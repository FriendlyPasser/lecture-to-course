#!/usr/bin/env python3
"""Render selected physical PDF pages with Poppler for visual review."""

import argparse
import os
import shutil
import subprocess
from pathlib import Path


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("pdf", type=Path)
    p.add_argument("--pages", required=True, help="e.g. 1-5,8")
    p.add_argument("--out", required=True, type=Path)
    p.add_argument("--dpi", type=int, default=120)
    p.add_argument("--renderer", default=os.environ.get("PDFTOPPM", "pdftoppm"))
    a = p.parse_args()
    exe = shutil.which(a.renderer)
    if not exe:
        p.error("Missing pdftoppm. Put Poppler on PATH, set PDFTOPPM, or pass --renderer.")
    try:
        from pypdf import PdfReader

        count = len(PdfReader(a.pdf).pages)
        pages = set()
        for token in a.pages.split(","):
            bounds = [int(x) for x in token.split("-")]
            if len(bounds) not in (1, 2):
                raise ValueError()
            if len(bounds) == 2 and bounds[0] > bounds[1]:
                raise ValueError()
            pages.update(range(bounds[0], bounds[-1] + 1))
        if not pages or min(pages) < 1 or max(pages) > count or not 36 <= a.dpi <= 600:
            raise ValueError()
    except ImportError:
        p.error("Missing pypdf.")
    except Exception:
        p.error("Invalid PDF, page range, or DPI (36–600).")
    a.out.mkdir(parents=True, exist_ok=True)
    for page in sorted(pages):
        dest = a.out / f"page-{page:04d}"
        if dest.with_suffix(".png").exists():
            p.error(f"Refusing to overwrite {dest}.png")
        result = subprocess.run(
            [
                exe,
                "-f",
                str(page),
                "-l",
                str(page),
                "-singlefile",
                "-r",
                str(a.dpi),
                "-png",
                str(a.pdf),
                str(dest),
            ],
            capture_output=True,
            text=True,
        )
        if result.returncode:
            p.error(result.stderr[-2000:])
    print(f"Rendered {len(pages)} page(s) to {a.out}")


if __name__ == "__main__":
    main()
