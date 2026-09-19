# Validation

## Contextual glossary explanations and comparisons — 2026-09-19

- Issue #5 item 8 adds optional plain-language explanations, course examples and
  explicit comparisons with other glossary entries. Existing definition-only
  entries remain valid. The builder validates prose and comparison targets before
  writing output, and escapes all authored text.
- All 49 Python tests passed, including nine glossary regression tests and the
  loopback launcher test. Both demos built and passed offline resource checks.
  Ruff, Prettier and skill validation passed.
- Both offline browser suites passed at 1024 and 1440 pixels. Checks cover searching
  added prose, comparison navigation to filtered terms, visible target headings,
  keyboard focus trapping and return to the original lesson term, blocked storage,
  translated explanations and preserved English/Chinese headwords. Existing quiz,
  prerequisite and typed-practice checks also passed.
- English and Chinese glossary layouts were visually reviewed at both widths.
  Both generated launchers passed glossary navigation and focus-return checks over
  loopback HTTP with external requests blocked; test servers were stopped.
- Independent content review checked the survey and club counts, probability
  distinctions, translations and first-use English terminology against the lesson
  prose, formulas and quizzes. These are synthetic content and functional checks,
  not evidence of measured learning gains.

## Combined hints and practice regression — 2026-09-19

- PR #8 incorporates main through `1d591dc`, preserving the targeted quiz hints,
  retry/reveal behavior and navigation synchronization alongside typed practice.
- All 40 Python tests passed. Both regenerated demos passed local resource checks,
  and both offline browser suites passed at 1024 and 1440 pixels, including hints,
  numeric/reflection responses, language switching, keyboard focus and blocked
  storage. Ruff, Prettier and skill validation passed.

## Formula explanations and scaffolded practice — 2026-09-19

- Issue #5 items 4 and 6 are implemented in the teaching guidance, reusable
  template and English/Chinese synthetic examples. Visible tables connect words,
  count origins and symbols; the examples distinguish exact algebra, selection
  assumptions and rounding, with the positive-denominator condition beside the rule.
- Worked examples lead to a missing-step exercise, an independent new scenario
  and a short explanation with reference points for self-assessment. Numeric
  responses accept decimals, fractions and percentages with an authored absolute
  tolerance. Solutions and hints remain optional; reset starts a fresh attempt.
- All 32 Python tests passed, including practice metadata, accessible controls,
  malformed forms, source links inside solutions and the local HTTP launcher.
  Both demos built and passed resource/fragment checks. Ruff, Prettier and the
  skill validator passed.
- Offline browser checks passed at 1024 and 1440 pixels, including invalid input,
  tolerance boundaries, finite-number overflow, keyboard submission, voluntary
  solutions, reset focus, independent form state and blocked storage. Language
  switching preserves typed responses, hints, solutions and feedback; reflection
  responses receive a self-assessment message rather than an automatic grade.
- Formula tables and practice states were visually reviewed in English and Chinese
  at both desktop widths. Independent review checked calculations, rounding,
  translations, builder/runtime compatibility and existing quiz behavior. The
  objective-to-formula-to-exercise map is in `demo/coverage.md`.
- These are synthetic content and functional checks. They do not establish
  improved learning outcomes or replace student trials; practice responses and
  scores are not persisted or treated as mastery evidence.

## Browser navigation synchronization — 2026-09-19

- The first push check for PR #7 failed when the bilingual test reloaded while
  Chromium was still replacing the page after a next-lecture click. The companion
  pull-request check for the same commit passed.
- Browser tests now wait for the expected destination URL and its load event
  before reading the new page or reloading it. The bilingual test also verifies
  the destination lecture and language before and after reload, including the
  blocked-storage path, so the source page cannot satisfy the assertion.
- The English offline browser suite passed, and the full bilingual offline suite
  passed five consecutive local runs. Formatting checks passed. No fixed sleeps,
  suppressed errors or automatic test retries were added.

