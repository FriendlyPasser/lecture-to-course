const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.resolve('.local/cache/playwright');
const { chromium } = require('../.local/node_modules/playwright');
(async () => {
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
    const base = pathToFileURL(path.resolve('.local/demo/bilingual/conditional.html')).href;
    for (const width of [1024, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(base + '?lang=en');
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
      assert.match(await quiz.locator('.quiz-status').innerText(), /回答正确/);
      assert.equal(await page.locator('#reference-answer').getAttribute('open'), '');
      assert.equal(await quiz.locator('.options button').first().isDisabled(), true);
      assert.equal(await page.locator('.glossary-tab').innerText(), '术语');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
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
      await page.locator('a.next').click();
      await page.reload();
      assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
    }
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('Blocked');
        },
      });
    });
    await page.goto(base + '?lang=en');
    await page.locator('.language-toggle').click();
    await page.locator('a.next').click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
    assert.deepEqual(errors, []);
    console.log(
      'PASS bilingual offline switching, fixed button, quiz/detail state, glossary, both widths, navigation, reload and blocked storage',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
