const assert = require('node:assert/strict');

async function assertFocused(locator) {
  assert.equal(await locator.evaluate((element) => element === document.activeElement), true);
}

async function assertHeadingVisible(page, item) {
  const box = await item.locator(':scope > h3').boundingBox();
  assert(box && box.y >= 0 && box.y + box.height <= page.viewportSize().height);
}

async function assertDrawerFits(page) {
  assert.equal(
    await page.locator('.drawer').evaluate((drawer) => {
      const box = drawer.getBoundingClientRect();
      return drawer.scrollWidth <= drawer.clientWidth && box.left >= 0 && box.right <= innerWidth;
    }),
    true,
  );
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
}

async function headwords(page) {
  return page
    .locator('.glossary-item > h3, .glossary-item > .zh, .term-reference')
    .allTextContents();
}

async function checkGlossary(page, { bilingual = false, screenshot } = {}) {
  const drawer = page.locator('.drawer');
  const tab = page.locator('.glossary-tab');
  const search = page.locator('#term-search');
  const conditional = page.locator('#term-conditional');
  const joint = page.locator('#term-joint');
  const opener = page.locator('main [data-term="conditional"]').first();
  const toJoint = conditional.locator('.term-reference[data-term="joint"]');
  const toConditional = joint.locator('.term-reference[data-term="conditional"]');
  const details = conditional.locator('.glossary-details dd');
  const context = conditional.locator('.glossary-details dd, .glossary-comparisons li > p');
  const prose = drawer.locator(
    '.glossary-item > p:not(.zh), .glossary-details dd, .glossary-comparisons li > p',
  );

  await opener.focus();
  await page.keyboard.press('Enter');
  assert.equal(await drawer.isVisible(), true);
  assert.equal(await tab.getAttribute('aria-expanded'), 'true');
  await assertFocused(conditional);
  await assertHeadingVisible(page, conditional);
  assert.equal(await conditional.locator(':scope > h3').innerText(), 'Conditional probability');
  assert.equal(await conditional.locator(':scope > .zh').innerText(), '条件概率');
  // The formal definition remains alongside the new explanation and course example.
  assert((await conditional.locator(':scope > p:not(.zh)').innerText()).length > 20);
  for (const item of [conditional, joint]) {
    assert.deepEqual(await item.locator('.glossary-details dt').allTextContents(), [
      'In plain language',
      'In this course',
    ]);
    assert.equal(await item.locator('.glossary-comparisons h4').innerText(), 'Distinguish from');
  }
  assert.match(await details.nth(1).innerText(), bilingual ? /4\/10/ : /24\/40/);
  assert.match(
    await joint.locator('.glossary-details dd').nth(1).innerText(),
    bilingual ? /4\/40/ : /24\/100/,
  );
  const distinction = await conditional
    .locator('.glossary-comparisons li')
    .filter({ has: page.locator('.term-reference[data-term="joint"]') })
    .locator('p')
    .innerText();
  for (const count of bilingual ? ['4', '10', '40'] : ['24', '40', '100']) {
    assert.match(distinction, new RegExp(`\\b${count}\\b`));
  }
  assert.equal(
    await toJoint.locator('[lang="en"][translate="no"]').innerText(),
    'Joint probability',
  );
  assert.equal(await toJoint.locator('[lang="zh-Hans"][translate="no"]').innerText(), '联合概率');
  assert.equal(await toConditional.count(), 1);

  const englishContext = await context.allTextContents();
  const englishProse = await prose.allTextContents();
  const originalHeadwords = await headwords(page);
  // Search indexes every new prose field, as well as the two headword languages.
  for (const query of [...englishContext, 'conditional probability', '条件']) {
    await search.fill(query);
    assert.equal(await conditional.isVisible(), true, `Missing glossary search result: ${query}`);
    assert.equal(await drawer.locator('.empty').isVisible(), false);
  }
  await search.fill(englishContext[0]);
  assert.equal(await joint.isVisible(), false);
  await conditional.focus();
  await page.keyboard.press('Tab');
  await assertFocused(toJoint);
  await page.keyboard.press('Enter');
  assert.equal(await search.inputValue(), '');
  assert.equal(await joint.isVisible(), true);
  await assertFocused(joint);
  await assertHeadingVisible(page, joint);
  await toConditional.focus();
  await page.keyboard.press('Enter');
  await assertFocused(conditional);
  await assertHeadingVisible(page, conditional);
  await page.keyboard.press('Escape');
  assert.equal(await drawer.isVisible(), false);
  assert.equal(await tab.getAttribute('aria-expanded'), 'false');
  await assertFocused(opener);

  // A failed search can be closed and reopened; a new opening clears the filter.
  await tab.click();
  await assertFocused(search);
  await search.fill('no such glossary term 918273');
  assert.equal(await drawer.locator('.empty').isVisible(), true);
  await page.keyboard.press('Escape');
  await assertFocused(tab);
  await tab.click();
  assert.equal(await search.inputValue(), '');
  assert.equal(await conditional.isVisible(), true);
  assert.equal(await joint.isVisible(), true);

  // Every visible control and term can be reached, including comparison buttons,
  // while both directions wrap inside the drawer.
  const close = drawer.locator('.close');
  const stops = await drawer
    .locator('button:visible, input:visible, .glossary-item:visible')
    .count();
  await close.focus();
  await page.keyboard.press('Shift+Tab');
  assert.equal(await close.evaluate((element) => element === document.activeElement), false);
  assert.equal(await drawer.evaluate((element) => element.contains(document.activeElement)), true);
  await page.keyboard.press('Tab');
  await assertFocused(close);
  let reachedComparison = false;
  for (let step = 0; step < stops; step++) {
    await page.keyboard.press('Tab');
    assert.equal(
      await drawer.evaluate((element) => element.contains(document.activeElement)),
      true,
    );
    reachedComparison ||= await page.evaluate(() =>
      document.activeElement.classList.contains('term-reference'),
    );
  }
  assert.equal(reachedComparison, true);
  await assertFocused(close);
  await close.click();
  assert.equal(await drawer.isVisible(), false);
  await assertFocused(tab);

  await opener.click();
  if (bilingual) {
    const toggle = page.locator('.language-toggle');
    const openerEnglish = await opener.innerText();
    await search.fill(englishContext[0]);
    await page.keyboard.press('Escape');
    await toggle.click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
    // The language switch is outside the drawer. Closing retains the search,
    // which must be refreshed when its matching prose changes language.
    assert.equal(await search.inputValue(), englishContext[0]);
    assert.equal(await conditional.getAttribute('hidden'), '');
    assert.equal(await drawer.locator('.empty').getAttribute('hidden'), null);
    await opener.click();
    assert.deepEqual(await conditional.locator('.glossary-details dt').allTextContents(), [
      '白话解释',
      '本课例子',
    ]);
    assert.equal(await conditional.locator('.glossary-comparisons h4').innerText(), '易混概念对照');
    assert.equal(await opener.innerText(), '条件概率（conditional probability）');
    assert.deepEqual(await headwords(page), originalHeadwords);
    const chineseContext = await context.allTextContents();
    const chineseProse = await prose.allTextContents();
    assert.equal(chineseProse.length, englishProse.length);
    for (let index = 0; index < chineseProse.length; index++) {
      assert.notEqual(chineseProse[index], englishProse[index]);
      assert.match(chineseProse[index], /[\u3400-\u9fff]/);
    }
    for (const query of [...chineseContext, 'conditional probability', '条件']) {
      await search.fill(query);
      assert.equal(await conditional.isVisible(), true);
      assert.equal(await drawer.locator('.empty').isVisible(), false);
    }
    await search.fill(chineseContext[0]);
    assert.equal(await joint.isVisible(), false);
    await toJoint.focus();
    await page.keyboard.press('Enter');
    await assertFocused(joint);
    await assertHeadingVisible(page, joint);
    assert.equal(await search.inputValue(), '');
    await assertDrawerFits(page);
    if (screenshot) await page.screenshot({ path: screenshot });
    await page.keyboard.press('Escape');
    await assertFocused(opener);
    await opener.click();
    assert.equal(await conditional.locator('.glossary-details dt').first().innerText(), '白话解释');
    await page.keyboard.press('Escape');
    await toggle.click();
    await opener.click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.equal(await opener.innerText(), openerEnglish);
    assert.deepEqual(await context.allTextContents(), englishContext);
    assert.deepEqual(await prose.allTextContents(), englishProse);
    assert.deepEqual(await headwords(page), originalHeadwords);
    assert.deepEqual(await conditional.locator('.glossary-details dt').allTextContents(), [
      'In plain language',
      'In this course',
    ]);
  }
  await assertDrawerFits(page);
  if (screenshot && !bilingual) await page.screenshot({ path: screenshot });
  await conditional.focus();
  await page.keyboard.press('Escape');
  await assertFocused(opener);
}

async function checkGlossaryLayout(page, { screenshot } = {}) {
  await page.locator('main [data-term="conditional"]').first().click();
  await assertHeadingVisible(page, page.locator('#term-conditional'));
  await assertDrawerFits(page);
  if (screenshot) await page.screenshot({ path: screenshot });
  await page.keyboard.press('Escape');
}

module.exports = { checkGlossary, checkGlossaryLayout };
