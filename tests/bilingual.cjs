const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { checkPrerequisites } = require('./prerequisites.cjs');
const { checkPractice } = require('./practice.cjs');
const { checkBilingualQuizHints } = require('./quiz-hints.cjs');
const {
  checkExploration,
  checkExplorationIsolation,
  checkExplorationFallback,
} = require('./explorations.cjs');
const localDir = path.resolve(__dirname, '../.local');
process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(localDir, 'cache/playwright');
const { chromium } = require(path.join(localDir, 'node_modules/playwright'));
const siteDir = path.resolve(process.argv[2] ?? path.join(localDir, 'demo/bilingual'));
const reviewDir = path.resolve(process.argv[3] ?? path.join(localDir, 'demo/bilingual-review'));
(async () => {
  await fs.mkdir(reviewDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
  });
  try {
    const context = await browser.newContext({ offline: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const base = pathToFileURL(path.join(siteDir, 'conditional.html')).href;
    const reviewURL = pathToFileURL(path.join(siteDir, 'review.html')).href + '?lang=zh';
    async function openReview() {
      // A click can return while Chromium is still replacing the document/session.
      // Wait for the destination to load before reading its state or reloading it.
      await Promise.all([
        page.waitForURL(reviewURL, { waitUntil: 'load', timeout: 10000 }),
        page.locator('a.next').click(),
      ]);
      assert.equal(await page.locator('body').getAttribute('data-lecture'), 'review');
      assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
    }
    for (const width of [1024, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(base + '?lang=en');
      await checkPrerequisites(page, {
        bilingual: true,
        screenshot: path.join(reviewDir, `prerequisites-zh-${width}.png`),
      });
      await checkPractice(page, {
        bilingual: true,
        screenshot: path.join(reviewDir, `practice-zh-${width}.png`),
      });
      await checkBilingualQuizHints(page);
      await checkExploration(page, {
        bilingual: true,
        screenshot: path.join(reviewDir, `exploration-zh-${width}.png`),
      });
      const toggle = page.locator('.language-toggle');
      await page.locator('#reference-answer summary').click();
      const box = await toggle.boundingBox();
      const quiz = page.locator('#bilingual-quiz');
      await quiz.locator('.options button').nth(1).click();
      assert.match(await quiz.locator('.quiz-status').innerText(), /Correct/);
      assert.equal((await toggle.boundingBox()).y, box.y);
      await toggle.click();
      assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
      assert.equal(await page.locator('#conditional-practice h2').innerText(), '选择分母');
      assert.equal(
        await page.locator('#conditional-general-rule > p').first().innerText(),
        '用 C 表示下棋，用 T 表示打网球。俱乐部的人数保持不变：P(C) = 10/40，P(T ∩ C) = 4/40。',
      );
      assert.equal(
        await quiz.locator('.explanation p').nth(1).innerText(),
        '如果使用 40，得到的是整个俱乐部中两项活动都参加的成员比例，回答的是另一个问题。',
      );
      assert.match(await quiz.locator('.quiz-status').innerText(), /回答正确/);
      assert.equal(await page.locator('#reference-answer').getAttribute('open'), '');
      assert.equal(await quiz.locator('.options button').first().isDisabled(), true);
      assert.equal(await page.locator('.glossary-tab').innerText(), '术语');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: path.join(reviewDir, `lesson-zh-${width}.png`) });
      await toggle.click();
      assert.match(await quiz.locator('.quiz-status').innerText(), /Correct/);
      await toggle.click();
      await quiz.locator('.retry').click();
      await quiz.locator('.options button').first().click();
      assert.match(await quiz.locator('.quiz-status').innerText(), /还不完全正确/);
      await page.locator('.glossary-tab').click();
      await page.locator('#term-search').fill('条件');
      assert.equal(await page.locator('.glossary-item:visible').count(), 1);
      await page.keyboard.press('Escape');
      assert(await page.locator('.glossary-tab').evaluate((el) => el === document.activeElement));
      await openReview();
      await page.reload();
      assert.equal(page.url(), reviewURL);
      assert.equal(await page.locator('body').getAttribute('data-lecture'), 'review');
      assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
    }
    await page.goto(base + '?lang=en');
    await checkExplorationIsolation(page);
    await checkExplorationFallback(browser, base);
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('Blocked');
        },
      });
    });
    await page.goto(base + '?lang=en');
    await checkPrerequisites(page, { bilingual: true });
    await checkPractice(page, { bilingual: true });
    await checkExploration(page, { bilingual: true });
    await page.locator('.language-toggle').click();
    await openReview();
    assert.deepEqual(errors, []);
    console.log(
      'PASS bilingual offline switching, optional checks, refresher/return focus, fixed button, ' +
        'typed answers, practice feedback/hint/solution state, self-assessment, ' +
        'hint/retry/reveal/correct/unanswered state, quiz/detail state, glossary, both widths, ' +
        'translated exploration formulas/bars/status, keyboard, preserved notes and slider, reset, ' +
        'fixed margins/complements, isolated explorations, no-JS fallback, ' +
        'navigation, reload and blocked storage',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
