import { expect, test } from "@playwright/test";
import {
  docsScreenshotRoutes,
  maintainerGalleryRoutes,
  previewRoutes,
  publicShowcaseRoutes,
  visualQaRoutes,
  type VisualQaRouteAudience,
  type VisualQaRouteCategory,
  type VisualQaRouteKind,
} from "../src/fixtures/visual-qa-manifest";

const expectedAudiences: readonly VisualQaRouteAudience[] = ["public", "maintainer"];

const expectedCategories: readonly VisualQaRouteCategory[] = [
  "host-reference",
  "primitive-composition",
  "protocol-lifecycle",
  "visual-maintenance",
];

const expectedKinds: readonly VisualQaRouteKind[] = [
  "closeup-gallery",
  "probe",
  "showcase",
  "specimen",
  "state",
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
    expect(expectedAudiences).toContain(route.audience);
    expect(expectedCategories).toContain(route.category);
    expect(expectedKinds).toContain(route.kind);
    expect(route.description.length, route.id).toBeGreaterThan(24);
    expect(route.ownerSpecs.length, route.id).toBeGreaterThan(0);
    for (const ownerSpec of route.ownerSpecs) {
      expect(ownerSpec, route.id).toMatch(/^examples\/local-react-vite\/e2e\//);
    }
    if (route.audience === "public") {
      expect(route.path, route.id).toMatch(/^\/showcase\//);
      expect(route.kind, route.id).not.toBe("closeup-gallery");
    } else {
      expect(route.path, route.id).toBe("/maintainer-gallery");
      expect(route.docsScreenshot, route.id).toBe(false);
    }
    expect(route.readySelector, route.id).toBeTruthy();
    expect(route.viewports.length, route.id).toBeGreaterThanOrEqual(4);
  }

  expect([...paths]).toEqual([
    "/showcase/default-conversation",
    "/showcase/rich-transcript",
    "/showcase/host-workflow-recipe",
    "/showcase/composer-retry",
    "/showcase/transcript-density",
    "/showcase/resource-resolution",
    "/showcase/scoped-thread-lists",
    "/showcase/usage-only",
    "/showcase/scoped-thread-pane",
    "/showcase/app-connectors",
    "/showcase/empty-authenticated-workspace",
    "/showcase/unauthenticated-first-run",
    "/showcase/bridge-error",
    "/maintainer-gallery",
  ]);
  expect(new Set(visualQaRoutes.map((route) => route.category))).toEqual(
    new Set(expectedCategories),
  );
  expect(publicShowcaseRoutes.map((route) => route.path)).toEqual(
    [...paths].filter((path) => path.startsWith("/showcase/")),
  );
  expect(maintainerGalleryRoutes.map((route) => route.path)).toEqual([
    "/maintainer-gallery",
  ]);
});

test("docs screenshot routes come from public showcase manifest entries", async () => {
  expect(docsScreenshotRoutes.map((route) => route.path)).toEqual([
    "/showcase/default-conversation",
    "/showcase/rich-transcript",
    "/showcase/host-workflow-recipe",
    "/showcase/usage-only",
    "/showcase/scoped-thread-pane",
    "/showcase/app-connectors",
  ]);
  for (const route of docsScreenshotRoutes) {
    expect(route.audience).toBe("public");
    expect(route.docsScreenshot.desktopName).toMatch(/^agent-ui-.+-desktop\.png$/);
    expect(route.docsScreenshot.mobileName).toMatch(/^agent-ui-.+-mobile\.png$/);
  }
});

test("showcase index previews public examples only", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".aui-route-gallery")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Agent UI showcase" })).toBeVisible();
  for (const route of previewRoutes.filter((route) => route.audience === "public")) {
    await expect(
      page.getByRole("link", { name: new RegExp(route.title) }),
    ).toBeVisible();
  }
  await expect(page.getByRole("link", { name: /Maintainer gallery/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Scoped thread lists/ })).toHaveCount(0);
});

test("maintainer gallery previews public examples after closeups", async ({ page }) => {
  await page.goto("/maintainer-gallery");
  await expect(page.locator(".aui-route-gallery")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Agent UI maintainer gallery" })).toBeVisible();
  await expect(page.getByTestId("component-closeups")).toBeVisible();
  for (const route of previewRoutes.filter((route) => route.audience === "public")) {
    await expect(
      page.getByRole("link", { name: new RegExp(route.title) }),
    ).toBeVisible();
  }
  await expect(page.getByRole("link", { name: /Maintainer gallery/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Scoped thread lists/ })).toHaveCount(0);
});

for (const route of visualQaRoutes) {
  test(`visual QA route is reachable: ${route.id}`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.locator(route.readySelector).first()).toBeVisible();
  });
}
