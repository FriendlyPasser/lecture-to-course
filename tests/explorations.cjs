const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { fileURLToPath, pathToFileURL } = require('node:url');

async function state(component) {
  return component.evaluate((element) => {
    const control = element.querySelector('.exploration-control');
    return {
      overlap: Number(control.value),
      prediction: element.querySelector('.exploration-prediction').value,
      reflection: element.querySelector('.exploration-reflection').value,
      values: Object.fromEntries(
        [...element.querySelectorAll('[data-exploration-value]')].map((output) => [
          output.dataset.explorationValue,
          { value: Number(output.dataset.value), text: output.textContent.trim() },
        ]),
      ),
      meters: Object.fromEntries(
        [...element.querySelectorAll('[data-exploration-meter]')].map((meter) => [
          meter.dataset.explorationMeter,
          {
            value: meter.value,
            min: meter.min,
            max: meter.max,
            label: meter.getAttribute('aria-label'),
          },
        ]),
      ),
      status: element.querySelector('.exploration-status').textContent,
      accessibleValue: control.getAttribute('aria-valuetext'),
    };
  });
}

async function metadata(component) {
  return component.evaluate((element) => ({
    total: Number(element.dataset.total),
    condition: Number(element.dataset.condition),
    event: Number(element.dataset.event),
    initial: Number(element.dataset.overlap),
  }));
}

function near(actual, expected, message) {
  assert(Math.abs(actual - expected) < 1e-10, `${message}: ${actual} != ${expected}`);
}

function assertArithmetic(current, model) {
  const { total, condition, event } = model;
  const x = current.overlap;
  const expected = {
    both: x,
    'condition-only': condition - x,
    'event-only': event - x,
    neither: total - condition - event + x,
    conditional: x / condition,
    complement: (condition - x) / condition,
    marginal: event / total,
    sum: 1,
  };
  for (const [key, value] of Object.entries(expected)) {
    assert(current.values[key], `The readout must expose ${key}`);
    near(current.values[key].value, value, key);
    assert(current.values[key].text.length, `${key} must also have a visible readout`);
  }
  const counts = ['both', 'condition-only', 'event-only', 'neither'].map(
    (key) => current.values[key].value,
  );
  assert(counts.every((count) => Number.isInteger(count) && count >= 0));
  assert.equal(
    counts.reduce((sum, count) => sum + count, 0),
    total,
  );
  assert.equal(counts[0] + counts[1], condition);
  assert.equal(counts[0] + counts[2], event);
  near(current.values.conditional.value + current.values.complement.value, 1, 'complement rule');
  for (const key of ['conditional', 'complement', 'marginal']) {
    near(current.meters[key].value, expected[key], `${key} bar`);
    assert.equal(current.meters[key].min, 0);
    assert.equal(current.meters[key].max, 1);
    assert(current.meters[key].label?.length, `${key} bar must have an accessible name`);
  }
  assert(
    current.accessibleValue?.includes(String(x)),
    'The slider must announce its current count',
  );
}

async function checkTranslation(page, component, expectedRelation) {
  const before = await state(component);
  await page.locator('.language-toggle').click();
  assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
  const chinese = await state(component);
  assert.notEqual(chinese.status, before.status);
  assert.match(chinese.status, expectedRelation);
  assert.equal(chinese.overlap, before.overlap);
  assert.equal(chinese.prediction, before.prediction);
  assert.equal(chinese.reflection, before.reflection);
  assert.deepEqual(chinese.values, before.values);
  for (const key of Object.keys(before.meters)) {
    assert.equal(chinese.meters[key].value, before.meters[key].value);
    assert.notEqual(chinese.meters[key].label, before.meters[key].label);
  }
  await page.locator('.language-toggle').click();
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.deepEqual(await state(component), before);
}

