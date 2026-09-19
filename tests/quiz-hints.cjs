const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { fileURLToPath, pathToFileURL } = require('node:url');

async function state(quiz) {
  return quiz.evaluate((element) => ({
    result: element.dataset.result ?? null,
    revealed: element.dataset.revealed ?? null,
    explanationHidden: element.querySelector('.explanation').hidden,
    retryHidden: element.querySelector('.retry').hidden,
    revealHidden: element.querySelector('.show-explanation')?.hidden ?? null,
    hints: [...element.querySelectorAll('.quiz-hint')].map((hint) => hint.hidden),
    options: [...element.querySelectorAll('.options button')].map((button) => ({
      disabled: button.disabled,
      correct: button.classList.contains('correct'),
      incorrect: button.classList.contains('incorrect'),
    })),
  }));
}

async function focused(locator) {
  assert.equal(await locator.evaluate((element) => element === document.activeElement), true);
}

async function activate(page, locator, key = 'Enter') {
  await locator.focus();
  await page.keyboard.press(key);
}

async function visibleHint(quiz, index) {
  const hints = quiz.locator('.quiz-hint:visible');
  assert.equal(await hints.count(), index === null ? 0 : 1);
  if (index !== null) {
    assert.equal(await hints.getAttribute('data-option'), String(index));
    assert.equal(
      await quiz.locator('.quiz-status').getAttribute('aria-describedby'),
      await hints.getAttribute('id'),
    );
  } else {
    assert.equal(await quiz.locator('.quiz-status').getAttribute('aria-describedby'), null);
  }
}

async function hiddenSolution(quiz) {
  assert.equal(await quiz.locator('.explanation').isVisible(), false);
  assert.equal(await quiz.locator('.options .correct').count(), 0);
  assert.equal(await quiz.getAttribute('data-revealed'), null);
}

async function wrong(page, quiz, index, key = 'Enter') {
  await activate(page, quiz.locator('.options button').nth(index), key);
  assert.equal(await quiz.getAttribute('data-result'), 'incorrect');
  assert.match(await quiz.locator('.quiz-status').innerText(), /Not quite/);
  await hiddenSolution(quiz);
  assert.equal(await quiz.locator('.options button:enabled').count(), 0);
  assert.equal(await quiz.locator('.options .incorrect').count(), 1);
  assert.equal(await quiz.locator('.options button').nth(index).getAttribute('class'), 'incorrect');
  assert.equal(await quiz.locator('.retry').isVisible(), true);
  assert.equal(await quiz.locator('.show-explanation').isVisible(), true);
  assert.equal(await quiz.locator('.quiz-status').getAttribute('tabindex'), '-1');
  await focused(quiz.locator('.quiz-status'));
}

async function retry(page, quiz, hint, key = 'Enter') {
  await activate(page, quiz.locator('.retry'), key);
  await hiddenSolution(quiz);
  assert.equal(await quiz.getAttribute('data-result'), null);
  const status = await quiz.locator('.quiz-status').innerText();
  if (hint !== null) assert.equal(status, 'Try again using the hint.');
  else assert(['', 'Try again or view the full explanation.'].includes(status));
  assert.equal(await quiz.locator('.options button:disabled').count(), 0);
  assert.equal(await quiz.locator('.options .incorrect').count(), 0);
  assert.equal(await quiz.locator('.retry').isVisible(), false);
  assert.equal(await quiz.locator('.show-explanation').isVisible(), true);
  await visibleHint(quiz, hint);
  await focused(quiz.locator('.options button').first());
}

