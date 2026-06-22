import { expect, test } from "@playwright/test";
import {
  docsScreenshotRoutes,
  previewRoutes,
  visualQaRoutes,
  type VisualQaRouteCategory,
} from "../src/fixtures/visual-qa-manifest";

const expectedCategories: readonly VisualQaRouteCategory[] = [
  "component-closeups",
  "host-reference",
  "primitive-composition",
  "protocol-lifecycle",
];

test("visual QA manifest classifies every route with stable metadata", async () => {
  const ids = new Set<string>();
  const paths = new Set<string>();
  for (const route of visualQaRoutes) {
    expect(route.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(ids.has(route.id), `duplicate route id ${route.id}`).toBe(false);
    ids.add(route.id);
    expect(paths.has(route.path), `duplicate route path ${route.path}`).toBe(false);
    paths.add(route.path);
    expect(expectedCategories).toContain(route.category);
    expect(route.description.length, route.id).toBeGreaterThan(24);
    expect(route.ownerSpec, route.id).toMatch(/^examples\/local-react-vite\/e2e\//);
    expect(route.readySelector, route.id).toBeTruthy();
    expect(route.viewports.length, route.id).toBeGreaterThanOrEqual(4);
  }

  expect([...paths]).toEqual([
    "/",
    "/rich-transcript",
    "/host-workflow-recipe",
    "/composer-retry",
    "/transcript-density",
    "/resource-resolution",
    "/scoped-thread-lists",
    "/usage-only",
    "/scoped-thread-pane",
    "/app-connectors",
    "/?state=empty",
    "/?state=unauth",
    "/?state=bridge-error",
    "/fixture-gallery",
  ]);
  expect(new Set(visualQaRoutes.map((route) => route.category))).toEqual(
    new Set(expectedCategories),
  );
});

test("docs screenshot routes come from the visual QA manifest", async () => {
  expect(docsScreenshotRoutes.map((route) => route.path)).toEqual([
    "/",
    "/rich-transcript",
    "/host-workflow-recipe",
    "/usage-only",
    "/scoped-thread-pane",
    "/app-connectors",
    "/fixture-gallery",
  ]);
  for (const route of docsScreenshotRoutes) {
    expect(route.docsScreenshot.desktopName).toMatch(/^agent-ui-.+-desktop\.png$/);
    expect(route.docsScreenshot.mobileName).toMatch(/^agent-ui-.+-mobile\.png$/);
  }
});

test("fixture gallery previews are a manifest subset", async ({ page }) => {
  await page.goto("/fixture-gallery");
  await expect(page.locator(".aui-fixture-gallery")).toBeVisible();
  for (const route of previewRoutes) {
    await expect(
      page.getByRole("link", { name: new RegExp(route.title) }),
    ).toBeVisible();
  }
  await expect(page.getByRole("link", { name: /Fixture gallery/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Scoped thread lists/ })).toHaveCount(0);
});

for (const route of visualQaRoutes) {
  test(`visual QA route is reachable: ${route.id}`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.locator(route.readySelector).first()).toBeVisible();
  });
}
