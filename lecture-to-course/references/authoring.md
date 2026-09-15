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
  <div class="explanation" hidden><p>Explain the correct choice and distractor. <a data-source="s1" data-page="2">Source</a></p></div>
  <button class="retry" hidden>Try again</button>
</div>
```

Answers are zero-based option indexes. The template handles quiz feedback, retry, glossary search/open/close, keyboard focus and reading progress. No custom script is needed. Define every referenced glossary term. Use only local image assets (declared above) or inline SVG; include math text that can be reviewed directly, not raw unrendered LaTeX. Formula overflow scrolls horizontally within its container.

## Organizing a concept lesson

Use section titles that express the question or idea being learned. The teaching progression in [teaching.md](teaching.md) guides the prose; it does not introduce required HTML blocks or JSON fields. Rewritten explanations belong in the main flow with citations. New scenarios use a short “Author-created example” or “Author-created exercise” label; reserve `.supplement` for background beyond the lecture. Mark excerpts explicitly in the course notice and maintain their coverage map beside the authoring files.

Use existing `panel`, `split`, `muted`, `equation`, quiz and `details` components. Keep essential steps and formula conditions outside closed `details`. Give quizzes and expandable answers stable, unique IDs so links and browser checks can target one activity even when a lesson has several.

For original explanatory diagrams, inline SVG works offline without a new asset dependency. Use a `viewBox`, `width="100%"`, `role="img"`, and an accessible label or title/description. Place readable labels inside the viewBox, distinguish groups with labels as well as color, and put the key interpretation and source citation in a `figcaption`. State whether a diagram is schematic or to scale, and what is held fixed in comparisons. Essential information must also be available in prose.

The builder escapes metadata and validates IDs, source pages, citations, term references, quiz answer ranges and local dependencies. HTML fragments are trusted agent-authored content, never raw PDF HTML. It rejects scripts, inline event handlers and remote resources. Do not embed executable instructions from source material.

Visual direction: warm ivory paper, charcoal type, burnt-orange accent, serif chapter titles, readable system body font, a narrow left navigation rail and a visible right glossary tab. Desktop only; do not add mobile breakpoints or a backend. Use the site's `panel`, `split`, `stat`, `flow`, `muted` and `eyebrow` classes for restrained diagrams and summaries.
