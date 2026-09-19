'use strict';
(() => {
  const dictionary = window.courseTranslations;
  // HTML formatters wrap prose without changing the sentence students read.
  const normalized = new Map(
    Object.entries(dictionary).map(([en, zh]) => [en.trim().replace(/\s+/g, ' '), zh]),
  );
  function translated(text) {
    const clean = text.trim();
    return Object.prototype.hasOwnProperty.call(dictionary, clean)
      ? dictionary[clean]
      : normalized.get(clean.replace(/\s+/g, ' '));
  }
  const key = 'lecture-to-course:language:' + document.body.dataset.course;
  const toggle = document.querySelector('.language-toggle');
  const records = [];
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (
      node.parentElement.closest(
        'script, style, textarea, [translate="no"], .language-toggle, .quiz-status, .practice-status, .exploration-readout, .exploration-status, .reading, .glossary-item h3, .glossary-item > .zh',
      )
    )
      continue;
    const original = node.nodeValue;
    const zh = translated(original);
    if (zh) {
      const leading = original.match(/^\s*/)[0];
      const trailing = original.match(/\s*$/)[0];
      records.push({ node, en: original, zh: leading + zh + trailing });
    }
  }
  const attributes = [];
  document
    .querySelectorAll('[aria-label], [placeholder], [alt], [title], meta[name="description"]')
    .forEach((el) => {
      for (const attr of ['aria-label', 'placeholder', 'alt', 'title', 'content']) {
        const en = el.getAttribute(attr);
        if (!en || el === toggle) continue;
        let zh = translated(en);
        if (!zh && attr === 'title' && el.classList.contains('source-link'))
          zh = '课件来源 · 第 ' + el.dataset.page + ' 页';
        if (zh) attributes.push({ el, attr, en, zh });
      }
    });
  // Store original link targets once so changing language never duplicates parameters.
  const links = [...document.querySelectorAll('a[href]')]
    .filter((a) => {
      const url = new URL(a.getAttribute('href'), location.href);
      return url.pathname.endsWith('.html') && !a.getAttribute('href').startsWith('#');
    })
    .map((a) => ({ a, original: a.getAttribute('href') }));
  function apply(language, remember = true) {
    const sections = [...document.querySelectorAll('main section[id]')];
    const anchor = sections
      .filter((el) => el.getBoundingClientRect().top <= innerHeight * 0.35)
      .at(-1);
    const top = anchor ? anchor.getBoundingClientRect().top : null;
    window.courseLanguage = language;
    document.documentElement.lang = language === 'zh' ? 'zh-Hans' : 'en';
    records.forEach((record) => {
      record.node.nodeValue = record[language];
    });
    attributes.forEach((record) => record.el.setAttribute(record.attr, record[language]));
    toggle.setAttribute('aria-pressed', String(language === 'zh'));
    toggle.setAttribute(
      'aria-label',
      language === 'zh' ? '当前为中文讲解，切换到英文' : 'Currently English. Switch to Chinese',
    );
    toggle
      .querySelectorAll('[data-language]')
      .forEach((el) => el.setAttribute('aria-current', String(el.dataset.language === language)));
    links.forEach(({ a, original }) => {
      const hashIndex = original.indexOf('#');
      const base = hashIndex < 0 ? original : original.slice(0, hashIndex);
      const hash = hashIndex < 0 ? '' : original.slice(hashIndex);
      a.setAttribute('href', base + (base.includes('?') ? '&' : '?') + 'lang=' + language + hash);
    });
    if (remember) {
      try {
        localStorage.setItem(key, language);
      } catch {}
      try {
        const url = new URL(location.href);
        url.searchParams.set('lang', language);
        history.replaceState(null, '', url);
      } catch {}
    }
    dispatchEvent(new Event('course-language-change'));
    if (anchor && remember) scrollBy(0, anchor.getBoundingClientRect().top - top);
  }
  let initial = new URL(location.href).searchParams.get('lang');
  if (!['en', 'zh'].includes(initial)) {
    try {
      initial = localStorage.getItem(key);
    } catch {}
  }
  apply(['en', 'zh'].includes(initial) ? initial : window.courseDefaultLanguage, false);
  toggle.addEventListener('click', () => apply(window.courseLanguage === 'zh' ? 'en' : 'zh'));
})();
