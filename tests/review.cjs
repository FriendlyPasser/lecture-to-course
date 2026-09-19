const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const localDir = path.resolve(__dirname, '../.local');
process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(localDir, 'cache/playwright');
const { chromium } = require(path.join(localDir, 'node_modules/playwright'));
const siteDir = path.resolve(process.argv[2] ?? path.join(localDir, 'demo/site'));
const bilingualDir = path.resolve(process.argv[3] ?? path.join(localDir, 'demo/bilingual'));
const screenshotDir = path.resolve(process.argv[4] ?? path.join(localDir, 'demo/concept-review'));
const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 8, 19, 12);
const conceptId = 'reference-denominator';

function address(directory, file = 'index.html', now = NOW) {
  const url = pathToFileURL(path.join(directory, file));
  url.searchParams.set('lang', 'en');
  url.searchParams.set('reviewNow', String(now));
  return url.href;
}

function row(page, id = conceptId) {
  return page.locator(`.review-list [data-review-concept="${id}"]`);
}

async function openReview(page) {
  const review = page.locator('details#concept-review');
  if ((await review.getAttribute('open')) === null) {
    await review.locator('summary').focus();
    await page.keyboard.press('Enter');
  }
  assert.equal(await review.getAttribute('open'), '');
  return review;
}

async function stored(page) {
  return page.evaluate(() => {
    const key = `lecture-to-course:review:${document.body.dataset.course}`;
    return JSON.parse(localStorage.getItem(key) || '{"version":1,"activities":{}}');
  });
}

function events(state, lecture, id) {
  return state.activities[`${lecture}:${id}`]?.events ?? [];
}

function countIndependent(state, lecture, id) {
  return events(state, lecture, id).filter((event) => event.kind === 'independent').length;
}

async function expectEvent(page, lecture, id, kind) {
  await page.waitForFunction(
    ({ lecture, id, kind }) => {
      const key = `lecture-to-course:review:${document.body.dataset.course}`;
      const state = JSON.parse(localStorage.getItem(key) || '{"activities":{}}');
      return state.activities[`${lecture}:${id}`]?.events.some((event) => event.kind === kind);
    },
    { lecture, id, kind },
  );
  const record = (await stored(page)).activities[`${lecture}:${id}`];
  assert(record, `Missing review history for ${lecture}:${id}`);
  assert(
    record.events.some((event) => event.kind === kind),
    `Missing ${kind} evidence for ${id}`,
  );
  assert.equal(typeof record.seenAt, 'number');
  return record;
}

async function correctQuiz(page, id) {
  const quiz = page.locator(`[id="${id}"]`);
  const answer = Number(await quiz.getAttribute('data-answer'));
  await quiz.locator('.options button').nth(answer).focus();
  await page.keyboard.press('Enter');
  assert.equal(await quiz.getAttribute('data-result'), 'correct');
}

async function answerPractice(page, id, value) {
  const practice = page.locator(`form[id="${id}"]`);
  await practice.locator('.practice-response').fill(value);
  await practice.locator('.practice-check').click();
  return practice;
}

async function dueAt(page, id = conceptId) {
  await openReview(page);
  const due = Number(await row(page, id).locator('.review-due').getAttribute('data-due-at'));
  assert(Number.isFinite(due));
  return due;
}

async function seed(page, value) {
  await page.evaluate((data) => {
    localStorage.setItem(
      `lecture-to-course:review:${document.body.dataset.course}`,
      typeof data === 'string' ? data : JSON.stringify(data),
    );
  }, value);
}

async function withPage(browser, run, storageFailure) {
  const context = await browser.newContext({
    offline: true,
    viewport: { width: 1280, height: 940 },
  });
  await context.addInitScript(
    ({ now, failure }) => {
      Date.now = () => Number(new URL(location.href).searchParams.get('reviewNow') || now);
      if (failure === 'getter') {
        Object.defineProperty(window, 'localStorage', {
          get() {
            throw new Error('Storage unavailable');
          },
        });
      } else if (failure === 'write') {
        Storage.prototype.setItem = () => {
          throw new Error('Storage quota exceeded');
        };
      }
    },
    { now: NOW, failure: storageFailure },
  );
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await run(page);
    assert.deepEqual(errors, [], 'Review must not introduce uncaught page errors');
  } finally {
    await context.close();
  }
}

