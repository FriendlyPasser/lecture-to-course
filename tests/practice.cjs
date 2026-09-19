const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { fileURLToPath, pathToFileURL } = require('node:url');

async function practiceState(form) {
  return form.evaluate((element) => ({
    value: element.querySelector('.practice-response').value,
    invalid: element.querySelector('.practice-response').getAttribute('aria-invalid'),
    result: element.dataset.result ?? null,
    solutionHidden: element.querySelector('.practice-solution').hidden,
    hintOpen: element.querySelector('.practice-hint')?.open ?? null,
    revealExpanded: element.querySelector('.practice-reveal').getAttribute('aria-expanded'),
    controls: [...element.querySelectorAll('input, textarea, button')].map((control) => ({
      disabled: control.disabled,
      className: control.className,
    })),
  }));
}

async function assertFocused(locator) {
  assert.equal(await locator.evaluate((element) => element === document.activeElement), true);
}

async function submit(page, form, value, keyboard = false) {
  await form.locator('.practice-response').fill(value);
  const beforeURL = page.url();
  if (keyboard) await page.keyboard.press('Enter');
  else await form.locator('.practice-check').click();
  assert.equal(page.url(), beforeURL, 'Checking a response must not navigate or reload the lesson');
  return form.locator('.practice-status').innerText();
}

async function reset(form) {
  await form.locator('.practice-reset').click();
  assert.equal(await form.locator('.practice-response').inputValue(), '');
  assert.equal(await form.locator('.practice-status').innerText(), '');
  assert.equal(await form.getAttribute('data-result'), null);
  assert.equal(await form.locator('.practice-response').getAttribute('aria-invalid'), null);
  assert.equal(await form.locator('.practice-solution').isVisible(), false);
  assert.equal(await form.locator('.practice-reveal').getAttribute('aria-expanded'), 'false');
  if (await form.locator('.practice-hint').count()) {
    assert.equal(await form.locator('.practice-hint').getAttribute('open'), null);
  }
  await assertFocused(form.locator('.practice-response'));
}

async function checkTranslation(page, forms) {
  const before = await Promise.all(forms.map(practiceState));
  const english = await Promise.all(
    forms.map((form) => form.locator('.practice-status').innerText()),
  );
  const labels = await Promise.all(forms.map((form) => form.locator('label').innerText()));
  const solutions = await Promise.all(
    forms.map((form) => form.locator('.practice-solution').textContent()),
  );
  const translated = await page.evaluate(
    (statuses) => statuses.map((status) => (status ? window.courseTranslations[status] : '')),
    english,
  );
  assert(translated.every((status) => typeof status === 'string'));
  await page.locator('.language-toggle').click();
  assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
  assert.deepEqual(await Promise.all(forms.map(practiceState)), before);
  assert.deepEqual(
    await Promise.all(forms.map((form) => form.locator('.practice-status').innerText())),
    translated,
  );
  for (let index = 0; index < forms.length; index++) {
    assert.notEqual(await forms[index].locator('label').innerText(), labels[index]);
    assert.notEqual(
      await forms[index].locator('.practice-solution').textContent(),
      solutions[index],
    );
    assert.equal(
      await forms[index].locator('.practice-check').innerText(),
      index === 2 ? '对照关键要点' : '检查答案',
    );
  }
  await page.locator('.language-toggle').click();
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.deepEqual(await Promise.all(forms.map(practiceState)), before);
  assert.deepEqual(
    await Promise.all(forms.map((form) => form.locator('.practice-status').innerText())),
    english,
  );
}

