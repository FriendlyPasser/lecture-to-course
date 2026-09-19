const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { fileURLToPath, pathToFileURL } = require('node:url');

async function quizState(quiz) {
  return quiz.evaluate((element) => ({
    result: element.dataset.result ?? null,
    revealed: element.dataset.revealed ?? null,
    explanationHidden: element.querySelector('.explanation').hidden,
    retryHidden: element.querySelector('.retry').hidden,
    hints: [...element.querySelectorAll('.quiz-hint')].map((hint) => hint.hidden),
    options: [...element.querySelectorAll('.options button')].map((button) => ({
      disabled: button.disabled,
      correct: button.classList.contains('correct'),
      incorrect: button.classList.contains('incorrect'),
    })),
  }));
}

async function assertFocused(locator) {
  assert.equal(await locator.evaluate((element) => element === document.activeElement), true);
}

async function answer(page, quiz, correct) {
  const index = Number(await quiz.getAttribute('data-answer'));
  const button = quiz.locator('.options button').nth(correct ? index : (index + 1) % 2);
  await button.focus();
  await page.keyboard.press('Enter');
  assert.equal(await quiz.getAttribute('data-result'), correct ? 'correct' : 'incorrect');
  const enhanced = (await quiz.locator('.quiz-hint').count()) > 0;
  assert.equal(await quiz.locator('.explanation').isVisible(), correct || !enhanced);
  assert.equal(await quiz.locator('.prerequisite-review').isVisible(), !correct);
  if (enhanced) {
    await assertFocused(quiz.locator('.quiz-status'));
    if (!correct) {
      assert.equal(await quiz.locator('.options .correct').count(), 0);
      assert.equal(await quiz.locator('.quiz-hint:visible').count(), 1);
      await page.keyboard.press('Tab');
      await assertFocused(quiz.locator('.prerequisite-review'));
      await page.keyboard.press('Tab');
      await assertFocused(quiz.locator('.show-explanation'));
      await page.keyboard.press('Tab');
      await assertFocused(quiz.locator('.retry'));
    }
  }
}

async function openRefresher(page, quiz) {
  const target = await quiz.getAttribute('data-prerequisite');
  const refresher = page.locator(`details[id="${target}"]`);
  const before = await quizState(quiz);
  const review = quiz.locator('a.prerequisite-review');
  assert.equal(await review.getAttribute('href'), '#' + target);
  assert.equal(await quiz.locator('.explanation .prerequisite-review').count(), 0);
  await review.focus();
  await page.keyboard.press('Enter');
  assert.equal(await refresher.getAttribute('open'), '');
  await assertFocused(refresher.locator('summary'));
  assert.deepEqual(await quizState(quiz), before);
  assert.equal(await refresher.locator('.prerequisite-return').isVisible(), true);
  return refresher;
}

async function returnToQuiz(page, refresher, quiz) {
  const before = await quizState(quiz);
  await refresher.locator('.prerequisite-return').focus();
  await page.keyboard.press('Enter');
  await assertFocused(quiz);
  assert.deepEqual(await quizState(quiz), before);
  const box = await quiz.locator('h3').boundingBox();
  assert(box.y >= 0 && box.y + box.height <= page.viewportSize().height);
  await page.keyboard.press('Tab');
  await assertFocused(quiz.locator('.prerequisite-review'));
  await page.keyboard.press('Tab');
  if (await quiz.locator('.show-explanation:visible').count()) {
    await assertFocused(quiz.locator('.show-explanation'));
    await page.keyboard.press('Tab');
  }
  await assertFocused(quiz.locator('.retry'));
}