async function checkPersistence(browser) {
  await withPage(browser, async (page) => {
    await page.goto(address(siteDir));
    assert.equal(await page.locator('#concept-review').getAttribute('open'), null);
    assert.equal(await page.locator('#concept-review > summary').innerText(), 'Review by concept');
    const manifest = await page.evaluate(() => window.courseReview.concepts);
    assert(manifest.length >= 2);
    const concept = manifest.find((item) => item.id === conceptId);
    assert(concept.activities.some((activity) => activity.lecture === 'independence'));
    assert(concept.activities.some((activity) => activity.kind === 'numeric'));
    assert(concept.activities.some((activity) => activity.kind === 'reflection'));
    await openReview(page);
    assert.match(
      await row(page).locator('.review-state').innerText(),
      /no activity evidence|not.*(?:attempted|started)|unattempted/i,
    );
    assert.match(await page.locator('.review-storage').innerText(), /local|browser/i);
    const initial = await stored(page);
    await page.locator('#concept-review > summary').click();
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await openReview(page);
    assert.deepEqual(
      await stored(page),
      initial,
      'Reading and opening review cannot count as learning',
    );

    await page.goto(address(siteDir, 'conditional-probability.html'));
    await correctQuiz(page, 'survey-quiz');
    await expectEvent(page, 'conditional-probability', 'survey-quiz', 'independent');
    await openReview(page);
    assert.match(await row(page).locator('.review-evidence').innerText(), /independent/i);
    const firstDue = await dueAt(page);
    const next = await row(page).locator('a.review-next').getAttribute('href');
    assert(
      !next.includes('#survey-quiz'),
      'Recommend a fresh variant after an independent success',
    );
    const snapshot = await stored(page);
    await page.goto(address(siteDir));
    await openReview(page);
    assert.deepEqual(await stored(page), snapshot, 'Overview retains lesson evidence');
    assert.equal(await dueAt(page), firstDue);
    await page.goto(address(siteDir, 'independence.html'));
    await openReview(page);
    assert.deepEqual(await stored(page), snapshot, 'Evidence follows offline file navigation');

    await page.goto(address(siteDir, 'conditional-probability.html'));
    await correctQuiz(page, 'survey-quiz');
    assert.equal(countIndependent(await stored(page), 'conditional-probability', 'survey-quiz'), 1);
    await expectEvent(page, 'conditional-probability', 'survey-quiz', 'supported');
    const quiz = page.locator('#survey-quiz');
    const beforeRetry = await stored(page);
    await quiz.locator('.retry').click();
    assert.deepEqual(await stored(page), beforeRetry, 'Retry alone does not record evidence');
    await correctQuiz(page, 'survey-quiz');
    assert.equal(countIndependent(await stored(page), 'conditional-probability', 'survey-quiz'), 1);
    await correctQuiz(page, 'transfer-quiz');
    assert.equal(
      countIndependent(await stored(page), 'conditional-probability', 'transfer-quiz'),
      1,
    );
    await openReview(page);
    await page.screenshot({ path: path.join(screenshotDir, 'concept-history.png') });

    // The two demonstrations share a concept ID, but have different course IDs.
    await page.goto(address(bilingualDir, 'conditional.html'));
    assert.deepEqual(
      (await stored(page)).activities,
      {},
      'A second course starts without inherited evidence',
    );
    await correctQuiz(page, 'bilingual-quiz');
    await expectEvent(page, 'conditional', 'bilingual-quiz', 'independent');
    await page.goto(address(siteDir));
    assert.equal(countIndependent(await stored(page), 'conditional-probability', 'survey-quiz'), 1);
    assert.equal(events(await stored(page), 'conditional', 'bilingual-quiz').length, 0);
  });
}

