import { expect, test, type Page } from "@playwright/test";
import { desktopViewport, mobileViewport } from "./support/visual-contracts";

for (const viewport of [
  { ...desktopViewport, name: "desktop" },
  { ...mobileViewport, name: "mobile" },
] as const) {
  test(`resource resolution route renders safe media metadata on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/resource-resolution");

    await expect(page.getByRole("heading", { name: "Resource resolution" })).toBeVisible();
    await expect(page.getByRole("img", { name: "fixture-image.png" })).toHaveAttribute(
      "src",
      /^data:image\/gif;base64,/,
    );
    await expect(page.getByText("fixture-image.png")).toBeVisible();
    await expect(page.getByText(/agent-ui-fixture-rich-transcript/)).toHaveCount(0);
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
      ".aui-image-block",
      ".aui-image-block img",
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
