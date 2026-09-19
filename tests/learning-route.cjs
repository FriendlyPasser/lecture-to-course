const assert = require('node:assert/strict');

async function followSectionLink(page, link) {
  const destination = new URL(await link.getAttribute('href'), page.url());
  assert(destination.hash, 'A section link needs a destination fragment');
  await link.focus();
  await page.keyboard.press('Enter');
  await page.waitForURL(destination.href, { waitUntil: 'load', timeout: 10000 });
  const section = page.locator(`section[id="${decodeURIComponent(destination.hash.slice(1))}"]`);
  assert.equal(await section.count(), 1, `Missing section: ${destination.href}`);
  assert.equal(await section.evaluate((element) => element === document.activeElement), true);
  const heading = await section.locator('h2').boundingBox();
  assert(heading && heading.y >= 0 && heading.y + heading.height <= page.viewportSize().height);
}

async function routeText(page, targets) {
  return page.evaluate((ids) => {
    const text = [...document.querySelectorAll('.learning-route p, .learning-route li > a')];
    for (const id of ids) {
      text.push(
        ...document
          .getElementById(id)
          .querySelectorAll(
            ':scope > h2, :scope > .section-context, :scope > .objectives li, :scope > .section-next',
          ),
      );
    }
    return text.map((element) => element.textContent.trim().replace(/\s+/g, ' '));
  }, targets);
}

async function checkLearningRoute(page, { bilingual = false, screenshot } = {}) {
  const startURL = page.url();
  const route = page.locator('nav.learning-route');
  assert.equal(await route.count(), 1);
  assert.equal(await route.getAttribute('aria-label'), 'Learning route');
  const links = route.locator('li > a');
  const hrefs = await links.evaluateAll((items) => items.map((link) => link.getAttribute('href')));
  assert(hrefs.length >= 2);
  assert(hrefs.every((href) => href.startsWith('#')));
  assert.equal(new Set(hrefs).size, hrefs.length);
  const targets = hrefs.map((href) => href.slice(1));
  const chapterLinks = page.locator('.chapters a');
  const chapters = await chapterLinks.evaluateAll((items) =>
    items.map((link) => link.getAttribute('href')),
  );
  assert(hrefs.every((href) => chapters.includes(href)));
  const english = await routeText(page, targets);

  async function navigateRoute() {
    for (let index = 0; index < hrefs.length; index += 1) {
      await followSectionLink(page, links.nth(index));
    }
    // The existing chapter navigation reaches the same sections as the new route.
    await followSectionLink(page, page.locator(`.chapters a[href="${hrefs.at(-1)}"]`));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }

  await navigateRoute();
  if (bilingual) {
    await page.locator('.language-toggle').click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
    assert.equal(await route.getAttribute('aria-label'), '学习路线');
    const chinese = await routeText(page, targets);
    assert.equal(chinese.length, english.length);
    chinese.forEach((text, index) => {
      assert.notEqual(text, english[index], `Untranslated learning guidance: ${english[index]}`);
      assert.match(text, /[\u3400-\u9fff]/);
    });
    assert.deepEqual(
      await links.evaluateAll((items) => items.map((link) => link.getAttribute('href'))),
      hrefs,
    );
    assert.deepEqual(
      await chapterLinks.evaluateAll((items) => items.map((link) => link.getAttribute('href'))),
      chapters,
    );
    await navigateRoute();
    if (screenshot) {
      await route.scrollIntoViewIfNeeded();
      await page.screenshot({ path: screenshot });
    }
    await page.locator('.language-toggle').click();
    assert.deepEqual(await routeText(page, targets), english);
    assert.equal(await route.getAttribute('aria-label'), 'Learning route');
  } else if (screenshot) {
    await route.scrollIntoViewIfNeeded();
    await page.screenshot({ path: screenshot });
  }

  // Follow the authored links between sections, then reset before the quiz checks.
  const bridges = page.locator('.section-context a[href^="#"], .section-next a[href^="#"]');
  const bridgeCount = await bridges.count();
  for (let index = 0; index < bridgeCount; index += 1) {
    await followSectionLink(page, bridges.nth(index));
  }
  await page.goto(startURL);
}

module.exports = { checkLearningRoute };