async function checkEvidence(browser) {
  await withPage(browser, async (page) => {
    await page.goto(address(siteDir, 'conditional-probability.html'));
    const initial = await stored(page);
    const numeric = page.locator('#survey-completion');
    for (const value of ['', '1/0', 'cats']) {
      await answerPractice(page, 'survey-completion', value);
      assert.equal(await numeric.getAttribute('data-result'), 'invalid');
      assert.deepEqual(await stored(page), initial, 'Invalid input does not count as an attempt');
    }
    await numeric.locator('.practice-hint summary').focus();
    await page.keyboard.press('Space');
    await expectEvent(page, 'conditional-probability', 'survey-completion', 'hint');
    const afterHint = await stored(page);
    await numeric.locator('.practice-hint summary').click();
    await numeric.locator('.practice-reset').click();
    assert.deepEqual(
      await stored(page),
      afterHint,
      'Closing a hint and resetting cannot erase or add evidence',
    );
    const answer = await numeric.getAttribute('data-answer');
    await answerPractice(page, 'survey-completion', answer);
    await expectEvent(page, 'conditional-probability', 'survey-completion', 'supported');
    assert.equal(
      countIndependent(await stored(page), 'conditional-probability', 'survey-completion'),
      0,
    );
    await page.reload();
    await answerPractice(page, 'survey-completion', answer);
    assert.equal(
      countIndependent(await stored(page), 'conditional-probability', 'survey-completion'),
      0,
    );

    const independent = page.locator('#library-independent');
    await answerPractice(
      page,
      'library-independent',
      await independent.getAttribute('data-answer'),
    );
    assert.equal(
      countIndependent(await stored(page), 'conditional-probability', 'library-independent'),
      1,
    );
    await independent.locator('.practice-reset').click();
    await answerPractice(
      page,
      'library-independent',
      await independent.getAttribute('data-answer'),
    );
    assert.equal(
      countIndependent(await stored(page), 'conditional-probability', 'library-independent'),
      1,
    );
    await expectEvent(page, 'conditional-probability', 'library-independent', 'supported');

    const quiz = page.locator('#survey-quiz');
    await quiz.locator('.options button').first().click();
    await expectEvent(page, 'conditional-probability', 'survey-quiz', 'needs-review');
    await expectEvent(page, 'conditional-probability', 'survey-quiz', 'hint');
    await quiz.locator('.retry').click();
    await correctQuiz(page, 'survey-quiz');
    await expectEvent(page, 'conditional-probability', 'survey-quiz', 'supported');
    assert.equal(countIndependent(await stored(page), 'conditional-probability', 'survey-quiz'), 0);

    const transfer = page.locator('#transfer-quiz');
    await transfer.locator('.show-explanation').focus();
    await page.keyboard.press('Enter');
    await expectEvent(page, 'conditional-probability', 'transfer-quiz', 'revealed');
    await transfer.locator('.retry').click();
    await correctQuiz(page, 'transfer-quiz');
    assert.equal(
      countIndependent(await stored(page), 'conditional-probability', 'transfer-quiz'),
      0,
    );
    await expectEvent(page, 'conditional-probability', 'transfer-quiz', 'supported');

    await answerPractice(page, 'library-reflection', 'The condition selects the reference group.');
    await expectEvent(page, 'conditional-probability', 'library-reflection', 'self-assessed');
    assert.equal(
      countIndependent(await stored(page), 'conditional-probability', 'library-reflection'),
      0,
    );
    await openReview(page);
    assert.doesNotMatch(await row(page).locator('.review-state').innerText(), /mastered|掌握/);
  });

  await withPage(browser, async (page) => {
    await page.goto(address(siteDir, 'conditional-probability.html'));
    const form = page.locator('#survey-completion');
    await form.locator('.practice-reveal').click();
    await expectEvent(page, 'conditional-probability', 'survey-completion', 'revealed');
    await form.locator('.practice-reset').click();
    await answerPractice(page, 'survey-completion', await form.getAttribute('data-answer'));
    assert.equal(
      countIndependent(await stored(page), 'conditional-probability', 'survey-completion'),
      0,
    );
  });
}

