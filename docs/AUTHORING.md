# Set up and author a course

[English overview](../README.md) · [中文介绍](../README.zh-CN.md) · [Development](DEVELOPMENT.md)

The repository contains a Codex skill, PDF utilities and an offline website template. The utilities extract, build and check files; lesson explanations are authored after reading and visually checking the sources. The complete agent workflow is in [SKILL.md](../lecture-to-course/SKILL.md).

## Set up the tools

Use Python 3.10 or newer. In a checkout of this repository:

```bash
python3 -m venv .local/venv
source .local/venv/bin/activate
python -m pip install --cache-dir .local/cache/pip -r requirements.txt
```

On Windows, create the environment using `python` or `py` if needed, then activate it with `.\.local\venv\Scripts\Activate.ps1` in PowerShell or `.local\venv\Scripts\activate.bat` in CMD. Continue with the remaining commands after activation.

Install [Poppler](https://poppler.freedesktop.org/) and ensure `pdftoppm` is available for source-page rendering:

```bash
# macOS
brew install poppler
```

```bash
# Ubuntu
sudo apt-get install poppler-utils
```

A supplied renderer can also be selected using `--renderer /path/to/pdftoppm` or the `PDFTOPPM` environment variable. Building the already-authored probability demo does not need Poppler.

When installing the Codex skill, use the repository's `lecture-to-course/` subdirectory and retain all of its scripts, templates and references. Do not install only the entrypoint Markdown file.

## 1. Index the source PDFs

Pass local PDFs in lecture order. Keep private course materials and generated outputs under `.local/`.

```bash
python -B lecture-to-course/scripts/extract_pdf.py .local/lecture-01.pdf .local/lecture-02.pdf --out .local/work/source-index
```

The result contains copies of the sources, per-page text and a manifest. Physical PDF pages are numbered from 1; printed slide numbers can differ.

## 2. Review the original pages

```bash
python -B lecture-to-course/scripts/render_pages.py .local/work/source-index/sources/01-lecture-01.pdf --pages 1-8 --out .local/work/review/lecture-01
```

Review all relevant pages in bounded batches, including diagrams, legends, subscripts and equation conditions. Low-text warnings are clues, not a substitute for visual review. Mark uncertain source regions rather than inventing missing content.

## 3. Plan concepts and write the lessons

Map **source page → concept → prerequisites → learning objective → destination chapter** before authoring. Keep lecture boundaries, regrouping within a lecture when dependencies or explanation benefit. For excerpts, state the page range and what is excluded. The coverage map is a working document, not an additional JSON field.

Use these references:

- [Teaching requirements](../lecture-to-course/references/teaching.md): explanations, source fidelity, new examples and understanding checks.
- [Authoring contract](../lecture-to-course/references/authoring.md): course JSON, supported HTML components, citations, quizzes and glossary.
- [Probability example](../demo/course.json) and [coverage map](../demo/coverage.md): a complete self-authored input set.

Prepare the course JSON, lecture HTML fragments, glossary entries and necessary images. Paths in the JSON are relative to that JSON file. Preserve important derivations, assumptions and key teacher examples. Rewritten explanations belong in the main lesson; label author-created scenarios and extra background appropriately.

For necessary prior knowledge, add a small optional check at the start of the course, usually two or three questions. Map each question to a focused, supplementary refresher; students can skip the check or visit the matching refresher after a wrong answer and return to the question. The [prerequisite component contract](../lecture-to-course/references/authoring.md#optional-prerequisite-check) supplies the markup. Keep all lesson content available from the start.

Where related concepts support a running case, make each new concept answer an unresolved problem from the previous step. Record **case step → unresolved problem → next concept**, with source or author-created provenance, in the coverage map. Preserve the teacher's key examples and return to them after any simpler entry example. This adds continuity to substantive lessons without forcing a case onto tiny or unrelated excerpts.

HTML fragments are trusted author-written content. The builder rejects common executable and remote dependencies, but it is not a security sandbox for arbitrary HTML copied from a PDF or third party.

## 4. Build and verify

```bash
python -B lecture-to-course/scripts/build_course.py .local/work/course.json --out .local/work/site
python -B lecture-to-course/scripts/check_site.py .local/work/site
python -B .local/work/site/launch_course.py
```

Choose a new or empty output directory. For a revision, use a new directory such as `.local/work/site-v2`.

Check source pages, formulas and quiz reasoning, then inspect reading and interactions at 1024 and 1440 pixels. Verify source links, retry, glossary search and keyboard operation. For prerequisite checks, verify skip, the wrong-answer link to the correct refresher, return to the originating question, and the same flow after language switching. Read the running case's transitions to confirm that the next concept answers the problem just raised. The static checker can identify common resource problems, but cannot establish teaching accuracy or learning outcomes.

## Open and share the output

The generated site includes local HTML, scripts, styles, the original PDFs and selected assets. It needs no Node.js, API key, CDN or online service to read.

- Open the generated `index.html` directly when supported by your browser.
- If local companion files are restricted, use `launch_course.py` or double-click `打开课程.command` on macOS. These launchers need Python 3.
- To use a particular browser, run `python -B .local/work/site/launch_course.py --no-browser`, then copy the printed address into that browser.
- Keep the launcher running while studying. It serves only on `127.0.0.1`; press `Ctrl+C` to stop. Use the new printed address after each restart.
- If you share a course, include its supporting files and ensure you have permission to share its source PDFs. The normal workflow does not publish a course online.

See [local browser compatibility](../lecture-to-course/references/local-opening.md) for further opening and validation details.
