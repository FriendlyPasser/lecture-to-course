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
        self.element_nodes = []
        self.nodes = []
        self.id_nodes = {}
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
        classes = a.get("class", "").split()
        node = {
            "tag": tag,
            "attrs": a,
            "classes": classes,
            "ancestors": tuple(self.element_nodes),
            "text": [],
        }
        self.nodes.append(node)
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
            self.element_nodes.append(node)
        if "id" in a:
            slug(a["id"])
            if a["id"] in self.ids:
                raise ValueError(f"Duplicate ID: {a['id']}")
            self.ids.add(a["id"])
            self.id_nodes[a["id"]] = node
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
        if "data-prerequisite" in a:
            if "quiz" not in classes or not a.get("id"):
                raise ValueError("data-prerequisite requires a quiz with a unique id")
            slug(a["data-prerequisite"])
        if "quiz" in classes:
            if self.quiz:
                raise ValueError("Nested quizzes unsupported")
            self.quiz = {
                "answer": int(a["data-answer"]),
                "options": 0,
                "required": set(),
                "node": node,
            }
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
            del self.element_nodes[index:]
            if self.options_depth is not None and len(self.elements) < self.options_depth:
                self.options_depth = None
            if self.quiz_depth is not None and len(self.elements) < self.quiz_depth:
                self.quiz = None
                self.quiz_depth = None
        self.parts.append("</" + tag + ">")

    def handle_data(self, data):
        self.parts.append(data)
        if self.element_nodes:
            self.element_nodes[-1]["text"].append(data)
        if self.heading:
            self.headingtext.append(data)

    def handle_entityref(self, name):
        self.parts.append("&" + name + ";")
        if self.element_nodes:
            self.element_nodes[-1]["text"].append(html.unescape("&" + name + ";"))
        if self.heading:
            self.headingtext.append(html.unescape("&" + name + ";"))

    def handle_charref(self, name):
        self.parts.append("&#" + name + ";")
        if self.element_nodes:
            self.element_nodes[-1]["text"].append(html.unescape("&#" + name + ";"))
        if self.heading:
            self.headingtext.append(html.unescape("&#" + name + ";"))

    def handle_comment(self, data):
        pass

    @staticmethod
    def blocked(nodes, collapsible=False):
        return any(
            "hidden" in node["attrs"]
            or "inert" in node["attrs"]
            or (node["attrs"].get("aria-hidden") or "").lower() == "true"
            or "quiz" in node["classes"]
            or (node["tag"] == "details" and (collapsible or "open" not in node["attrs"]))
            for node in nodes
        )

    @staticmethod
    def hint_blocked(nodes, revealing=None):
        return any(
            ("hidden" in node["attrs"] and node is not revealing)
            or "inert" in node["attrs"]
            or (node["attrs"].get("aria-hidden") or "").strip().lower() == "true"
            or node["tag"] == "template"
            or (node["tag"] == "details" and "open" not in node["attrs"])
            for node in nodes
        )

    def validate_hints(self):
        quizzes = {id(quiz["node"]): quiz for quiz in self.quizzes}
        indexes = {}
        for node in self.nodes:
            if "quiz-hint" not in node["classes"]:
                if "data-option" in node["attrs"]:
                    raise ValueError("data-option requires a quiz-hint")
                continue
            owner = next(
                (
                    ancestor
                    for ancestor in reversed(node["ancestors"])
                    if "quiz" in ancestor["classes"]
                ),
                None,
            )
            if owner is None:
                raise ValueError("Quiz hint must belong to a quiz")
            quiz = quizzes[id(owner)]
            value = node["attrs"].get("data-option") or ""
            if not re.fullmatch(r"[0-9]+", value):
                raise ValueError("Quiz hint needs an integer data-option")
            index = int(value)
            if not 0 <= index < quiz["options"] or index == quiz["answer"]:
                raise ValueError("Quiz hint must target an incorrect option in range")
            seen = indexes.setdefault(id(owner), set())
            if index in seen:
                raise ValueError("Duplicate quiz hint option")
            seen.add(index)
            if "hidden" not in node["attrs"]:
                raise ValueError("Quiz hint must be initially hidden")
            containers = (*node["ancestors"], node)
            if any(
                {"options", "explanation", "quiz-status", "retry"}.intersection(ancestor["classes"])
                or (ancestor is not node and "quiz-hint" in ancestor["classes"])
                for ancestor in containers
            ):
                raise ValueError(
                    "Quiz hint must be outside options, feedback controls, explanations, and other hints"
                )
            if self.hint_blocked(containers, revealing=node):
                raise ValueError("Quiz hint is unreachable")
            readable = []
            for child in self.nodes:
                if child is node:
                    readable.extend(child["text"])
                elif any(ancestor is node for ancestor in child["ancestors"]):
                    context = (*child["ancestors"][len(node["ancestors"]) + 1 :], child)
                    if not self.hint_blocked(context):
                        readable.extend(child["text"])
            if not "".join(readable).strip():
                raise ValueError("Quiz hint needs readable text")
        for owner in indexes:
            self.validate_hint_feedback(quizzes[owner]["node"])

    def validate_hint_feedback(self, quiz):
        descendants = [
            node for node in self.nodes if any(ancestor is quiz for ancestor in node["ancestors"])
        ]
        for component in ("quiz-status", "retry", "explanation"):
            matches = [node for node in descendants if component in node["classes"]]
            if len(matches) != 1:
                raise ValueError(f"Hinted quiz needs exactly one {component}")
            node = matches[0]
            initially_hidden = component != "quiz-status"
            if ("hidden" in node["attrs"]) != initially_hidden:
                state = "hidden" if initially_hidden else "visible"
                raise ValueError(f"Hinted quiz {component} must be initially {state}")
            ancestors = node["ancestors"][len(quiz["ancestors"]) + 1 :]
            context = (*ancestors, node)
            if component == "retry" and (
                node["tag"] != "button"
                or "disabled" in node["attrs"]
                or any(
                    parent["tag"] == "fieldset" and "disabled" in parent["attrs"]
                    for parent in ancestors
                )
            ):
                raise ValueError("Hinted quiz retry must be an enabled button")
            forbidden = {"options", "quiz-hint", "quiz-status", "retry", "explanation"}
            if (
                self.hint_blocked(context, revealing=node if initially_hidden else None)
                or any(parent["tag"] == "details" for parent in ancestors)
                or any(forbidden.intersection(parent["classes"]) for parent in ancestors)
                or (forbidden - {component}).intersection(node["classes"])
            ):
                raise ValueError(
                    f"Hinted quiz {component} is unreachable or nested in other feedback"
                )

    def validate_prerequisites(self):
        for node in self.nodes:
            reference = node["attrs"].get("data-prerequisite")
            if reference is not None:
                target = self.id_nodes.get(reference)
                if (
                    not target
                    or target["tag"] != "details"
                    or "prerequisite" not in target["classes"]
                ):
                    raise ValueError(f"Unknown prerequisite details: {reference}")
                if (
                    self.blocked(target["ancestors"], collapsible=True)
                    or "hidden" in target["attrs"]
                    or "inert" in target["attrs"]
                    or (target["attrs"].get("aria-hidden") or "").lower() == "true"
                    or "quiz" in target["classes"]
                ):
                    raise ValueError(f"Prerequisite is unreachable: {reference}")
                descendants = [
                    child
                    for child in self.nodes
                    if any(ancestor is target for ancestor in child["ancestors"])
                ]
                summaries = [child for child in descendants if child["tag"] == "summary"]
                if (
                    len(summaries) != 1
                    or summaries[0]["ancestors"][-1] is not target
                    or self.blocked(summaries)
                ):
                    raise ValueError(f"Prerequisite needs one visible direct summary: {reference}")
                returns = [
                    child for child in descendants if "prerequisite-return" in child["classes"]
                ]
                if len(returns) != 1:
                    raise ValueError(f"Prerequisite needs one return button: {reference}")
                button = returns[0]
                if (
                    button["tag"] != "button"
                    or "hidden" not in button["attrs"]
                    or "disabled" in button["attrs"]
                    or "inert" in button["attrs"]
                    or (button["attrs"].get("aria-hidden") or "").lower() == "true"
                    or self.blocked(
                        button["ancestors"][len(target["ancestors"]) + 1 :], collapsible=True
                    )
                ):
                    raise ValueError(
                        f"Prerequisite needs an initially hidden, reachable return button: {reference}"
                    )
            if "precheck-skip" in node["classes"]:
                href = node["attrs"].get("href") or ""
                target = self.id_nodes.get(href[1:]) if href.startswith("#") else None
                if node["tag"] != "a" or not target:
                    raise ValueError("Precheck skip must link to an id in the same lecture")
                if self.blocked((*target["ancestors"], target)):
                    raise ValueError(f"Precheck skip target is unreachable: {href}")

    def finish(self):
        if not self.chapters:
            raise ValueError("Lecture must contain a section with h2")
        for q in self.quizzes:
            if not 0 <= q["answer"] < q["options"] or q["options"] < 2:
                raise ValueError("Invalid quiz answer/options")
            if not {"explanation", "retry", "quiz-status"}.issubset(q["required"]):
                raise ValueError("Quiz missing feedback, explanation, or retry")
        self.validate_hints()
        self.validate_prerequisites()
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