async function checkInitiallyOpenHint(browser) {
  const source = await fs.readFile(path.join(siteDir, 'conditional-probability.html'), 'utf8');
  const fixtureName = `.review-open-hint-${randomUUID()}.html`;
  const fixture = path.join(siteDir, fixtureName);
  const variant = source.replace(
    '<details class="practice-hint">',
    '<details class="practice-hint" open>',
  );
  assert.notEqual(variant, source, 'The regression fixture must start with a visible hint');
  try {
    await fs.writeFile(fixture, variant, 'utf8');
    await withPage(browser, async (page) => {
      await page.goto(address(siteDir, fixtureName));
      assert.equal(
        await page.locator('body').getAttribute('data-lecture'),
        'conditional-probability',
      );
      const form = page.locator('#survey-completion');
      assert.equal(await form.locator('.practice-hint').getAttribute('open'), '');
      await form.locator('.practice-hint summary').click();
      assert.equal(await form.locator('.practice-hint').getAttribute('open'), null);
      await answerPractice(page, 'survey-completion', await form.getAttribute('data-answer'));
      await expectEvent(page, 'conditional-probability', 'survey-completion', 'supported');
      assert.equal(
        countIndependent(await stored(page), 'conditional-probability', 'survey-completion'),
        0,
        'Closing an authored visible hint cannot turn the answer into independent evidence',
      );
    });
  } finally {
    await fs.rm(fixture, { force: true });
  }
}

async function checkSpacing(browser) {
  await withPage(browser, async (page) => {
    await page.goto(address(siteDir, 'conditional-probability.html'));
    await correctQuiz(page, 'survey-quiz');
    assert.equal(await dueAt(page), NOW + DAY);
    await correctQuiz(page, 'transfer-quiz');
    assert.equal(await dueAt(page), NOW + DAY, 'Same-day successes cannot lengthen the interval');
    const second = NOW + DAY;
    await page.goto(address(siteDir, 'independence.html', second));
    await answerPractice(page, 'clinic-review', '0.3');
    await expectEvent(page, 'independence', 'clinic-review', 'independent');
    assert.equal(await dueAt(page), second + 3 * DAY);
    const third = second + 3 * DAY;
    await page.goto(address(siteDir, 'conditional-probability.html', third));
    await correctQuiz(page, 'survey-quiz');
    assert.equal(await dueAt(page), third + 7 * DAY);
    assert.equal(countIndependent(await stored(page), 'conditional-probability', 'survey-quiz'), 2);
    const wrong = page.locator('#transfer-quiz');
    await wrong.locator('.options button').first().click();
    await openReview(page);
    assert.match(await row(page).locator('.review-state').innerText(), /review|support|hint/i);
    assert.match(await row(page).locator('.review-due').innerText(), /now|today|due/i);
    await page.goto(address(siteDir, 'independence.html', third + DAY));
    await answerPractice(page, 'clinic-review', '0.3');
    assert.equal(
      await dueAt(page),
      third + 2 * DAY,
      'New independent evidence restarts spacing after difficulty',
    );
  });

  await withPage(browser, async (page) => {
    await page.goto(address(siteDir));
    const manifest = await page.evaluate(() => window.courseReview.concepts);
    const concept = manifest.find((item) => item.id === conceptId);
    const graded = concept.activities.filter((activity) => activity.kind !== 'reflection');
    assert(graded.length >= 3);
    const other = manifest.find((item) => item.id !== conceptId);
    const otherActivity = other.activities.find((activity) => activity.kind !== 'reflection');
    await seed(page, {
      version: 1,
      activities: {
        [`${graded[0].lecture}:${graded[0].id}`]: {
          events: [{ kind: 'independent', at: NOW }],
          seenAt: NOW,
        },
      },
    });
    await page.reload();
    await openReview(page);
    assert.equal(
      await page.locator('.review-list > li').first().getAttribute('data-review-concept'),
      other.id,
      'An unattempted concept comes before an upcoming review',
    );
    await seed(page, {
      version: 1,
      activities: {
        [`${otherActivity.lecture}:${otherActivity.id}`]: {
          events: [{ kind: 'needs-review', at: NOW }],
          seenAt: NOW,
        },
      },
    });
    await page.reload();
    await openReview(page);
    assert.equal(
      await page.locator('.review-list > li').first().getAttribute('data-review-concept'),
      other.id,
      'A concept needing review comes before an unattempted concept',
    );
    await seed(page, {
      version: 1,
      activities: {
        [`${graded[0].lecture}:${graded[0].id}`]: {
          events: [{ kind: 'independent', at: NOW - 7 * DAY }],
          seenAt: NOW - 7 * DAY,
        },
        [`${otherActivity.lecture}:${otherActivity.id}`]: {
          events: [{ kind: 'needs-review', at: NOW }],
          seenAt: NOW,
        },
      },
    });
    await page.reload();
    await openReview(page);
    assert.equal(
      await page.locator('.review-list > li').first().getAttribute('data-review-concept'),
      other.id,
      'Recent difficulty outranks an older overdue independent success',
    );
    const activities = Object.fromEntries(
      graded.map((activity, index) => [
        `${activity.lecture}:${activity.id}`,
        {
          events: [{ kind: 'independent', at: NOW - (graded.length - index) * DAY }],
          seenAt: NOW - (graded.length - index) * DAY,
        },
      ]),
    );
    await seed(page, { version: 1, activities });
    await page.reload();
    await openReview(page);
    const recommendation = await row(page).locator('a.review-next').getAttribute('href');
    assert.equal(
      new URL(recommendation, page.url()).hash,
      `#${graded[0].id}`,
      'When all variants were seen, recommend the oldest graded activity',
    );
    assert(
      !recommendation.includes('reflection'),
      'Reflection is never a graded retrieval recommendation',
    );
  });
}

