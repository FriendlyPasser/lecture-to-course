"""Build regression coverage for optional glossary explanations and comparisons."""

import copy
import html
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "glossary_builder", ROOT / "lecture-to-course/scripts/build_course.py"
)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class GlossaryBuildTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        (self.root / "lesson.html").write_text(
            '<section id="chapter"><h2>Changing the reference group</h2>'
            '<button class="term" data-term="conditional">Conditional probability</button>'
            "</section>",
            encoding="utf-8",
        )
        self.course = {
            "id": "glossary-test",
            "title": "Probability",
            "description": "A glossary demonstration.",
            "sources": [],
            "glossary": [
                {
                    "id": "conditional",
                    "en": "Conditional probability",
                    "zh": "条件概率",
                    "definition": "Probability within a specified event.",
                },
                {
                    "id": "marginal",
                    "en": "Marginal probability",
                    "zh": "边缘概率",
                    "definition": "Probability without conditioning on another event.",
                },
            ],
            "lectures": [
                {
                    "id": "lesson",
                    "title": "Changing the reference group",
                    "summary": "Compare conditional and marginal probabilities.",
                    "file": "lesson.html",
                }
            ],
        }

    def build(self, glossary=None, output="site"):
        course = copy.deepcopy(self.course)
        if glossary is not None:
            course["glossary"] = glossary
        course_path = self.root / "course.json"
        course_path.write_text(json.dumps(course), encoding="utf-8")
        builder.build(course_path, self.root / output)
        return (self.root / output / "lesson.html").read_text(encoding="utf-8")

    def assert_invalid(self, glossary):
        course = copy.deepcopy(self.course)
        course["glossary"] = glossary
        course_path = self.root / "course.json"
        course_path.write_text(json.dumps(course), encoding="utf-8")
        with self.assertRaises(ValueError):
            builder.build(course_path, self.root / "invalid")
        self.assertFalse((self.root / "invalid").exists())

    def test_existing_four_field_glossary_builds_without_empty_optional_sections(self):
        page = self.build()
        self.assertIn(
            '<article class="glossary-item" id="term-conditional" tabindex="0">'
            "<h3>Conditional probability</h3>",
            page,
        )
        self.assertIn('<p class="zh" lang="zh-Hans">条件概率</p>', page)
        self.assertIn("Probability within a specified event.", page)
        self.assertNotIn('class="glossary-details"', page)
        self.assertNotIn('class="glossary-comparisons"', page)

    def test_enriched_term_renders_explanations_and_bilingual_comparison(self):
        terms = copy.deepcopy(self.course["glossary"])
        terms[0].update(
            plain_language="Use only the students in the named group.",
            example="Among 40 students in B, 24 are also in A: P(A|B) = 24/40.",
            confused_with=[
                {
                    "term": "marginal",
                    "distinction": "Conditional uses group B; marginal uses the whole class.",
                }
            ],
        )
        page = self.build(terms)
        self.assertIn('<dl class="glossary-details">', page)
        self.assertIn(
            "<dt>In plain language</dt><dd>Use only the students in the named group.</dd>",
            page,
        )
        self.assertIn("<dt>In this course</dt><dd>Among 40 students in B", page)
        self.assertIn('<div class="glossary-comparisons"><h4>Distinguish from</h4><ul>', page)
        self.assertIn(
            '<button type="button" class="term term-reference" data-term="marginal">', page
        )
        self.assertIn('<span lang="en" translate="no">Marginal probability</span>', page)
        self.assertIn('<span lang="zh-Hans" translate="no">边缘概率</span>', page)
        self.assertIn("<p>Conditional uses group B; marginal uses the whole class.</p>", page)
        # Enrichment stays scoped to its term and appears on the overview too.
        marginal = page.split('id="term-marginal"', 1)[1].split("</article>", 1)[0]
        self.assertNotIn("glossary-details", marginal)
        self.assertNotIn("glossary-comparisons", marginal)
        overview = (self.root / "site/index.html").read_text(encoding="utf-8")
        self.assertIn("Conditional uses group B; marginal uses the whole class.", overview)

    def test_each_optional_field_is_independently_optional(self):
        cases = (
            ({"plain_language": "Start with the named group."}, "In plain language"),
            ({"example": "Count 24 out of 40 students."}, "In this course"),
            (
                {"confused_with": [{"term": "marginal", "distinction": "Different denominator."}]},
                "Distinguish from",
            ),
            ({"confused_with": []}, None),
        )
        for index, (extra, label) in enumerate(cases):
            with self.subTest(extra=extra):
                terms = copy.deepcopy(self.course["glossary"])
                terms[0].update(extra)
                page = self.build(terms, output=f"optional-{index}")
                for possible_label in ("In plain language", "In this course", "Distinguish from"):
                    self.assertEqual(possible_label in page, possible_label == label)
                if not label:
                    self.assertNotIn('class="glossary-details"', page)
                    self.assertNotIn('class="glossary-comparisons"', page)

    def test_all_authored_glossary_text_is_escaped(self):
        terms = copy.deepcopy(self.course["glossary"])
        unsafe = '<img src="x" onerror="alert(1)"> & \'quoted\''
        for term in terms:
            for field in ("en", "zh", "definition", "plain_language", "example"):
                term[field] = f"{field}: {unsafe}"
        terms[0]["confused_with"] = [{"term": "marginal", "distinction": unsafe}]
        page = self.build(terms)
        self.assertNotIn(unsafe, page)
        self.assertNotIn('<img src="x"', page)
        for field in ("en", "zh", "definition", "plain_language", "example"):
            self.assertIn(html.escape(f"{field}: {unsafe}", quote=True), page)
        self.assertIn(f"<p>{html.escape(unsafe, quote=True)}</p>", page)
        self.assertIn(
            '<span lang="en" translate="no">'
            + html.escape(f"en: {unsafe}", quote=True)
            + "</span>",
            page,
        )

    def test_glossary_requires_a_list_of_objects_with_valid_unique_ids(self):
        for invalid in (None, {}, "terms", [None], ["term"], [{}]):
            with self.subTest(glossary=invalid):
                self.assert_invalid(invalid)
        for tid in (None, 42, "", "with space", 'bad"id'):
            terms = copy.deepcopy(self.course["glossary"])
            terms[0]["id"] = tid
            with self.subTest(id=tid):
                self.assert_invalid(terms)
        terms = copy.deepcopy(self.course["glossary"])
        terms.append(copy.deepcopy(terms[0]))
        self.assert_invalid(terms)

    def test_required_and_optional_prose_fields_reject_non_strings_and_blank_text(self):
        for field in ("en", "zh", "definition", "plain_language", "example"):
            for invalid in (None, False, 0, [], {}, "", " \n\t "):
                with self.subTest(field=field, value=invalid):
                    terms = copy.deepcopy(self.course["glossary"])
                    terms[0][field] = invalid
                    self.assert_invalid(terms)
        for field in ("en", "zh", "definition"):
            with self.subTest(missing=field):
                terms = copy.deepcopy(self.course["glossary"])
                del terms[0][field]
                self.assert_invalid(terms)

    def test_comparison_shape_and_distinction_are_validated_before_output(self):
        invalid_values = [None, False, "marginal", {}, [None], ["marginal"], [{}]]
        invalid_values.extend(
            [{"term": "marginal", "distinction": invalid}]
            for invalid in (None, False, 7, [], {}, "", " \n\t ")
        )
        invalid_values.append([{"term": "marginal"}])
        for invalid in invalid_values:
            with self.subTest(confused_with=invalid):
                terms = copy.deepcopy(self.course["glossary"])
                terms[0]["confused_with"] = invalid
                self.assert_invalid(terms)

    def test_unknown_self_and_duplicate_comparison_targets_are_rejected(self):
        for target in (None, False, 7, [], {}, "", "unknown", "conditional"):
            with self.subTest(target=target):
                terms = copy.deepcopy(self.course["glossary"])
                terms[0]["confused_with"] = [{"term": target, "distinction": "Compare groups."}]
                self.assert_invalid(terms)
        terms = copy.deepcopy(self.course["glossary"])
        terms[0]["confused_with"] = [
            {"term": "marginal", "distinction": "Compare denominators."},
            {"term": "marginal", "distinction": "The same target appears twice."},
        ]
        self.assert_invalid(terms)

    def test_reciprocal_comparisons_are_valid(self):
        terms = copy.deepcopy(self.course["glossary"])
        terms[0]["confused_with"] = [{"term": "marginal", "distinction": "Use a subgroup."}]
        terms[1]["confused_with"] = [{"term": "conditional", "distinction": "Use everyone."}]
        page = self.build(terms)
        self.assertEqual(page.count('class="term term-reference"'), 2)


if __name__ == "__main__":
    unittest.main()