async function reveal(page, quiz, result, key = 'Enter') {
  await activate(page, quiz.locator('.show-explanation'), key);
  assert.equal(await quiz.getAttribute('data-result'), result);
  assert.equal(await quiz.getAttribute('data-revealed'), 'true');
  assert.equal(
    await quiz.locator('.quiz-status').innerText(),
    'Answer revealed — compare the reasoning below.',
  );
  assert.equal(await quiz.locator('.explanation').isVisible(), true);
  assert.equal(await quiz.locator('.options button:enabled').count(), 0);
  assert.equal(await quiz.locator('.options .correct').count(), 1);
  assert.equal(
    await quiz
      .locator('.options button')
      .nth(Number(await quiz.getAttribute('data-answer')))
      .evaluate((button) => button.classList.contains('correct')),
    true,
  );
  assert.equal(await quiz.locator('.retry').isVisible(), true);
  await visibleHint(quiz, null);
  await focused(quiz.locator('.quiz-status'));
}

async function correct(page, quiz) {
  await activate(
    page,
    quiz.locator('.options button').nth(Number(await quiz.getAttribute('data-answer'))),
  );
  assert.equal(await quiz.getAttribute('data-result'), 'correct');
  assert.match(await quiz.locator('.quiz-status').innerText(), /Correct/);
  assert.equal(await quiz.locator('.explanation').isVisible(), true);
  assert.equal(await quiz.locator('.options button:enabled').count(), 0);
  assert.equal(await quiz.locator('.options .correct').count(), 1);
  assert.equal(await quiz.locator('.options .incorrect').count(), 0);
  await visibleHint(quiz, null);
  await focused(quiz.locator('.quiz-status'));
}

async function checkQuizHints(page) {
  const originalURL = page.url();
  await page.reload();
  const quiz = page.locator('#survey-quiz');
  const peer = page.locator('#transfer-quiz');
  const peerInitial = await state(peer);
  await hiddenSolution(quiz);
  await visibleHint(quiz, null);
  assert.equal(await quiz.locator('.show-explanation').isVisible(), true);

  await wrong(page, quiz, 0);
  await visibleHint(quiz, 0);
  await page.keyboard.press('Tab');
  await focused(quiz.locator('.show-explanation'));
  await page.keyboard.press('Tab');
  await focused(quiz.locator('.retry'));
  await retry(page, quiz, 0, 'Space');
  await wrong(page, quiz, 2, 'Space');
  await visibleHint(quiz, 2);
  await reveal(page, quiz, 'incorrect', 'Space');
  await retry(page, quiz, 2);
  await correct(page, quiz);
  await retry(page, quiz, null);
  assert.deepEqual(await state(peer), peerInitial);

  // Revealing an unattempted answer must never mark the question as answered correctly.
  const quizInitial = await state(quiz);
  await reveal(page, peer, null);
  await retry(page, peer, null, 'Space');
  assert.deepEqual(await state(peer), peerInitial);
  await wrong(page, peer, 1, 'Space');
  const peerWrong = await state(peer);
  await wrong(page, quiz, 0);
  await retry(page, quiz, 0);
  assert.deepEqual(await state(peer), peerWrong);
  await correct(page, quiz);
  await retry(page, quiz, null);
  assert.deepEqual(await state(quiz), quizInitial);

  // Use generated-page variants so legacy and incomplete authored hints exercise real assets.
  const sourcePath = fileURLToPath(originalURL);
  const source = await fs.readFile(sourcePath, 'utf8');
  const fixture = path.join(path.dirname(sourcePath), `.quiz-hints-${randomUUID()}.html`);
  const variant = await page.evaluate((html) => {
    const document = new DOMParser().parseFromString(html, 'text/html');
    document.querySelector('#survey-quiz .quiz-hint[data-option="0"]').remove();
    document
      .querySelector('.precheck .quiz')
      .querySelectorAll('.quiz-hint')
      .forEach((hint) => hint.remove());
    return '<!doctype html>\n' + document.documentElement.outerHTML;
  }, source);
  try {
    await fs.writeFile(fixture, variant, 'utf8');
    await page.goto(pathToFileURL(fixture).href);
    await wrong(page, quiz, 2);
    await retry(page, quiz, 2);
    await wrong(page, quiz, 0, 'Space');
    await visibleHint(quiz, null);
    assert.doesNotMatch(
      await quiz.locator('.quiz-status').innerText(),
      /compare the reasoning below/,
    );
    await retry(page, quiz, null);
    await wrong(page, quiz, 0);
    await reveal(page, quiz, 'incorrect');
    await retry(page, quiz, null);
    await correct(page, quiz);

    const legacy = page.locator('.precheck .quiz').first();
    assert.equal(await legacy.locator('.quiz-hint, .show-explanation').count(), 0);
    await activate(page, legacy.locator('.options button').nth(1));
    assert.equal(
      await legacy.locator('.quiz-status').innerText(),
      'Not quite — compare the reasoning below.',
    );
    assert.equal(await legacy.locator('.explanation').isVisible(), true);
    assert.equal(await legacy.locator('.options .correct').count(), 1);
    assert.equal(await legacy.locator('.prerequisite-review').isVisible(), true);
    await activate(page, legacy.locator('.retry'), 'Space');
    assert.equal(await legacy.locator('.prerequisite-review').isVisible(), false);
    assert.equal(await legacy.getAttribute('data-result'), null);
    assert.equal(await legacy.locator('.options button:disabled').count(), 0);
    assert.equal(await legacy.locator('.explanation').isVisible(), false);
    await activate(page, legacy.locator('.options button').first(), 'Space');
    assert.match(await legacy.locator('.quiz-status').innerText(), /Correct/);
    assert.equal(await legacy.locator('.explanation').isVisible(), true);
  } finally {
    await page.goto(originalURL);
    await fs.unlink(fixture);
  }
}

