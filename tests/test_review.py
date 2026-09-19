"""Validate optional concept mappings before emitting the offline review assets."""

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "lecture-to-course/scripts/build_course.py"
spec = importlib.util.spec_from_file_location("review_builder", SCRIPT)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

QUIZ = """
<div class="quiz" id="question" data-concept="probability" data-answer="1">
  <h3>Find <em>the</em> probability &amp; explain.</h3>
  <div class="options"><button>0.2</button><button>0.4</button></div>
  <p class="quiz-status"></p>
  <div class="explanation" hidden>4 / 10 = 0.4.</div>
  <button class="retry" hidden>Try again</button>
</div>
"""
NUMERIC = """
<form class="practice" id="share" data-concept="probability" data-kind="numeric"
      data-answer="0.4">
  <h3>Calculate the share.</h3>
  <label for="response">Your answer</label>
  <input class="practice-response" id="response" type="text" inputmode="decimal">
  <button class="practice-check" type="submit">Check answer</button>
  <button class="practice-reveal" type="button">Show solution</button>
  <button class="practice-reset" type="button">Start again</button>
  <p class="practice-status" role="status"></p>
  <div class="practice-solution" hidden>4 / 10 = 0.4.</div>
</form>
"""
REFLECTION = (
    NUMERIC.replace('data-kind="numeric"', 'data-kind="reflection"')
    .replace('data-answer="0.4"', "")
    .replace(
        '<input class="practice-response" id="response" type="text" inputmode="decimal">',
        '<textarea class="practice-response" id="response"></textarea>',
    )
)


class ConceptFragmentTests(unittest.TestCase):
    def parse(self, content, concepts=None):
        parser = builder.Fragment(
            {}, {}, {"probability": {"title": "Probability"}} if concepts is None else concepts
        )
        parser.feed('<section id="chapter"><h2>Chapter</h2>' + content + "</section>")
        parser.close()
        parser.finish()
        return parser.activities

    def test_activity_kinds_and_decoded_titles(self):
        for markup, kind, title in (
            (QUIZ, "quiz", "Find the probability & explain."),
            (NUMERIC, "numeric", "Calculate the share."),
            (REFLECTION, "reflection", "Calculate the share."),
        ):
            with self.subTest(kind=kind):
                activity = self.parse(markup)[0]
                self.assertEqual(activity["concept"], "probability")
                self.assertEqual(activity["kind"], kind)
                self.assertEqual(activity["title"], title)

    def test_title_uses_first_readable_heading_or_concept_title(self):
        old = "<h3>Find <em>the</em> probability &amp; explain.</h3>"
        cases = (
            ("", "Probability"),
            ("<h3 hidden>Hidden</h3>", "Probability"),
            ("<h3><span inert>Hidden</span>&nbsp; &#32;</h3>", "Probability"),
            (
                "<h3 hidden>Ignore</h3><h3> A\n<em>&#945;</em> B "
                '<span aria-hidden="true">Icon</span><span hidden>Hint</span></h3>',
                "A α B",
            ),
            ("<h3>A<em>B</em>C</h3>", "ABC"),
            (
                "<h3>&lt;script&gt; &quot;quoted&quot; \\ backslash</h3>",
                '<script> "quoted" \\ backslash',
            ),
        )
        for heading, expected in cases:
            with self.subTest(heading=heading):
                self.assertEqual(self.parse(QUIZ.replace(old, heading))[0]["title"], expected)

    def test_references_require_declared_concepts_and_activity_ids(self):
        for markup in (
            QUIZ.replace('data-concept="probability"', "data-concept"),
            QUIZ.replace('data-concept="probability"', 'data-concept="unknown"'),
            QUIZ.replace('data-concept="probability"', 'data-concept=""'),
            QUIZ.replace('id="question"', ""),
            QUIZ.replace('id="question"', 'id="Invalid ID"'),
            QUIZ.replace('id="question"', 'id="concept-review"'),
            QUIZ * 2,
            QUIZ.replace(
                'data-concept="probability"', 'data-concept="unknown" data-concept="probability"'
            ),
            QUIZ.replace('id="question"', 'id="earlier" id="question"'),
            '<p data-concept="probability">Text</p>',
            QUIZ.replace("<h3>", '<h3 data-concept="probability">'),
        ):
            with self.subTest(markup=markup), self.assertRaises(ValueError):
                self.parse(markup)
        with self.assertRaisesRegex(ValueError, "Unknown concept"):
            self.parse(QUIZ, concepts={})

    def test_mapped_activities_are_reachable(self):
        for markup in (QUIZ, NUMERIC, REFLECTION):
            for start, end in (
                ("<div hidden>", "</div>"),
                ("<div inert>", "</div>"),
                ('<div aria-hidden=" true ">', "</div>"),
                ("<details><summary>More</summary>", "</details>"),
                ("<template>", "</template>"),
            ):
                with self.subTest(start=start, markup=markup), self.assertRaises(ValueError):
                    self.parse(start + markup + end)
            for attribute in ("hidden", "inert", 'aria-hidden="true"'):
                with (
                    self.subTest(attribute=attribute, markup=markup),
                    self.assertRaises(ValueError),
                ):
                    self.parse(
                        markup.replace(
                            'data-concept="probability"', f'data-concept="probability" {attribute}'
                        )
                    )
            self.parse("<details open><summary>More</summary>" + markup + "</details>")

    def test_mapped_activities_cannot_be_nested_or_malformed(self):
        for markup in (
            QUIZ.replace("4 / 10 = 0.4.", NUMERIC),
            NUMERIC.replace("4 / 10 = 0.4.", QUIZ),
            QUIZ.replace("</h3>", ""),
            QUIZ.replace("</div>\n", ""),
            QUIZ.replace("<em>the</em>", '<em hidden hidden="false">the</em>'),
        ):
            with self.subTest(markup=markup), self.assertRaises(ValueError):
                self.parse(markup)

    def test_unmapped_legacy_quiz_can_keep_its_optional_id(self):
        self.assertEqual(
            self.parse(QUIZ.replace('data-concept="probability"', "").replace('id="question"', "")),
            [],
        )


class ConceptBuildTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.spec = self.root / "course.json"
        self.output = self.root / "site"
        self.course = {
            "id": "test-course",
            "title": "Test course",
            "description": "Concept review test.",
            "sources": [],
            "glossary": [],
            "concepts": [{"id": "probability", "title": "Probability"}],
            "lectures": [
                {"id": "lesson", "title": "Lesson", "summary": "Summary", "file": "lesson.html"}
            ],
        }
        self.fragment(QUIZ)

    def fragment(self, markup, file="lesson.html"):
        (self.root / file).write_text(
            '<section id="chapter"><h2>Chapter</h2>' + markup + "</section>", encoding="utf-8"
        )

    def build(self):
        self.spec.write_text(json.dumps(self.course), encoding="utf-8")
        return builder.build(self.spec, self.output)

    def metadata(self):
        script = (self.output / "review-data.js").read_text(encoding="utf-8")
        return json.loads(script.removeprefix("window.courseReview = ").removesuffix(";\n"))

    def test_generated_metadata_groups_lecture_scoped_activity_ids(self):
        self.course["lectures"].append(
            {"id": "next-lesson", "title": "Next", "summary": "Summary", "file": "next.html"}
        )
        reflection = REFLECTION.replace('id="share"', 'id="reason"').replace(
            '="response"', '="reason-response"'
        )
        self.fragment(QUIZ + NUMERIC + reflection)
        self.fragment(QUIZ, "next.html")
        self.assertEqual(self.build(), 2)
        concept = self.metadata()["concepts"][0]
        self.assertEqual(concept["id"], "probability")
        self.assertEqual(
            concept["activities"],
            [
                {
                    "id": "question",
                    "lecture": "lesson",
                    "href": "lesson.html#question",
                    "kind": "quiz",
                    "title": "Find the probability & explain.",
                },
                {
                    "id": "share",
                    "lecture": "lesson",
                    "href": "lesson.html#share",
                    "kind": "numeric",
                    "title": "Calculate the share.",
                },
                {
                    "id": "reason",
                    "lecture": "lesson",
                    "href": "lesson.html#reason",
                    "kind": "reflection",
                    "title": "Calculate the share.",
                },
                {
                    "id": "question",
                    "lecture": "next-lesson",
                    "href": "next-lesson.html#question",
                    "kind": "quiz",
                    "title": "Find the probability & explain.",
                },
            ],
        )
        self.assertEqual(
            (self.output / "review.js").read_bytes(),
            (ROOT / "lecture-to-course/assets/template/review.js").read_bytes(),
        )
        for page in ("index", "lesson", "next-lesson"):
            markup = (self.output / f"{page}.html").read_text()
            self.assertLess(
                markup.index('src="review-data.js" defer'), markup.index('src="review.js" defer')
            )
            self.assertLess(
                markup.index('src="review.js" defer'), markup.index('src="main.js" defer')
            )

    def test_concept_titles_serialize_as_text(self):
        title = '  <script> "中文" \\ & \n\u2028\u2029 </script>  '
        self.course["concepts"][0]["title"] = title
        self.fragment(QUIZ.replace("<h3>Find <em>the</em> probability &amp; explain.</h3>", ""))
        self.build()
        concept = self.metadata()["concepts"][0]
        self.assertEqual(concept["title"], " ".join(title.split()))
        self.assertEqual(concept["activities"][0]["title"], concept["title"])
        self.assertNotIn("<script>", (self.output / "review-data.js").read_text())

    def test_invalid_declarations_fail_before_output(self):
        for concepts in (
            None,
            {},
            "probability",
            [None],
            ["probability"],
            [{}],
            [{"id": "Bad", "title": "Bad"}],
            [{"id": "probability"}],
        ):
            with self.subTest(concepts=concepts):
                self.course["concepts"] = concepts
                with self.assertRaises(ValueError):
                    self.build()
                self.assertFalse(self.output.exists())
        for title in (None, 7, [], {}, "", " \n\t "):
            with self.subTest(title=title):
                self.course["concepts"] = [{"id": "probability", "title": title}]
                with self.assertRaises(ValueError):
                    self.build()
                self.assertFalse(self.output.exists())
        self.course["concepts"] = [{"id": "probability", "title": "First"}] * 2
        with self.assertRaisesRegex(ValueError, "Duplicate concept"):
            self.build()
        self.assertFalse(self.output.exists())

    def test_each_concept_needs_a_graded_activity(self):
        for markup in ("<p>Reading only.</p>", REFLECTION):
            with self.subTest(markup=markup):
                self.fragment(markup)
                with self.assertRaisesRegex(ValueError, "at least one graded"):
                    self.build()
                self.assertFalse(self.output.exists())
        self.fragment(QUIZ)
        self.course["concepts"].append({"id": "unmapped", "title": "Unmapped"})
        with self.assertRaisesRegex(ValueError, "unmapped"):
            self.build()
        self.assertFalse(self.output.exists())

    def test_bad_reference_in_later_lecture_leaves_no_partial_output(self):
        self.course["lectures"].append(
            {"id": "next-lesson", "title": "Next", "summary": "Summary", "file": "next.html"}
        )
        self.fragment(
            QUIZ.replace('data-concept="probability"', 'data-concept="unknown"'), "next.html"
        )
        with self.assertRaisesRegex(ValueError, "Unknown concept"):
            self.build()
        self.assertFalse(self.output.exists())

    def test_absent_or_empty_concepts_keep_legacy_outputs(self):
        self.fragment(QUIZ.replace('data-concept="probability"', ""))
        for declaration in (None, []):
            with self.subTest(declaration=declaration):
                if declaration is None:
                    del self.course["concepts"]
                else:
                    self.course["concepts"] = declaration
                self.output = self.root / ("legacy" if declaration is None else "empty")
                self.build()
                self.assertFalse((self.output / "review-data.js").exists())
                self.assertFalse((self.output / "review.js").exists())
                self.assertNotIn("review.js", (self.output / "index.html").read_text())
                self.assertNotIn(
                    "${review_scripts_html}", (self.output / "lesson.html").read_text()
                )


if __name__ == "__main__":
    unittest.main()