async function checkPractice(page, { bilingual = false, screenshot } = {}) {
  const guided = page.locator(bilingual ? '#club-completion' : '#survey-completion');
  const independent = page.locator(bilingual ? '#garden-independent' : '#library-independent');
  const reflection = page.locator(bilingual ? '#garden-reflection' : '#library-reflection');
  const forms = [guided, independent, reflection];
  for (const form of forms) {
    assert.equal(await form.locator('.practice-response').inputValue(), '');
    assert.equal(await form.locator('.practice-status').getAttribute('role'), 'status');
    assert.equal(await form.locator('.practice-status').innerText(), '');
    assert.equal(await form.locator('.practice-solution').isVisible(), false);
  }
  assert.equal(await guided.locator('details.practice-hint').count(), 1);
  assert.equal(await independent.locator('.practice-hint').count(), 0);
  assert.equal(await reflection.locator('textarea.practice-response').count(), 1);
  const untouched = await Promise.all([practiceState(independent), practiceState(reflection)]);

  // Blank, non-finite and malformed expressions need validation, not a scored result.
  for (const value of [
    '',
    '   ',
    'cats',
    '1/0',
    '0/0',
    'Infinity',
    'NaN',
    '2/3/4',
    '40%%',
    '0x10',
    '1 + 2',
    '9'.repeat(400),
    `1/${'9'.repeat(400)}`,
  ]) {
    const message = await submit(page, guided, value, true);
    assert.match(message, /enter|valid|finite|number|answer/i);
    assert.doesNotMatch(message, /^Correct|^Not quite/i);
    assert.equal(await guided.getAttribute('data-result'), 'invalid');
    assert.equal(await guided.locator('.practice-response').getAttribute('aria-invalid'), 'true');
    assert.equal(await guided.locator('.practice-solution').isVisible(), false);
  }
  assert.deepEqual(
    await Promise.all([practiceState(independent), practiceState(reflection)]),
    untouched,
  );
  if (bilingual) await checkTranslation(page, forms);
  const answer = Number(await guided.getAttribute('data-answer'));
  assert.match(await submit(page, guided, String(answer + 1)), /not quite|try again/i);
  assert.equal(await guided.locator('.practice-solution').isVisible(), false);
  await guided.locator('.practice-hint summary').click();
  assert.equal(await guided.locator('.practice-hint').getAttribute('open'), '');

  // A language change must preserve unfinished answers as well as checked work and hints.
  await independent.locator('.practice-response').fill('1 / 3');
  const reflectionText = 'I restricted the denominator to the named group.\n分母必须与条件对应。';
  await reflection.locator('.practice-response').fill(reflectionText);
  if (bilingual) await checkTranslation(page, forms);
  const peers = await Promise.all([practiceState(independent), practiceState(reflection)]);
  await guided.locator('.practice-reveal').focus();
  await page.keyboard.press('Enter');
  assert.equal(await guided.locator('.practice-solution').isVisible(), true);
  assert.equal(await guided.locator('.practice-reveal').getAttribute('aria-expanded'), 'true');
  await assertFocused(guided.locator('.practice-solution'));
  if (bilingual) await checkTranslation(page, forms);
  await reset(guided);
  assert.deepEqual(
    await Promise.all([practiceState(independent), practiceState(reflection)]),
    peers,
  );

  // The same numerical value can be entered as a decimal, simple fraction or percentage.
  for (const value of [String(answer), `${answer * 10} / 10`, `${answer * 100}%`]) {
    await reset(guided);
    assert.match(await submit(page, guided, value, true), /^Correct/i);
    assert.equal(await guided.getAttribute('data-result'), 'correct');
    assert.equal(await guided.locator('.practice-solution').isVisible(), true);
  }
  const guidedCorrect = await practiceState(guided);
  assert.match(await submit(page, independent, '1 / 3', true), /^Correct/i);
  assert.equal(await independent.locator('.practice-solution').isVisible(), true);
  await reset(independent);
  assert.deepEqual(await practiceState(guided), guidedCorrect);
  assert.match(await submit(page, independent, '0'), /not quite|try again/i);
  assert.equal(await independent.locator('.practice-solution').isVisible(), false);

  await reset(reflection);
  assert.match(await submit(page, reflection, '   '), /enter|write|response|answer/i);
  assert.equal(await reflection.locator('.practice-solution').isVisible(), false);
  const reflectiveMessage = await submit(page, reflection, reflectionText);
  assert.match(reflectiveMessage, /self.assess|self.check|compare/i);
  assert.doesNotMatch(reflectiveMessage, /^Correct|^Not quite|^Incorrect/i);
  assert.equal(await reflection.getAttribute('data-result'), 'self-assessment');
  assert.equal(await reflection.locator('.practice-solution').isVisible(), true);
  assert.equal(await reflection.locator('.practice-response').inputValue(), reflectionText);
  if (bilingual) await checkTranslation(page, forms);

  // Independent exercises can reveal their method voluntarily and start over without a hint.
  await independent.locator('.practice-reveal').click();
  assert.equal(await independent.locator('.practice-solution').isVisible(), true);
  for (const value of ['0.334', '0.332']) {
    await reset(independent);
    assert.match(await submit(page, independent, value), /not quite|try again/i);
    assert.equal(await independent.getAttribute('data-result'), 'incorrect');
    assert.equal(await independent.locator('.practice-solution').isVisible(), false);
  }
  await reset(independent);
  assert.match(await submit(page, independent, '0.333'), /^Correct/i);
  assert.deepEqual(await practiceState(guided), guidedCorrect);
  assert.equal(await reflection.locator('.practice-response').inputValue(), reflectionText);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  if (screenshot) {
    if (bilingual) await page.locator('.language-toggle').click();
    await independent.scrollIntoViewIfNeeded();
    await page.screenshot({ path: screenshot });
    await guided.screenshot({ path: screenshot.replace(/\.png$/, '-guided.png') });
    await reflection.screenshot({ path: screenshot.replace(/\.png$/, '-reflection.png') });
    if (bilingual) await page.locator('.language-toggle').click();
  }
}

