# Validation

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
