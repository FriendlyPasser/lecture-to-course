'use strict';
const courseText = (en) =>
  window.courseLanguage === 'zh' ? window.courseTranslations[en] || en : en;
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
  const prerequisiteOrigins = new WeakMap();
  function focusAt(element, block = 'center') {
    if (element.tabIndex < 0) element.tabIndex = -1;
    element.focus({ preventScroll: true });
    element.scrollIntoView({ block });
  }
  document.querySelectorAll('.precheck-skip').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      focusAt(target, 'start');
    });
  });
  document.querySelectorAll('details.prerequisite').forEach((refresher) => {
    refresher.querySelector('.prerequisite-return')?.addEventListener('click', () => {
      const quiz = prerequisiteOrigins.get(refresher);
      if (!quiz) return;
      focusAt(quiz, 'start');
    });
  });
  document.querySelectorAll('.quiz').forEach((quiz, quizIndex) => {
    const evidence = window.courseReviewTracker?.start(quiz);
    const buttons = [...quiz.querySelectorAll('.options button')],
      answer = Number(quiz.dataset.answer),
      explanation = quiz.querySelector('.explanation'),
      retry = quiz.querySelector('.retry'),
      status = quiz.querySelector('.quiz-status'),
      hints = [...quiz.querySelectorAll('.quiz-hint')],
      targeted = hints.length > 0;
    const refresher = quiz.dataset.prerequisite
      ? document.getElementById(quiz.dataset.prerequisite)
      : null;
    let review, reveal;
    let selected = null,
      revealed = false,
      lastHint = null,
      needsReview = false;
    function ensureId(element, suffix) {
      if (element.id) return element.id;
      const base = 'quiz-' + quizIndex + '-' + suffix;
      let id = base;
      while (document.getElementById(id)) id += '-auto';
      element.id = id;
      return id;
    }
    if (targeted) {
      status.tabIndex = -1;
      status.setAttribute('role', 'status');
      status.setAttribute('aria-atomic', 'true');
      hints.forEach((hint, index) => ensureId(hint, 'hint-' + index));
      reveal = document.createElement('button');
      reveal.type = 'button';
      reveal.className = 'show-explanation';
      reveal.setAttribute('aria-controls', ensureId(explanation, 'explanation'));
      reveal.addEventListener('click', () => {
        evidence?.reveal();
        revealed = true;
        render();
        status.focus();
      });
    }
    if (refresher) {
      review = document.createElement('a');
      review.className = 'prerequisite-review';
      review.href = '#' + refresher.id;
      review.hidden = true;
      retry.before(review);
      review.addEventListener('click', (event) => {
        event.preventDefault();
        prerequisiteOrigins.set(refresher, quiz);
        refresher.open = true;
        refresher.querySelector('.prerequisite-return').hidden = false;
        focusAt(refresher.querySelector(':scope > summary'));
      });
    }
    if (reveal) retry.before(reveal);
    function render() {
      const answered = selected !== null,
        correct = answered && selected === answer,
        solutionVisible = revealed || correct || (!targeted && answered),
        visibleHint = targeted && !solutionVisible ? lastHint : null;
      buttons.forEach((button, index) => {
        button.disabled = answered || revealed;
        button.classList.toggle('correct', solutionVisible && index === answer);
        button.classList.toggle('incorrect', answered && !correct && index === selected);
      });
      hints.forEach((hint) => (hint.hidden = hint !== visibleHint));
      if (visibleHint) status.setAttribute('aria-describedby', visibleHint.id);
      else status.removeAttribute('aria-describedby');
      let message = '';
      if (revealed) message = 'Answer revealed — compare the reasoning below.';
      else if (correct) message = 'Correct — here is why.';
      else if (answered) {
        message = !targeted
          ? 'Not quite — compare the reasoning below.'
          : visibleHint
            ? 'Not quite — use the hint and try again.'
            : 'Not quite — try again or view the full explanation.';
      } else if (targeted && needsReview) {
        message = visibleHint
          ? 'Try again using the hint.'
          : 'Try again or view the full explanation.';
      }
      status.textContent = courseText(message);
      if (answered) quiz.dataset.result = correct ? 'correct' : 'incorrect';
      else delete quiz.dataset.result;
      if (revealed) quiz.dataset.revealed = 'true';
      else delete quiz.dataset.revealed;
      explanation.hidden = !solutionVisible;
      retry.hidden = !answered && !revealed;
      if (reveal) {
        reveal.textContent = courseText('Show full explanation');
        reveal.hidden = solutionVisible;
        reveal.setAttribute('aria-expanded', String(solutionVisible));
      }
      if (review) {
        review.textContent = courseText('Review this prerequisite');
        review.hidden = !needsReview;
        if (!needsReview && prerequisiteOrigins.get(refresher) === quiz) {
          prerequisiteOrigins.delete(refresher);
          refresher.querySelector('.prerequisite-return').hidden = true;
        }
      }
    }
    buttons.forEach((button, index) =>
      button.addEventListener('click', () => {
        selected = index;
        revealed = false;
        needsReview = index !== answer;
        lastHint = needsReview
          ? hints.find((hint) => Number(hint.dataset.option) === index) || null
          : null;
        evidence?.answer(!needsReview);
        if (lastHint) evidence?.hint();
        render();
        if (targeted) status.focus();
      }),
    );
    retry.addEventListener('click', () => {
      selected = null;
      revealed = false;
      if (!targeted) needsReview = false;
      render();
      buttons[0].focus();
    });
    render();
    addEventListener('course-language-change', render);
  });
  // Parse only written numbers, fractions and percentages; never evaluate expressions.
  function numericResponse(value) {
    const decimal = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?';
    const match = value
      .trim()
      .match(new RegExp(`^(${decimal})(?:\\s*/\\s*(${decimal}))?\\s*(%)?$`));
    if (!match) return null;
    const numerator = Number(match[1]);
    const denominator = match[2] === undefined ? 1 : Number(match[2]);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0)
      return null;
    const result = numerator / denominator / (match[3] ? 100 : 1);
    return Number.isFinite(result) ? result : null;
  }
  let practiceId = 0;
  function ensurePracticeId(element) {
    if (!element.id) {
      let id;
      do id = 'practice-feedback-' + ++practiceId;
      while (document.getElementById(id));
      element.id = id;
    }
    return element.id;
  }
  document.querySelectorAll('form.practice').forEach((practice) => {
    const evidence = window.courseReviewTracker?.start(practice);
    const practiceHints = [...practice.querySelectorAll('details.practice-hint')];
    practiceHints.forEach((hint) => {
      if (hint.open) evidence?.hint();
      hint.addEventListener('toggle', () => {
        if (hint.open) evidence?.hint();
      });
    });
    const response = practice.querySelector('.practice-response'),
      status = practice.querySelector('.practice-status'),
      solution = practice.querySelector('.practice-solution'),
      reveal = practice.querySelector('.practice-reveal');
    const reflection = practice.dataset.kind === 'reflection';
    const expected = Number(practice.dataset.answer);
    const tolerance = Number(practice.dataset.tolerance ?? '0.000001');
    let feedback = '';
    practice.noValidate = true;
    response.setAttribute(
      'aria-describedby',
      [response.getAttribute('aria-describedby'), ensurePracticeId(status)]
        .filter(Boolean)
        .join(' '),
    );
    reveal.setAttribute('aria-controls', ensurePracticeId(solution));
    reveal.setAttribute('aria-expanded', 'false');
    function setFeedback(message, result) {
      feedback = message;
      status.textContent = courseText(message);
      if (result) practice.dataset.result = result;
      else delete practice.dataset.result;
    }
    function showSolution() {
      solution.hidden = false;
      reveal.setAttribute('aria-expanded', 'true');
    }
    practice.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = reflection ? response.value.trim() : numericResponse(response.value);
      if (value === null || value === '') {
        setFeedback(
          reflection
            ? 'Write a short explanation before comparing with the key points.'
            : 'Enter a finite number, fraction, or percentage (for example, 0.4, 2/5, or 40%).',
          'invalid',
        );
        response.setAttribute('aria-invalid', 'true');
        response.focus();
        return;
      }
      response.removeAttribute('aria-invalid');
      if (practiceHints.some((hint) => hint.open)) evidence?.hint();
      if (reflection) {
        evidence?.reflect();
        showSolution();
        setFeedback(
          'Compare your explanation with the key points. This is self-assessment, not an automatic score.',
          'self-assessment',
        );
      } else {
        // Allow floating-point roundoff at an authored absolute-tolerance boundary.
        const roundoff = 4 * Number.EPSILON * Math.max(Math.abs(value), Math.abs(expected));
        const difference = Math.abs(value - expected);
        const correct =
          Number.isFinite(difference) &&
          (difference <= tolerance || difference - tolerance <= roundoff);
        evidence?.answer(correct);
        if (correct) showSolution();
        setFeedback(
          correct
            ? 'Correct — compare your steps with the solution.'
            : 'Not yet. Check your steps and try again, or show the solution.',
          correct ? 'correct' : 'incorrect',
        );
      }
    });
    reveal.addEventListener('click', () => {
      evidence?.reveal();
      showSolution();
      response.removeAttribute('aria-invalid');
      setFeedback('Solution shown. Compare the reasoning, then try a fresh attempt.', 'review');
      focusAt(solution, 'nearest');
    });
    practice.querySelector('.practice-reset').addEventListener('click', () => {
      response.value = '';
      response.removeAttribute('aria-invalid');
      solution.hidden = true;
      reveal.setAttribute('aria-expanded', 'false');
      practice.querySelectorAll('details.practice-hint').forEach((hint) => (hint.open = false));
      setFeedback('');
      response.focus();
    });
    response.addEventListener('input', () => {
      response.removeAttribute('aria-invalid');
      setFeedback(
        solution.hidden ? '' : 'Solution shown. Compare the reasoning, then try a fresh attempt.',
        solution.hidden ? undefined : 'review',
      );
    });
    addEventListener('course-language-change', () => {
      status.textContent = courseText(feedback);
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
      label.textContent = window.courseLanguage === 'zh' ? '已读 ' + value + '%' : value + '% read';
      try {
        localStorage.setItem(key, String(value));
      } catch {}
    }
    update();
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    addEventListener('course-language-change', update);
  }
  addEventListener('course-language-change', () => {
    filter();
  });
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
