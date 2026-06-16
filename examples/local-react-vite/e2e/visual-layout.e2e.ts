import { expect, test } from "@playwright/test";
import {
  desktopViewport,
  expectActuallyHitTestable,
  expectFullyWithinViewport,
  expectVisibleInViewport,
  expectWithinViewport,
  mobileViewport,
  viewportSurfaceSelectors,
  expectVisualLayoutContract,
} from "./support/visual-contracts";

test("matches the desktop shell layout contract", async ({ page }) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  await expectVisualLayoutContract(page, "desktop");
});

test("matches the mobile shell layout contract", async ({ page }) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  await expectVisualLayoutContract(page, "mobile");
});

test("mobile first-run keeps primary chat wide and header controls icon-only", async ({
  page,
}) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/?state=empty");
  await expect(page.getByRole("form", { name: "Start a Codex thread" })).toBeVisible();

  const metrics = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return {
        height: Math.round(box.height),
        left: Math.round(box.left),
        text: element.textContent?.trim().replace(/\s+/g, " ") ?? "",
        width: Math.round(box.width),
      };
    };
    const tools = Array.from(
      document.querySelectorAll(".aui-first-run-toolbar .aui-composer-tool"),
    ).map((element) => {
      const box = element.getBoundingClientRect();
      return {
        height: Math.round(box.height),
        left: Math.round(box.left),
        text: element.textContent?.trim().replace(/\s+/g, " ") ?? "",
        width: Math.round(box.width),
      };
    });
    return {
      firstRun: rect(".aui-first-run-starter"),
      submit: rect(".aui-first-run-submit"),
      toolbar: rect(".aui-first-run-toolbar"),
      threads: rect(".aui-threads-trigger"),
      tools,
      viewportWidth: document.documentElement.clientWidth,
    };
  });

  expect(metrics.firstRun?.width, JSON.stringify(metrics)).toBeGreaterThanOrEqual(360);
  expect(metrics.threads?.width, JSON.stringify(metrics)).toBe(36);
  expect(metrics.tools, JSON.stringify(metrics)).toHaveLength(2);
  for (const tool of metrics.tools) {
    expect(tool.width, JSON.stringify(metrics)).toBeLessThanOrEqual(36);
  }
  expect(metrics.submit?.left, JSON.stringify(metrics)).toBeGreaterThan(320);
  expect(metrics.toolbar?.height, JSON.stringify(metrics)).toBeLessThanOrEqual(40);
  await expect(page.locator(".aui-chat-rail")).toHaveCount(0);
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
  const toolSizes = await page
    .locator(".aui-composer-settings .aui-composer-tool")
    .evaluateAll((tools) =>
      tools.map((tool) => {
        const box = tool.getBoundingClientRect();
        return {
          height: Math.round(box.height),
          text: tool.textContent?.trim().replace(/\s+/g, " ") ?? "",
          width: Math.round(box.width),
        };
      }),
    );
  expect(toolSizes).toHaveLength(2);
  for (const tool of toolSizes) {
    expect(tool.width, JSON.stringify(toolSizes)).toBe(36);
    expect(tool.height, JSON.stringify(toolSizes)).toBeGreaterThanOrEqual(36);
  }
});

test("mobile opens secondary chrome from the status bar context sheet", async ({
  page,
}) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/rich-transcript");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  await expect(page.locator(".aui-chat-rail")).toHaveCount(0);

  await page.getByRole("button", { name: "Agent context" }).click();
  const contextSheet = page.locator(".aui-chat-rail");
  await expect(contextSheet).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(document.activeElement?.closest(".aui-chat-rail"))),
    )
    .toBe(true);
  await expect(page.getByLabel("Status summary")).toBeVisible();
  await expect(page.getByLabel("Usage limits")).toBeVisible();
  await expectWithinViewport(page, ".aui-chat-rail");

  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => ({
      inComposer: Boolean(document.activeElement?.closest(".aui-composer")),
      inSheet: Boolean(document.activeElement?.closest(".aui-chat-rail")),
      inStatus: Boolean(document.activeElement?.closest(".aui-status")),
    })),
  ).toEqual({ inComposer: false, inSheet: true, inStatus: false });

  await page.keyboard.press("Escape");
  await expect(contextSheet).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.activeElement?.classList.contains("aui-agent-context-trigger") ??
          false,
      ),
    )
    .toBe(true);
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
