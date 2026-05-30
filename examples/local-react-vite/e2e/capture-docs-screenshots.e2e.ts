/**
 * Refreshes docs/screenshots/*.png against the current build.
 *
 * Skipped unless `CAPTURE_DOCS_SCREENSHOTS=1` so it does not run in CI.
 */
import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const shouldRun = process.env.CAPTURE_DOCS_SCREENSHOTS === "1";

const outputDir = resolve(import.meta.dirname, "..", "..", "..", "docs", "screenshots");

const routes: ReadonlyArray<{
  desktopName: string;
  fullPage?: boolean;
  mobileName: string;
  path: string;
  readySelector: string;
}> = [
  {
    desktopName: "agent-ui-home-desktop.png",
    mobileName: "agent-ui-home-mobile.png",
    path: "/",
    readySelector: '[data-testid="agent-chat"]',
  },
  {
    desktopName: "agent-ui-rich-transcript-desktop.png",
    mobileName: "agent-ui-rich-transcript-mobile.png",
    path: "/rich-transcript",
    readySelector: '[data-testid="agent-chat"]',
  },
  {
    desktopName: "agent-ui-host-workflow-desktop.png",
    fullPage: true,
    mobileName: "agent-ui-host-workflow-mobile.png",
    path: "/host-workflow-recipe",
    readySelector: ".aui-host-recipe",
  },
  {
    desktopName: "agent-ui-usage-only-desktop.png",
    mobileName: "agent-ui-usage-only-mobile.png",
    path: "/usage-only",
    readySelector: ".aui-usage-only",
  },
  {
    desktopName: "agent-ui-scoped-thread-desktop.png",
    mobileName: "agent-ui-scoped-thread-mobile.png",
    path: "/scoped-thread-pane",
    readySelector: ".aui-example-frame .aui-thread-surface",
  },
  {
    desktopName: "agent-ui-app-connectors-desktop.png",
    mobileName: "agent-ui-app-connectors-mobile.png",
    path: "/app-connectors",
    readySelector: ".aui-example-frame .aui-apps-panel",
  },
  {
    desktopName: "agent-ui-fixture-gallery-desktop.png",
    fullPage: true,
    mobileName: "agent-ui-fixture-gallery-mobile.png",
    path: "/fixture-gallery",
    readySelector: ".aui-fixture-gallery",
  },
];

test.describe.configure({ mode: "default" });

test("refresh docs/screenshots", async ({ browser }) => {
  test.setTimeout(120_000);
  test.skip(
    !shouldRun,
    "Run with CAPTURE_DOCS_SCREENSHOTS=1 to regenerate docs screenshots",
  );
  mkdirSync(outputDir, { recursive: true });
  for (const route of routes) {
    for (const size of ["desktop", "mobile"] as const) {
      const context = await browser.newContext({
        viewport:
          size === "desktop" ? { width: 1280, height: 900 } : { width: 390, height: 900 },
      });
      const page = await context.newPage();
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.locator(route.readySelector).waitFor({ state: "visible" });
      if (route.path === "/app-connectors") {
        await page.getByRole("button", { name: "Refresh" }).click();
        await expect(page.getByText("Browser")).toBeVisible();
        await expect(page.getByText("Drive")).toBeVisible();
      }
      await page.evaluate(async () => {
        await document.fonts?.ready;
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });
      const filename = size === "desktop" ? route.desktopName : route.mobileName;
      const path = resolve(outputDir, filename);
      await page.screenshot({ fullPage: route.fullPage ?? false, path });
      console.log(`captured ${size} ${route.path} → ${filename}`);
      await context.close();
    }
  }
});