async function checkPrerequisites(page, { bilingual = false, screenshot } = {}) {
  const checks = page.locator('.precheck .quiz[data-prerequisite]');
  assert.equal(await checks.count(), 2);
  const first = checks.nth(0);
  const second = checks.nth(1);
  const initial = await Promise.all([quizState(first), quizState(second)]);
  assert(initial.every((state) => state.result === null));
  assert.equal(await page.locator('.prerequisite-return:visible').count(), 0);
  assert.equal(await page.locator('.prerequisite-review:visible').count(), 0);

  // Skipping never requires an answer and makes the main lesson keyboard accessible.
  const skip = page.locator('a.precheck-skip');
  const sectionId = (await skip.getAttribute('href')).slice(1);
  await skip.focus();
  await page.keyboard.press('Enter');
  await assertFocused(page.locator(`section[id="${sectionId}"]`));
  assert.deepEqual(await Promise.all([quizState(first), quizState(second)]), initial);

  await answer(page, first, true);
  assert.equal(await page.locator('details.prerequisite[open]').count(), 0);
  await answer(page, second, false);
  assert.equal(await page.locator('details.prerequisite[open]').count(), 0);
  const secondBefore = await quizState(second);
  const secondRefresher = await openRefresher(page, second);
  await returnToQuiz(page, secondRefresher, second);

  // A different error opens a different refresher; retrying one check leaves its peer intact.
  await first.locator('.retry').click();
  assert.equal(await first.locator('.prerequisite-review').isVisible(), false);
  await assertFocused(first.locator('.options button').first());
  assert.deepEqual(await quizState(second), secondBefore);
  await answer(page, first, false);
  const firstRefresher = await openRefresher(page, first);
  assert.notEqual(
    await firstRefresher.getAttribute('id'),
    await secondRefresher.getAttribute('id'),
  );
  assert.deepEqual(await quizState(second), secondBefore);

  if (bilingual) {
    const before = await Promise.all([quizState(first), quizState(second)]);
    const headingEnglish = await second.locator('h3').textContent();
    const explanationEnglish = await first.locator('.explanation p').first().textContent();
    const refresherEnglish = await firstRefresher.locator('.supplement p').first().textContent();
    const toggle = page.locator('.language-toggle');
    await toggle.click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
    assert.equal(await first.locator('.prerequisite-review').innerText(), '复习这项前置知识');
    // Formatted HTML wraps these text nodes, while the translation keys occupy a single line.
    assert.equal(
      await second.locator('h3').innerText(),
      '6 人阅读，4 人游泳，其中 2 人两项活动都参加。阅读者与游泳者的交集中有几人？',
    );
    assert.equal(
      (await first.locator('.explanation p').first().textContent()).trim(),
      '用部分除以整体：3/12 = 0.25 = 25%。3 乘以 12 得到 36，并不是所占比例；75% 则表示其余 9 枚非蓝色计数片的比例。',
    );
    assert.equal(
      await firstRefresher.locator('.supplement p').first().innerText(),
      '在这个自编计数片例子中，分子是 3 枚蓝色计数片，分母是所选群体中的全部 12 枚计数片。3 除以 12 得 0.25，再乘以 100，就可写成 25%。',
    );
    assert.equal(await firstRefresher.getAttribute('open'), '');
    const summaryBox = await firstRefresher.locator('summary').boundingBox();
    assert(summaryBox.y >= 0 && summaryBox.y + summaryBox.height <= page.viewportSize().height);
    assert.deepEqual(await Promise.all([quizState(first), quizState(second)]), before);
    if (screenshot) await page.screenshot({ path: screenshot });
    await returnToQuiz(page, firstRefresher, first);
    await toggle.click();
    assert.equal(
      await first.locator('.prerequisite-review').innerText(),
      'Review this prerequisite',
    );
    assert.equal(await second.locator('h3').textContent(), headingEnglish);
    assert.equal(await first.locator('.explanation p').first().textContent(), explanationEnglish);
    assert.equal(
      await firstRefresher.locator('.supplement p').first().textContent(),
      refresherEnglish,
    );
    assert.deepEqual(await Promise.all([quizState(first), quizState(second)]), before);
  } else if (screenshot) {
    await page.screenshot({ path: screenshot });
  }

  await returnToQuiz(page, firstRefresher, first);
  await first.locator('.retry').click();
  assert.equal(await first.locator('.prerequisite-review').isVisible(), true);
  assert.equal(await first.locator('.quiz-hint:visible').count(), 1);
  assert.equal(await first.locator('.explanation').isVisible(), false);
  assert.equal(await firstRefresher.locator('.prerequisite-return').isVisible(), true);
  assert.deepEqual(await quizState(second), secondBefore);
  await answer(page, first, true);
  await second.locator('.retry').click();
  const retryState = await quizState(second);
  assert.deepEqual({ ...retryState, hints: initial[1].hints }, initial[1]);
  assert.equal(await second.locator('.quiz-hint:visible').count(), 1);
  assert.equal(await second.locator('.prerequisite-review').isVisible(), true);
  assert.equal(await first.getAttribute('data-result'), 'correct');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
}

async function checkSharedPrerequisite(page) {
  const originalURL = page.url();
  const sourcePath = fileURLToPath(originalURL);
  const checks = page.locator('.precheck .quiz[data-prerequisite]');
  const targets = await checks.evaluateAll((quizzes) =>
    quizzes.map((quiz) => quiz.dataset.prerequisite),
  );
  const source = await fs.readFile(sourcePath, 'utf8');
  const marker = `data-prerequisite="${targets[1]}"`;
  assert(source.includes(marker));
  const shared = source.replace(marker, `data-prerequisite="${targets[0]}"`);
  // Load a temporary authored variant beside the generated lesson so real offline assets resolve.
  const fixture = path.join(path.dirname(sourcePath), `.prerequisite-routing-${randomUUID()}.html`);
  try {
    await fs.writeFile(fixture, shared, 'utf8');
    await page.goto(pathToFileURL(fixture).href + '?lang=en');
    const first = page.locator('.precheck .quiz').nth(0);
    const second = page.locator('.precheck .quiz').nth(1);
    await answer(page, first, false);
    const refresher = await openRefresher(page, first);
    await returnToQuiz(page, refresher, first);
    await answer(page, second, false);
    await openRefresher(page, second);
    // Clearing the older answer must not erase the latest question's return destination.
    await first.locator('.retry').click();
    await returnToQuiz(page, refresher, second);
    await second.locator('.retry').click();
    assert.equal(await refresher.locator('.prerequisite-return').isVisible(), true);
    await answer(page, second, true);
    assert.equal(await refresher.locator('.prerequisite-return').isVisible(), false);
  } finally {
    await page.goto(originalURL);
    await fs.unlink(fixture);
  }
}

module.exports = { checkPrerequisites, checkSharedPrerequisite };