async function checkExploration(page, { bilingual = false, screenshot } = {}) {
  const component = page.locator('.exploration').first();
  const model = await metadata(component);
  const control = component.locator('.exploration-control');
  const prediction = component.locator('.exploration-prediction');
  const reflection = component.locator('.exploration-reflection');
  const lower = Math.max(0, model.condition + model.event - model.total);
  const upper = Math.min(model.condition, model.event);
  assert.equal(await component.getAttribute('data-model'), 'overlap');
  assert.equal(await control.getAttribute('type'), 'range');
  assert.equal(await control.isEnabled(), true);
  assert.equal(Number(await control.getAttribute('min')), lower);
  assert.equal(Number(await control.getAttribute('max')), upper);
  assert.equal(Number(await control.getAttribute('step')), 1);
  assert.equal(Number(await control.inputValue()), model.initial);
  assert.equal(await component.locator('.exploration-status').getAttribute('role'), 'status');
  for (const field of [control, prediction, reflection]) {
    const id = await field.getAttribute('id');
    assert(id);
    assert.equal(await component.locator(`label[for="${id}"]`).count(), 1);
  }
  assertArithmetic(await state(component), model);

  // The learner records a prediction before changing the model; editing it does not move the slider.
  const predictionText = 'I predict the conditional share will rise.\n先预测，再检验。';
  const reflectionText = 'The two conditional shares still sum to one.\n总体比例不变。';
  await prediction.fill(predictionText);
  assert.equal(Number(await control.inputValue()), model.initial);
  await control.focus();
  await page.keyboard.press('Home');
  assert.equal(Number(await control.inputValue()), lower);
  assert.match((await state(component)).status, /is below|equals/);
  await page.keyboard.press('ArrowLeft');
  assert.equal(Number(await control.inputValue()), lower);
  assertArithmetic(await state(component), model);
  if (bilingual) await checkTranslation(page, component, /低于|相等|等于/);

  // Every attainable count must retain nonnegative cells, fixed margins and complementary shares.
  await control.focus();
  for (let overlap = lower; overlap <= upper; overlap++) {
    const current = await state(component);
    assert.equal(current.overlap, overlap);
    assert.equal(current.prediction, predictionText);
    assertArithmetic(current, model);
    if (overlap < upper) await page.keyboard.press('ArrowRight');
  }
  await page.keyboard.press('End');
  await page.keyboard.press('ArrowRight');
  assert.equal(Number(await control.inputValue()), upper);
  assert.match((await state(component)).status, /is above|equals/);
  await reflection.fill(reflectionText);
  if (bilingual) await checkTranslation(page, component, /高于|相等|等于/);

  const independence = (model.event * model.condition) / model.total;
  if (Number.isInteger(independence)) {
    await control.focus();
    await page.keyboard.press('Home');
    for (let overlap = lower; overlap < independence; overlap++) {
      await page.keyboard.press('ArrowRight');
    }
    const current = await state(component);
    assert.match(current.status, /equals/);
    near(current.values.conditional.value, current.values.marginal.value, 'independence');
    if (bilingual) await checkTranslation(page, component, /相等|等于/);
  }
  await component.locator('.exploration-reset').focus();
  await page.keyboard.press('Enter');
  const reset = await state(component);
  assert.equal(reset.overlap, model.initial);
  assert.equal(reset.prediction, predictionText);
  assert.equal(reset.reflection, reflectionText);
  assertArithmetic(reset, model);
  assert(await control.evaluate((element) => element === document.activeElement));
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  if (screenshot) {
    if (bilingual) await page.locator('.language-toggle').click();
    await component.screenshot({ path: screenshot });
    if (bilingual) await page.locator('.language-toggle').click();
  }
}