## Targeted quiz hints and retry — 2026-09-19

- Issue #5 item 7 is implemented through optional per-wrong-option hints. Wrong
  attempts withhold the correct choice and full solution; retry retains the latest
  hint. Students can explicitly reveal the answer before or after attempting a
  question, without an unanswered reveal being marked correct. Hint-free quizzes
  retain their existing behavior.
- All 28 Python tests passed, including hint indexes, readable content, reachable
  feedback controls and legacy compatibility. Both synthetic courses built and
  passed local resource checks. Ruff and Prettier checks passed.
- Both offline direct-file browser suites passed. Coverage includes specific hint
  selection and replacement, retry, correct and revealed answers, unanswered
  reveals, partial hint coverage, legacy quizzes, independent question states,
  prerequisite review/return routing, Enter/Space/Tab focus, and denied storage.
  English–Chinese switching preserves hint, retry, revealed and correct states.
- Hint and solution screenshots were visually reviewed at 1024 and 1440 pixels
  in English and Chinese. Both generated local launchers also passed browser
  hint/retry/answer checks over loopback HTTP with external requests blocked;
  the bilingual launcher preserved the active hint when switching languages.
  No browser page errors occurred and the local servers were stopped.
- All 15 wrong options across the demo fragments have reviewed, specific prompts;
  the bilingual fixture translates all five of its hints. These checks establish
  functionality and synthetic-content consistency, not measured learning gains.

## Prerequisite checks and running cases — 2026-09-19

- Issue #5 items 1 and 2 are implemented in the reusable template, authoring
  guidance and synthetic demos. Each optional diagnostic maps one prerequisite
  to a short refresher, with skip, wrong-answer review, return and retry.
  The lesson remains available regardless of the student's answers.
- All 20 Python tests passed, including new checks for invalid refresher targets,
  inaccessible or ambiguous controls, shared targets and skip links. Both demos
  built successfully and passed local resource and fragment-link checks. Ruff,
  Prettier and the skill validator passed.
- Offline direct-file browser checks passed at 1024 and 1440 pixels, including
  keyboard skip/review/return, visible question headings on return, independent
  quiz state, shared-refresher return destinations, retry, bilingual switching
  with an open refresher, denied storage and existing lesson/glossary interactions.
  The new translation checks cover wrapped questions, feedback, refresher and
  running-case prose, plus exact restoration of English text when switching back.
- English and Chinese screenshots were visually reviewed at both widths.
  This caught and fixed two defects: returning to an offscreen question heading,
  and HTML formatting line breaks preventing long paragraphs from translating.
- Both generated launchers also passed browser interaction checks over loopback
  HTTP with external requests blocked. Styles, scripts, source PDFs and the
  selected image were served byte-for-byte; local test servers were stopped.
- Independent content review verified diagnostic answers, focused refreshers,
  survey and club case continuity, source counts, formula conditions, provenance
  and Chinese translations. The case-step and prerequisite mappings are recorded
  in `demo/coverage.md`. These are synthetic content and functional checks, not
  student trial data or evidence of improved learning outcomes.

## Concept-focused teaching revision — 2026-09-15

- The repository skill now maps concepts, prerequisites and learning objectives before
  authoring. Its entrypoint, teaching guide, authoring guide and README agree on
  regrouping within lectures, visible core reasoning, and inline provenance labels.
  The installed skill copy was not modified.
- The skill validator, Ruff checks, Prettier checks and all 13 existing Python tests
  passed. No course JSON fields, builder interfaces or runtime dependencies changed.
- Both synthetic PDFs (four pages) were visually rechecked. The probability demo
  retains the source calculations, adds an original group diagram, exposes the core
  derivation, and adds explanation, applicability and transfer checks. Fraction
  calculations were verified independently, including two numerically equal options
  that answer different questions.
