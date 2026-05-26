import { expect, test } from "@playwright/test";
import {
  desktopViewport,
  expectActuallyHitTestable,
  expectFullyWithinViewport,
  expectVisibleInViewport,
  expectWithinViewport,
  mobileViewport,
  viewportSurfaceSelectors,
  visualContractJson,
} from "./support/visual-contracts";

test("matches the desktop shell layout contract", async ({ page }) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  expect(await visualContractJson(page)).toMatchSnapshot("desktop-layout.json");
});

test("matches the mobile shell layout contract", async ({ page }) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  expect(await visualContractJson(page)).toMatchSnapshot("mobile-layout.json");
});

test("rich transcript mobile keeps approval and composer surfaces inside the viewport", async ({
  page,
}) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/rich-transcript");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  for (const selector of viewportSurfaceSelectors) {
    await expectWithinViewport(page, selector);
  }
});

for (const route of ["/", "/host-workflow-recipe"] as const) {
  test(`${route} mobile keeps thread controls inside the viewport`, async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    await page.goto(route);
    await expect(page.locator(".aui-thread-surface").first()).toBeVisible();
    for (const selector of viewportSurfaceSelectors) {
      await expectWithinViewport(page, selector);
    }
  });
}

test("composer mode menu opens within the viewport on mobile", async ({ page }) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/");
  const modeMenu = page.getByRole("button", { name: "Execution mode" });
  await modeMenu.scrollIntoViewIfNeeded();
  await modeMenu.click();
  await expect(page.getByRole("menu", { name: "Execution mode" })).toBeVisible();
  await expectWithinViewport(page, ".aui-menu-panel");
});

test("model and effort menu stays inside a short viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 360 });
  await page.goto("/");
  await expect(page.locator(".aui-thread-surface").first()).toBeVisible();
  const modelMenu = page.getByRole("button", { name: "Model and effort" }).first();
  await modelMenu.scrollIntoViewIfNeeded();
  await modelMenu.click();
  await expect(page.getByRole("menu", { name: "Model and effort" })).toBeVisible();
  await expectFullyWithinViewport(page, ".aui-menu-panel");
});

for (const route of ["/", "/host-workflow-recipe"] as const) {
  for (const viewport of [
    { ...desktopViewport, name: "desktop" },
    { ...mobileViewport, name: "mobile" },
  ] as const) {
    test(`${route} keeps transcript, composer, and run-settings menus reachable on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(route);
      await expect(page.locator(".aui-thread-surface").first()).toBeVisible();
      for (const selector of [
        ".aui-thread-surface",
        ".aui-message-list",
        ".aui-compose-panel",
        ".aui-composer",
        ".aui-approvals",
        ".aui-approval-actions .aui-btn",
        ".aui-composer-settings .aui-composer-tool",
      ]) {
        if (route === "/host-workflow-recipe") {
          await page.locator(selector).first().scrollIntoViewIfNeeded();
        }
        await expectVisibleInViewport(page, selector);
      }
      if (route === "/host-workflow-recipe") {
        await page
          .locator(".aui-composer button[aria-label='Send']")
          .first()
          .scrollIntoViewIfNeeded();
      }
      await expectActuallyHitTestable(
        page.locator(".aui-composer button[aria-label='Send']").first(),
      );
      const modeMenu = page.getByRole("button", { name: "Execution mode" }).first();
      await modeMenu.scrollIntoViewIfNeeded();
      await modeMenu.click();
      await expectVisibleInViewport(page, ".aui-menu-panel");
      await page.keyboard.press("Escape");
    });
  }
}

test("usage-only page demonstrates four host shells, not a blank page", async ({
  page,
}) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/usage-only");
  for (const heading of [
    "Drop the Codex usage primitive into any host surface",
    "Compact rail slot",
    "Standalone quota panel",
    "Dashboard widget",
    "Inline thread chrome",
  ]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
  const usagePanels = page.locator(".aui-usage");
  expect(await usagePanels.count()).toBeGreaterThanOrEqual(3);
  const summaryTop = await page
    .locator('[aria-label="Usage summary"]')
    .first()
    .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  expect(summaryTop).toBeLessThan(900);
});

test("usage-only mobile keeps content stacked instead of leaving whitespace", async ({
  page,
}) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/usage-only");
  await expect(
    page.getByRole("heading", { name: "Standalone quota panel" }),
  ).toBeVisible();
  await expect(page.locator(".aui-usage-only-section")).toHaveCount(4);
});

test("host workflow recipe never duplicates the status summary", async ({ page }) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/host-workflow-recipe");
  await expect(
    page.getByRole("heading", { name: "Verify Codex local build" }),
  ).toBeVisible();
  await expect(page.locator('[aria-label="Status summary"]')).toHaveCount(1);
});
