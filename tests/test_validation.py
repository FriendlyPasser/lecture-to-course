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

    def hinted_quiz(self, hints):
        return self.quiz.format(attributes="").replace(
            '<p class="quiz-status">', hints + '<p class="quiz-status">'
        )

    def test_optional_hints_allow_partial_coverage_and_reused_indexes_across_quizzes(self):
        hint = '<p class="quiz-hint" data-option="0" hidden>Compare <em>both</em> terms.</p>'
        question = self.hinted_quiz(hint).replace(
            "<button>Second</button>", "<button>Second</button><div><button>Third</button></div>"
        )
        self.assertIn(hint, self.parse(question + question))
        # A hint may precede its options; the other wrong answer uses the runtime fallback.
        before_options = question.replace(hint, "").replace(
            '<div class="options">', hint + '<div class="options">'
        )
        self.parse(before_options)
        self.parse(self.quiz.format(attributes=""))

    def test_hints_require_unique_in_range_incorrect_integer_indexes(self):
        for attribute in (
            "",
            "data-option",
            'data-option=""',
            'data-option=" "',
            'data-option="-1"',
            'data-option="+0"',
            'data-option="0.0"',
            'data-option="0junk"',
            'data-option="1"',
            'data-option="2"',
        ):
            hint = f'<p class="quiz-hint" {attribute} hidden>Review the terms.</p>'
            with self.subTest(attribute=attribute), self.assertRaisesRegex(ValueError, "Quiz hint"):
                self.parse(self.hinted_quiz(hint))
        first = '<p class="quiz-hint" data-option="0" hidden>First hint.</p>'
        second = '<p class="quiz-hint" data-option="00" hidden>Same option.</p>'
        with self.assertRaisesRegex(ValueError, "Duplicate quiz hint"):
            self.parse(self.hinted_quiz(first + second))

    def test_hints_and_their_data_option_attribute_are_scoped(self):
        hint = '<p class="quiz-hint" data-option="0" hidden>Review the terms.</p>'
        for content in (hint, hint + self.quiz.format(attributes="")):
            with (
                self.subTest(content=content),
                self.assertRaisesRegex(ValueError, "belong to a quiz"),
            ):
                self.parse(content)
        for content in (
            '<p data-option="0">Regular text.</p>',
            self.hinted_quiz('<p data-option="0" hidden>Regular text.</p>'),
            self.quiz.format(attributes="").replace(
                "<button>First", '<button data-option="0">First'
            ),
        ):
            with (
                self.subTest(content=content),
                self.assertRaisesRegex(ValueError, "requires a quiz-hint"),
            ):
                self.parse(content)

    def test_hints_are_separate_from_options_explanations_and_other_hints(self):
        hint = '<div class="quiz-hint" data-option="0" hidden>Review the terms.</div>'
        question = self.quiz.format(attributes="")
        for content in (
            question.replace("<button>First", hint + "<button>First"),
            question.replace("Reasoning", "<div>" + hint + "</div>"),
            question.replace(
                '<p class="quiz-status"></p>', '<div class="quiz-status">' + hint + "</div>"
            ),
            self.hinted_quiz(hint.replace('class="quiz-hint"', 'class="quiz-hint options"')),
            self.hinted_quiz(hint.replace('class="quiz-hint"', 'class="quiz-hint explanation"')),
        ):
            with (
                self.subTest(content=content),
                self.assertRaisesRegex(ValueError, "outside options"),
            ):
                self.parse(content)
        nested = self.hinted_quiz(
            hint.replace(
                "Review the terms.",
                'Outer hint.<p class="quiz-hint" data-option="2" hidden>Nested hint.</p>',
            )
        ).replace("<button>Second</button>", "<button>Second</button><button>Third</button>")
        with self.assertRaisesRegex(ValueError, "other hints"):
            self.parse(nested)

    def test_hints_start_hidden_and_can_be_revealed(self):
        hint = '<p class="quiz-hint" data-option="0" hidden>Review the terms.</p>'
        with self.assertRaisesRegex(ValueError, "initially hidden"):
            self.parse(self.hinted_quiz(hint.replace(" hidden", "")))
        for content in (
            hint.replace(" hidden", " hidden inert"),
            hint.replace(" hidden", ' hidden aria-hidden="true"'),
            "<div hidden>" + hint + "</div>",
            "<div inert>" + hint + "</div>",
            '<div aria-hidden="true">' + hint + "</div>",
            "<template>" + hint + "</template>",
            "<details><summary>Hint</summary>" + hint + "</details>",
        ):
            with self.subTest(content=content), self.assertRaisesRegex(ValueError, "unreachable"):
                self.parse(self.hinted_quiz(content))
        with self.assertRaisesRegex(ValueError, "unreachable"):
            self.parse("<div hidden>" + self.hinted_quiz(hint) + "</div>")
        self.parse(self.hinted_quiz("<div>" + hint + "</div>"))

    def test_hints_need_visible_text_including_decoded_character_references(self):
        for contents in (
            "",
            " \n\t ",
            "&nbsp;&#32;&#x20;",
            "<!-- Text in comments is not a hint. -->",
            '<img src="example.png" alt="Illustration">',
            "<span hidden>Hidden words</span>",
            '<span aria-hidden="true">Hidden words</span>',
            "<span inert>Unavailable words</span>",
            "<template>Unrendered words</template>",
        ):
            hint = f'<div class="quiz-hint" data-option="0" hidden>{contents}</div>'
            with (
                self.subTest(contents=contents),
                self.assertRaisesRegex(ValueError, "readable text"),
            ):
                self.parse(self.hinted_quiz(hint))
        for contents in (
            "<span>&alpha;</span>",
            "&#945;",
            "&#x3b1;",
            "<span hidden>Icon</span>Read this.",
        ):
            hint = f'<div class="quiz-hint" data-option="0" hidden>{contents}</div>'
            with self.subTest(contents=contents):
                self.parse(self.hinted_quiz(hint))

    def test_hinted_quiz_feedback_must_be_unique_and_initially_usable(self):
        hint = '<p class="quiz-hint" data-option="0" hidden>Review the terms.</p>'
        question = self.hinted_quiz(hint)
        components = (
            '<p class="quiz-status"></p>',
            '<button class="retry" hidden>Retry</button>',
            '<div class="explanation" hidden>Reasoning</div>',
        )
        for component in components:
            with (
                self.subTest(component=component),
                self.assertRaisesRegex(ValueError, "exactly one"),
            ):
                self.parse(question.replace(component, component * 2))
        for content in (
            question.replace('class="quiz-status"', 'class="quiz-status" hidden'),
            question.replace('class="retry" hidden', 'class="retry"'),
            question.replace('class="explanation" hidden', 'class="explanation"'),
            question.replace('class="retry"', 'class="retry" disabled'),
            question.replace(components[1], '<a class="retry" hidden>Retry</a>'),
            question.replace(components[1], "<fieldset disabled>" + components[1] + "</fieldset>"),
            question.replace('class="retry"', 'class="retry explanation"').replace(
                components[2], ""
            ),
        ):
            with self.subTest(content=content), self.assertRaisesRegex(ValueError, "Hinted quiz"):
                self.parse(content)
        wrapped = question
        for component in components:
            wrapped = wrapped.replace(
                component, '<div class="feedback-group">' + component + "</div>"
            )
        self.parse(wrapped)

    def test_hinted_quiz_feedback_cannot_be_hidden_inside_another_component(self):
        hint = '<p class="quiz-hint" data-option="0" hidden>Review the terms.</p>'
        question = self.hinted_quiz(hint)
        status = '<p class="quiz-status"></p>'
        retry = '<button class="retry" hidden>Retry</button>'
        explanation = '<div class="explanation" hidden>Reasoning</div>'
        for content in (
            question.replace(retry, "").replace("Reasoning", "Reasoning" + retry),
            question.replace(status, "").replace("Reasoning", status + "Reasoning"),
            question.replace(retry, "").replace("Review the terms.", "Review the terms." + retry),
            question.replace(explanation, "").replace(
                '<div class="options">', '<div class="options">' + explanation
            ),
            question.replace(explanation, "").replace(
                status, '<div class="quiz-status">' + explanation + "</div>"
            ),
            question.replace(retry, "").replace(
                status, '<div class="quiz-status">' + retry + "</div>"
            ),
        ):
            with self.subTest(content=content), self.assertRaisesRegex(ValueError, "Hinted quiz"):
                self.parse(content)
        for component in (status, retry, explanation):
            for start, end in (
                ("<div hidden>", "</div>"),
                ("<div inert>", "</div>"),
                ('<div aria-hidden="true">', "</div>"),
                ("<details open><summary>More</summary>", "</details>"),
                ("<template>", "</template>"),
            ):
                with (
                    self.subTest(component=component, start=start),
                    self.assertRaisesRegex(ValueError, "unreachable"),
                ):
                    self.parse(question.replace(component, start + component + end))
            for attribute in (" inert", ' aria-hidden="true"'):
                with (
                    self.subTest(component=component, attribute=attribute),
                    self.assertRaisesRegex(ValueError, "unreachable"),
                ):
                    self.parse(
                        question.replace(component, component.replace(">", attribute + ">", 1))
                    )
        # Existing immediate-explanation quizzes may still place retry inside the solution.
        legacy = (
            self.quiz.format(attributes="")
            .replace(retry, "")
            .replace("Reasoning", "Reasoning" + retry)
        )
        self.parse(legacy)

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
