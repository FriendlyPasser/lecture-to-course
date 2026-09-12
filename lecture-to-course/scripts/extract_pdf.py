#!/usr/bin/env python3
"""Index lecture PDFs without claiming that extraction is visually verified."""

import argparse
import json
import re
import shutil
from pathlib import Path


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("pdfs", nargs="+", type=Path)
    p.add_argument("--out", required=True, type=Path)
    a = p.parse_args()
    try:
        from pypdf import PdfReader
    except ImportError:
        p.error("Missing pypdf. Use the bundled Python runtime or install pypdf.")
    if a.out.exists() and any(a.out.iterdir()):
        p.error("Output directory must be empty.")
    records = []
    # Validate all input documents before creating output.
    for i, path in enumerate(a.pdfs, 1):
        if not path.is_file():
            p.error(f"File not found: {path}")
        try:
            reader = PdfReader(path)
            if reader.is_encrypted and not reader.decrypt(""):
                p.error(f"Password required: {path}")
            pages = []
            for n, page in enumerate(reader.pages, 1):
                text = page.extract_text() or ""
                pages.append(
                    {
                        "page": n,
                        "text": text,
                        "needs_visual_review": True,
                        "low_text": len(re.sub(r"\s", "", text)) < 60,
                    }
                )
            if not pages:
                p.error(f"No pages: {path}")
        except Exception as e:
            p.error(f"Cannot read {path}: {e}")
        safe = re.sub(r"[^A-Za-z0-9._-]+", "-", path.stem).strip("-") or "lecture"
        records.append(
            (
                path,
                {
                    "id": f"s{i}",
                    "title": path.name,
                    "path": f"sources/{i:02d}-{safe}.pdf",
                    "pages": pages,
                },
            )
        )
    (a.out / "sources").mkdir(parents=True, exist_ok=True)
    for path, r in records:
        shutil.copy2(path, a.out / r["path"])
    (a.out / "manifest.json").write_text(
        json.dumps({"sources": [r for _, r in records]}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(
        f"Indexed {len(records)} PDF(s). All pages require visual review; low_text is only a heuristic."
    )


if __name__ == "__main__":
    main()
