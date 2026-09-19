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
    quiz = """
        <div class="quiz" {attributes} data-answer="1">
          <div class="options"><button>First</button><button>Second</button></div>
          <p class="quiz-status"></p>
          <div class="explanation" hidden>Reasoning</div>
          <button class="retry" hidden>Retry</button>
        </div>
    """
    refresher = """
        <details class="prerequisite" id="refresh">
          <summary>Concept refresher</summary>
          <div class="supplement">
            <p>Review the underlying concept.</p>
            <button class="prerequisite-return" hidden>Return to question</button>
          </div>
        </details>
    """

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

    def test_optional_prerequisites_support_forward_and_shared_references(self):
        first = self.quiz.format(attributes='id="first" data-prerequisite="refresh"')
        second = self.quiz.format(attributes='id="second" data-prerequisite="refresh"')
        for content in (first + second + self.refresher, self.refresher + first + second):
            with self.subTest(content=content):
                self.assertIn('data-prerequisite="refresh"', self.parse(content))
        # A new lecture may reuse IDs; a target from another lecture is unavailable.
        self.parse(first + self.refresher)
        with self.assertRaisesRegex(ValueError, "Unknown prerequisite"):
            self.parse(first)
        self.parse("<p>No prerequisites or precheck are needed for this lecture.</p>")
        self.parse(self.quiz.format(attributes=""))

    def test_prerequisite_links_require_quiz_ids_and_real_details(self):
        for attributes, target in (
            ('data-prerequisite="refresh"', self.refresher),
            ('id="question" data-prerequisite=""', self.refresher),
            ('id="question" data-prerequisite="#refresh"', self.refresher),
            ('id="question" data-prerequisite="refresh"', '<div id="refresh"></div>'),
            (
                'id="question" data-prerequisite="refresh"',
                self.refresher.replace('class="prerequisite"', ""),
            ),
            ('id="question" data-prerequisite="glossary"', ""),
        ):
            with self.subTest(attributes=attributes, target=target), self.assertRaises(ValueError):
                self.parse(self.quiz.format(attributes=attributes) + target)
        with self.assertRaisesRegex(ValueError, "requires a quiz"):
            self.parse('<p data-prerequisite="refresh">Text</p>' + self.refresher)
        with self.assertRaisesRegex(ValueError, "Duplicate ID"):
            self.parse(
                self.quiz.format(attributes='id="question" data-prerequisite="refresh"') * 2
                + self.refresher
            )

    def test_prerequisites_must_be_reachable_outside_quiz_feedback(self):
        question = self.quiz.format(attributes='id="question" data-prerequisite="refresh"')
        unreachable = (
            self.refresher.replace("<details ", "<details hidden "),
            "<div hidden>" + self.refresher + "</div>",
            "<div inert>" + self.refresher + "</div>",
            '<div aria-hidden="true">' + self.refresher + "</div>",
            "<details><summary>Outer</summary>" + self.refresher + "</details>",
            "<details open><summary>Outer</summary>" + self.refresher + "</details>",
        )
        for target in unreachable:
            with self.subTest(target=target), self.assertRaisesRegex(ValueError, "unreachable"):
                self.parse(question + target)
        with self.assertRaisesRegex(ValueError, "unreachable"):
            self.parse(question.replace("Reasoning", self.refresher))

    def test_prerequisites_need_summary_and_usable_return_button(self):
        question = self.quiz.format(attributes='id="question" data-prerequisite="refresh"')
        for target in (
            self.refresher.replace("<summary>Concept refresher</summary>", ""),
            self.refresher.replace("<summary>", "<summary hidden>"),
            self.refresher.replace("</summary>", "</summary><summary>Another</summary>"),
            self.refresher.replace("<summary>", "<div><summary>").replace(
                "</summary>", "</summary></div>"
            ),
            self.refresher.replace(
                '<div class="supplement">', '<div class="supplement"><summary>Nested</summary>'
            ),
            self.refresher.replace('class="prerequisite-return"', 'class="other"'),
            self.refresher.replace(
                'class="prerequisite-return"', 'class="prerequisite-return" disabled'
            ),
            self.refresher.replace(
                'class="prerequisite-return" hidden', 'class="prerequisite-return"'
            ),
            self.refresher.replace(
                "</button>", '</button><button class="prerequisite-return" hidden>Extra</button>'
            ),
            self.refresher.replace("<button ", "<a ").replace("</button>", "</a>"),
            self.refresher.replace('class="supplement"', 'class="supplement" hidden'),
            self.refresher.replace(
                '<div class="supplement">', '<details open class="supplement">'
            ).replace("</div>", "</details>"),
        ):
            with (
                self.subTest(target=target),
                self.assertRaisesRegex(ValueError, "Prerequisite needs"),
            ):
                self.parse(question + target)

    def test_precheck_skip_must_reach_a_same_lecture_target(self):
        self.parse('<a class="precheck-skip" href="#main">Skip</a><h3 id="main">Lesson</h3>')
        for link, target in (
            ('<a class="precheck-skip" href>Skip</a>', ""),
            ('<a class="precheck-skip" href="#missing">Skip</a>', ""),
            (
                '<a class="precheck-skip" href="lecture.html#main">Skip</a>',
                '<h3 id="main">Lesson</h3>',
            ),
            (
                '<button class="precheck-skip" href="#main">Skip</button>',
                '<h3 id="main">Lesson</h3>',
            ),
            ('<a class="precheck-skip" href="#main">Skip</a>', '<h3 id="main" hidden>Lesson</h3>'),
        ):
            with (
                self.subTest(link=link, target=target),
                self.assertRaisesRegex(ValueError, "Precheck skip"),
            ):
                self.parse(link + target)


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
