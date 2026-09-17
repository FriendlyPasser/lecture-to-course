#!/usr/bin/env python3
"""Build a standalone desktop course from reviewed, agent-authored fragments."""

import argparse
import html
import json
import re
import shutil
from html.parser import HTMLParser
from pathlib import Path
from string import Template


def esc(x):
    return html.escape(str(x), quote=True)


def slug(value):
    if not isinstance(value, str) or not re.fullmatch(r"[a-z][a-z0-9-]*", value):
        raise ValueError(f"Invalid ID: {value}")
    return value


def local(value):
    if (
        not value
        or Path(value).is_absolute()
        or ".." in Path(value).parts
        or re.match(r"\w+:", value)
        or value.startswith("//")
    ):
        raise ValueError(f"Not a local relative path: {value}")
    return value


class Fragment(HTMLParser):
    def __init__(self, sources, terms):
        super().__init__(convert_charrefs=False)
        self.sources = sources
        self.terms = terms
        self.parts = []
        self.ids = {"content", "glossary", "term-search"} | {"term-" + t for t in terms}
        self.chapters = []
        self.section = None
        self.heading = False
        self.headingtext = []
        self.quizzes = []
        self.quiz = None
        self.elements = []
        self.quiz_depth = None
        self.options_depth = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in (
            "html",
            "head",
            "body",
            "script",
            "style",
            "iframe",
            "object",
            "embed",
            "link",
            "base",
            "form",
            "meta",
        ):
            raise ValueError(f"Forbidden fragment tag: {tag}")
        for k, v in attrs:
            if k.startswith("on") or k in ("style", "srcset"):
                raise ValueError(f"Forbidden attribute: {k}")
            if k in ("src", "href", "xlink:href", "poster") and v and not v.startswith("#"):
                local(v)
        # Container depths keep nested option markup from closing the quiz early.
        if tag not in (
            "area",
            "base",
            "br",
            "col",
            "embed",
            "hr",
            "img",
            "input",
            "link",
            "meta",
            "param",
            "source",
            "track",
            "wbr",
        ):
            self.elements.append(tag)
        if "id" in a:
            slug(a["id"])
            if a["id"] in self.ids:
                raise ValueError(f"Duplicate ID: {a['id']}")
            self.ids.add(a["id"])
        if tag == "section":
            if not a.get("id"):
                raise ValueError("Chapter needs an id")
            self.section = a["id"]
        if tag == "h2" and self.section:
            self.heading = True
            self.headingtext = []
        if "data-term" in a and a["data-term"] not in self.terms:
            raise ValueError(f"Unknown term: {a['data-term']}")
        if "data-source" in a:
            if tag != "a":
                raise ValueError("Source references must be links")
            source = self.sources.get(a["data-source"])
            page = int(a.get("data-page", "0"))
            if not source or page < 1 or page > source["count"]:
                raise ValueError(f"Invalid source/page: {a}")
            a["href"] = source["url"] + "#page=" + str(page)
            a["target"] = "_blank"
            a["rel"] = "noopener"
            a["class"] = (a.get("class", "") + " source-link").strip()
            a["title"] = f"{source['title']} · PDF page {page}"
        classes = a.get("class", "").split()
        if "quiz" in classes:
            if self.quiz:
                raise ValueError("Nested quizzes unsupported")
            self.quiz = {"answer": int(a["data-answer"]), "options": 0, "required": set()}
            self.quizzes.append(self.quiz)
            self.quiz_depth = len(self.elements)
        if self.quiz:
            self.quiz["required"].update(classes)
            if "options" in classes and self.options_depth is None:
                self.options_depth = len(self.elements)
            if (
                tag == "button"
                and self.options_depth is not None
                and len(self.elements) > self.options_depth
            ):
                self.quiz["options"] += 1
        self.parts.append(
            "<"
            + tag
            + "".join(
                " " + k + ('="' + esc(v) + '"' if v is not None else "") for k, v in a.items()
            )
            + ">"
        )

    def handle_endtag(self, tag):
        if tag == "h2" and self.heading:
            self.chapters.append((self.section, "".join(self.headingtext)))
            self.heading = False
        if tag == "section":
            self.section = None
        if tag in self.elements:
            index = len(self.elements) - 1 - self.elements[::-1].index(tag)
            del self.elements[index:]
            if self.options_depth is not None and len(self.elements) < self.options_depth:
                self.options_depth = None
            if self.quiz_depth is not None and len(self.elements) < self.quiz_depth:
                self.quiz = None
                self.quiz_depth = None
        self.parts.append("</" + tag + ">")

    def handle_data(self, data):
        self.parts.append(data)
        if self.heading:
            self.headingtext.append(data)

    def handle_entityref(self, name):
        self.parts.append("&" + name + ";")
        if self.heading:
            self.headingtext.append(html.unescape("&" + name + ";"))

    def handle_charref(self, name):
        self.parts.append("&#" + name + ";")
        if self.heading:
            self.headingtext.append(html.unescape("&#" + name + ";"))

    def handle_comment(self, data):
        pass

    def finish(self):
        if not self.chapters:
            raise ValueError("Lecture must contain a section with h2")
        for q in self.quizzes:
            if not 0 <= q["answer"] < q["options"] or q["options"] < 2:
                raise ValueError("Invalid quiz answer/options")
            if not {"explanation", "retry", "quiz-status"}.issubset(q["required"]):
                raise ValueError("Quiz missing feedback, explanation, or retry")
        return "".join(self.parts)


