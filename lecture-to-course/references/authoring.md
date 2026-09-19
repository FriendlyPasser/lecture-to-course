# Course authoring contract

All file paths in course JSON are relative to that JSON file. Generated filenames use stable lowercase slugs. Source IDs, glossary IDs and optional concept IDs are unique within their respective lists. Physical PDF pages start at 1; printed slide labels can be mentioned separately.

```json
{
  "id": "probability-course",
  "title": "Probability, one idea at a time",
  "description": "Review conditional probability with worked examples.",
  "notice": "Optional ordering, coverage, or synthetic-demo notice",
  "sources": [{"id":"s1","title":"Lecture 1.pdf","path":"source-index/sources/01-Lecture-1.pdf"}],
  "assets": [{"path":"images/diagram.png","name":"diagram.png"}],
  "glossary": [{"id":"conditional","en":"Conditional probability","zh":"条件概率","definition":"Probability within a specified event."}],
  "lectures": [{"id":"conditional-probability","title":"Conditional probability","summary":"Change the reference group.","file":"lecture-01.html"}]
}
```

Author lecture files as HTML fragments, without head/body/script/style. Each chapter is `<section id="unique-chapter"><p class="eyebrow">01 / IDEA</p><h2>Heading</h2>…</section>`. Every lecture must have at least one section with a unique ID and h2. Use proper paragraphs, lists, tables, inline SVG, and native MathML. Source attributes on citations resolve into working PDF links during build.

Components:

```html
<ul class="objectives"><li>Compute a conditional probability.</li></ul>
<button class="term" data-term="conditional">conditional probability</button>
<a data-source="s1" data-page="2">Source · p. 2</a>
<p class="muted">Author-created example · New numbers applying the cited concept.</p>
<details><summary>Optional background</summary><div class="supplement"><strong>Supplementary explanation</strong><p>Added context beyond the lecture.</p></div></details>
<div class="uncertain"><strong>Unclear in source · p. 3</strong><p>State exactly what cannot be read.</p></div>
<ol><li>Essential calculation step with justification, visible in the main lesson.</li></ol>
<details id="explain-reference"><summary>Compare your explanation</summary><p>Reference answer to a self-explanation prompt.</p></details>
<div class="equation"><math display="block"><mi>P</mi><mo>(</mo><mi>A</mi><mo>)</mo></math><p>Accessible explanation of the expression.</p></div>
<figure><img src="assets/diagram.png" alt="Specific description"><figcaption>Explanation and source citation.</figcaption></figure>
<div class="quiz" data-answer="1">
  <h3>Which denominator should we use?</h3>
  <div class="options"><button>Everyone</button><button>Only the conditioned group</button></div>
  <p class="quiz-status" role="status"></p>
  <p class="quiz-hint" data-option="0" hidden>Which words in the question restrict who belongs in the group?</p>
  <div class="explanation" hidden><p>Explain the correct choice and distractor. <a data-source="s1" data-page="2">Source</a></p></div>
  <button class="retry" hidden>Try again</button>
</div>
```

Answers are zero-based option indexes. The template handles quiz feedback, retry, glossary search/open/close, keyboard focus and reading progress. No custom script is needed. Define every referenced glossary term. Use only local image assets (declared above) or inline SVG; include math text that can be reviewed directly, not raw unrendered LaTeX. Formula overflow scrolls horizontally within its container.

## Hints before the full answer

Add a hidden `<p class="quiz-hint" data-option="0" hidden>…</p>` for each plausible wrong option. `data-option` is the zero-based index of that incorrect option, in the same order as the buttons in `.options`. Keep each hint inside its quiz but outside `.options` and `.explanation`; give each wrong option at most one hint, and never attach a hint to the correct option. Use a short, nonempty prompt aimed at that distractor's misconception. For example, a whole-population denominator calls for reconsidering the reference group; a numerator counting the wrong property calls for naming what is measured. Do not state the correct option, calculate the final answer, or copy the full explanation into a hint.

For a quiz with hints, include exactly one visible `.quiz-status`, one initially hidden `.explanation`, and one initially hidden, enabled `button.retry`. Keep these components separate from one another and outside `.options`, hints, and hidden, inert, or collapsible wrappers so all feedback controls remain reachable. Keep hints outside the status and retry controls as well. The builder rejects missing or unreachable feedback controls, duplicate hints and invalid hint indexes before producing a course.

One or more hints enable the following behavior for that quiz:

- A wrong choice shows only its matching hint and leaves the correct choice and full explanation hidden. If that option has no authored hint, the template supplies a generic prompt to reconsider and retry. Author hints for every plausible distractor so feedback remains useful.
- “Try again” unlocks the options while retaining the latest hint for the next attempt. Another wrong choice replaces that hint; a correct choice clears it and reveals the full explanation.
- The template supplies a “Show full explanation” button (`.show-explanation`) while the solution is hidden, including before answering and after a wrong attempt. It reveals the correct choice and full reasoning and locks the options, then hides itself while the solution is visible. Revealing an unanswered question does not grade it as a correct response. “Try again” hides the solution and allows another attempt, keeping the latest wrong-answer hint if one is still relevant.

Keep the complete, cited reasoning in `.explanation`, including why the correct answer follows and why the distractors fail. The reveal control lets students read it whenever they need it; no custom script or course JSON field is needed. Existing quizzes without any `.quiz-hint` retain their original behavior: every submitted answer immediately reveals the correct option and explanation.

In a bilingual course, add a reviewed Chinese translation for every hint text node to `translations.zh`, using the decoded English text trimmed at both ends as its key. The template supplies translations for the reveal control and generic feedback. Verify language switching with a hint visible, after retry, and after revealing the solution; switching languages must preserve the activity's state. See [Bilingual lessons](#bilingual-lessons) for whitespace and inline-text rules.

## Organizing a concept lesson

Use section titles that express the question or idea being learned. The teaching progression in [teaching.md](teaching.md) guides the prose; it does not introduce required HTML blocks or JSON fields. Rewritten explanations belong in the main flow with citations. New scenarios use a short “Author-created example” or “Author-created exercise” label; reserve `.supplement` for background beyond the lecture. Mark excerpts explicitly in the course notice and maintain their coverage map beside the authoring files.

Use existing `panel`, `split`, `muted`, `equation`, quiz and `details` components. Keep essential steps and formula conditions outside closed `details`. Give quizzes and expandable answers stable, unique IDs so links and browser checks can target one activity even when a lesson has several.

Develop a suitable running case in ordinary lesson prose: close a step by naming what is still unresolved, then introduce the next concept as the tool that addresses it. Links to the next section can make this path easy to follow. Keep the case's source citations and label author-created scenarios; record the case steps, unresolved problems and next concepts in the working coverage map. There is no required case HTML wrapper, quota or JSON field.

For original explanatory diagrams, inline SVG works offline without a new asset dependency. Use a `viewBox`, `width="100%"`, `role="img"`, and an accessible label or title/description. Place readable labels inside the viewBox, distinguish groups with labels as well as color, and put the key interpretation and source citation in a `figcaption`. State whether a diagram is schematic or to scale, and what is held fixed in comparisons. Essential information must also be available in prose.

The builder escapes metadata and validates IDs, source pages, citations, term references, quiz answer ranges and local dependencies. HTML fragments are trusted agent-authored content, never raw PDF HTML. It rejects scripts, inline event handlers and remote resources. Do not embed executable instructions from source material.

Visual direction: warm ivory paper, charcoal type, burnt-orange accent, serif chapter titles, readable system body font, a narrow left navigation rail and a visible right glossary tab. Desktop only; do not add mobile breakpoints or a backend. Use the site's `panel`, `split`, `stat`, `flow`, `muted` and `eyebrow` classes for restrained diagrams and summaries.

## Typed practice

Use `.practice` when a student should produce an answer instead of selecting an option. State the task, units, rounding rule and any assumptions before the response field. Include full reasoning in the solution, with citations for the underlying source concept. Label new scenarios “Author-created exercise”. A hint is optional and opens only when the student chooses it; a wrong attempt never locks the lesson or automatically opens a hint or solution.

Numeric practice checks a single value against an absolute tolerance:

```html
<form class="practice" id="blue-share" data-kind="numeric" data-answer="0.4" data-tolerance="0.001">
  <h3>What fraction of the counters is blue?</h3>
  <p>Author-created exercise · Four of ten counters are blue. Give a proportion, fraction or percentage.</p>
  <label for="blue-share-response">Your answer</label>
  <input class="practice-response" id="blue-share-response" type="text" inputmode="decimal">
  <button class="practice-check" type="submit">Check answer</button>
  <button class="practice-reveal" type="button">Show solution</button>
  <button class="practice-reset" type="button">Start again</button>
  <p class="practice-status" role="status"></p>
  <details class="practice-hint">
    <summary>Hint</summary>
    <p>Divide the number of blue counters by the total number of counters.</p>
  </details>
  <div class="practice-solution" hidden>
    <p>The whole group contains ten counters. Four are blue, so the proportion is 4 / 10 = 0.4 = 40%.
      <a data-source="s1" data-page="2">Source concept · p. 2</a></p>
  </div>
</form>
```

