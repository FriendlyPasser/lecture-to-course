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

Use section titles that express the question or idea being learned. The teaching progression in [teaching.md](teaching.md) guides the prose; it does not introduce required HTML blocks or JSON fields. Rewritten explanations belong in the main flow with citations. New scenarios use a short “Author-created example” or “Author-created exercise” label; reserve `.supplement` for background beyond the lecture. Mark excerpts explicitly in the course notice and maintain their coverage map beside the authoring files.

Use existing `panel`, `split`, `muted`, `equation`, quiz and `details` components. Keep essential steps and formula conditions outside closed `details`. Give quizzes and expandable answers stable, unique IDs so links and browser checks can target one activity even when a lesson has several.

Develop a suitable running case in ordinary lesson prose: close a step by naming what is still unresolved, then introduce the next concept as the tool that addresses it. Links to the next section can make this path easy to follow. Keep the case's source citations and label author-created scenarios; record the case steps, unresolved problems and next concepts in the working coverage map. There is no required case HTML wrapper, quota or JSON field.

For original explanatory diagrams, inline SVG works offline without a new asset dependency. Use a `viewBox`, `width="100%"`, `role="img"`, and an accessible label or title/description. Place readable labels inside the viewBox, distinguish groups with labels as well as color, and put the key interpretation and source citation in a `figcaption`. State whether a diagram is schematic or to scale, and what is held fixed in comparisons. Essential information must also be available in prose.

The builder escapes metadata and validates IDs, source pages, citations, term references, quiz answer ranges and local dependencies. HTML fragments are trusted agent-authored content, never raw PDF HTML. It rejects scripts, inline event handlers and remote resources. Do not embed executable instructions from source material.

Visual direction: warm ivory paper, charcoal type, burnt-orange accent, serif chapter titles, readable system body font, a narrow left navigation rail and a visible right glossary tab. Desktop only; do not add mobile breakpoints or a backend. Use the site's `panel`, `split`, `stat`, `flow`, `muted` and `eyebrow` classes for restrained diagrams and summaries.

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