async function checkLanguage(browser) {
  await withPage(browser, async (page) => {
    await page.goto(address(bilingualDir, 'conditional.html'));
    await correctQuiz(page, 'bilingual-quiz');
    await openReview(page);
    const snapshot = await stored(page);
    const exploration = page.locator('.exploration').first();
    await exploration.locator('.exploration-prediction').fill('The conditional share will change.');
    await exploration.locator('.exploration-control').focus();
    await page.keyboard.press('ArrowRight');
    const overlap = await exploration.locator('.exploration-control').inputValue();
    await exploration.locator('.exploration-reflection').fill('The group totals remain fixed.');
    assert.deepEqual(await stored(page), snapshot, 'Exploring a diagram is not graded evidence');
    const english = await page.locator('#concept-review').innerText();
    const state = await row(page).locator('.review-state').innerText();
    await page.locator('.language-toggle').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
    assert.notEqual(await page.locator('#concept-review').innerText(), english);
    assert.notEqual(await row(page).locator('.review-state').innerText(), state);
    assert.match(await row(page).locator('.review-state').innerText(), /[\u3400-\u9fff]/);
    assert.deepEqual(
      await stored(page),
      snapshot,
      'Language changes cannot record or lose evidence',
    );
    assert.equal(await exploration.locator('.exploration-control').inputValue(), overlap);
    assert.equal(
      await exploration.locator('.exploration-prediction').inputValue(),
      'The conditional share will change.',
    );
    assert.equal(
      await exploration.locator('.exploration-reflection').inputValue(),
      'The group totals remain fixed.',
    );
    assert.equal(await page.locator('#concept-review').getAttribute('open'), '');
    const next = row(page).locator('a.review-next');
    const destination = new URL(await next.getAttribute('href'), page.url());
    assert(destination.hash, 'A keyboard recommendation links directly to an activity');
    const samePage = destination.pathname === new URL(page.url()).pathname;
    await next.focus();
    if (samePage) {
      await page.keyboard.press('Enter');
      assert.equal(
        await page
          .locator(destination.hash)
          .evaluate((element) => element === document.activeElement),
        true,
      );
    } else {
      await Promise.all([page.waitForURL(destination.href), page.keyboard.press('Enter')]);
    }
    assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
    await openReview(page);
    for (const width of [1024, 1440]) {
      await page.setViewportSize({ width, height: 940 });
      await page.locator('#concept-review').scrollIntoViewIfNeeded();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: path.join(screenshotDir, `concept-review-zh-${width}.png`) });
    }
    assert.deepEqual(await stored(page), snapshot);
    for (const kind of ['hint', 'supported', 'needs-review', 'revealed', 'self-assessed']) {
      await page.goto(address(bilingualDir, 'conditional.html'));
      await seed(page, {
        version: 1,
        activities: {
          'conditional:bilingual-quiz': { events: [{ kind, at: NOW }], seenAt: NOW },
        },
      });
      await page.reload();
      await openReview(page);
      const englishState = await row(page).locator('.review-state').innerText();
      const translated = await page.evaluate(
        (label) => window.courseTranslations[label],
        englishState,
      );
      assert(translated, `Missing bilingual review label for ${kind}`);
      const beforeLanguageChange = await stored(page);
      await page.locator('.language-toggle').click();
      assert.equal(await row(page).locator('.review-state').innerText(), translated);
      assert.deepEqual(await stored(page), beforeLanguageChange);
    }
    await page.goto(address(bilingualDir, 'conditional.html'));
    const variants = await page.evaluate(
      (id) => window.courseReview.concepts.find((concept) => concept.id === id).activities,
      conceptId,
    );
    const seen = Object.fromEntries(
      variants
        .filter((activity) => activity.lecture === 'conditional')
        .map((activity) => [
          `${activity.lecture}:${activity.id}`,
          {
            events: [
              { kind: activity.kind === 'reflection' ? 'self-assessed' : 'independent', at: NOW },
            ],
            seenAt: NOW,
          },
        ]),
    );
    await seed(page, { version: 1, activities: seen });
    await page.reload();
    await page.locator('.language-toggle').click();
    await openReview(page);
    const later = row(page).locator('a.review-next');
    const laterURL = new URL(await later.getAttribute('href'), page.url());
    assert.equal(path.basename(laterURL.pathname), 'review.html');
    assert.equal(laterURL.searchParams.get('lang'), 'zh');
    assert.equal(laterURL.hash, '#bilingual-clinic-review');
    await later.focus();
    await Promise.all([page.waitForURL(laterURL.href), page.keyboard.press('Enter')]);
    assert.equal(await page.locator('body').getAttribute('data-lecture'), 'review');
    assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
    assert.deepEqual(
      (await stored(page)).activities,
      seen,
      'Following a later retrieval link must preserve evidence',
    );
  });
}