- Updated browser tests passed in offline direct-file mode, including independent
  state for two quizzes, retry, glossary search and keyboard operation, visible
  derivation, diagram label bounds, next-lecture navigation and denied localStorage.
  The test accepts optional site and screenshot directories; defaults are unchanged.
- A separate local perspective-projection excerpt was authored from eight reviewed
  source pages. It includes original SVGs, the original triangle-pair derivation,
  explicit coordinate/sign conditions, and independently checked numeric examples.
  A source text/diagram convention mismatch is disclosed. No claim is made about
  the remainder of that lecture; its source and generated files stay under `.local/`.
- Both delivered artifacts passed static resource checks, direct-file interaction
  checks, and visual review at 1024 and 1440 pixels. Their actual launchers served
  HTML, styles, scripts, PDFs and selected images byte-for-byte over loopback HTTP;
  quiz and glossary interactions also passed over HTTP. External requests were
  blocked in that HTTP browser check, separately from direct-file offline mode.
- Local test servers were stopped. Browser and loopback checks required permission
  to run outside the process sandbox. Automated checks establish mechanics, not
  measured learning gains; learner feedback remains the next pedagogical check.

## Repository verification — 2026-09-12

The public source files were copied into a new temporary directory without any local
course exports, demo build, extracted index, or review screenshots. Verification used
Python 3.12, pypdf 6.10.0, Playwright 1.62.1, and installed Google Chrome on macOS.

- Ruff lint and formatting checks passed for the Python sources and tests.
- Prettier checks passed for the JavaScript, CSS, demo HTML, and configuration.
- All 13 Python tests passed, including source-page resolution, invalid source/term
  rejection, quiz answer validation, live PDF extraction and low-text detection,
  single-lecture builds, overwrite protection, and missing-resource detection.
- Regression tests passed for nested quiz options, numeric character references in
  chapter titles, video poster and SVG image dependencies, and CSS `url()` paths.
- The local launcher served both HTML and a PDF on `127.0.0.1` and was stopped after
  testing. This HTTP check is separate from browser offline emulation.
- A new two-lecture demo built from the checked-in JSON, HTML, synthetic PDFs, and
  table image. Static file and fragment-link checks passed.
- Browser tests passed with network disabled and direct `file://` navigation:
  glossary term focus, Escape, English/Chinese search, empty state, expandable
  examples, incorrect/correct quiz answers, retry, source links, 1024/1440-pixel
  desktop widths, and denied localStorage. No JavaScript page errors occurred.
- The fixture generator was exercised in a temporary directory. Both generated PDFs
  have two pages; the final page remains an image-only table for low-text detection.
- Extracting the page shell into a separate template preserved the generated DOM,
  attributes, and effective text, including metadata with special characters.
- After consolidating local files under `.local/`, a clean source copy passed
  dependency installation, all 13 Python tests, demo build, static checks, and
  offline browser tests. No dependencies, demo build, or Python bytecode appeared
  in their former source-tree locations. Installing dependencies preserved an
  existing local-file fixture; 375 moved historical-course resource links resolved.

GitHub Actions is configured to repeat lint, formatting, Python tests, demo build,
static checks, and offline Chromium interactions on Ubuntu for pushes and pull
requests. Its current result is available in the repository's Actions tab.

## Original synthetic review — 2026-09-08

The original two self-authored probability PDFs contain four pages. All four rendered
pages were visually reviewed, including the image-only two-way table. The arithmetic
and source mappings were checked; the page-by-page map is in `demo/coverage.md`.
Native offline MathML was reviewed for conditional probability and independence.
The skill frontmatter and resources passed the original skill validator.

## Scope

These checks concern the tool and synthetic demonstration. They do not establish
accuracy on real teacher PDFs, handwriting, complex multi-column layouts, or OCR.
The workflow requires visual source review and explicit uncertainty handling for each
course. Static resource checks detect common mistakes in trusted authored content;
they are not a general HTML/CSS security sandbox. No OCR, external upload, or website
hosting service is required by the generated course.