async function checkBilingualQuizHints(page) {
  const quiz = page.locator('#bilingual-quiz');
  const peer = page.locator('.precheck .quiz').last();
  const peerInitial = await state(peer);
  const initial = await state(quiz);
  const englishHint = (await quiz.locator('.quiz-hint').first().textContent())
    .trim()
    .replace(/\s+/g, ' ');
  const englishReveal = await quiz.locator('.show-explanation').textContent();
  async function roundTrip() {
    const before = await state(quiz);
    const englishStatus = await quiz.locator('.quiz-status').innerText();
    const translated = await page.evaluate(
      ({ hint, status, reveal }) => ({
        hint: window.courseTranslations[hint],
        status: status ? window.courseTranslations[status] : '',
        reveal: window.courseTranslations[reveal],
      }),
      { hint: englishHint, status: englishStatus, reveal: englishReveal },
    );
    assert(translated.hint && translated.reveal);
    if (englishStatus) assert(translated.status);
    await page.locator('.language-toggle').click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
    assert.equal((await quiz.locator('.quiz-hint').first().textContent()).trim(), translated.hint);
    assert.equal(await quiz.locator('.show-explanation').textContent(), translated.reveal);
    assert.equal(await quiz.locator('.quiz-status').innerText(), translated.status);
    assert.deepEqual(await state(quiz), before);
    assert.deepEqual(await state(peer), peerInitial);
    await page.locator('.language-toggle').click();
    assert.equal(await quiz.locator('.quiz-status').innerText(), englishStatus);
    assert.equal(
      (await quiz.locator('.quiz-hint').first().textContent()).trim().replace(/\s+/g, ' '),
      englishHint,
    );
    assert.deepEqual(await state(quiz), before);
  }

  await roundTrip();
  await reveal(page, quiz, null, 'Space');
  await roundTrip();
  await retry(page, quiz, null);
  assert.deepEqual(await state(quiz), initial);
  await wrong(page, quiz, 0);
  await visibleHint(quiz, 0);
  await roundTrip();
  await retry(page, quiz, 0, 'Space');
  await roundTrip();
  await wrong(page, quiz, 0, 'Space');
  await reveal(page, quiz, 'incorrect');
  await roundTrip();
  await retry(page, quiz, 0);
  await correct(page, quiz);
  await roundTrip();
  await retry(page, quiz, null);
  assert.deepEqual(await state(quiz), initial);
  assert.deepEqual(await state(peer), peerInitial);
}

module.exports = { checkQuizHints, checkBilingualQuizHints };