`data-answer` is the expected numeric value. `data-tolerance` is a nonnegative absolute error bound and defaults to `0.000001` when omitted; zero requires an exact numeric match apart from floating-point roundoff. Both attributes must contain finite decimal numbers; scientific notation is supported. Write `0.4`, not `40%` or `2/5`, in `data-answer`. Student responses accept finite decimals, simple fractions with a nonzero denominator, and a trailing `%` after either form; for example, `0.4`, `2/5` and `40%` represent the same value. Do not use expression evaluation, variable names or units in the response field. Empty or invalid input receives guidance to enter a valid number. A valid attempt receives correct/try-again feedback; a correct answer also reveals the solution. The student can edit and resubmit. Select a tolerance that matches the question's rounding instructions.

For explanations, derivations or responses that need judgment, use reflection practice. It collects the student's attempt and reveals a reference answer or rubric for self-assessment; it never labels the response correct or incorrect:

```html
<form class="practice" id="denominator-reason" data-kind="reflection">
  <h3>Explain your denominator</h3>
  <p>Author-created exercise · Explain why the denominator changes when we condition on a group.</p>
  <label for="denominator-response">Your explanation</label>
  <textarea class="practice-response" id="denominator-response" rows="4"></textarea>
  <button class="practice-check" type="submit">Compare with key points</button>
  <button class="practice-reveal" type="button">Show solution</button>
  <button class="practice-reset" type="button">Start again</button>
  <p class="practice-status" role="status"></p>
  <div class="practice-solution" hidden>
    <p>Self-assessment: did you identify the conditioned group, explain that it becomes the reference group,
      and use only its members in the denominator? Compare each point with your own explanation.
      <a data-source="s1" data-page="2">Source concept · p. 2</a></p>
  </div>
</form>
```

A reflection uses one `textarea.practice-response` and must not have `data-answer` or `data-tolerance`. Submitting a nonempty response reveals the rubric; submitting an empty response asks the student to write an attempt. The reveal button is available immediately for either kind, including before an attempt, and moves focus to the solution. Reset clears the response and feedback, hides the solution, closes optional hints and returns focus to the response. Typed response text and the visible form state are not saved; reloading starts a fresh form. If the activity has a concept mapping, its recent interaction evidence is saved separately for review as described below. A correct numeric response is feedback on one calculation, not a mastery claim. All behavior runs locally, with no grading service or custom author script.

Give every practice form and response a unique lowercase slug ID. Each form requires exactly one response, one visible `label` whose `for` matches the response ID, and the three separate buttons with the exact classes and types shown above. Numeric responses require `type="text" inputmode="decimal"`; do not use `type="number"`, which cannot accept fractions or percentages. Include exactly one initially empty `p.practice-status` with `role="status"`, and one nonempty `div.practice-solution` with `hidden`. Keep the form, labels, response, status and buttons visible, enabled and outside hidden, inert or closed containers; the solution must become reachable when its `hidden` attribute is removed. An optional hint uses `details.practice-hint` with a descriptive summary. Do not nest practices, quizzes or other forms inside one another, override form submission attributes, or add extra input controls. Any additional button, such as a glossary term, needs `type="button"` so it cannot submit the practice. The builder rejects missing, duplicate or unusable required controls and malformed practice markup before producing the course.

Translate practice questions, labels, hints, solutions, rubrics and custom button labels in `translations.zh`; common feedback is supplied by the template. Verify invalid input, wrong/correct numeric attempts, reflection self-assessment, reveal, reset, keyboard submission and language switching in the built course. Switching language must preserve the current response and revealed solution.

## Concept evidence and cumulative review

Concept review is optional. Declare the important assessable concepts in course JSON independently of the glossary, then map existing activities to them:

```json
{
  "concepts": [
    {"id": "reference-denominator", "title": "Choose the conditional reference group"}
  ]
}
```

A concept is a learning target, such as choosing a denominator; a glossary entry defines a term. They need not share IDs or have a one-to-one relationship. Add a reviewed `translations.zh` entry for every concept title in a bilingual course. Courses without `concepts` keep their existing behavior.

