'use strict';
(() => {
  const concepts = window.courseReview?.concepts;
  if (!concepts?.length) return;
  const day = 24 * 60 * 60 * 1000;
  const key = 'lecture-to-course:review:' + document.body.dataset.course;
  const activityKey = (activity) => activity.lecture + ':' + activity.id;
  const activities = new Map(
    concepts.flatMap((concept) =>
      concept.activities.map((activity) => [activityKey(activity), activity]),
    ),
  );
  const labels = {
    independent: 'Independently correct',
    hint: 'Used a hint',
    supported: 'Correct with support or repetition',
    'needs-review': 'Still needs review',
    revealed: 'Viewed the solution',
    'self-assessed': 'Compared with key points',
  };
  const text = (english) =>
    window.courseLanguage === 'zh' ? window.courseTranslations[english] || english : english;
  const empty = () => ({ version: 1, activities: Object.create(null) });
  let saved = true;
  let unreadable = false;
  function read() {
    let raw;
    try {
      raw = localStorage.getItem(key);
    } catch {
      saved = false;
      return null;
    }
    if (!raw) return empty();
    const result = empty();
    try {
      const data = JSON.parse(raw);
      if (
        data?.version !== 1 ||
        !data.activities ||
        typeof data.activities !== 'object' ||
        Array.isArray(data.activities)
      )
        throw new Error('Invalid review record');
      const validTime = (value) =>
        Number.isFinite(value) && value >= 0 && value <= Date.now() + day;
      for (const id of activities.keys()) {
        const entry = data.activities[id];
        if (!entry) continue;
        if (!Array.isArray(entry.events) || !validTime(entry.seenAt)) {
          unreadable = true;
          continue;
        }
        const events = entry.events
          .filter((event) => event && Object.hasOwn(labels, event.kind) && validTime(event.at))
          .slice(-40)
          .map(({ kind, at, sequence }) => ({
            kind,
            at,
            sequence:
              Number.isSafeInteger(sequence) && sequence > 0 && sequence < 1e9 ? sequence : 0,
          }));
        if (events.length)
          result.activities[id] = {
            events,
            seenAt: Math.max(entry.seenAt, ...events.map((event) => event.at)),
          };
      }
    } catch {
      unreadable = true;
    }
    return result;
  }
  let data = read() || empty();
  // Probe writes as well as reads: private-browser quotas can deny only writes.
  if (saved) {
    try {
      localStorage.setItem(key + ':probe', '1');
      localStorage.removeItem(key + ':probe');
    } catch {
      saved = false;
    }
  }
  const panel = document.createElement('details');
  panel.id = 'concept-review';
  panel.className = 'concept-review';
  const summary = panel.appendChild(document.createElement('summary'));
  const introduction = panel.appendChild(document.createElement('p'));
  introduction.className = 'muted';
  const storage = panel.appendChild(document.createElement('p'));
  storage.className = 'review-storage muted';
  const list = panel.appendChild(document.createElement('ol'));
  list.className = 'review-list';
  const rows = new Map();
  function element(parent, tag, className) {
    const node = parent.appendChild(document.createElement(tag));
    node.className = className;
    return node;
  }
  concepts.forEach((concept) => {
    const row = element(list, 'li', 'review-item');
    row.dataset.reviewConcept = concept.id;
    const title = element(row, 'h3', 'review-title');
    const state = element(row, 'p', 'review-state');
    const evidence = element(row, 'p', 'review-evidence');
    const due = element(row, 'p', 'review-due');
    const next = element(row, 'a', 'review-next');
    next.addEventListener('click', (event) => {
      const url = new URL(next.href);
      if (url.pathname !== location.pathname) return;
      const target = document.getElementById(url.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'start' });
    });
    rows.set(concept.id, { row, title, state, evidence, due, next });
  });
  document.querySelector('.hero').after(panel);
  function conceptState(concept) {
    const events = concept.activities
      .flatMap((activity) =>
        (data.activities[activityKey(activity)]?.events || []).map((event) => ({
          ...event,
          activity,
        })),
      )
      .sort((a, b) => a.at - b.at || a.sequence - b.sequence);
    const last = events.at(-1);
    let streak = 0;
    let previous = null;
    let dueAt = null;
    events.forEach((event) => {
      if (event.kind !== 'independent') {
        streak = 0;
        previous = null;
        dueAt = event.at;
      } else if (previous === null || event.at - previous >= day) {
        streak++;
        previous = event.at;
        dueAt = event.at + [1, 3, 7][Math.min(streak - 1, 2)] * day;
      }
    });
    const candidates = concept.activities.filter((activity) => activity.kind !== 'reflection');
    candidates.sort((a, b) => {
      const aSeen = data.activities[activityKey(a)]?.seenAt ?? -1;
      const bSeen = data.activities[activityKey(b)]?.seenAt ?? -1;
      return aSeen - bSeen || Number(a === last?.activity) - Number(b === last?.activity);
    });
    return { events, last, dueAt, next: candidates[0] };
  }
  function render() {
    summary.textContent = text('Review by concept');
    introduction.textContent = text(
      'Reading progress shows your place. These recent activity records help you choose what to revisit; they do not certify mastery.',
    );
    storage.textContent = text(
      saved
        ? 'Saved in this browser on this device. Review dates are suggestions.'
        : 'Storage is unavailable. Records last only on this page; you can keep learning.',
    );
    if (unreadable)
      storage.textContent +=
        ' ' + text('Some saved records could not be read. New attempts start a fresh record.');
    const ordered = concepts.map((concept, index) => ({
      concept,
      index,
      ...conceptState(concept),
    }));
    ordered.sort((a, b) => {
      const rank = (item) => {
        if (item.last && item.last.kind !== 'independent') return 0;
        if (item.dueAt !== null && item.dueAt <= Date.now()) return 1;
        return item.last ? 3 : 2;
      };
      return rank(a) - rank(b) || (a.dueAt ?? 0) - (b.dueAt ?? 0) || a.index - b.index;
    });
    ordered.forEach(({ concept, events, last, dueAt, next }, position) => {
      const row = rows.get(concept.id);
      row.title.textContent = text(concept.title);
      row.state.textContent = text(last ? labels[last.kind] : 'No activity evidence yet');
      const counts = new Map();
      events.forEach(({ kind }) => counts.set(kind, (counts.get(kind) || 0) + 1));
      row.evidence.textContent = counts.size
        ? [...counts].map(([kind, count]) => text(labels[kind]) + ': ' + count).join(' · ')
        : text('Try a question without hints, then compare your reasoning.');
      row.due.textContent =
        dueAt === null
          ? text('Start with a question')
          : dueAt <= Date.now()
            ? text('Review now — revisit the reasoning, then try a different question.')
            : text('Suggested review date') +
              ': ' +
              new Date(dueAt).toLocaleDateString(
                window.courseLanguage === 'zh' ? 'zh-CN' : 'en-GB',
              );
      if (dueAt !== null) row.due.dataset.dueAt = String(dueAt);
      else delete row.due.dataset.dueAt;
      row.next.textContent =
        text(last ? 'Try another question' : 'Try a question') + ': ' + text(next.title);
      const url = new URL(next.href, location.href);
      if (window.courseLanguage) url.searchParams.set('lang', window.courseLanguage);
      row.next.href = url.href;
      // Keep nodes in place when their order is unchanged, preserving keyboard focus.
      if (list.children[position] !== row.row)
        list.insertBefore(row.row, list.children[position] || null);
    });
  }
  function refresh() {
    if (saved) data = read() || data;
  }
  function record(id, kind) {
    refresh();
    const now = Date.now();
    // Preserve event order even when multiple activities are recorded in one millisecond.
    const sequence =
      Object.values(data.activities).reduce(
        (maximum, item) =>
          item.events.reduce((value, event) => Math.max(value, event.sequence || 0), maximum),
        0,
      ) + 1;
    const entry = data.activities[id] || { events: [], seenAt: now };
    entry.events = [...entry.events, { kind, at: now, sequence }].slice(-40);
    entry.seenAt = now;
    data.activities[id] = entry;
    if (saved) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        unreadable = false;
      } catch {
        saved = false;
      }
    }
    render();
  }
  // One tracker per authored activity; resetting its form never erases prior help.
  window.courseReviewTracker = {
    start(activity) {
      const id = document.body.dataset.lecture + ':' + activity.id;
      if (!activity.dataset.concept || !activities.has(id)) return null;
      let assisted = false;
      let hintUsed = false;
      return {
        hint() {
          assisted = true;
          if (!hintUsed) record(id, 'hint');
          hintUsed = true;
        },
        answer(correct) {
          refresh();
          const seenAt = data.activities[id]?.seenAt;
          const independent = !assisted && (seenAt === undefined || Date.now() - seenAt >= day);
          record(id, correct ? (independent ? 'independent' : 'supported') : 'needs-review');
          assisted = true;
        },
        reveal() {
          assisted = true;
          record(id, 'revealed');
        },
        reflect() {
          assisted = true;
          record(id, 'self-assessed');
        },
      };
    },
  };
  addEventListener('course-language-change', render);
  addEventListener('storage', (event) => {
    if (event.key === key || event.key === null) {
      refresh();
      render();
    }
  });
  addEventListener('pageshow', () => {
    refresh();
    render();
  });
  panel.addEventListener('toggle', () => {
    if (panel.open) {
      refresh();
      render();
    }
  });
  // Refresh due dates after a background tab has crossed a review date.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      refresh();
      render();
    }
  });
  render();
})();