async function checkPracticeTolerance(page) {
  const originalURL = page.url();
  const sourcePath = fileURLToPath(originalURL);
  const source = await fs.readFile(sourcePath, 'utf8');
  const id = await page.locator('form.practice[data-kind="numeric"]').first().getAttribute('id');
  const fixture = path.join(path.dirname(sourcePath), `.practice-tolerance-${randomUUID()}.html`);
  const fixtureURL = pathToFileURL(fixture).href + '?lang=en';
  async function load(tolerance, answer = '0.5') {
    let replaced = false;
    const content = source.replace(/<form\b[^>]*>/g, (tag) => {
      if (!tag.includes(`id="${id}"`)) return tag;
      replaced = true;
      return tag
        .replace(/\sdata-answer="[^"]*"/, ` data-answer="${answer}"`)
        .replace(/\sdata-tolerance="[^"]*"/, '')
        .replace(/>$/, tolerance === null ? '>' : ` data-tolerance="${tolerance}">`);
    });
    assert(replaced);
    await fs.writeFile(fixture, content, 'utf8');
    await page.goto(fixtureURL);
    return page.locator(`form[id="${id}"]`);
  }
  try {
    // Binary-exact endpoints distinguish inclusive tolerance from an approximate spot check.
    let form = await load('0.125');
    for (const value of ['.5', '+0.5', '1 / 2', '50%', '0.375', '0.625']) {
      await reset(form);
      assert.match(await submit(page, form, value, true), /^Correct/i);
    }
    for (const value of ['0.374999', '0.625001', '-0.5']) {
      await reset(form);
      assert.match(await submit(page, form, value), /not quite|try again/i);
      assert.equal(await form.locator('.practice-solution').isVisible(), false);
    }
    form = await load(null);
    for (const value of ['0.5000005', '0.4999995', '0.500001', '0.499999']) {
      await reset(form);
      assert.match(await submit(page, form, value), /^Correct/i);
    }
    for (const value of ['0.50000100001', '0.49999899999']) {
      await reset(form);
      assert.match(await submit(page, form, value), /not quite|try again/i);
      assert.equal(await form.locator('.practice-solution').isVisible(), false);
    }

    // Finite operands can still overflow when subtracted; an infinite error cannot pass.
    form = await load('1.7976931348623157e308', '-1.7e308');
    assert.match(await submit(page, form, '1.7e308'), /not quite|try again/i);
    assert.equal(await form.getAttribute('data-result'), 'incorrect');
    assert.equal(await form.locator('.practice-solution').isVisible(), false);
    await reset(form);
    assert.match(await submit(page, form, '-1.7e308'), /^Correct/i);
    assert.equal(await form.getAttribute('data-result'), 'correct');
    assert.equal(await form.locator('.practice-solution').isVisible(), true);
  } finally {
    await page.goto(originalURL);
    await fs.unlink(fixture);
  }
}

module.exports = { checkPractice, checkPracticeTolerance };
