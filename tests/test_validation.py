"""Regression coverage for course fragments and offline resource checks."""

import importlib.util
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1] / "lecture-to-course" / "scripts"


def load_script(name):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


builder = load_script("build_course")
checker = load_script("check_site")


class FragmentValidationTests(unittest.TestCase):
    def parse(self, content):
        parser = builder.Fragment({}, {})
        parser.feed('<section id="chapter"><h2>Title</h2>' + content + "</section>")
        parser.close()
        return parser.finish()

    def test_remote_poster_and_svg_image_are_rejected(self):
        for content in (
            '<video poster="https://example.com/poster.png"></video>',
            '<svg><image xlink:href="https://example.com/image.svg" /></svg>',
        ):
            with self.subTest(content=content), self.assertRaises(ValueError):
                self.parse(content)

    def test_nested_option_wrappers_and_feedback_button(self):
        quiz = """
            <div class="quiz" data-answer="{answer}">
              <div class="options">
                <div><button>First<br>choice</button></div>
                <div><div><button>Second choice</button></div></div>
              </div>
              <p class="quiz-status"></p>
              <div class="explanation" hidden><button>Extra explanation</button></div>
              <button class="retry" hidden>Retry</button>
            </div>
        """
        self.parse(quiz.format(answer=1) + quiz.format(answer=0))
        with self.assertRaises(ValueError):
            self.parse(quiz.format(answer=2))

    def test_numeric_character_references_remain_in_navigation_title(self):
        parser = builder.Fragment({}, {})
        parser.feed('<section id="chapter"><h2>A &#38; B &#x2192; C</h2></section>')
        result = parser.finish()
        self.assertEqual(parser.chapters, [("chapter", "A & B → C")])
        self.assertIn("A &#38; B &#x2192; C", result)


class OfflineResourceTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.parent = Path(temporary.name)
        self.root = self.parent / "site"
        self.root.mkdir()
        self.write("index.html", "<h1>Course</h1>")

    def write(self, name, text=""):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def test_html_media_resources_are_checked(self):
        for element in (
            '<video poster="{url}"></video>',
            '<svg><image xlink:href="{url}" /></svg>',
        ):
            for url, expected in (
                ("https://example.com/image.png", "nonlocal reference"),
                ("missing.png", "Missing dependency"),
            ):
                with self.subTest(element=element, url=url):
                    self.write("index.html", element.format(url=url))
                    self.assertTrue(any(expected in error for error in checker.check(self.root)))

        self.write("image.png")
        self.write(
            "index.html",
            "".join(
                element.format(url="image.png")
                for element in (
                    '<video poster="{url}"></video>',
                    '<svg><image xlink:href="{url}" /></svg>',
                )
            ),
        )
        self.assertEqual(checker.check(self.root), [])

    def test_css_urls_resolve_relative_to_stylesheet(self):
        self.write("assets/image.png")
        self.write("assets/image name.png")
        self.write("assets/font.woff2")
        self.write(
            "css/styles.css",
            r"""
            body { background: url(../assets/image.png); }
            p { background: URL("../assets/image name.png"); }
            h1 { background: url(../assets/image\ name.png); }
            @font-face { src: url('../assets/font.woff2'); }
            /* An unused example: url(missing.png) */
        """,
        )
        self.assertEqual(checker.check(self.root), [])
        (self.root / "assets/image.png").unlink()
        self.assertIn("Missing dependency: ../assets/image.png", checker.check(self.root))

    def test_css_urls_cannot_escape_course_directory(self):
        (self.parent / "outside.png").write_text("", encoding="utf-8")
        for url in ("../../outside.png", "%2e%2e/%2e%2e/outside.png"):
            with self.subTest(url=url):
                self.write("css/styles.css", f'body {{ background: url("{url}"); }}')
                self.assertIn(f"Escapes output: {url}", checker.check(self.root))


if __name__ == "__main__":
    unittest.main()
