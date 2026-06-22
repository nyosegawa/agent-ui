import { expect, test, type Page } from "@playwright/test";
import {
  FAST_EXPECT_TIMEOUT,
  assertComposerAnchored,
  assertLocalAppBackgroundFullBleed,
  assertNoHorizontalOverflow,
  openRealLocalApp,
  openStoredThread,
} from "./support/real-local-page";

const layoutViewports = [
  { height: 900, name: "desktop", width: 1280 },
  { height: 900, name: "mobile", width: 390 },
] as const;

for (const viewport of layoutViewports) {
  test(`first-run real-local layout stays contained on ${viewport.name}`, async ({
    page,
  }) => {
    await openRealLocalApp(page, viewport, "/");
    await assertLocalAppBackgroundFullBleed(page);
    await assertNoHorizontalOverflow(page);
    await expect(page.getByRole("form", { name: "Start a Codex thread" })).toBeVisible({
      timeout: FAST_EXPECT_TIMEOUT,
    });
    await expectFirstRunSubmitContained(page);
  });

  test(`stored-thread real-local layout anchors composer on ${viewport.name}`, async ({
    page,
  }) => {
    await openStoredThread(page, viewport);
    await assertLocalAppBackgroundFullBleed(page);
    await assertNoHorizontalOverflow(page);
    await assertComposerAnchored(page);
  });
}

async function expectFirstRunSubmitContained(page: Page) {
  const metrics = await page.evaluate(() => {
    const card = document.querySelector(".aui-starter-card")?.getBoundingClientRect();
    const submit = document.querySelector(".aui-first-run-submit")?.getBoundingClientRect();
    const hitTarget = submit
      ? document.elementFromPoint(
          submit.left + submit.width / 2,
          submit.top + submit.height / 2,
        )
      : null;
    return {
      card: card
        ? {
            bottom: Math.round(card.bottom),
            left: Math.round(card.left),
            right: Math.round(card.right),
            top: Math.round(card.top),
          }
        : null,
      hitTestable: Boolean(hitTarget?.closest(".aui-first-run-submit")),
      submit: submit
        ? {
            bottom: Math.round(submit.bottom),
            left: Math.round(submit.left),
            right: Math.round(submit.right),
            top: Math.round(submit.top),
          }
        : null,
      viewport: {
        height: window.innerHeight,
        width: window.innerWidth,
      },
    };
  });
  expect(metrics.card, JSON.stringify(metrics)).not.toBeNull();
  expect(metrics.submit, JSON.stringify(metrics)).not.toBeNull();
  expect(metrics.submit!.left, JSON.stringify(metrics)).toBeGreaterThanOrEqual(
    metrics.card!.left,
  );
  expect(metrics.submit!.right, JSON.stringify(metrics)).toBeLessThanOrEqual(
    metrics.card!.right + 1,
  );
  expect(metrics.submit!.bottom, JSON.stringify(metrics)).toBeLessThanOrEqual(
    metrics.card!.bottom + 1,
  );
  expect(metrics.submit!.right, JSON.stringify(metrics)).toBeLessThanOrEqual(
    metrics.viewport.width + 1,
  );
  expect(metrics.hitTestable, JSON.stringify(metrics)).toBe(true);
}
