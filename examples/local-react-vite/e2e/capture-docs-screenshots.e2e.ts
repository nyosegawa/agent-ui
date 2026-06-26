/**
 * Refreshes docs/screenshots/*.png against the current build.
 *
 * Skipped unless `CAPTURE_DOCS_SCREENSHOTS=1` so it does not run in CI.
 */
import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { docsScreenshotRoutes } from "../src/fixtures/visual-qa-manifest";

const shouldRun = process.env.CAPTURE_DOCS_SCREENSHOTS === "1";

const outputDir = resolve(import.meta.dirname, "..", "..", "..", "docs", "screenshots");

test.describe.configure({ mode: "default" });

test("refresh docs/screenshots", async ({ browser }) => {
  test.setTimeout(120_000);
  test.skip(
    !shouldRun,
    "Run with CAPTURE_DOCS_SCREENSHOTS=1 to regenerate docs screenshots",
  );
  mkdirSync(outputDir, { recursive: true });
  for (const route of docsScreenshotRoutes) {
    for (const size of ["desktop", "mobile"] as const) {
      const context = await browser.newContext({
        viewport:
          size === "desktop" ? { width: 1280, height: 900 } : { width: 390, height: 900 },
      });
      const page = await context.newPage();
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.locator(route.readySelector).waitFor({ state: "visible" });
      if (route.docsScreenshot.prepare === "refresh-app-connectors") {
        await page.getByRole("button", { name: "Refresh" }).click();
        await expect(page.getByText("Browser")).toBeVisible();
        await expect(page.getByText("Drive")).toBeVisible();
      }
      await page.evaluate(async () => {
        await document.fonts?.ready;
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });
      const filename =
        size === "desktop"
          ? route.docsScreenshot.desktopName
          : route.docsScreenshot.mobileName;
      const path = resolve(outputDir, filename);
      await page.screenshot({ fullPage: route.docsScreenshot.fullPage ?? false, path });
      console.log(`captured ${size} ${route.path} → ${filename}`);
      await context.close();
    }
  }
});
