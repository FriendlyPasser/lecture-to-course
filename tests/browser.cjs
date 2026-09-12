const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const localDir = path.resolve(__dirname, '../.local');
process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(localDir, 'cache/playwright');
const { chromium } = require(path.join(localDir, 'node_modules/playwright'));

const demoDir = path.join(localDir, 'demo');
const reviewDir = path.join(demoDir, 'review');

async function main() {
  await fs.mkdir(reviewDir, { recursive: true });
  const launchOptions = { headless: true };
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }

  const browser = await chromium.launch(launchOptions);
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      offline: true,
    });
    const errors = [];
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(pathToFileURL(path.join(demoDir, 'site/index.html')).href);
    await page.screenshot({ path: path.join(reviewDir, 'overview.png') });
    await page.locator('.lecture-card').first().click();

    // Glossary terms support focus, keyboard dismissal, and Chinese search.
    await page.locator('[data-term="conditional"]').click();
    assert.equal(await page.locator('.drawer').isVisible(), true);
    assert.equal(
      await page
        .locator('#term-conditional')
        .evaluate((element) => element === document.activeElement),
      true,
    );
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.drawer').isVisible(), false);
    await page.locator('.glossary-tab').click();
    await page.locator('#term-search').fill('条件');
    assert.equal(await page.locator('.glossary-item:visible').count(), 1);
    await page.screenshot({ path: path.join(reviewDir, 'glossary.png') });
    await page.locator('#term-search').fill('no such term');
    assert.equal(await page.locator('.empty').isVisible(), true);
    await page.keyboard.press('Escape');

    // Worked examples and quizzes remain usable without a network connection.
    await page.locator('details summary').click();
    assert.equal(await page.locator('details').getAttribute('open'), '');
    await page.locator('.quiz .options button').first().click();
    assert.match(await page.locator('.quiz-status').innerText(), /Not quite/);
    assert.equal(await page.locator('.explanation').isVisible(), true);
    await page.locator('.retry').click();
    await page.locator('.quiz .options button').nth(1).click();
    assert.match(await page.locator('.quiz-status').innerText(), /Correct/);
    await page.screenshot({ path: path.join(reviewDir, 'quiz.png') });
    assert.match(await page.locator('[data-source]').first().getAttribute('href'), /#page=1$/);

    for (const width of [1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => scrollTo(0, 0));
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
      await page.screenshot({ path: path.join(reviewDir, `lecture-${width}.png`) });
    }

    // Browsers that deny localStorage should still allow glossary interaction.
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('Storage blocked');
        },
      });
    });
    await page.reload();
    await page.locator('.glossary-tab').click();
    assert.equal(await page.locator('.drawer').isVisible(), true);
    assert.deepEqual(errors, []);
    console.log(
      'PASS: offline file navigation, glossary, keyboard, search, quizzes, retry, ' +
        'details, source links, desktop widths, blocked storage, no page errors.',
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
