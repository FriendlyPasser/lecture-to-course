# Lecture to Course

### Your lecture slides, explained.

Turn lecture PDFs into an **offline study website** with clear explanations, diagrams, worked examples, and quizzes that explain the reasoning.

A **Codex skill** for working through the concepts in your course. Keep the original assumptions and source pages, with a clearer path from the first idea to a problem you can solve.

[简体中文](README.zh-CN.md) · [Use your own lectures](#use-your-own-lectures) · [Try the demo](#try-the-demo) · [How it teaches](#how-it-teaches)

![A generated probability lesson: a diagram connects 100 students, 40 statistics students and 24 taking both subjects, with navigation and source-page links.](docs/images/course-preview.png)

*Actual output from the included, self-authored probability demo. English lessons and quizzes, with an English–Chinese glossary.*


Courses support English–Chinese explanations and quizzes, a language switch fixed at the upper right while scrolling, and a separate “术语” glossary tab. The language choice persists across lessons; switching preserves answers and reading position. See the [bilingual authoring contract](lecture-to-course/references/authoring.md#bilingual-lessons).

Quizzes can give a specific hint for each wrong choice, keep that hint visible during a retry, and let students choose when to reveal the full explanation. Hints and answer states stay consistent when switching languages. See the [quiz authoring contract](lecture-to-course/references/authoring.md#hints-before-the-full-answer).

An optional concept-review panel separates reading progress from recent practice evidence: independent or supported correct answers, hints, errors and solution viewing. It suggests when to return and links to authored questions, including changed scenarios in later lessons. History stays in the browser; the schedule is a simple heuristic, not a mastery score. See the [concept-review contract](lecture-to-course/references/authoring.md#concept-evidence-and-cumulative-review).

Interactive diagrams can guide students through **predict → operate → explain**: write a prediction, change a meaningful quantity, then explain the result. The offline overlap diagram keeps group totals fixed and preserves notes when switching languages. See the [diagram authoring contract](lecture-to-course/references/authoring.md#predict--operate--explain-diagrams).

## What you get

| While studying | In your course |
|---|---|
| “Am I missing a prerequisite?” | An optional short check points to the specific refresher you need, then returns you to the question. |
| “How do these ideas connect?” | Question-led sections state their goals and build on earlier results; a short learning route links the steps when useful. |
| “Why does this formula work?” | Plain-language meaning, concrete numbers and symbols connected step by step, with assumptions and approximations explained. |
| “I understand this example. Can I do another?” | A worked example, a missing step to complete, then an independent problem with numeric entry or a short explanation and a reference solution. |
| “What does this term mean?” | A searchable English–Chinese glossary with optional plain-language explanations, course examples and comparisons of easily confused concepts. |
| “Where was this in the lecture?” | Links back to the original PDF's physical page numbers. |
| “What should I revisit?” | A concept-review panel prioritizes errors and support use, suggests review dates, and links to another question when available. |
| “Can I review this later?” | A local website you can reopen offline, with chapters, formulas and the source PDFs included. |

<details>
<summary><strong>See the quiz feedback and bilingual glossary</strong></summary>

### See why an answer works

Two options below both equal 25%. Only one uses the group the question asks about. Feedback explains why the other answer fails.

![A library exercise explains why 20/80 and 5/20 can equal the same percentage while answering different questions.](docs/images/quiz-feedback.png)

### Look up a term without leaving the lesson

![The English–Chinese glossary shows conditional probability and 条件概率 beside the formula and worked calculation.](docs/images/glossary.png)

</details>

## Use your own lectures

### 1. Install the skill in Codex

Send this in Codex:

```text
Use $skill-installer to install the lecture-to-course skill from:
https://github.com/FriendlyPasser/lecture-to-course/tree/main/lecture-to-course
```

The skill is the `lecture-to-course/` subdirectory of this repository, including its scripts, template and references.

### 2. Give it your PDF

Attach your lecture PDFs or provide their local paths. For example:

```text
Use $lecture-to-course with .local/my-lecture.pdf.
Build an offline course that explains the concepts with intuition,
diagrams, worked examples and checks for understanding.
Keep important derivations, assumptions and source-page citations.
```

Codex reads and checks the source pages, plans the concepts, writes the lessons, then builds and verifies the website. You can supply one lecture or several in order.

**For authoring:** you need Codex, Python 3.10+, `pypdf`, and Poppler for page rendering. The [setup and authoring guide](docs/AUTHORING.md) covers dependencies and the manual workflow. Once built, the course needs no AI service, API key or internet connection to read.

## Try the demo

Build two short probability lessons using the content already in this repository. **This demo needs Python 3.10+; it does not need Codex or Poppler.**

On macOS/Linux:

```bash
git clone https://github.com/FriendlyPasser/lecture-to-course.git
cd lecture-to-course
python3 -m venv .local/venv
source .local/venv/bin/activate
python -m pip install --cache-dir .local/cache/pip -r requirements.txt
python -B lecture-to-course/scripts/build_course.py demo/course.json --out .local/demo/site
python -B .local/demo/site/launch_course.py
```

The last command opens the course in your default browser. Keep the terminal open while studying; press `Ctrl+C` to stop the local server.

<details>
<summary><strong>Windows instructions and other ways to open the course</strong></summary>

On Windows, use `python` or `py` in place of `python3` when creating the environment. Replace the activation line with the command for your terminal:

- **PowerShell:** `.\.local\venv\Scripts\Activate.ps1`
- **CMD:** `.local\venv\Scripts\activate.bat`

Then continue with the remaining installation, build and launch commands.

You can also open `.local/demo/site/index.html` directly. If local-file restrictions prevent that, use the launcher. On macOS, double-click `打开课程.command` in the generated directory. The launcher uses Python 3 and serves the course only on your own computer.

To choose a browser yourself:

```bash
python -B .local/demo/site/launch_course.py --no-browser
```

Copy the full address printed in the terminal into your preferred browser. Keep that terminal open. A new launch can choose a different port, so use the newly printed address each time.

</details>

Already built the demo? Reopen it with the last command. To rebuild, choose a new output directory, such as `.local/work/demo-v2`; the builder protects existing nonempty output directories.

## How it teaches

**The lecture sets what to learn. The lesson makes the reasoning visible.**

In the probability demo, students can check fractions and intersections first or skip directly to **100 students → 40 taking statistics → 24 taking both subjects**. The same survey then raises the next question at each step: how to express the group restriction as a formula, and whether knowing a student's subject changes a probability. A library exercise checks whether the reasoning transfers to another situation; a new clinic question in the later lecture retrieves the earlier denominator decision.

The skill follows the same principles across subjects:

1. **Map concepts and prerequisites.** Keep lecture boundaries and source coverage. Check necessary prior knowledge briefly, with optional focused refreshers and a direct skip to the lesson.
2. **Build understanding through connected problems.** Use a running case when related concepts suit it: each next idea addresses a problem the previous step leaves open. Keep core derivations, conditions and teacher examples visible.
3. **Practice and trace back.** Reduce support from a worked example to a missing step and an independent variation. Let learners enter numbers or explain their reasoning, with reference solutions and retry. Cite the source concept, and label new examples and extra background clearly.
4. **Return to earlier concepts.** Author later questions that change the scenario. Keep reading, hints, graded answers and self-assessment distinct, and suggest spaced review without calling the concept mastered.
5. **Review the teaching and collect feedback.** Map each core objective to its explanation, worked example and assessment. Use a local trial record for the first unclear sentence, independent reasoning, a new problem and a delayed follow-up. Report technical checks, content review and observed learning separately.

The lesson structure adapts to the material. There is no fixed chapter count or requirement to turn every idea into an animation.

## What to expect

- **For students taking the course.** The lesson preserves its important derivations, assumptions and examples. It is designed for desktop reading.
- **AI-authored, with source review.** The scripts extract, build and check; Codex writes the teaching content after reading the pages. The workflow includes source review and content checks.
- **Source quality matters.** Scans and ambiguous formulas need visual review. Unclear regions are called out and excluded from quizzes.
- **Offline after generation.** The output uses local HTML, CSS, JavaScript and native MathML. There is no backend or hosted math renderer.

See the [teaching guide](lecture-to-course/references/teaching.md) and [validation results](VALIDATION.md) for the standards and current checks. Reading progress shows where you are in the lesson; it does not claim to measure mastery. Review history is local to the browser and origin, with an in-page fallback when storage is unavailable. File storage is browser-dependent, and changing the launcher port may start a separate history. There is no account or server sync.

The [demo teaching review](demo/teaching-review.md) records objective coverage and content gaps; its [student trial plan](demo/learner-trial.md) contains fresh tasks and facilitator rubrics. No student trial has been run, so these materials do not establish learning gains. Reusable [review and feedback templates](lecture-to-course/references/teaching-review.md) are included with the skill.

## Explore and contribute

- [Author a course](docs/AUTHORING.md) — setup, PDF review, content format and build commands.
- [Develop the toolkit](docs/DEVELOPMENT.md) — project layout, tests and screenshot reproduction.
- [Inspect the demo](demo/course.json) — self-authored source PDFs, lessons and glossary.
- [Share feedback](https://github.com/FriendlyPasser/lecture-to-course/issues) — tell us where an explanation loses you, a diagram is unclear, or a quiz misses the point. Include a small example you have permission to share.

Useful contributions include clearer worked examples, better misconception questions, accessibility improvements and reproducible PDF-handling fixes.

**Want to try this on your next lecture? Star the repository to keep it handy.**

## Acknowledgments

Inspired by [zarazhangrui/codebase-to-course](https://github.com/zarazhangrui/codebase-to-course). This project uses an independently authored desktop template and a teaching workflow tailored to lecture PDFs.
