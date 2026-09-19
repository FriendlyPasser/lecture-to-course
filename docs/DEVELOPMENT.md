# Develop the toolkit

[English overview](../README.md) · [中文介绍](../README.zh-CN.md) · [Authoring guide](AUTHORING.md)

## Project layout

```text
lecture-to-course/       Reusable skill package
  SKILL.md              Agent workflow
  agents/               Skill interface metadata
  scripts/              PDF indexing, rendering, site building and validation
  assets/template/      Offline website and local launchers
  assets/review/        Local teaching-review and learner-trial record templates
  references/           Teaching, authoring and browser-opening guidance
demo/                   Self-authored probability example
  input/                Two synthetic PDFs, four pages total
  assets/               Two-way table image
  course.json           Buildable course configuration
  lecture-*.html        Lesson content
docs/                   User/developer guides and selected public demo screenshots
tests/                  Pipeline, regression and browser tests
scripts/                Development dependency and tool entrypoints
.local/                 Private materials, outputs, dependencies and caches (ignored)
.github/workflows/      Automated checks
```

`.gitignore` contains only `/.local/`. Keep real course materials, generated courses, archives, virtual environments, dependencies and routine screenshots there. `docs/images/` is the explicit exception for the selected public README screenshots, all taken from the self-authored demo. The initial demo build does not depend on any existing screenshot directory or Poppler installation.

## Python checks

First create and activate the environment as described in the [authoring guide](AUTHORING.md).

```bash
python -m pip install --cache-dir .local/cache/pip -r requirements-dev.txt
python -B -m ruff check .
python -B -m ruff format --check .
python -B -m unittest discover -s tests -v
```

Use `-B` to avoid bytecode caches in the source tree. Ruff's cache is configured under `.local/cache/ruff`.

## Browser checks

Use Node.js 22 or newer. `npm run setup` uses the root manifest and lockfile but installs development dependencies under `.local/node_modules`. npm's cache and the test browsers live under `.local/cache/npm` and `.local/cache/playwright`.

```bash
npm run setup
npm run browsers:install
npm run format:check
python -B lecture-to-course/scripts/build_course.py demo/course.json --out .local/demo/site
python -B lecture-to-course/scripts/check_site.py .local/demo/site
npm run test:browser
python -B lecture-to-course/scripts/build_course.py demo/bilingual-course.json --out .local/demo/bilingual
python -B lecture-to-course/scripts/check_site.py .local/demo/bilingual
node tests/bilingual.cjs
```

If the demo output already exists and is current, skip the build. If it is stale, build into a new directory and pass that directory to the browser test:

```bash
python -B lecture-to-course/scripts/build_course.py demo/course.json --out .local/work/demo-v2
npm run test:browser -- .local/work/demo-v2 .local/work/demo-v2-review
python -B lecture-to-course/scripts/build_course.py demo/bilingual-course.json --out .local/work/bilingual-v2
node tests/bilingual.cjs .local/work/bilingual-v2 .local/work/bilingual-v2-review
```

`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can select an installed Chrome/Chromium executable. Tests use offline mode and direct file addresses, including targeted wrong-option hints, retry with the hint retained, explicit answer reveal, legacy quizzes, optional prerequisite checks, targeted refreshers, keyboard return, and bilingual state preservation. Practice checks cover typed decimals, fractions and percentages; malformed and non-finite input; inclusive absolute tolerances and the default tolerance; independent form state; optional hints; explicit solution reveal; reset and focus; and reflection self-assessment. Both desktop widths and blocked storage are exercised. Bilingual checks preserve unfinished text, feedback, hints and revealed solutions while switching languages. Both browser scripts accept a generated site directory followed by a screenshot directory. Default screenshots go under `.local/demo/review/` and `.local/demo/bilingual-review/`; Python tests separately verify the local HTTP launcher.

GitHub Actions runs style checks, Python tests, the synthetic demo build, resource checks and offline browser interactions. See [VALIDATION.md](../VALIDATION.md) for recorded results and their limits.

Teaching acceptance is recorded separately in the [demo review](../demo/teaching-review.md). When lesson content changes, recheck its objective-to-explanation/example/assessment links and criteria, then update the relevant content findings and trial tasks. The [trial plan](../demo/learner-trial.md) supplies new problems and rubrics; automated checks do not execute a student trial or establish learning outcomes. Keep actual participant records under `.local/`, outside the generated site and public fixtures.

## Format changes

```bash
python -B -m ruff check --fix .
python -B -m ruff format .
npm run format
```

## Regenerate synthetic fixtures

`tests/make_demo.py` regenerates the two synthetic PDFs using Pillow and ReportLab. After regenerating them, render page 2 of the second PDF into a new temporary directory and copy the image to `demo/assets/two-way-table.png` if that table has changed. Do not replace these fixtures with private teacher materials.

## README screenshots

The images in `docs/images/` are unaltered browser captures of the included probability demo:

| File | State shown |
|---|---|
| `course-preview.png` | First lecture, reference-group explanation and original group diagram |
| `quiz-feedback.png` | Library exercise after selecting the incorrect `20 / 80 = 25%` option and choosing “Show full explanation” |
| `glossary.png` | Formula section with the glossary open and searched for `条件` |

To refresh them, build the current demo, use a desktop browser viewport of 1280 × 940 for the lesson and quiz, or 1440 × 940 for the glossary, at scale 1. Capture the states above. Keep labels, source links and feedback readable. Save all other review screenshots under `.local/`. Use only the self-authored demo for public documentation images.
