import { expect, test } from "@playwright/test";
import {
  desktopViewport,
  elementMetrics,
  mobileViewport,
} from "./support/visual-contracts";

test("composer stays a single bordered card with reachable run controls", async ({
  page,
}) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/showcase/rich-transcript");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  const composer = page.locator(".aui-composer").first();
  await expect(composer).toBeVisible();
  await expect(composer).toHaveAttribute("data-disabled", "true");
  await expect(composer.locator(".aui-composer-notice")).toContainText("Needs attention");
  await expect(composer.getByRole("button", { name: "Send" })).toBeDisabled();
  await expect(composer.getByRole("button", { name: "Run policy" })).toBeEnabled();
  await expect(composer.getByRole("button", { name: "Model and effort" })).toBeEnabled();
});

test("composer close-up exposes attachment and send controls from the real primitive", async ({
  page,
}) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/maintainer-gallery");
  const closeup = page.getByTestId("closeup:Composer · normal");
  const composer = closeup.locator(".aui-composer");
  await expect(composer).toBeVisible();
  await expect(composer).not.toHaveAttribute("data-disabled", "true");
  await expect(composer.getByRole("button", { name: "Attach file" })).toBeVisible();
  await expect(composer.getByRole("button", { name: "App" })).toHaveCount(0);
  await expect(composer.getByRole("button", { name: "Plugin" })).toHaveCount(0);
  await expect(composer.getByRole("button", { name: "Send" })).toBeVisible();
});

test("mobile composer keeps tap targets above 32px and hides keyboard hint", async ({
  page,
}) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/showcase/default-conversation");
  const composer = page.locator(".aui-composer").first();
  await expect(composer).toBeVisible();
  await expect(composer.locator(".aui-composer-hint")).toBeHidden();
  const send = composer.getByRole("button", { name: "Send" });
  const box = await send.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(36);
});

test("core controls keep the shared sizing and typography contract", async ({ page }) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/showcase/default-conversation");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  const chatMetrics = {
    accountControl: await elementMetrics(page, ".aui-account-control"),
    accountTrigger: await elementMetrics(page, ".aui-account-trigger"),
    composerInput: await elementMetrics(page, ".aui-composer-input"),
    composerSubmit: await elementMetrics(
      page,
      ".aui-composer .aui-btn-primary.aui-btn-icon-only",
    ),
    localeMenu: await elementMetrics(page, ".aui-locale-menu"),
    localeTrigger: await elementMetrics(page, ".aui-locale-trigger"),
  };
  expect(chatMetrics.localeMenu.height, JSON.stringify(chatMetrics)).toBe(36);
  expect(chatMetrics.accountControl.height, JSON.stringify(chatMetrics)).toBe(36);
  expect(chatMetrics.localeTrigger.height, JSON.stringify(chatMetrics)).toBe(36);
  expect(chatMetrics.accountTrigger.height, JSON.stringify(chatMetrics)).toBe(36);
  expect(chatMetrics.localeTrigger.fontSize, JSON.stringify(chatMetrics)).toBe("13px");
  expect(chatMetrics.accountTrigger.fontSize, JSON.stringify(chatMetrics)).toBe("13px");
  expect(chatMetrics.composerInput.fontSize, JSON.stringify(chatMetrics)).toBe("14px");
  expect(chatMetrics.composerInput.minHeight, JSON.stringify(chatMetrics)).toBe("60px");
  expect(chatMetrics.composerSubmit.width, JSON.stringify(chatMetrics)).toBe(36);
  expect(chatMetrics.composerSubmit.height, JSON.stringify(chatMetrics)).toBe(36);

  await page.goto("/showcase/empty-authenticated-workspace");
  await expect(page.getByRole("form", { name: "Start a Codex thread" })).toBeVisible();
  const firstRunMetrics = {
    prompt: await elementMetrics(page, ".aui-first-run-prompt"),
    submit: await elementMetrics(page, ".aui-first-run-submit"),
  };
  expect(firstRunMetrics.prompt.fontSize, JSON.stringify(firstRunMetrics)).toBe("14px");
  expect(firstRunMetrics.prompt.minHeight, JSON.stringify(firstRunMetrics)).toBe("60px");
  expect(firstRunMetrics.submit.width, JSON.stringify(firstRunMetrics)).toBe(36);
  expect(firstRunMetrics.submit.height, JSON.stringify(firstRunMetrics)).toBe(36);
});

test("status and transcript cards do not use decorative left rails", async ({ page }) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/showcase/rich-transcript");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  const cardBorders = await page.evaluate(() =>
    [
      ".aui-approval",
      ".aui-transcript-card",
      ".aui-file-change-card",
      ".aui-plan-card",
      ".aui-status-card",
    ].flatMap((selector) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector)).map((element) => {
        const styles = getComputedStyle(element);
        return {
          borderLeftColor: styles.borderLeftColor,
          borderLeftWidth: styles.borderLeftWidth,
          borderTopColor: styles.borderTopColor,
          borderTopWidth: styles.borderTopWidth,
          selector,
        };
      }),
    ),
  );
  expect(cardBorders.length).toBeGreaterThan(0);
  for (const border of cardBorders) {
    expect(border.borderLeftWidth, JSON.stringify(border)).toBe(border.borderTopWidth);
    expect(border.borderLeftColor, JSON.stringify(border)).toBe(border.borderTopColor);
  }
});

test("thread list metadata keeps dot and text on one row", async ({ page }) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/showcase/default-conversation");
  const layout = await page
    .locator(".aui-thread-list-item")
    .first()
    .evaluate((item) => {
      const meta = item.querySelector(".aui-thread-list-meta");
      const dot = item.querySelector(".aui-thread-list-dot");
      const small = item.querySelector("small");
      const metaRect = meta?.getBoundingClientRect();
      const dotRect = dot?.getBoundingClientRect();
      const smallRect = small?.getBoundingClientRect();
      return {
        dotDisplay: dot ? getComputedStyle(dot).display : null,
        dotTop: dotRect ? Math.round(dotRect.top) : null,
        metaDisplay: meta ? getComputedStyle(meta).display : null,
        metaHeight: metaRect ? Math.round(metaRect.height) : 0,
        smallTop: smallRect ? Math.round(smallRect.top) : null,
      };
    });
  expect(layout.metaDisplay, JSON.stringify(layout)).toBe("flex");
  expect(layout.dotDisplay, JSON.stringify(layout)).toBe("block");
  expect(layout.metaHeight, JSON.stringify(layout)).toBeLessThanOrEqual(18);
  expect(
    Math.abs(layout.dotTop! - layout.smallTop!),
    JSON.stringify(layout),
  ).toBeLessThanOrEqual(4);
});
