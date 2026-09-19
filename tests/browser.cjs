const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { checkPrerequisites, checkSharedPrerequisite } = require('./prerequisites.cjs');
const { checkPractice, checkPracticeTolerance } = require('./practice.cjs');

const localDir = path.resolve(__dirname, '../.local');
process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(localDir, 'cache/playwright');
const { chromium } = require(path.join(localDir, 'node_modules/playwright'));

const demoDir = path.join(localDir, 'demo');
const siteDir = path.resolve(process.argv[2] ?? path.join(demoDir, 'site'));
const reviewDir = path.resolve(process.argv[3] ?? path.join(demoDir, 'review'));

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
    await page.goto(pathToFileURL(path.join(siteDir, 'index.html')).href);
    await page.screenshot({ path: path.join(reviewDir, 'overview.png') });
    await page.locator('.lecture-card').first().click();
    await checkPrerequisites(page, { screenshot: path.join(reviewDir, 'prerequisites-1440.png') });

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
    const explanation = page.locator('#denominator-explanation');
    await explanation.locator('summary').click();
    assert.equal(await explanation.getAttribute('open'), '');
    const survey = page.locator('#survey-quiz');
    const transfer = page.locator('#transfer-quiz');
    await survey.locator('.options button').first().click();
    assert.match(await survey.locator('.quiz-status').innerText(), /Not quite/);
    assert.equal(await survey.locator('.explanation').isVisible(), true);
    await survey.locator('.retry').click();
    await survey.locator('.options button').nth(1).click();
    assert.match(await survey.locator('.quiz-status').innerText(), /Correct/);
    // The same numerical answer can come from the wrong reference group.
    await transfer.locator('.options button').nth(1).click();
    assert.match(await transfer.locator('.quiz-status').innerText(), /Not quite/);
    await transfer.locator('.retry').click();
    assert.match(await survey.locator('.quiz-status').innerText(), /Correct/);
    assert.equal(await survey.locator('.options button').first().isDisabled(), true);
    await transfer.locator('.options button').nth(2).click();
    assert.match(await transfer.locator('.quiz-status').innerText(), /Correct/);
    // Reading the central derivation must not require opening an answer panel.
    assert.equal(await page.locator('#calculation .equation').isVisible(), true);
    assert.equal(await page.locator('#calculation details .equation').count(), 0);
    await page.screenshot({ path: path.join(reviewDir, 'quiz.png') });
    assert.match(await page.locator('[data-source]').first().getAttribute('href'), /#page=1$/);

    for (const width of [1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.reload();
      if (width === 1024) {
        await checkPrerequisites(page, {
          screenshot: path.join(reviewDir, 'prerequisites-1024.png'),
        });
      }
      await checkPractice(page, { screenshot: path.join(reviewDir, `practice-${width}.png`) });
      await page.evaluate(() => scrollTo(0, 0));
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
      await page.screenshot({ path: path.join(reviewDir, `lecture-${width}.png`) });
      await page.locator('#reference-group figure').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(reviewDir, `groups-${width}.png`) });
      // SVG labels must stay inside the diagram at both supported reading widths.
      assert.equal(
        await page.locator('svg').evaluateAll((diagrams) =>
          diagrams.every((svg) => {
            const view = svg.viewBox.baseVal;
            return [...svg.querySelectorAll('text')].every((text) => {
              const box = text.getBBox();
              return (
                box.x >= view.x &&
                box.y >= view.y &&
                box.x + box.width <= view.x + view.width &&
                box.y + box.height <= view.y + view.height
              );
            });
          }),
        ),
        true,
      );
    }

    await checkSharedPrerequisite(page);
    await checkPracticeTolerance(page);

    // Browsers that deny localStorage should still allow optional checks and glossary interaction.
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('Storage blocked');
        },
      });
    });
    await page.reload();
    await checkPrerequisites(page);
    await checkPractice(page);
    await page.locator('.glossary-tab').click();
    assert.equal(await page.locator('.drawer').isVisible(), true);
    await page.keyboard.press('Escape');
    await page.locator('a.next').click();
    const independence = page.locator('#independence-quiz-question');
    await independence.locator('.options button').first().click();
    assert.match(await independence.locator('.quiz-status').innerText(), /Correct/);
    await page.screenshot({ path: path.join(reviewDir, 'independence.png') });
    assert.deepEqual(errors, []);
    console.log(
      'PASS: offline file navigation, glossary, keyboard, search, quizzes, retry, ' +
        'optional prerequisite checks, targeted refreshers, return focus, shared targets, ' +
        'typed practice, numeric validation/tolerance, hints, self-assessment, reveal/reset, ' +
        'independent quiz state, visible derivation, SVG labels, details, source links, ' +
        'desktop widths, blocked storage, next lecture, no page errors.',
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
