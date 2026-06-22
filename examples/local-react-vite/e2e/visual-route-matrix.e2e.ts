import { expect, test, type Page } from "@playwright/test";
import {
  visualQaRoutes,
  type VisualQaViewport,
} from "../src/fixtures/visual-qa-manifest";
import { expectWithinViewport } from "./support/visual-contracts";

const viewportSizes: Record<VisualQaViewport, { height: number; width: number }> = {
  compact: { height: 900, width: 700 },
  desktop: { height: 900, width: 1280 },
  mobile: { height: 900, width: 390 },
  short: { height: 520, width: 900 },
  tablet: { height: 1024, width: 768 },
  wide: { height: 960, width: 1440 },
};

const containedSurfaceSelectors = [
  ".aui-shell",
  ".aui-example-frame",
  ".aui-host-recipe",
  ".aui-fixture-gallery",
  ".aui-thread-surface",
  ".aui-message-list",
  ".aui-compose-panel",
  ".aui-composer",
  ".aui-composer-toolbar",
  ".aui-composer-settings",
  ".aui-approval",
  ".aui-approval-actions",
  ".aui-usage",
  ".aui-apps-panel",
  ".aui-closeup",
  ".aui-closeup-stage",
] as const;

test.describe("visual QA route viewport matrix", () => {
  for (const route of visualQaRoutes) {
    for (const viewport of route.viewports) {
      test(`${route.id} is layout-ready on ${viewport}`, async ({ page }) => {
        await page.setViewportSize(viewportSizes[viewport]);
        await page.goto(route.path);
        await expect(page.locator(route.readySelector).first()).toBeVisible();
        await expectNoDocumentHorizontalOverflow(page, route.id, viewport);
        await expectVisibleTextFitsViewport(page, route.id, viewport);
        for (const selector of containedSurfaceSelectors) {
          await expectWithinViewport(page, selector);
        }
      });
    }
  }
});

async function expectNoDocumentHorizontalOverflow(
  page: Page,
  routeId: string,
  viewport: VisualQaViewport,
) {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.overflow, JSON.stringify({ routeId, viewport, metrics })).toBeLessThanOrEqual(
    1,
  );
}

async function expectVisibleTextFitsViewport(
  page: Page,
  routeId: string,
  viewport: VisualQaViewport,
) {
  const failures = await page.evaluate(() => {
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(
        "button, a, input, select, textarea, [role='button'], [role='menuitem'], [role='menuitemradio'], h1, h2, h3, p, dt, dd, li",
      ),
    );
    return candidates.flatMap((element) => {
      const styles = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (
        styles.display === "none" ||
        styles.visibility === "hidden" ||
        rect.width === 0 ||
        rect.height === 0 ||
        rect.bottom < 0 ||
        rect.top > window.innerHeight
      ) {
        return [];
      }
      if (rect.left < -1 || rect.right > window.innerWidth + 1) {
        return [
          {
            className: element.className,
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            tagName: element.tagName,
            text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 120) ?? "",
            viewportWidth: window.innerWidth,
            width: Math.round(rect.width),
          },
        ];
      }
      return [];
    });
  });
  expect(failures, JSON.stringify({ routeId, viewport, failures }, null, 2)).toEqual([]);
}
