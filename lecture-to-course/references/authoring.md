# Course authoring contract

All file paths in course JSON are relative to that JSON file. Generated filenames use stable lowercase slugs. Source IDs and glossary IDs are unique. Physical PDF pages start at 1; printed slide labels can be mentioned separately.

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

Organize core sections around questions, with a clear learning objective, a brief opening connection to prior knowledge and a closing bridge to the next question. Follow the [teaching guidance](teaching.md#connect-the-questions-within-a-lecture) when choosing section boundaries; keep a complete argument together and do not impose a section count. Rewritten explanations belong in the main flow with citations. New scenarios use a short “Author-created example” or “Author-created exercise” label; reserve `.supplement` for background beyond the lecture. Mark excerpts explicitly in the course notice and maintain their coverage map beside the authoring files.

Use existing `panel`, `split`, `muted`, `equation`, quiz and `details` components. Keep essential steps and formula conditions outside closed `details`. Give quizzes and expandable answers stable, unique IDs so links and browser checks can target one activity even when a lesson has several.

Develop a suitable running case in ordinary lesson prose: close a step by naming what is still unresolved, then introduce the next concept as the tool that addresses it. Links to the next section can make this path easy to follow. Keep the case's source citations and label author-created scenarios; record the case steps, unresolved problems and next concepts in the working coverage map. There is no required case HTML wrapper, quota or JSON field.

For original explanatory diagrams, inline SVG works offline without a new asset dependency. Use a `viewBox`, `width="100%"`, `role="img"`, and an accessible label or title/description. Place readable labels inside the viewBox, distinguish groups with labels as well as color, and put the key interpretation and source citation in a `figcaption`. State whether a diagram is schematic or to scale, and what is held fixed in comparisons. Essential information must also be available in prose.

The builder escapes metadata and validates IDs, source pages, citations, term references, quiz answer ranges and local dependencies. HTML fragments are trusted agent-authored content, never raw PDF HTML. It rejects scripts, inline event handlers and remote resources. Do not embed executable instructions from source material.

Visual direction: warm ivory paper, charcoal type, burnt-orange accent, serif chapter titles, readable system body font, a narrow left navigation rail and a visible right glossary tab. Desktop only; do not add mobile breakpoints or a backend. Use the site's `panel`, `split`, `stat`, `flow`, `muted` and `eyebrow` classes for restrained diagrams and summaries.

### Question-led sections and learning routes

Use `.section-context` for the opening connection, the existing `.objectives` list for what the learner will be able to do, and `.section-next` for the closing bridge. A bridge should explain why its destination question follows, with an ordinary anchor when there is a destination to visit. The last section may end with a meaningful synthesis or transfer question. These classes style ordinary HTML; they add no required JSON fields or completion gates, and existing fragments remain compatible.

When a learning route would clarify several related concepts, use a `<nav class="learning-route" aria-label="Learning route">` outside the teaching sections. An ordered list can link each question to its section and briefly explain the relationship. Keep the route concise and optional; use a labeled concept diagram instead when branches matter more than sequence, following the accessible SVG guidance above. Do not create extra sections just to hold route nodes.

This example shows the structure; adapt its questions, explanations and citations to the reviewed sources:

```html
<nav class="learning-route" aria-label="Learning route">
  <p><strong>Learning route</strong></p>
  <ol>
    <li><a href="#reference-group">Which group belongs in the denominator?</a><p>Use a part-to-whole fraction to identify the eligible group.</p></li>
    <li><a href="#conditional-rule">How can we express that restriction as a rule?</a><p>Use the chosen group to interpret conditional probability.</p></li>
  </ol>
</nav>
<section id="reference-group" tabindex="-1">
  <h2>Which group belongs in the denominator?</h2>
  <p class="section-context">A fraction compares a part with a whole. A condition changes which whole is relevant.</p>
  <ul class="objectives"><li>Identify the eligible group before calculating a conditional probability.</li></ul>
  <p>For a question about students within group B, count the students satisfying the question within B and compare them with all students in B. <a data-source="s1" data-page="2">Source · p. 2</a></p>
  <p class="section-next">We have chosen the reference group. <a href="#conditional-rule">How can we express the same restriction for any events A and B?</a></p>
</section>
<section id="conditional-rule" tabindex="-1">
  <h2>How can we express that restriction as a rule?</h2>
  <p class="section-context">The previous question made B our reference group. We now describe the part and whole with event probabilities.</p>
  <ul class="objectives"><li>Explain the numerator, denominator and positive-denominator condition in the conditional probability rule.</li></ul>
  <p>P(A | B) = P(A ∩ B) / P(B), provided P(B) &gt; 0. The numerator measures outcomes in both A and B; the denominator measures all outcomes in B. Dividing expresses the share of B that is also in A. <a data-source="s1" data-page="2">Source · p. 2</a></p>
  <p class="section-next">Transfer question: if the condition changes from B to A, which reference group and denominator must change?</p>
</section>
```

Give anchor destinations stable IDs; `tabindex="-1"` makes a section focusable when following a native fragment link without adding it to the Tab order. Keep connections and objectives visible with the core explanation. In bilingual courses, translate every route label, relationship, objective and transition text node, plus the custom `aria-label`, through `translations.zh`; preserve IDs and link destinations. See [Bilingual lessons](#bilingual-lessons) for inline-text and whitespace rules.

Review these relationships against the coverage map's **section question → objective → depends on → next question** entries. Follow route and bridge links by keyboard in both languages and check destination focus. The static checker detects missing anchor targets; it does not assess whether an objective is taught or a dependency is valid.

## Predict → operate → explain diagrams

Use the `.exploration` component for a relationship where changing one quantity helps answer one learning question. It is optional; a static figure remains better when there is no useful controlled change. The currently supported model, `data-model="overlap"`, keeps two event sizes and the total fixed while varying the intersection. It renders a two-way count table and probability bars locally, without author scripts or external services.

```html
<div class="exploration" id="survey-overlap" data-model="overlap"
     data-total="100" data-condition="40" data-event="50" data-overlap="24">
  <p class="exploration-goal">Explain when the conditional and marginal probabilities match.</p>
  <p class="exploration-fixed">A means economics; B means statistics. Fix 100 students, 50 in A
    and 40 in B. Select a student uniformly. Hypothetically rearrange membership in both groups
    while preserving their totals; the original survey remains unchanged.</p>
  <h3>1. Predict</h3>
  <label for="overlap-prediction">Predict what lowering the overlap will do to P(A | B).</label>
  <textarea class="exploration-prediction" id="overlap-prediction" rows="3"></textarea>
  <h3>2. Operate</h3>
  <label for="overlap-control">Number in both groups, A ∩ B</label>
  <input class="exploration-control" id="overlap-control" type="range"
         min="0" max="40" step="1" value="24" disabled>
  <div class="exploration-readout"></div>
  <p class="exploration-status" role="status"></p>
  <button class="exploration-reset" type="button" disabled>Reset diagram</button>
  <h3>3. Explain</h3>
  <div class="exploration-explanation">
    <p>At the starting overlap of 24, P(A | B) = 24/40 = 60%, while P(A) = 50/100 = 50%.
      At overlap 20, both equal 50%. The four cells become 20, 20, 30 and 30 instead of
      24, 16, 26 and 34; all margins remain fixed.</p>
  </div>
  <label for="overlap-reflection">Explain your changed probability using its counts and denominator.</label>
  <textarea class="exploration-reflection" id="overlap-reflection" rows="3"></textarea>
</div>
<p class="muted">Author-created what-if diagram; starting counts match the source survey.
  <a data-source="s1" data-page="2">Source concept and counts · p. 2</a></p>
```

The metadata are integer counts: `data-total` is N, `data-condition` is the size of B, `data-event` is the size of A, and `data-overlap` is the initial intersection x. Require 2 ≤ N ≤ 1,000,000, 0 < B < N, and 0 ≤ A ≤ N; every metadata count must be an integer from 0 through 1,000,000. The range must use `min=max(0,A+B−N)`, `max=min(A,B)`, `step="1"`, and `value` equal to the initial x within that range. These constraints keep all four cells nonnegative: x, B−x, A−x and N−A−B+x. The table retains the A, B and N margins; P(A | B) = x/B changes while P(A) = A/N stays fixed. Explain the events A and B in the visible prose because generated labels use this notation. Uniform selection is a modeling assumption to state, not something the widget establishes.

Give the exploration and its three response/control fields unique lowercase slug IDs. Include exactly one of every required class shown above. Use `p` for `.exploration-goal`, `.exploration-fixed` and `.exploration-status`; `textarea` for prediction/reflection; an `input type="range"` for the control; `div` for the readout and explanation; and a `button type="button"` for reset. Each textarea and the range needs a separate visible `label` whose `for` matches its ID. Keep prediction and reflection initially empty and enabled. Keep the readout and status initially empty, with `role="status"` on the status. Author the slider and reset disabled: the template enables them after initialization, so a page without JavaScript still offers the visible worked explanation without presenting a working-looking diagram. Do not add scores, answer/tolerance metadata, extra input controls, nested explorations, quizzes or practice forms inside the component. Keep required content outside hidden, inert or collapsible wrappers; the explanation is visible, substantive prose.

Prediction is an invitation before operation, never a submission gate. The slider supports native keyboard operation and updates the table, probability bars and status together. Reset restores only the initial overlap, preserving both notes. Language switching preserves the slider and notes; notes are ungraded and are not saved by the course. Without JavaScript, the prompt and full worked reasoning remain readable. No animation or persistent storage is required.

State what is fixed, what may vary, the valid range and what each visualization represents. Mark hypothetical arrangements and distinguish them from the original source data. Keep a worked baseline and changed-setting comparison, conservation reasoning and source citations visible outside collapsible answers. Translate every authored text node and label for a bilingual course; the template supplies Chinese translations for generated table, probability and status text. Verify the baseline, both endpoints, a meaningful interior setting, reset, keyboard operation, no-JavaScript reading, offline operation, and state preservation during language switches. See [teaching.md](teaching.md#make-a-controlled-change-worth-exploring) for selecting the learning question.

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

A reflection uses one `textarea.practice-response` and must not have `data-answer` or `data-tolerance`. Submitting a nonempty response reveals the rubric; submitting an empty response asks the student to write an attempt. The reveal button is available immediately for either kind, including before an attempt, and moves focus to the solution. Reset clears the response and feedback, hides the solution, closes optional hints and returns focus to the response. Neither kind saves responses or scores, and a correct numeric response is feedback on one calculation, not a mastery claim. Reloading starts a fresh attempt. All behavior runs locally, with no grading service or custom author script.

Give every practice form and response a unique lowercase slug ID. Each form requires exactly one response, one visible `label` whose `for` matches the response ID, and the three separate buttons with the exact classes and types shown above. Numeric responses require `type="text" inputmode="decimal"`; do not use `type="number"`, which cannot accept fractions or percentages. Include exactly one initially empty `p.practice-status` with `role="status"`, and one nonempty `div.practice-solution` with `hidden`. Keep the form, labels, response, status and buttons visible, enabled and outside hidden, inert or closed containers; the solution must become reachable when its `hidden` attribute is removed. An optional hint uses `details.practice-hint` with a descriptive summary. Do not nest practices, quizzes or other forms inside one another, override form submission attributes, or add extra input controls. Any additional button, such as a glossary term, needs `type="button"` so it cannot submit the practice. The builder rejects missing, duplicate or unusable required controls and malformed practice markup before producing the course.

Translate practice questions, labels, hints, solutions, rubrics and custom button labels in `translations.zh`; common feedback is supplied by the template. Verify invalid input, wrong/correct numeric attempts, reflection self-assessment, reveal, reset, keyboard submission and language switching in the built course. Switching language must preserve the current response and revealed solution.

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

Author English fragments and add a `translations.zh` dictionary to the course JSON. Keys are decoded English text nodes trimmed at both ends; values are reviewed plain Chinese text, not HTML. Exact matches take priority; otherwise the switch collapses whitespace in both keys and text so formatting line breaks do not prevent translation. Translate each text node separately around inline terms, subscripts and emphasis so the sentences still read naturally when joined. Translate course/lecture titles, summaries, notice, section headings, body text, table explanations, quiz questions/options/hints/reasoning, glossary definitions, image captions/alt text and custom UI labels, including learning-route `aria-label` values. Preserve source examples, mathematical notation and formal tags when translating would change their meaning. Original source images may remain in their original language with Chinese captions and explanations.

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