async function checkExplorationIsolation(page) {
  const originalURL = page.url();
  const sourcePath = fileURLToPath(originalURL);
  const source = await fs.readFile(sourcePath, 'utf8');
  const fixture = path.join(path.dirname(sourcePath), `.exploration-${randomUUID()}.html`);
  async function load(model, scenario) {
    const html = await page.evaluate(
      ({ sourceHTML, model }) => {
        const doc = new DOMParser().parseFromString(sourceHTML, 'text/html');
        const original = doc.querySelector('.exploration');
        const clone = original.cloneNode(true);
        const ids = new Map();
        for (const element of [clone, ...clone.querySelectorAll('[id]')]) {
          if (!element.id) continue;
          const previous = element.id;
          element.id = `${previous}-second`;
          ids.set(previous, element.id);
        }
        for (const element of clone.querySelectorAll('*')) {
          for (const attr of ['for', 'aria-labelledby', 'aria-describedby', 'aria-controls']) {
            if (!element.hasAttribute(attr)) continue;
            element.setAttribute(
              attr,
              element
                .getAttribute(attr)
                .split(/\s+/)
                .map((id) => ids.get(id) ?? id)
                .join(' '),
            );
          }
        }
        Object.assign(clone.dataset, model);
        const control = clone.querySelector('.exploration-control');
        control.min = Math.max(0, model.condition + model.event - model.total);
        control.max = Math.min(model.condition, model.event);
        control.setAttribute('value', model.overlap);
        original.after(clone);
        return `<!doctype html>\n${doc.documentElement.outerHTML}`;
      },
      { sourceHTML: source, model },
    );
    await fs.writeFile(fixture, html, 'utf8');
    await page.goto(pathToFileURL(fixture).href + `?lang=en&scenario=${scenario}`);
  }
  try {
    await load({ total: 20, condition: 12, event: 14, overlap: 9 }, 'positive-minimum');
    const first = page.locator('.exploration').first();
    const second = page.locator('.exploration').nth(1);
    const model = await metadata(second);
    const control = second.locator('.exploration-control');
    assert.equal(
      Number(await control.getAttribute('min')),
      6,
      'Positive lower bound prevents negative cells',
    );
    assert.equal(Number(await control.getAttribute('max')), 12);
    const untouched = await state(second);
    await first.locator('.exploration-prediction').fill('Only the first component changes.');
    await first.locator('.exploration-control').focus();
    await page.keyboard.press('End');
    assert.deepEqual(await state(second), untouched);
    const firstBefore = await state(first);
    await control.focus();
    await page.keyboard.press('Home');
    assert.equal(Number(await control.inputValue()), 6);
    assertArithmetic(await state(second), model);
    await page.keyboard.press('End');
    assert.equal(Number(await control.inputValue()), 12);
    assertArithmetic(await state(second), model);
    await second.locator('.exploration-reset').click();
    assert.deepEqual(await state(first), firstBefore);
    assert.equal(Number(await control.inputValue()), 9);

    // Matching rounded percentages must not claim independence for unequal exact probabilities.
    await load({ total: 1000000, condition: 999999, event: 500000, overlap: 500000 }, 'rounding');
    const close = page.locator('.exploration').nth(1);
    const closeModel = await metadata(close);
    const above = await state(close);
    assertArithmetic(above, closeModel);
    assert.match(above.values.conditional.text, /≈\s*50%/);
    assert.match(above.values.marginal.text, /=\s*50%/);
    assert.match(above.status, /is above/);
    await close.locator('.exploration-control').focus();
    await page.keyboard.press('Home');
    const below = await state(close);
    assertArithmetic(below, closeModel);
    assert.match(below.values.conditional.text, /≈\s*50%/);
    assert.match(below.status, /is below/);
  } finally {
    await page.goto(originalURL);
    await fs.unlink(fixture);
  }
}

async function checkExplorationFallback(browser, url) {
  const context = await browser.newContext({ offline: true, javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(url);
    const component = page.locator('.exploration').first();
    assert.equal(await component.isVisible(), true);
    assert.equal(await component.locator('.exploration-control').isDisabled(), true);
    assert.equal(await component.locator('.exploration-reset').isDisabled(), true);
    assert(
      (await component.innerText()).length > 100,
      'The authored explanation remains readable without JavaScript',
    );
    assert.equal(await component.locator('.exploration-prediction').isVisible(), true);
    assert.equal(await component.locator('.exploration-reflection').isVisible(), true);
    assert.equal(await page.locator('[data-source]').first().isVisible(), true);
  } finally {
    await context.close();
  }
}

module.exports = { checkExploration, checkExplorationIsolation, checkExplorationFallback };
