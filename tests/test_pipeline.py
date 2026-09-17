"""Regression tests that build their own temporary outputs from checked-in fixtures."""

import importlib.util
import json
import queue
import shutil
import subprocess
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.request import ProxyHandler, build_opener

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "lecture-to-course" / "scripts"


def load_script(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


builder = load_script("builder", SCRIPTS / "build_course.py")
site_checker = load_script("site_checker", SCRIPTS / "check_site.py")


class PipelineTests(unittest.TestCase):
    def fragment(self, text):
        parser = builder.Fragment(
            {"s1": {"count": 2, "url": "sources/s1.pdf", "title": "Slides"}},
            {"term": {}},
        )
        parser.feed(text)
        return parser.finish()

    def test_citations_resolve(self):
        result = self.fragment(
            '<section id="one"><h2>One</h2><a data-source="s1" data-page="2">Source</a></section>'
        )
        self.assertIn("sources/s1.pdf#page=2", result)

    def test_invalid_source_page_and_term(self):
        invalid_fragments = [
            '<a data-source="s1" data-page="3">Source</a>',
            '<button data-term="unknown">word</button>',
            "<script>evil()</script>",
            '<img src="https://example.com/x">',
            '<img src="../x.png">',
        ]
        for inner in invalid_fragments:
            with self.subTest(inner=inner), self.assertRaises(ValueError):
                self.fragment(f'<section id="one"><h2>One</h2>{inner}</section>')

    def test_bad_answer(self):
        with self.assertRaises(ValueError):
            self.fragment(
                '<section id="one"><h2>One</h2>'
                '<div class="quiz" data-answer="3">'
                '<div class="options"><button>A</button><button>B</button></div>'
                '<p class="quiz-status"></p><div class="explanation"></div>'
                '<button class="retry">Retry</button></div></section>'
            )

    def test_multiple_sources_scan_warning(self):
        with tempfile.TemporaryDirectory() as temporary_dir:
            output_dir = Path(temporary_dir) / "source-index"
            subprocess.run(
                [
                    sys.executable,
                    str(SCRIPTS / "extract_pdf.py"),
                    str(ROOT / "demo" / "input" / "01-conditional-probability.pdf"),
                    str(ROOT / "demo" / "input" / "02-independence.pdf"),
                    "--out",
                    str(output_dir),
                ],
                check=True,
                capture_output=True,
                text=True,
                timeout=30,
            )
            manifest = json.loads((output_dir / "manifest.json").read_text(encoding="utf-8"))
            sources = manifest["sources"]
            self.assertEqual(len(sources), 2)
            self.assertEqual([len(source["pages"]) for source in sources], [2, 2])
            self.assertTrue(sources[1]["pages"][1]["low_text"])
            self.assertFalse(sources[0]["pages"][0]["low_text"])
            for source in sources:
                self.assertTrue((output_dir / source["path"]).is_file())

    def test_single_lecture_and_no_overwrite(self):
        with tempfile.TemporaryDirectory() as temporary_dir:
            course = json.loads((ROOT / "demo" / "course.json").read_text(encoding="utf-8"))
            course["lectures"] = course["lectures"][:1]
            for source in course["sources"]:
                source["path"] = (Path("input") / Path(source["path"]).name).as_posix()
            course["assets"] = []

            temporary_path = Path(temporary_dir)
            shutil.copytree(ROOT / "demo" / "input", temporary_path / "input")
            shutil.copy(ROOT / "demo" / "lecture-01.html", temporary_path / "lecture-01.html")
            course_path = temporary_path / "course.json"
            course_path.write_text(json.dumps(course), encoding="utf-8")
            site_path = temporary_path / "site"
            self.assertEqual(builder.build(course_path, site_path), 1)
            with self.assertRaises(ValueError):
                builder.build(course_path, site_path)

    def test_missing_resource_detected(self):
        with tempfile.TemporaryDirectory() as temporary_dir:
            site_path = Path(temporary_dir)
            (site_path / "index.html").write_text('<img src="gone.png">', encoding="utf-8")
            self.assertTrue(site_checker.check(site_path))

    def test_launcher_serves_html_and_pdf(self):
        with tempfile.TemporaryDirectory() as temporary_dir:
            site_path = Path(temporary_dir) / "site"
            site_path.mkdir()
            (site_path / "index.html").write_text("<h1>Local course</h1>", encoding="utf-8")
            shutil.copy(
                ROOT / "demo" / "input" / "01-conditional-probability.pdf",
                site_path / "sample.pdf",
            )
            launcher_path = site_path / "launch_course.py"
            shutil.copy(
                ROOT / "lecture-to-course" / "assets" / "template" / "launch_course.py",
                launcher_path,
            )
            process = subprocess.Popen(
                [sys.executable, str(launcher_path), "--no-browser"],
                cwd=temporary_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding="utf-8",
            )
            try:
                # Read startup output with a deadline so a broken launcher cannot hang CI.
                startup_lines = queue.Queue()
                reader = threading.Thread(
                    target=lambda: startup_lines.put(process.stdout.readline()),
                    daemon=True,
                )
                reader.start()
                try:
                    url = startup_lines.get(timeout=10).strip()
                except queue.Empty:
                    self.fail("Launcher did not print a URL within 10 seconds")
                reader.join(timeout=1)
                if not url:
                    _, error_output = process.communicate(timeout=5)
                    self.fail(f"Launcher exited before printing a URL: {error_output.strip()}")
                self.assertRegex(url, r"^http://127\.0\.0\.1:\d+/index\.html$")

                # Ignore proxy configuration for this explicitly local connection.
                opener = build_opener(ProxyHandler({}))
                with opener.open(url, timeout=5) as response:
                    self.assertEqual(response.status, 200)
                    self.assertIn(b"Local course", response.read())
                with opener.open(url.replace("index.html", "sample.pdf"), timeout=5) as response:
                    self.assertEqual(response.status, 200)
                    self.assertTrue(response.read().startswith(b"%PDF-"))
            finally:
                process.terminate()
                try:
                    process.communicate(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.communicate(timeout=5)


class BilingualBuildTests(unittest.TestCase):
    def test_bilingual_assets_and_legacy_compatibility(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            shutil.copytree(ROOT / "demo", root / "demo")
            spec = root / "demo/course.json"
            data = json.loads(spec.read_text())
            data["translations"] = {"zh": {"Conditional probability": "条件概率"}}
            data["default_language"] = "zh"
            spec.write_text(json.dumps(data))
            builder.build(spec, root / "site")
            self.assertEqual(site_checker.check(root / "site"), [])
            self.assertTrue((root / "site/language.js").is_file())
            self.assertIn("language-toggle", (root / "site/index.html").read_text())
            js = (root / "site/translations.js").read_text()
            self.assertIn('window.courseDefaultLanguage = "zh"', js)
            self.assertNotIn("COMP5423", js)
            del data["translations"]
            data["default_language"] = "en"
            spec.write_text(json.dumps(data))
            builder.build(spec, root / "legacy")
            self.assertFalse((root / "legacy/language.js").exists())
            self.assertNotIn("language-toggle", (root / "legacy/index.html").read_text())

    def test_invalid_translation_config_fails_before_output(self):
        for config in [
            {"translations": []},
            {"translations": {"fr": {}}},
            {"translations": {"zh": []}},
            {"translations": {"zh": {"A": 4}}},
            {"translations": {"zh": {}}},
            {"default_language": "zh"},
            {"default_language": "fr"},
        ]:
            with self.subTest(config=config), tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                spec = root / "course.json"
                spec.write_text(json.dumps({"id": "test", **config}))
                with self.assertRaises(ValueError):
                    builder.build(spec, root / "site")
                self.assertFalse((root / "site").exists())


if __name__ == "__main__":
    unittest.main()