Add `data-concept="reference-denominator"` and a stable `id` to each relevant `.quiz` or `form.practice`:

```html
<div class="quiz" id="library-denominator" data-concept="reference-denominator" data-answer="1">
  <!-- Include the complete quiz controls, targeted hints and cited explanation shown above. -->
</div>
<form class="practice" id="clinic-review" data-concept="reference-denominator"
      data-kind="numeric" data-answer="0.3" data-tolerance="0">
  <!-- Include a complete new-scenario prompt, response, controls and cited solution. -->
</form>
```

These abbreviated tags show the mapping only; they do not replace the required quiz or practice markup. Each activity maps to one declared concept. Every declared concept needs at least one graded multiple-choice or numeric activity. Reflection practices may map to the same concept to record self-assessment, but cannot supply graded evidence on their own. Put mappings on the activity, not a surrounding section, source link or glossary term. The builder discovers lecture/activity links and rejects unknown concepts, missing activity IDs and concepts without a graded activity. Keep course, lecture, concept and activity IDs stable across translations; assign a new activity ID when replacing a question with a materially different task so its evidence is not conflated with the old task.

For a multi-lecture course, author at least one later-lecture activity that retrieves an earlier concept with changed numbers, context or reasoning. Keep the earlier concept ID and give the new activity a different ID. Write and verify the new question yourself: the template does not generate variants. Label new scenarios “Author-created cumulative review,” cite the earlier source rule in the solution and supply an optional targeted hint. Avoid repeating the exact question or placing its answer immediately before the review prompt. Record **concept → first practice → later changed-scenario practice → verified reasoning/source** in the coverage map. The demo's `clinic-review` revisits the reference group in the independence lecture; `bilingual-clinic-review` provides a separate translated review fragment.

The generated review panel is available from the overview and every lecture. Its states describe observed activity interactions:

| Evidence | Meaning and limits |
|---|---|
| Independently correct | A graded answer was correct without recorded help for that attempt or recent solution exposure. This is an operational label, not proof that the learner worked unaided. |
| Used a hint | The learner opened a numeric hint or received a quiz hint after a wrong choice. |
| Correct with support or repetition | A correct answer followed recorded help or a recent attempt on the same question. |
| Still needs review | A graded answer was wrong. Reading or marking a chapter complete cannot replace this evidence. |
| Viewed the solution | The learner chose to reveal the answer; this does not count as correct. |
| Compared with key points | A reflection response was compared with its rubric; the prose is not automatically graded. |

A correct answer's automatically displayed solution is also remembered, so resetting or reloading and repeating that question cannot immediately create another independent success. An unseen or different graded question is recommended ahead of repeating the last question when available. Recent errors or support use take priority over concepts that are not due. A first qualifying independent success recommends review the next day; further independent successes separated by at least 24 hours can extend the interval to 3, then 7 days. A later attempt on the same question needs a fresh page and no new help; leaving an already answered or helped form open overnight does not make it independent. Another question answered on the same day can add evidence without extending the interval again. Wrong answers, hints, voluntary solution views, supported repetitions and self-assessment restart the spacing sequence. These are transparent scheduling heuristics, not a validated memory model or an assessment of mastery.

Evidence is recent local history, not a lifetime score. The template retains a bounded recent event history per activity; typed responses are not stored. It uses browser storage scoped to the course and browser origin. File-URL storage behavior differs by browser, and a launcher port change creates a different origin. Clearing browser data, changing browser/device or rebuilding to a different location may make history unavailable; it is not synced or backed up. If storage is blocked or full, the course still works with a temporary in-page history. The review feature needs no account, network or grading server. Reading progress stays separate, and hints or solutions outside mapped activities are not tracked.

Verify independent and supported correct answers, wrong answers, hint use, voluntary reveal, reflection comparison and review links in the built course. Reload after solution exposure and confirm an immediate retry cannot advance the schedule. Check a different question and a later separated success, plus blocked storage and bilingual switching. Confirm every recommendation opens a real mapped activity and that no status or label calls the learner “mastered.”

## Optional prerequisite check

Place a `<section class="precheck" id="prerequisites">` with an h2 before the first main section when the course needs prior knowledge. Use ordinary quizzes with unique IDs. Add `data-prerequisite="fraction-refresher"` to map a diagnostic quiz to a same-lecture `<details class="prerequisite" id="fraction-refresher">`; each target needs a summary and a hidden return button inside its supplementary explanation:

```html
<section class="precheck" id="prerequisites">
  <h2>Before you begin: a quick prerequisite check</h2>
  <p>Optional author-created check. Review a gap or start the lesson now.</p>
  <a class="precheck-skip" href="#first-main-section">Skip the check and start the lesson</a>
  <div class="quiz" id="fraction-check" data-answer="0" data-prerequisite="fraction-refresher">
    <h3>Three of twelve counters are blue. What percentage is blue?</h3>
    <div class="options"><button>25%</button><button>36%</button></div>
    <p class="quiz-status" role="status"></p>
    <p class="quiz-hint" data-option="1" hidden>Multiplying the counts does not measure a share. How could you compare the blue count with the total instead?</p>
    <div class="explanation" hidden><p>3/12 = 1/4 = 25%. Multiplying the counts gives 36, not the share.</p></div>
    <button class="retry" hidden>Try again</button>
  </div>
  <details class="prerequisite" id="fraction-refresher">
    <summary>Refresher: a part-to-whole fraction</summary>
    <div class="supplement">
      <strong>Supplementary explanation</strong>
      <p>Author-created example: divide the blue count, 3, by the total count, 12. Multiply the resulting 0.25 by 100 to express it as 25%.</p>
      <button class="prerequisite-return" hidden>Return to question</button>
    </div>
  </details>
</section>
<section id="first-main-section"><h2>The main lesson</h2><p>All lesson content is available immediately.</p></section>
```

The template adds “Review this prerequisite” to a mapped quiz's feedback only after a wrong answer. With hints authored as above, that feedback first offers the misconception-specific prompt without automatically revealing the solution. Activating the review link opens and focuses the corresponding refresher; “Return to question” restores focus to the originating quiz so the student can retry. For quizzes with hints, retry keeps both the latest hint and the refresher link available, including the return route to the originating question if the refresher was opened. A correct answer clears that feedback and return route. Legacy quizzes without hints also clear the link and return route on retry. Students can open each refresher directly. The skip link is an ordinary same-page link to the first main section and works without JavaScript; the check never gates the lesson. No custom script or separate course JSON fields are needed.

Keep each referenced refresher outside quizzes and hidden, inert or collapsible containers so it is independently reachable. Give it exactly one `summary`, as a direct child, and one enabled `button.prerequisite-return` with the `hidden` attribute; do not nest that return button inside another `details`. The template reveals the return button when a diagnostic sends the student to the refresher.

Use a small number of questions, normally two or three, each tied to a specific necessary prerequisite. The snippet shows one mapping; select further questions based on the source rather than duplicating a quiz to meet a quota. Check the mappings, skip, focus return, retry and bilingual feedback in the built course.

## Bilingual lessons

Author English fragments and add a `translations.zh` dictionary to the course JSON. Keys are decoded English text nodes trimmed at both ends; values are reviewed plain Chinese text, not HTML. Exact matches take priority; otherwise the switch collapses whitespace in both keys and text so formatting line breaks do not prevent translation. Translate each text node separately around inline terms, subscripts and emphasis so the sentences still read naturally when joined. Translate course/lecture titles, summaries, notice, section headings, body text, table explanations, quiz questions/options/hints/reasoning, glossary definitions, image captions/alt text and custom UI labels. Preserve source examples, mathematical notation and formal tags when translating would change their meaning. Original source images may remain in their original language with Chinese captions and explanations.

```json
{
  "default_language": "en",
  "translations": {
    "zh": {
      "Conditional probability": "条件概率",
      "Change the reference group.": "改变参照群体。"
    }
  }
}
```

This snippet illustrates the dictionary format only; a finished bilingual course needs translations for the entire lesson, including prerequisite questions, options, feedback, refresher text and skip links. The builder supplies common UI translations (including the prerequisite review/return controls) and combines translated metadata into navigation labels. Include custom source-link text in the dictionary too. Glossary entries retain English headwords and Chinese equivalents in both modes. Default to `en` unless the user requests Chinese first. Legacy specs without translations remain English-only and do not show a nonfunctional language switch. Do not supply partial translations merely to expose the button.

The template places one Chinese/English switch at the fixed upper-right corner above lesson content and below the glossary drawer. The separate right-side glossary tab is always “术语”. Translations ship in a local JavaScript file with no fetch or external translation service. Text changes in place to preserve quiz selections, expanded answers and focus. Language choice uses a course-specific storage key and a `lang` query parameter for navigation when storage is blocked. Keep stable section IDs across languages and verify the visible reading section after switching.
