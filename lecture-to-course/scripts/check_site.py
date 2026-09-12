#!/usr/bin/env python3
"""Check authored course dependencies and flag potential network resources."""

import argparse
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

RESOURCE_ATTRIBUTES = ("src", "href", "xlink:href", "poster")
CSS_URL = re.compile(
    r"""\burl\(\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|((?:\\.|[^)\\])*))\s*\)""",
    re.IGNORECASE,
)
CSS_ESCAPE = re.compile(r"\\(?:([0-9a-fA-F]{1,6})\s?|([\r\n\f])|(.)?)")
NETWORK_RESOURCE = re.compile(r"(?:https?:)?//[^\s]|\bfetch\s*\(|XMLHttpRequest|@import")


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.refs = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if "id" in attributes:
            if attributes["id"] in self.ids:
                self.errors.append("Duplicate id: " + attributes["id"])
            self.ids.add(attributes["id"])
        for name in RESOURCE_ATTRIBUTES:
            if attributes.get(name):
                self.refs.append(attributes[name])


def css_urls(text):
    """Read url() references in authored CSS, including escaped filenames."""

    def unescape(match):
        if match[1]:
            codepoint = int(match[1], 16)
            if not codepoint or codepoint > 0x10FFFF or 0xD800 <= codepoint <= 0xDFFF:
                return "\ufffd"
            return chr(codepoint)
        return match[3] or ""

    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    for match in CSS_URL.finditer(text):
        value = next(group for group in match.groups() if group is not None)
        yield CSS_ESCAPE.sub(unescape, value.strip())


def check(root):
    root = root.resolve()
    errors = []
    pages = {}
    for file in root.glob("*.html"):
        page = Page()
        page.feed(file.read_text(encoding="utf-8"))
        page.close()
        pages[file.resolve()] = page
        errors.extend(page.errors)
    if not (root / "index.html").is_file():
        errors.append("Missing index.html")

    def check_reference(file, reference):
        url = urlsplit(reference)
        if url.scheme or url.netloc:
            errors.append(f"{file.name}: nonlocal reference {reference}")
            return
        destination = (file.parent / unquote(url.path)).resolve() if url.path else file
        if not destination.is_relative_to(root):
            errors.append(f"Escapes output: {reference}")
            return
        if not destination.is_file():
            errors.append(f"Missing dependency: {reference}")
        elif (
            url.fragment
            and destination in pages
            and unquote(url.fragment) not in pages[destination].ids
        ):
            errors.append(f"Broken fragment: {reference}")

    for file, page in pages.items():
        for reference in page.refs:
            check_reference(file, reference)
    for file in [*root.rglob("*.css"), *root.rglob("*.js")]:
        text = file.read_text(encoding="utf-8")
        if NETWORK_RESOURCE.search(text):
            errors.append(f"Potential network dependency: {file.name}")
        if file.suffix == ".css":
            for reference in css_urls(text):
                check_reference(file, reference)
    return errors


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("site", type=Path)
    args = parser.parse_args()
    errors = check(args.site)
    if errors:
        for error in errors:
            print(error)
        raise SystemExit(1)
    print("PASS: local files and fragment links resolve; no network dependencies detected.")
