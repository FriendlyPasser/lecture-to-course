'use strict';
(() => {
  const panel = document.querySelector('.drawer'),
    tab = document.querySelector('.glossary-tab'),
    search = panel.querySelector('input');
  let opener = tab;
  const items = [...panel.querySelectorAll('.glossary-item')];
  function filter() {
    let count = 0;
    const query = search.value.trim().toLocaleLowerCase();
    items.forEach((item) => {
      item.hidden = !item.textContent.toLocaleLowerCase().includes(query);
      if (!item.hidden) count++;
    });
    panel.querySelector('.empty').hidden = count > 0;
  }
  function open(trigger, id) {
    opener = trigger;
    panel.hidden = false;
    tab.setAttribute('aria-expanded', 'true');
    search.value = '';
    filter();
    if (id) {
      const item = items.find((x) => x.id === 'term-' + id);
      if (item) {
        item.focus();
        item.scrollIntoView({ block: 'nearest' });
        return;
      }
    }
    search.focus();
  }
  function close() {
    panel.hidden = true;
    tab.setAttribute('aria-expanded', 'false');
    opener.focus();
  }
  tab.addEventListener('click', () => (panel.hidden ? open(tab) : close()));
  panel.querySelector('.close').addEventListener('click', close);
  search.addEventListener('input', filter);
  document
    .querySelectorAll('[data-term]')
    .forEach((button) => button.addEventListener('click', () => open(button, button.dataset.term)));
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
    if (e.key === 'Tab') {
      const focusable = [...panel.querySelectorAll('button,input,[tabindex="0"]')].filter(
        (x) => !x.hidden && !x.closest('[hidden]'),
      );
      const first = focusable[0],
        last = focusable.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  document.querySelectorAll('.quiz').forEach((quiz) => {
    const buttons = [...quiz.querySelectorAll('.options button')],
      answer = Number(quiz.dataset.answer),
      explanation = quiz.querySelector('.explanation'),
      retry = quiz.querySelector('.retry'),
      status = quiz.querySelector('.quiz-status');
    buttons.forEach((button, index) =>
      button.addEventListener('click', () => {
        buttons.forEach((b, i) => {
          b.disabled = true;
          b.classList.toggle('correct', i === answer);
        });
        button.classList.toggle('incorrect', index !== answer);
        status.textContent =
          index === answer ? 'Correct — here is why.' : 'Not quite — compare the reasoning below.';
        explanation.hidden = false;
        retry.hidden = false;
      }),
    );
    retry.addEventListener('click', () => {
      buttons.forEach((b) => {
        b.disabled = false;
        b.classList.remove('correct', 'incorrect');
      });
      status.textContent = '';
      explanation.hidden = true;
      retry.hidden = true;
      buttons[0].focus();
    });
  });
  const progress = document.querySelector('progress'),
    label = document.querySelector('.reading');
  if (progress) {
    const key =
      'lecture-to-course:' + document.body.dataset.course + ':' + document.body.dataset.lecture;
    function update() {
      const span = document.documentElement.scrollHeight - innerHeight;
      const value =
        span <= 0 ? 100 : Math.max(0, Math.min(100, Math.round((scrollY / span) * 100)));
      progress.value = value;
      label.textContent = value + '% read';
      try {
        localStorage.setItem(key, String(value));
      } catch {}
    }
    update();
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
  }
  const sections = [...document.querySelectorAll('main section[id]')];
  function highlight() {
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= innerHeight * 0.35) current = section;
    }
    document
      .querySelectorAll('.chapters a')
      .forEach((a) => a.classList.toggle('active', !!current && a.hash === '#' + current.id));
  }
  highlight();
  addEventListener('scroll', highlight, { passive: true });
  addEventListener('resize', highlight);
})();
