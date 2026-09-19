"""Validate the offline predict–operate–explain contract before rendering."""

import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "lecture-to-course/scripts/build_course.py"
spec = importlib.util.spec_from_file_location("build_course", SCRIPT)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class ExplorationValidationTests(unittest.TestCase):
    template = """
        <div class="exploration" id="overlap-demo" data-model="overlap"
             data-total="{total}" data-condition="{condition}"
             data-event="{event}" data-overlap="{overlap}">
          <p class="exploration-goal">Predict how P(A | B) changes when the overlap grows.</p>
          <p class="exploration-fixed">Keep the total, A count, and B count fixed.</p>
          <label for="overlap-prediction">Your <strong>prediction</strong></label>
          <textarea class="exploration-prediction" id="overlap-prediction"></textarea>
          <label for="overlap-control">Number in both A and B</label>
          <input class="exploration-control" id="overlap-control" type="range"
                 min="{low}" max="{high}" step="1" value="{overlap}" disabled>
          <div class="exploration-readout"></div>
          <p class="exploration-status" role="status"></p>
          <button class="exploration-reset" type="button" disabled>Reset diagram</button>
          <label for="overlap-reflection">Explain the pattern you observed</label>
          <textarea class="exploration-reflection" id="overlap-reflection"></textarea>
          <div class="exploration-explanation"><p>The numerator changes; B stays fixed.</p></div>
        </div>
    """

    @classmethod
    def example(cls, total=20, condition=8, event=12, overlap=4):
        return cls.template.format(
            total=total,
            condition=condition,
            event=event,
            overlap=overlap,
            low=max(0, event + condition - total),
            high=min(event, condition),
        )

    def parse(self, content, sources=None):
        parser = builder.Fragment(sources or {}, {})
        parser.feed('<section id="chapter"><h2>Title</h2>' + content + "</section>")
        parser.close()
        return parser.finish()

    def test_optional_components_preserve_visible_explanation_and_independent_markup(self):
        content = self.example()
        result = self.parse(content + content.replace("overlap-", "second-"))
        self.assertIn('<div class="exploration-explanation"><p>The numerator', result)
        self.assertIn('id="second-control"', result)
        self.parse("<p>A lecture without an exploration.</p>")
        self.parse(content.replace('value="4" disabled>', 'value="4" disabled />'))

    def test_count_boundaries_follow_intersection_feasibility(self):
        # Includes the positive lower bound, disjoint events, and an event equal to
        # the empty/universal set. No arrangement can create a negative cell count.
        for total, condition, event in ((2, 1, 1), (20, 8, 15), (20, 8, 0), (20, 8, 20)):
            low, high = max(0, event + condition - total), min(event, condition)
            for overlap in {low, high}:
                with self.subTest(total=total, condition=condition, event=event, overlap=overlap):
                    self.parse(self.example(total, condition, event, overlap))
            for overlap in {low - 1, high + 1}:
                with self.subTest(overlap=overlap), self.assertRaises(ValueError):
                    self.parse(self.example(total, condition, event, overlap))
        self.parse(self.example(1_000_000, 400_000, 700_000, 100_000))
        for counts in ((1, 1, 1, 1), (20, 0, 12, 0), (20, 20, 12, 12), (20, 8, 21, 8)):
            with self.subTest(counts=counts), self.assertRaises(ValueError):
                self.parse(self.example(*counts))

    def test_metadata_must_be_present_safe_nonnegative_integers(self):
        content = self.example()
        for key, original in (("total", 20), ("condition", 8), ("event", 12), ("overlap", 4)):
            attr = f'data-{key}="{original}"'
            for value in (
                "",
                " ",
                "NaN",
                "Infinity",
                "1e309",
                "0x10",
                "1/2",
                "1.5",
                "4.0",
                "4e0",
                "-1",
                "1000001",
            ):
                with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                    self.parse(content.replace(attr, f'data-{key}="{value}"'))
            for replacement in ("", f"data-{key}"):
                with self.subTest(key=key, replacement=replacement), self.assertRaises(ValueError):
                    self.parse(content.replace(attr, replacement))
        self.parse(content.replace('data-total="20"', 'data-total="020"'))

    def test_container_needs_the_supported_model_tag_and_unique_id(self):
        for old, new in (
            ('data-model="overlap"', 'data-model="simulation"'),
            ('data-model="overlap"', ""),
            ('id="overlap-demo"', ""),
            ('id="overlap-demo"', 'id="chapter"'),
            ('<div class="exploration"', '<span class="exploration"'),
            ('class="exploration"', 'class="exploration quiz"'),
        ):
            with self.subTest(old=old, new=new), self.assertRaises(ValueError):
                self.parse(self.example().replace(old, new))
        with self.assertRaisesRegex(ValueError, "Duplicate ID"):
            self.parse(self.example() * 2)

    def test_each_required_part_is_unique_separate_and_correctly_typed(self):
        for tag, classname in (
            ("p", "exploration-goal"),
            ("p", "exploration-fixed"),
            ("textarea", "exploration-prediction"),
            ("input", "exploration-control"),
            ("div", "exploration-readout"),
            ("p", "exploration-status"),
            ("button", "exploration-reset"),
            ("textarea", "exploration-reflection"),
            ("div", "exploration-explanation"),
        ):
            with self.subTest(classname=classname), self.assertRaises(ValueError):
                self.parse(self.example().replace(f'class="{classname}"', 'class="missing"'))
            with self.subTest(duplicate=classname), self.assertRaises(ValueError):
                self.parse(
                    self.example().replace(
                        '<p class="exploration-goal">',
                        f'<{tag} class="{classname}"></{tag}><p class="exploration-goal">',
                    )
                )
            with self.subTest(tag=classname), self.assertRaises(ValueError):
                self.parse(
                    self.example().replace(
                        f'<{tag} class="{classname}"', f'<span class="{classname}"'
                    )
                )
        with self.assertRaisesRegex(ValueError, "separate"):
            self.parse(
                self.example()
                .replace('<div class="exploration-readout"></div>', "")
                .replace(
                    '<div class="exploration-explanation">',
                    '<div class="exploration-explanation"><div class="exploration-readout"></div>',
                )
            )

    def test_labels_and_responses_remain_available_without_javascript(self):
        for key in ("prediction", "control", "reflection"):
            for replacement in (
                f'<label for="wrong-{key}">',
                f'<label for="overlap-{key}" hidden>',
                f'<label for="overlap-{key}" inert>',
                f'<label for="overlap-{key}" aria-hidden="true">',
            ):
                with self.subTest(key=key, replacement=replacement), self.assertRaises(ValueError):
                    self.parse(self.example().replace(f'<label for="overlap-{key}">', replacement))
            for attribute in (
                "hidden",
                "inert",
                'aria-hidden="true"',
                'aria-disabled="true"',
                'tabindex="-1"',
                "readonly",
            ):
                with self.subTest(key=key, attribute=attribute), self.assertRaises(ValueError):
                    self.parse(
                        self.example().replace(
                            f'class="exploration-{key}"', f'class="exploration-{key}" {attribute}'
                        )
                    )
            with self.subTest(key=key), self.assertRaises(ValueError):
                self.parse(self.example().replace(f'id="overlap-{key}"', ""))
        for key in ("prediction", "reflection"):
            with self.subTest(key=key), self.assertRaises(ValueError):
                self.parse(
                    self.example().replace(
                        f'class="exploration-{key}"', f'class="exploration-{key}" disabled'
                    )
                )
        for value in (
            "",
            "&#32;&nbsp;",
            "<span hidden>Prediction</span>",
            "<template>Prediction</template>",
        ):
            with self.subTest(label=value), self.assertRaises(ValueError):
                self.parse(self.example().replace("Your <strong>prediction</strong>", value))

    def test_fixed_margins_determine_the_slider_bounds_and_initial_value(self):
        for old, new in (
            ('min="0"', 'min="1"'),
            ('max="8"', 'max="9"'),
            ('step="1"', 'step="0.1"'),
            ('step="1"', 'step="any"'),
            ('value="4"', 'value="5"'),
            ('value="4"', ""),
            ('type="range"', 'type="number"'),
            ('value="4" disabled', 'value="4"'),
            ('type="button" disabled', 'type="button"'),
            ('type="button"', 'type="reset"'),
            ('type="button"', 'type="submit"'),
        ):
            with self.subTest(old=old, new=new), self.assertRaises(ValueError):
                self.parse(self.example().replace(old, new))

    def test_goal_fixed_conditions_and_explanation_have_visible_static_text(self):
        for contents in (
            "Predict how P(A | B) changes when the overlap grows.",
            "Keep the total, A count, and B count fixed.",
            "The numerator changes; B stays fixed.",
        ):
            for replacement in (
                "",
                " &#32;&nbsp; ",
                "<span hidden>Words</span>",
                "<template>Words</template>",
            ):
                with (
                    self.subTest(contents=contents, replacement=replacement),
                    self.assertRaises(ValueError),
                ):
                    self.parse(self.example().replace(contents, replacement))
        result = self.parse(
            self.example().replace(
                "The numerator changes; B stays fixed.",
                'The numerator changes. <a data-source="s1" data-page="2">Source</a>',
            ),
            {"s1": {"count": 2, "url": "sources/01-sample.pdf", "title": "Sample"}},
        )
        self.assertIn('href="sources/01-sample.pdf#page=2"', result)

    def test_explorations_do_not_claim_automatically_graded_answers(self):
        for attribute in ('data-answer="0.5"', 'data-tolerance="0.1"'):
            with self.subTest(attribute=attribute), self.assertRaises(ValueError):
                self.parse(
                    self.example().replace(
                        'data-model="overlap"', f'data-model="overlap" {attribute}'
                    )
                )

    def test_generated_readout_status_and_learner_responses_start_empty(self):
        for old, new in (
            ('class="exploration-readout"></div>', 'class="exploration-readout">Stale value</div>'),
            (
                'class="exploration-readout"></div>',
                'class="exploration-readout"><span></span></div>',
            ),
            ('role="status"></p>', 'role="status">Already changed</p>'),
            ('role="status"', 'role="alert"'),
            (
                'id="overlap-prediction"></textarea>',
                'id="overlap-prediction">Supplied prediction</textarea>',
            ),
            (
                'id="overlap-reflection"></textarea>',
                'id="overlap-reflection">Supplied explanation</textarea>',
            ),
        ):
            with self.subTest(old=old, new=new), self.assertRaises(ValueError):
                self.parse(self.example().replace(old, new))

    def test_all_parts_and_the_container_must_be_reachable(self):
        for classname in (
            "exploration",
            "exploration-goal",
            "exploration-fixed",
            "exploration-prediction",
            "exploration-control",
            "exploration-readout",
            "exploration-status",
            "exploration-reset",
            "exploration-reflection",
            "exploration-explanation",
        ):
            for attribute in ("hidden", "inert", 'aria-hidden="true"'):
                with (
                    self.subTest(classname=classname, attribute=attribute),
                    self.assertRaises(ValueError),
                ):
                    self.parse(
                        self.example().replace(
                            f'class="{classname}"', f'class="{classname}" {attribute}'
                        )
                    )
        for start, end in (
            ("<div hidden>", "</div>"),
            ("<template>", "</template>"),
            ("<fieldset disabled>", "</fieldset>"),
            ("<details><summary>Closed</summary>", "</details>"),
        ):
            with self.subTest(start=start), self.assertRaises(ValueError):
                self.parse(start + self.example() + end)

    def test_nested_interactions_extra_controls_and_form_associations_are_rejected(self):
        for extra in (
            '<div class="exploration"></div>',
            '<div class="quiz" data-answer="0"></div>',
            '<form class="practice" id="nested"></form>',
            '<input type="text">',
            "<textarea></textarea>",
            '<button type="button">Another control</button>',
            "<select></select>",
            "<p contenteditable>Editable</p>",
        ):
            with self.subTest(extra=extra), self.assertRaises(ValueError):
                self.parse(
                    self.example().replace(
                        '<p class="exploration-goal">', extra + '<p class="exploration-goal">'
                    )
                )
        for start, end in (
            ('<div class="quiz" data-answer="0">', "</div>"),
            ('<form class="practice" id="outer">', "</form>"),
        ):
            with self.subTest(start=start), self.assertRaises(ValueError):
                self.parse(start + self.example() + end)
        for key in ("prediction", "control", "reset", "reflection"):
            with self.subTest(key=key), self.assertRaises(ValueError):
                self.parse(
                    self.example().replace(
                        f'class="exploration-{key}"', f'class="exploration-{key}" form="other"'
                    )
                )

    def test_browser_paragraph_repairs_and_labels_inside_controls_are_rejected(self):
        for content in (
            "<p>" + self.example() + "</p>",
            self.example().replace("The numerator changes; B stays fixed.", "<div>Reasoning</div>"),
            self.example().replace(
                '<div class="exploration-readout"></div>',
                '<p><div class="exploration-readout"></div></p>',
            ),
            self.example()
            .replace('<label for="overlap-prediction">Your <strong>prediction</strong></label>', "")
            .replace(
                "Reset diagram</button>",
                'Reset diagram<label for="overlap-prediction">Prediction</label></button>',
            ),
        ):
            with self.subTest(content=content), self.assertRaises(ValueError):
                self.parse(content)

    def test_duplicate_attributes_and_malformed_closing_tags_cannot_change_browser_meaning(self):
        for old, new in (
            ('data-total="20"', 'data-total="20" data-total="30"'),
            ('class="exploration"', 'class="exploration" class="ordinary"'),
            ('class="exploration"', 'class="ordinary" class="exploration"'),
            ('value="4"', 'value="4" value="5"'),
            ('for="overlap-prediction"', 'for="overlap-prediction" for="overlap-control"'),
            ("</textarea>", ""),
            ("</label>", ""),
            ("</div>", ""),
        ):
            with self.subTest(old=old, new=new), self.assertRaises(ValueError):
                self.parse(self.example().replace(old, new, 1))


if __name__ == "__main__":
    unittest.main()