def build(spec, out):
    from pypdf import PdfReader

    root = spec.parent
    data = json.loads(spec.read_text(encoding="utf-8"))
    cid = slug(data["id"])
    translations = data.get("translations", {})
    if not isinstance(translations, dict) or set(translations) - {"zh"}:
        raise ValueError("translations must contain only a zh text dictionary")
    chinese = translations.get("zh")
    if chinese is not None and (
        not isinstance(chinese, dict)
        or not chinese
        or any(
            not isinstance(k, str) or not k.strip() or not isinstance(v, str) or not v.strip()
            for k, v in chinese.items()
        )
    ):
        raise ValueError("translations.zh must map nonempty English text to Chinese text")
    default_language = data.get("default_language", "en")
    if default_language not in ("en", "zh") or (default_language == "zh" and not chinese):
        raise ValueError("default_language must be en, or zh with translations.zh")
    if out.exists() and any(out.iterdir()):
        raise ValueError("Output directory must be new or empty")
    sources = {}
    copies = []
    for i, s in enumerate(data["sources"], 1):
        sid = slug(s["id"])
        if sid in sources:
            raise ValueError("Duplicate source ID")
        path = root / local(s["path"])
        count = len(PdfReader(path).pages)
        url = f"sources/{i:02d}-{sid}.pdf"
        sources[sid] = {"count": count, "url": url, "title": s["title"]}
        copies.append((path, url))
    terms = {}
    for term in data["glossary"]:
        tid = slug(term["id"])
        if tid in terms:
            raise ValueError("Duplicate term ID")
        terms[tid] = term
    lectures = []
    ids = set()
    for lecture in data["lectures"]:
        lid = slug(lecture["id"])
        if lid in ids or lid == "index":
            raise ValueError("Duplicate/reserved lecture ID")
        ids.add(lid)
        parser = Fragment(sources, terms)
        parser.feed((root / local(lecture["file"])).read_text(encoding="utf-8"))
        parser.close()
        lectures.append({**lecture, "html": parser.finish(), "chapters": parser.chapters})
    if not lectures:
        raise ValueError("At least one lecture required")
    assetnames = set()
    for asset in data.get("assets", []):
        name = local(asset["name"])
        if name in assetnames:
            raise ValueError("Duplicate asset name")
        assetnames.add(name)
        copies.append((root / local(asset["path"]), "assets/" + name))
    for src, dst in copies:
        if not src.is_file():
            raise ValueError(f"Missing file: {src}")
    template = Path(__file__).resolve().parents[1] / "assets/template"
    page_template = Template((template / "page.html").read_text(encoding="utf-8"))
    # Validate everything before making the output tree.
    out.mkdir(parents=True, exist_ok=True)
    for file in ("styles.css", "main.js", "launch_course.py", "打开课程.command"):
        shutil.copy2(template / file, out / file)
    if chinese:
        dictionary = json.loads((template / "ui-zh.json").read_text(encoding="utf-8"))
        dictionary.update(chinese)

        # Translate labels synthesized by the builder from translated metadata.
        def translated(text):
            return dictionary.get(text, text)

        dictionary["THE COURSE / " + f"{len(lectures):02d}" + " LECTURES"] = (
            f"课程 / 共 {len(lectures)} 讲"
        )
        dictionary["Overview · " + data["title"]] = "课程总览 · " + translated(data["title"])
        for i, lecture in enumerate(lectures, 1):
            title = lecture["title"]
            dictionary[f"{i:02d} \u00a0 {title}"] = f"{i:02d}　{translated(title)}"
            dictionary[f"LECTURE {i:02d}"] = f"第 {i} 讲"
            dictionary["Next lecture: " + title + " →"] = "下一讲：" + translated(title) + " →"
            dictionary[title + " · " + data["title"]] = (
                translated(title) + " · " + translated(data["title"])
            )
        (out / "translations.js").write_text(
            "window.courseTranslations = "
            + json.dumps(dictionary, ensure_ascii=True)
            + ";\nwindow.courseDefaultLanguage = "
            + json.dumps(default_language)
            + ";\n",
            encoding="utf-8",
        )
        shutil.copy2(template / "language.js", out / "language.js")
    (out / "打开课程.command").chmod(0o755)
    for src, dst in copies:
        target = out / dst
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, target)
    glossary = "".join(
        f'<article class="glossary-item" id="term-{tid}" tabindex="0"><h3>{esc(t["en"])}</h3><p class="zh" lang="zh-Hans">{esc(t["zh"])}</p><p>{esc(t["definition"])}</p></article>'
        for tid, t in terms.items()
    )

    def shell(title, content, current="", chapters=()):
        nav = "".join(
            f'<a class="{"active" if lecture["id"] == current else ""}" href="{lecture["id"]}.html">{i:02d} &nbsp; {esc(lecture["title"])}</a>'
            for i, lecture in enumerate(lectures, 1)
        )
        chapterlinks = "".join(f'<a href="#{esc(id)}">{esc(text)}</a>' for id, text in chapters)
        reading_progress = (
            '<span class="reading">0% read</span>'
            '<progress max="100" value="0" aria-label="Reading progress"></progress>'
            if current
            else ""
        )
        return page_template.substitute(
            language_scripts_html=(
                '    <script src="translations.js" defer></script>\n'
                '    <script src="language.js" defer></script>'
                if chinese
                else ""
            ),
            language_toggle_html=(
                '<button class="language-toggle" type="button" '
                'aria-label="Switch lesson language" aria-pressed="false">'
                '<span lang="zh-Hans" data-language="zh">中文</span>'
                '<span aria-hidden="true"> / </span>'
                '<span lang="en" data-language="en">English</span></button>'
                if chinese
                else "<span>Study edition</span>"
            ),
            lesson_languages="English / 中文 lessons." if chinese else "English lessons.",
            page_title=esc(title),
            course_title=esc(data["title"]),
            description=esc(data["description"]),
            course_id=cid,
            lecture_id=current or "index",
            lecture_navigation_html=nav,
            chapter_navigation_html=chapterlinks,
            reading_progress_html=reading_progress,
            content_html=content,
            glossary_html=glossary,
        )

    notice = f'<p class="notice">{esc(data["notice"])}</p>' if data.get("notice") else ""
    cards = "".join(
        f'<a class="lecture-card" href="{lecture["id"]}.html"><span class="number">{i:02d}</span><div><h2>{esc(lecture["title"])}</h2><p>{esc(lecture["summary"])}</p></div><span aria-hidden="true">↗</span></a>'
        for i, lecture in enumerate(lectures, 1)
    )
    content = f'<header class="hero"><p class="eyebrow">THE COURSE / {len(lectures):02d} LECTURES</p><h1>{esc(data["title"])}</h1><p class="lead">{esc(data["description"])}</p>{notice}</header>{cards}'
    (out / "index.html").write_text(shell("Overview", content), encoding="utf-8")
    for i, lecture in enumerate(lectures):
        nxt = (
            f'<a class="next" href="{lectures[i + 1]["id"]}.html">Next lecture: {esc(lectures[i + 1]["title"])} →</a>'
            if i + 1 < len(lectures)
            else '<a class="next" href="index.html">Return to course overview →</a>'
        )
        content = (
            f'<header class="hero"><p class="eyebrow">LECTURE {i + 1:02d}</p><h1>{esc(lecture["title"])}</h1><p class="lead">{esc(lecture["summary"])}</p>{notice}</header>'
            + lecture["html"]
            + nxt
        )
        (out / (lecture["id"] + ".html")).write_text(
            shell(lecture["title"], content, lecture["id"], lecture["chapters"]),
            encoding="utf-8",
        )
    return len(lectures)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("course", type=Path)
    p.add_argument("--out", required=True, type=Path)
    a = p.parse_args()
    try:
        print(f"Built {build(a.course, a.out)} lectures at {a.out}/index.html")
    except (ValueError, KeyError, OSError, ImportError) as e:
        p.error(str(e))


if __name__ == "__main__":
    main()
