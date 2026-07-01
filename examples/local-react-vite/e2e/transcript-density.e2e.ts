import { expect, test, type Page } from "@playwright/test";
import { desktopViewport, mobileViewport } from "./support/visual-contracts";

for (const viewport of [
  { ...desktopViewport, name: "desktop" },
  { ...mobileViewport, name: "mobile" },
] as const) {
  test(`transcript density route stays readable on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/showcase/transcript-density");

    await expect(page.getByRole("heading", { name: "Transcript density" })).toBeVisible();
    await expect(page.locator(".aui-message-list")).toHaveAttribute("data-density", "compact");
    await expect(page.locator('[data-category="command"]')).toHaveAttribute(
      "data-density",
      "expanded",
    );
    await expect(page.locator('[data-category="command"]')).toHaveAttribute(
      "data-visibility",
      "collapsed",
    );
    await expect(page.locator('[data-category="command"]')).toContainText("Command");
    await expect(page.locator('[data-category="fileChange"]')).toHaveAttribute(
      "data-density",
      "expanded",
    );
    await expect(page.locator('[data-category="fileChange"]')).toHaveAttribute(
      "data-visibility",
      "collapsed",
    );
    await expect(page.locator('[data-category="fileChange"]')).toContainText("File change");
    await expect(page.locator('[data-category="message"][data-role="assistant"]')).toHaveCount(0);
    await expect(page.locator('[data-category="message"][data-role="user"]')).toHaveCount(0);
    await expect(horizontalOverflowOffenders(page)).resolves.toEqual([]);
  });
}

async function horizontalOverflowOffenders(page: Page) {
  return page.evaluate(() => {
    const offenders: string[] = [];
    if (document.documentElement.scrollWidth > document.documentElement.clientWidth) {
      offenders.push("document");
    }
    const selectors = [
      ".aui-message-list",
      ".aui-turn",
      ".aui-message",
      ".aui-transcript-card",
      ".aui-command-title",
      ".aui-command-output",
    ];
    const viewportRight = window.innerWidth + 0.5;
    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        const rect = element.getBoundingClientRect();
        if (rect.left < -0.5 || rect.right > viewportRight) {
          offenders.push(`${selector}:${Math.round(rect.left)}:${Math.round(rect.right)}`);
        }
      }
    }
    return offenders;
  });
}
