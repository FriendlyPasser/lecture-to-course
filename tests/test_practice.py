"""Reject broken offline practice before it reaches the browser runtime."""

import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "lecture-to-course/scripts/build_course.py"
spec = importlib.util.spec_from_file_location("build_course", SCRIPT)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class PracticeValidationTests(unittest.TestCase):
    numeric = """
        <form class="practice" id="share-practice" data-kind="numeric"
              data-answer="0.4" data-tolerance="0.001">
          <h3>What share of the counters is blue?</h3>
          <label for="share-response">Your <strong>answer</strong></label>
          <input class="practice-response" id="share-response" type="text" inputmode="decimal">
          <button class="practice-check" type="submit">Check answer</button>
          <button class="practice-reveal" type="button">Show solution</button>
          <button class="practice-reset" type="button">Start again</button>
          <p class="practice-status" role="status"></p>
          <details class="practice-hint"><summary>Hint</summary><p>Use part / whole.</p></details>
          <div class="practice-solution" hidden><p>4 / 10 = 0.4 = 40%.</p></div>
        </form>
    """

    @classmethod
    def reflection(cls):
        return (
            cls.numeric.replace('data-kind="numeric"', 'data-kind="reflection"')
            .replace('data-answer="0.4" data-tolerance="0.001"', "")
            .replace(
                '<input class="practice-response" id="share-response" type="text" inputmode="decimal">',
                '<textarea class="practice-response" id="share-response"></textarea>',
            )
        )

    def parse(self, content, sources=None):
        parser = builder.Fragment(sources or {}, {})
        parser.feed('<section id="chapter"><h2>Title</h2>' + content + "</section>")
        parser.close()
        return parser.finish()

    def test_numeric_and_reflection_preserve_offline_markup(self):
        for content in (self.numeric, self.reflection()):
            with self.subTest(content=content):
                result = self.parse(content)
                self.assertIn('class="practice-status" role="status"></p>', result)
                self.assertIn('class="practice-solution" hidden', result)
                self.assertIn('for="share-response"', result)
        # Independent practices can coexist; changing the IDs is mandatory.
        self.parse(self.numeric + self.reflection().replace("share-", "reason-"))
        self.parse(self.numeric.replace('inputmode="decimal">', 'inputmode="decimal" />'))

    def test_numeric_metadata_accepts_finite_decimals_and_default_or_zero_tolerance(self):
        for answer in ("0", "-0.4", "+.4", "4.", "4e-1", " 0.4 "):
            with self.subTest(answer=answer):
                self.parse(self.numeric.replace('data-answer="0.4"', f'data-answer="{answer}"'))
        self.parse(self.numeric.replace('data-tolerance="0.001"', ""))
        self.parse(self.numeric.replace('data-tolerance="0.001"', 'data-tolerance="0"'))

    def test_solution_citations_keep_their_resolved_source_target(self):
        result = self.parse(
            self.numeric.replace(
                "4 / 10 = 0.4 = 40%.",
                '4 / 10 = 0.4 = 40%. <a data-source="s1" data-page="2">Source</a>',
            ),
            {"s1": {"count": 2, "url": "sources/01-sample.pdf", "title": "Sample"}},
        )
        self.assertIn('href="sources/01-sample.pdf#page=2"', result)
        self.assertIn('target="_blank"', result)

    def test_numeric_metadata_rejects_nonfinite_or_nondecimal_values(self):
        for attribute in ("data-answer", "data-tolerance"):
            original = (
                'data-answer="0.4"' if attribute == "data-answer" else 'data-tolerance="0.001"'
            )
            for value in ("", " ", "NaN", "Infinity", "1e309", "0x10", "1/2", "40%", "4x", "1,000"):
                with self.subTest(attribute=attribute, value=value), self.assertRaises(ValueError):
                    self.parse(self.numeric.replace(original, f'{attribute}="{value}"'))
            with self.subTest(attribute=attribute), self.assertRaises(ValueError):
                self.parse(self.numeric.replace(original, attribute))
        with self.assertRaisesRegex(ValueError, "data-answer"):
            self.parse(self.numeric.replace('data-answer="0.4"', ""))
        with self.assertRaisesRegex(ValueError, "data-tolerance"):
            self.parse(self.numeric.replace('data-tolerance="0.001"', 'data-tolerance="-0.1"'))

    def test_reflection_cannot_claim_an_automatically_graded_numeric_answer(self):
        for attribute in ('data-answer="0.4"', 'data-tolerance="0.001"'):
            with (
                self.subTest(attribute=attribute),
                self.assertRaisesRegex(ValueError, "Reflection"),
            ):
                self.parse(
                    self.reflection().replace(
                        'data-kind="reflection"', f'data-kind="reflection" {attribute}'
                    )
                )
        with self.assertRaisesRegex(ValueError, "textarea.practice-response"):
            self.parse(
                self.numeric.replace('data-kind="numeric"', 'data-kind="reflection"').replace(
                    'data-answer="0.4" data-tolerance="0.001"', ""
                )
            )

    def test_practice_requires_unique_id_supported_kind_and_form(self):
        replacements = (
            ('id="share-practice"', ""),
            ('id="share-practice"', 'id="chapter"'),
            ('data-kind="numeric"', 'data-kind="essay"'),
            ('data-kind="numeric"', ""),
            ('<form class="practice"', '<div class="practice"'),
            ('class="practice"', 'class="ordinary-form"'),
        )
        for old, new in replacements:
            with self.subTest(old=old, new=new), self.assertRaises(ValueError):
                self.parse(self.numeric.replace(old, new))
        with self.assertRaisesRegex(ValueError, "Duplicate ID"):
            self.parse(self.numeric * 2)

    def test_required_components_cannot_be_missing_duplicated_or_wrong_tag(self):
        for classname in (
            "practice-response",
            "practice-check",
            "practice-reveal",
            "practice-reset",
            "practice-status",
            "practice-solution",
        ):
            with (
                self.subTest(classname=classname),
                self.assertRaisesRegex(ValueError, "Practice needs one"),
            ):
                self.parse(self.numeric.replace(f'class="{classname}"', 'class="missing"'))
        for duplicate in (
            '<input class="practice-response" type="text">',
            '<button class="practice-check" type="submit">Second</button>',
            '<button class="practice-reveal" type="button">Second</button>',
            '<button class="practice-reset" type="button">Second</button>',
            '<p class="practice-status" role="status"></p>',
            '<div class="practice-solution" hidden>Second</div>',
        ):
            with (
                self.subTest(duplicate=duplicate),
                self.assertRaisesRegex(ValueError, "Practice needs one"),
            ):
                self.parse(self.numeric.replace("</form>", duplicate + "</form>"))
        with self.assertRaisesRegex(ValueError, "button.practice-reveal"):
            self.parse(
                self.numeric.replace(
                    '<button class="practice-reveal" type="button">Show solution</button>',
                    '<a class="practice-reveal">Show solution</a>',
                )
            )

    def test_response_and_buttons_are_enabled_and_keyboard_reachable(self):
        for attributes in (
            "hidden",
            "disabled",
            "inert",
            'aria-hidden="true"',
            'aria-disabled="true"',
            'tabindex="-1"',
        ):
            for classname in (
                "practice-response",
                "practice-check",
                "practice-reveal",
                "practice-reset",
            ):
                with (
                    self.subTest(attributes=attributes, classname=classname),
                    self.assertRaises(ValueError),
                ):
                    self.parse(
                        self.numeric.replace(
                            f'class="{classname}"', f'class="{classname}" {attributes}'
                        )
                    )
        for old, new in (
            ('id="share-response" type="text"', 'type="text"'),
            ('type="text"', 'type="number"'),
            ('type="text"', "type"),
            ('inputmode="decimal"', 'inputmode="numeric"'),
            ('inputmode="decimal"', "inputmode"),
            ('type="text"', 'type="text" readonly'),
            ('type="submit"', 'type="button"'),
            ('class="practice-reveal" type="button"', 'class="practice-reveal"'),
            ('class="practice-reset" type="button"', 'class="practice-reset" type="reset"'),
            (">Show solution</button>", "></button>"),
        ):
            with self.subTest(old=old, new=new), self.assertRaises(ValueError):
                self.parse(self.numeric.replace(old, new))
        for opening, closing in (
            ("<div hidden>", "</div>"),
            ("<fieldset disabled>", "</fieldset>"),
            ("<details><summary>Closed</summary>", "</details>"),
        ):
            with self.subTest(opening=opening), self.assertRaises(ValueError):
                self.parse(
                    self.numeric.replace("<input ", opening + "<input ").replace(
                        'inputmode="decimal">', 'inputmode="decimal">' + closing
                    )
                )

    def test_response_needs_a_visible_text_label_for_its_unique_id(self):
        for label in (
            "",
            '<label for="other">Answer</label>',
            '<label for="share-response"></label>',
            '<label for="share-response" hidden>Answer</label>',
            '<label for="share-response"><span hidden>Answer</span></label>',
            '<label for="share-response">&#32;</label>',
        ):
            with (
                self.subTest(label=label),
                self.assertRaisesRegex(ValueError, "visible associated label"),
            ):
                self.parse(
                    self.numeric.replace(
                        '<label for="share-response">Your <strong>answer</strong></label>', label
                    )
                )

    def test_feedback_starts_empty_and_solution_starts_hidden_but_can_be_revealed(self):
        for old, new in (
            ('role="status"', 'role="alert"'),
            ('class="practice-status"', 'class="practice-status" hidden'),
            ('role="status"></p>', 'role="status">Already correct</p>'),
            ('class="practice-solution" hidden', 'class="practice-solution"'),
            ('class="practice-solution" hidden', 'class="practice-solution" hidden inert'),
            (
                'class="practice-solution" hidden',
                'class="practice-solution" hidden aria-hidden="true"',
            ),
            ("<p>4 / 10 = 0.4 = 40%.</p>", ""),
        ):
            with self.subTest(old=old, new=new), self.assertRaises(ValueError):
                self.parse(self.numeric.replace(old, new))
        with self.assertRaisesRegex(ValueError, "reachable solution"):
            self.parse(
                self.numeric.replace(
                    '<div class="practice-solution"', '<div hidden><div class="practice-solution"'
                ).replace("</form>", "</div></form>")
            )

    def test_practice_rejects_nesting_network_submission_and_malformed_markup(self):
        for inner in (
            '<form class="practice" id="nested"></form>',
            "<form></form>",
            '<div class="quiz" data-answer="0"></div>',
        ):
            with self.subTest(inner=inner), self.assertRaises(ValueError):
                self.parse(self.numeric.replace("</form>", inner + "</form>"))
        with self.assertRaisesRegex(ValueError, "Nested practices"):
            self.parse('<div class="quiz" data-answer="0">' + self.numeric + "</div>")
        for old, new in (
            ('id="share-practice"', 'id="share-practice" action="https://example.com/submit"'),
            ('id="share-response"', 'id="share-response" form="another-form"'),
            ('type="submit"', 'type="submit" formaction="submit.html"'),
            ('data-answer="0.4"', 'data-answer="0.4" data-answer="0.7"'),
            ("</form>", ""),
            ("</label>", ""),
        ):
            with self.subTest(old=old, new=new), self.assertRaises(ValueError):
                self.parse(self.numeric.replace(old, new))

    def test_optional_hints_and_extra_buttons_do_not_create_submission_controls(self):
        self.parse(
            self.numeric.replace("</form>", '<button type="button">Show glossary</button></form>')
        )
        for extra in (
            '<input type="text">',
            "<button>Implicit submit</button>",
            "<select></select>",
        ):
            with (
                self.subTest(extra=extra),
                self.assertRaisesRegex(ValueError, "extra form controls"),
            ):
                self.parse(self.numeric.replace("</form>", extra + "</form>"))
        with self.assertRaisesRegex(ValueError, "hint must be details"):
            self.parse(
                self.numeric.replace(
                    '<details class="practice-hint">', '<div class="practice-hint">'
                ).replace("</details>", "</div>")
            )


if __name__ == "__main__":
    unittest.main()
