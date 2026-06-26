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
import {
  publicApiCatalog,
  publicComponentCatalog,
} from "../src/fixtures/public-component-catalog";

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
      expect(route.path, route.id).toMatch(/^\/showcase(?:\/|$)/);
      expect(route.kind, route.id).not.toBe("closeup-gallery");
    } else {
      expect(route.path, route.id).toMatch(/^\/maintainer(?:-gallery|\/)/);
      expect(route.docsScreenshot, route.id).toBe(false);
    }
    expect(route.readySelector, route.id).toBeTruthy();
    expect(route.viewports.length, route.id).toBeGreaterThanOrEqual(4);
  }

  expect([...paths]).toEqual([
    "/showcase",
    "/showcase/components",
    "/showcase/patterns",
    "/showcase/component-preview",
    "/showcase/default-conversation",
    "/showcase/rich-transcript",
    "/showcase/composed-shell",
    "/showcase/host-workflow-recipe",
    "/showcase/composer-primitives",
    "/showcase/composer-retry",
    "/showcase/transcript-content",
    "/showcase/approvals-status",
    "/showcase/transcript-density",
    "/showcase/resource-resolution",
    "/maintainer/scoped-thread-lists",
    "/showcase/usage-only",
    "/showcase/thread-navigation",
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
    [...paths].filter((path) => path === "/showcase" || path.startsWith("/showcase/")),
  );
  expect(maintainerGalleryRoutes.map((route) => route.path)).toEqual([
    "/maintainer/scoped-thread-lists",
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

test("showcase index exposes user-facing docs, not maintainer previews", async ({ page }) => {
  await page.goto("/showcase");
  await expect(page.locator(".aui-showcase-docs")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Build Codex interfaces with Agent UI" }),
  ).toBeVisible();
  await expect(page.locator(".aui-showcase-preview iframe").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Maintainer gallery/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Scoped thread lists/ })).toHaveCount(0);
});

test("component API catalog shows direct snippet APIs only", async ({ page }) => {
  await page.goto("/showcase/components");
  const catalog = page.getByTestId("public-api-catalog");
  await expect(catalog).toBeVisible();
  await expect(page.getByRole("heading", { name: "Component API Catalog" })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search APIs" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Setup" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Layout primitives" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Status and review" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Advanced capability metadata" })).toBeVisible();
  for (const api of publicApiCatalog) {
    const card = catalog.locator(`[data-api-name="${api.name}"]`);
    await expect(card, api.name).toBeVisible();
    await expect(card.getByText(api.packageName, { exact: true }), api.name).toBeVisible();
  }
  await page.getByRole("searchbox", { name: "Search APIs" }).fill("AgentComposer");
  await expect(catalog.getByRole("heading", { name: "AgentComposer" })).toBeVisible();
  await expect(catalog.getByRole("heading", { name: "AgentChat" })).toHaveCount(0);
});

test("showcase display preferences propagate into previews", async ({ page }) => {
  await page.goto("/showcase/components?theme=dark&locale=ja");
  await expect(page.locator(".aui-showcase-docs")).toHaveAttribute(
    "data-aui-theme",
    "dark",
  );
  await expect(page.getByRole("button", { name: /言語:/ })).toHaveCount(0);
  const firstPreview = page.locator(".aui-showcase-preview iframe").first();
  await expect(firstPreview).toHaveAttribute(
    "src",
    "/showcase/component-preview?api=AgentChat&embed=1&locale=ja&theme=dark",
  );
  await expect(firstPreview.contentFrame().getByRole("textbox", { name: "メッセージ" })).toBeVisible();
});

test("showcase route previews honor dark theme", async ({ page }) => {
  for (const path of [
    "/showcase/host-workflow-recipe",
    "/showcase/usage-only",
    "/showcase/app-connectors",
  ]) {
    await page.goto(`${path}?theme=dark`);
    await expect(
      page.locator('[data-aui-theme="dark"]').first(),
      path,
    ).toBeVisible();
    const colors = await page.evaluate(() => {
      const themed = document.querySelector<HTMLElement>('[data-aui-theme="dark"]');
      if (!themed) return null;
      const styles = getComputedStyle(themed);
      return {
        background: styles.backgroundColor,
        color: styles.color,
      };
    });
    expect(colors?.background, path).not.toBe("rgb(255, 255, 255)");
  }
});

test("embedded dark previews tint the iframe document canvas", async ({ page }) => {
  const paths = [
    ...previewRoutes
      .filter((route) => route.audience === "public")
      .map((route) => route.path),
    ...publicApiCatalog
      .filter((api) => api.isVisual)
      .map((api) => api.previewHref),
  ];
  for (const path of paths) {
    const separator = path.includes("?") ? "&" : "?";
    await page.goto(`${path}${separator}embed=1&theme=dark`);
    await expect(page.locator('[data-aui-theme="dark"]').first(), path).toBeVisible();
    const canvas = await page.evaluate(() => {
      const html = getComputedStyle(document.documentElement);
      const body = getComputedStyle(document.body);
      return {
        bodyBackground: body.backgroundColor,
        bodyColorScheme: body.colorScheme,
        htmlBackground: html.backgroundColor,
        htmlColorScheme: html.colorScheme,
      };
    });
    expect(canvas.htmlBackground, path).not.toBe("rgb(255, 255, 255)");
    expect(canvas.htmlBackground, path).not.toBe("rgb(246, 247, 249)");
    expect(canvas.bodyBackground, path).not.toBe("rgb(255, 255, 255)");
    expect(canvas.bodyBackground, path).not.toBe("rgb(246, 247, 249)");
    expect(canvas.htmlColorScheme, path).toBe("dark");
    expect(canvas.bodyColorScheme, path).toBe("dark");
  }
});

test("showcase navigation preserves display preferences", async ({ page }) => {
  await page.goto("/showcase?theme=dark&locale=ja");
  await expect(page.locator(".aui-showcase-docs")).toHaveAttribute(
    "data-aui-theme",
    "dark",
  );
  await expect(page.locator(".aui-showcase-hero-actions")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Components" }).first()).toHaveAttribute(
    "href",
    "/showcase/components?locale=ja&theme=dark",
  );
  await expect(page.getByRole("link", { name: "Patterns" }).first()).toHaveAttribute(
    "href",
    "/showcase/patterns?locale=ja&theme=dark",
  );
  await expect(page.getByRole("link", { name: "Open route" }).first()).toHaveAttribute(
    "href",
    "/showcase/default-conversation?locale=ja&theme=dark",
  );

  await page.getByRole("link", { name: "Components" }).first().click();
  await expect(page).toHaveURL(/\/showcase\/components\?locale=ja&theme=dark$/);
  await expect(page.locator(".aui-showcase-hero-actions")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Patterns" }).first()).toHaveAttribute(
    "href",
    "/showcase/patterns?locale=ja&theme=dark",
  );

  await page.getByRole("link", { name: "Patterns" }).first().click();
  await expect(page).toHaveURL(/\/showcase\/patterns\?locale=ja&theme=dark$/);
  await expect(page.locator(".aui-showcase-hero-actions")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Start" }).first()).toHaveAttribute(
    "href",
    "/showcase?locale=ja&theme=dark",
  );

  await page.getByRole("link", { name: "Start" }).first().click();
  await expect(page).toHaveURL(/\/showcase\?locale=ja&theme=dark$/);
});

test("component previews do not crop composer controls or expose horizontal overflow", async ({
  page,
}) => {
  await page.goto("/showcase/component-preview?api=AgentComposer");
  await expect(page.locator(".aui-composer")).toBeVisible();
  const metrics = await page.evaluate(() => {
    const frame = document.querySelector(".aui-component-preview-frame")?.getBoundingClientRect();
    const composer = document.querySelector(".aui-composer")?.getBoundingClientRect();
    const button = document
      .querySelector('.aui-composer button[type="submit"]')
      ?.getBoundingClientRect();
    return {
      buttonRight: button?.right ?? 0,
      composerRight: composer?.right ?? 0,
      documentOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      frameRight: frame?.right ?? 0,
    };
  });
  expect(metrics.documentOverflow, JSON.stringify(metrics)).toBeLessThanOrEqual(1);
  expect(metrics.composerRight, JSON.stringify(metrics)).toBeLessThanOrEqual(
    metrics.frameRight + 1,
  );
  expect(metrics.buttonRight, JSON.stringify(metrics)).toBeLessThanOrEqual(
    metrics.frameRight + 1,
  );
});

test("pattern catalog links workflows to snippets and live routes", async ({ page }) => {
  await page.goto("/showcase/patterns");
  const catalog = page.getByTestId("public-pattern-catalog");
  await expect(catalog).toBeVisible();
  await expect(page.getByRole("heading", { name: "Host Patterns" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Workflow recipes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Advanced recipes" })).toBeVisible();
  for (const entry of publicComponentCatalog) {
    const card = catalog.locator(".aui-showcase-pattern-card").filter({
      hasText: entry.title,
    });
    await expect(card, entry.title).toBeVisible();
    const slug = entry.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    await expect(card.getByRole("link", { name: "View snippet" })).toHaveAttribute(
      "href",
      entry.start ? `/showcase#${slug}` : `/showcase/patterns#pattern-${slug}`,
    );
    await expect(card.getByRole("link", { name: "Open route" })).toHaveAttribute(
      "href",
      entry.href,
    );
  }
});

test("showcase index renders the public component catalog", async ({ page }) => {
  await page.goto("/showcase");
  const catalog = page.getByTestId("public-component-catalog");
  await expect(catalog).toBeVisible();
  const startTitles = [
    "Default chat preset",
    "Composed shell",
    "Composer slot",
    "Transcript pane",
    "Review rail",
  ];
  for (const title of startTitles) {
    await expect(catalog.getByRole("heading", { name: title })).toBeVisible();
  }
  await expect(catalog.getByRole("heading", { name: "Usage and diagnostics" })).toHaveCount(0);
  await expect(catalog.getByRole("heading", { name: "Apps and skills metadata" })).toHaveCount(0);
  for (const entry of publicComponentCatalog.filter((entry) => entry.start)) {
    const card = catalog.locator(".aui-showcase-path").filter({
      hasText: entry.title,
    });
    await expect(card, entry.title).toBeVisible();
    await expect(card.getByRole("link", { name: "Open route" })).toHaveAttribute(
      "href",
      entry.href,
    );
    await expect(card.locator(".aui-showcase-preview iframe")).toHaveAttribute(
      "src",
      `${entry.href}?embed=1`,
    );
    await card.getByRole("tab", { name: "Code" }).click();
    await expect(card.getByRole("button", { name: "Copy code" })).toBeVisible();
    await expect(card.locator("pre code")).toContainText(entry.codeApi[0] ?? "");
    await expect(card.getByText("Use this API")).toBeVisible();
    for (const apiName of entry.codeApi) {
      await expect(card.getByText(apiName, { exact: true }), entry.title).toBeVisible();
    }
  }
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