async function checkRecovery(browser) {
  for (const malformed of [
    '{not-json',
    { version: 1, activities: [] },
    { version: 42, activities: {} },
    {
      version: 1,
      activities: {
        'conditional-probability:survey-quiz': {
          events: [{ kind: 'independent', at: 'yesterday' }],
          seenAt: 'yesterday',
        },
      },
    },
  ]) {
    await withPage(browser, async (page) => {
      await page.goto(address(siteDir, 'conditional-probability.html'));
      await seed(page, malformed);
      await page.reload();
      await correctQuiz(page, 'survey-quiz');
      assert.equal(
        countIndependent(await stored(page), 'conditional-probability', 'survey-quiz'),
        1,
      );
      await openReview(page);
      assert.match(await row(page).locator('.review-evidence').innerText(), /independent/i);
    });
  }
  for (const failure of ['getter', 'write']) {
    await withPage(
      browser,
      async (page) => {
        await page.goto(address(siteDir, 'conditional-probability.html'));
        await correctQuiz(page, 'survey-quiz');
        await openReview(page);
        assert.match(
          await page.locator('.review-storage').innerText(),
          /current page|this page|not saved/i,
        );
        assert.match(await row(page).locator('.review-evidence').innerText(), /independent/i);
        await page.locator('#survey-quiz .retry').click();
        await correctQuiz(page, 'survey-quiz');
        assert.match(await row(page).locator('.review-evidence').innerText(), /support/i);
        await page.locator('.glossary-tab').click();
        assert.equal(await page.locator('.drawer').isVisible(), true);
        await page.keyboard.press('Escape');
        const form = await answerPractice(page, 'library-independent', '1/3');
        assert.equal(await form.getAttribute('data-result'), 'correct');
      },
      failure,
    );
  }
}

(async () => {
  await fs.mkdir(screenshotDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
  });
  try {
    await checkPersistence(browser);
    await checkEvidence(browser);
    await checkInitiallyOpenHint(browser);
    await checkSpacing(browser);
    await checkLanguage(browser);
    await checkRecovery(browser);
    console.log(
      'PASS: concept review, honest quiz/numeric/reflection evidence, same-day anti-inflation, offline persistence/course isolation, spaced review, fresh/oldest recommendations, keyboard/bilingual state, corrupt/blocked storage.',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
