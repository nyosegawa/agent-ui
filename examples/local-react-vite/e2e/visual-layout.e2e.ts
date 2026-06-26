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
  await page.goto("/showcase/default-conversation");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  await expectVisualLayoutContract(page, "desktop");
});

test("matches the mobile shell layout contract", async ({ page }) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/showcase/default-conversation");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  await expectVisualLayoutContract(page, "mobile");
});

test("default conversation primary surfaces do not expose horizontal panning", async ({
  page,
}) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/showcase/default-conversation");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  const selectors = [
    ".aui-shell",
    ".aui-chat",
    ".aui-chat-body",
    ".aui-thread-column",
    ".aui-thread-surface",
    ".aui-message-list",
    ".aui-sidebar",
    ".aui-thread-list",
    ".aui-chat-rail",
  ] as const;
  for (const selector of selectors) {
    const element = page.locator(selector).first();
    await expect(element, selector).toBeVisible();
    const metrics = await element.evaluate((node) => {
      node.scrollLeft = 80;
      const styles = getComputedStyle(node);
      return {
        clientWidth: node.clientWidth,
        overflowX: styles.overflowX,
        overscrollX: styles.overscrollBehaviorX,
        scrollLeft: node.scrollLeft,
        scrollWidth: node.scrollWidth,
      };
    });
    expect(metrics.scrollLeft, selector).toBe(0);
    expect(metrics.overscrollX, selector).toBe("none");
    expect(["hidden", "clip"].includes(metrics.overflowX), selector).toBe(true);
    expect(
      metrics.scrollWidth - metrics.clientWidth,
      JSON.stringify({ selector, metrics }),
    ).toBeLessThanOrEqual(1);
  }
});

test("tablet status bar keeps account controls inside the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ height: 1024, width: 768 });
  await page.goto("/showcase/default-conversation");
  await expect(page.getByTestId("agent-chat")).toBeVisible();

  const metrics = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return {
        left: Math.round(box.left),
        right: Math.round(box.right),
        width: Math.round(box.width),
      };
    };
    return {
      account: rect(".aui-account-trigger"),
      documentOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      status: rect(".aui-status"),
      statusActions: rect(".aui-status-actions"),
      viewportWidth: document.documentElement.clientWidth,
    };
  });

  expect(metrics.documentOverflow, JSON.stringify(metrics)).toBeLessThanOrEqual(1);
  expect(metrics.status?.left, JSON.stringify(metrics)).toBeGreaterThanOrEqual(0);
  expect(metrics.status?.right, JSON.stringify(metrics)).toBeLessThanOrEqual(
    metrics.viewportWidth + 1,
  );
  expect(metrics.statusActions?.right, JSON.stringify(metrics)).toBeLessThanOrEqual(
    metrics.viewportWidth + 1,
  );
  expect(metrics.account?.right, JSON.stringify(metrics)).toBeLessThanOrEqual(
    metrics.viewportWidth + 1,
  );
  expect(metrics.account?.width, JSON.stringify(metrics)).toBeLessThanOrEqual(40);
});

test("embedded narrow shell keeps status actions inside the component", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1024 });
  await page.goto("/showcase/default-conversation");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  await page.addStyleTag({
    content: `
      [data-testid="agent-chat"] {
        margin-inline: auto;
        max-width: 700px;
        width: 700px;
      }
    `,
  });

  const metrics = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return {
        left: Math.round(box.left),
        right: Math.round(box.right),
        width: Math.round(box.width),
      };
    };
    return {
      account: rect(".aui-account-trigger"),
      shell: rect('[data-testid="agent-chat"]'),
      statusActions: rect(".aui-status-actions"),
    };
  });

  expect(metrics.shell, JSON.stringify(metrics)).not.toBeNull();
  expect(metrics.statusActions?.right, JSON.stringify(metrics)).toBeLessThanOrEqual(
    metrics.shell!.right + 1,
  );
  expect(metrics.account?.right, JSON.stringify(metrics)).toBeLessThanOrEqual(
    metrics.shell!.right + 1,
  );
  expect(metrics.account?.width, JSON.stringify(metrics)).toBeLessThanOrEqual(40);
});

test("narrow tablet composer keeps settings compact and submit pinned", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 700 });
  await page.goto("/showcase/default-conversation");
  await expect(page.getByTestId("agent-chat")).toBeVisible();

  const metrics = await page.evaluate(() => {
    const box = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        bottom: Math.round(rect.bottom),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
      };
    };
    return {
      composer: box(".aui-composer"),
      submit: box('.aui-composer button[aria-label="Send"]'),
      tools: Array.from(document.querySelectorAll(".aui-composer-tool")).map(
        (tool) => {
          const rect = tool.getBoundingClientRect();
          return {
            labelVisible: Array.from(tool.querySelectorAll(".aui-composer-tool-label"))
              .some((label) => getComputedStyle(label).display !== "none"),
            width: Math.round(rect.width),
          };
        },
      ),
    };
  });

  expect(metrics.composer, JSON.stringify(metrics)).not.toBeNull();
  expect(metrics.submit, JSON.stringify(metrics)).not.toBeNull();
  expect(metrics.tools, JSON.stringify(metrics)).toHaveLength(2);
  for (const tool of metrics.tools) {
    expect(tool.width, JSON.stringify(metrics)).toBeLessThanOrEqual(40);
    expect(tool.labelVisible, JSON.stringify(metrics)).toBe(false);
  }
  expect(metrics.submit!.right, JSON.stringify(metrics)).toBeGreaterThanOrEqual(
    metrics.composer!.right - 20,
  );
  expect(metrics.submit!.right, JSON.stringify(metrics)).toBeLessThanOrEqual(
    metrics.composer!.right + 1,
  );
  expect(metrics.submit!.bottom, JSON.stringify(metrics)).toBeGreaterThanOrEqual(
    metrics.composer!.bottom - 20,
  );
  expect(metrics.submit!.bottom, JSON.stringify(metrics)).toBeLessThanOrEqual(
    metrics.composer!.bottom + 1,
  );
  await expectActuallyHitTestable(
    page.locator('.aui-composer button[aria-label="Send"]').first(),
  );
});

test("narrow tablet first-run composer keeps settings compact and submit pinned", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 700 });
  await page.goto("/showcase/empty-authenticated-workspace");
  await expect(page.getByRole("form", { name: "Start a Codex thread" })).toBeVisible();

  const metrics = await page.evaluate(() => {
    const box = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        bottom: Math.round(rect.bottom),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
      };
    };
    return {
      card: box(".aui-starter-card"),
      cwd: box(".aui-starter-cwd"),
      cwdAction: box(".aui-starter-cwd-action"),
      cwdTrigger: box(".aui-starter-cwd-trigger"),
      submit: box(".aui-first-run-submit"),
      tools: Array.from(
        document.querySelectorAll(".aui-first-run-toolbar .aui-composer-tool"),
      ).map((tool) => {
        const rect = tool.getBoundingClientRect();
        return {
          labelVisible: Array.from(tool.querySelectorAll(".aui-composer-tool-label"))
            .some((label) => getComputedStyle(label).display !== "none"),
          width: Math.round(rect.width),
        };
      }),
    };
  });

  expect(metrics.card, JSON.stringify(metrics)).not.toBeNull();
  expect(metrics.cwd, JSON.stringify(metrics)).not.toBeNull();
  expect(metrics.cwdTrigger, JSON.stringify(metrics)).not.toBeNull();
  expect(metrics.cwdAction, JSON.stringify(metrics)).not.toBeNull();
  expect(metrics.submit, JSON.stringify(metrics)).not.toBeNull();
  expect(metrics.tools, JSON.stringify(metrics)).toHaveLength(2);
  for (const tool of metrics.tools) {
    expect(tool.width, JSON.stringify(metrics)).toBeLessThanOrEqual(40);
    expect(tool.labelVisible, JSON.stringify(metrics)).toBe(false);
  }
  expect(metrics.cwd!.left, JSON.stringify(metrics)).toBeGreaterThanOrEqual(
    metrics.card!.left,
  );
  expect(metrics.cwd!.right, JSON.stringify(metrics)).toBeLessThanOrEqual(
    metrics.card!.right + 1,
  );
  expect(metrics.cwdTrigger!.right, JSON.stringify(metrics)).toBeLessThanOrEqual(
    metrics.card!.right + 1,
  );
  expect(metrics.cwdAction!.right, JSON.stringify(metrics)).toBeLessThanOrEqual(
    metrics.card!.right + 1,
  );
  expect(metrics.submit!.right, JSON.stringify(metrics)).toBeGreaterThanOrEqual(
    metrics.card!.right - 20,
  );
  expect(metrics.submit!.right, JSON.stringify(metrics)).toBeLessThanOrEqual(
    metrics.card!.right + 1,
  );
  expect(metrics.submit!.bottom, JSON.stringify(metrics)).toBeGreaterThanOrEqual(
    metrics.card!.bottom - 20,
  );
  expect(metrics.submit!.bottom, JSON.stringify(metrics)).toBeLessThanOrEqual(
    metrics.card!.bottom + 1,
  );
  await expectWithinViewport(page, ".aui-starter-cwd");
  await expectWithinViewport(page, ".aui-starter-cwd-trigger");
  await expectWithinViewport(page, ".aui-starter-cwd-action");
  await expectActuallyHitTestable(page.locator(".aui-starter-cwd-trigger"));
  await expectActuallyHitTestable(page.locator(".aui-starter-cwd-action"));
  await page.locator(".aui-starter-cwd-trigger").click();
  await expect(page.locator(".aui-starter-cwd-menu")).toBeVisible();
  await expectWithinViewport(page, ".aui-starter-cwd-menu");
  await expectActuallyHitTestable(page.locator(".aui-starter-cwd-open"));
  await expectActuallyHitTestable(page.locator(".aui-first-run-submit"));
});

test("mobile first-run keeps primary chat wide and header controls icon-only", async ({
  page,
}) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/showcase/empty-authenticated-workspace");
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
  await page.goto("/showcase/rich-transcript");
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
  await page.goto("/showcase/rich-transcript");
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

for (const route of ["/showcase/default-conversation", "/showcase/host-workflow-recipe"] as const) {
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
  await page.goto("/showcase/default-conversation");
  const modeMenu = page.getByRole("button", { name: "Run policy" });
  await modeMenu.scrollIntoViewIfNeeded();
  await modeMenu.click();
  await expect(page.getByRole("menu", { name: "Run policy" })).toBeVisible();
  await expectWithinViewport(page, ".aui-menu-panel");
});

test("model and effort menu stays inside a short viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 360 });
  await page.goto("/showcase/default-conversation");
  await expect(page.locator(".aui-thread-surface").first()).toBeVisible();
  const modelMenu = page.getByRole("button", { name: "Model and effort" }).first();
  await modelMenu.scrollIntoViewIfNeeded();
  await modelMenu.click();
  await expect(page.getByRole("menu", { name: "Model and effort" })).toBeVisible();
  await expectFullyWithinViewport(page, ".aui-menu-panel");
});

for (const route of ["/showcase/default-conversation", "/showcase/host-workflow-recipe"] as const) {
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
        if (route === "/showcase/host-workflow-recipe") {
          await page.locator(selector).first().scrollIntoViewIfNeeded();
        }
        await expectVisibleInViewport(page, selector);
      }
      if (route === "/showcase/host-workflow-recipe") {
        await page
          .locator(".aui-composer button[aria-label='Send']")
          .first()
          .scrollIntoViewIfNeeded();
      }
      await expectActuallyHitTestable(
        page.locator(".aui-composer button[aria-label='Send']").first(),
      );
      const modeMenu = page.getByRole("button", { name: "Run policy" }).first();
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
  await page.goto("/showcase/usage-only");
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
  await page.goto("/showcase/usage-only");
  await expect(
    page.getByRole("heading", { name: "Standalone quota panel" }),
  ).toBeVisible();
  await expect(page.locator(".aui-usage-only-section")).toHaveCount(4);
});

test("host workflow recipe never duplicates the status summary", async ({ page }) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/showcase/host-workflow-recipe");
  await expect(
    page.getByRole("heading", { name: "Verify Codex local build" }),
  ).toBeVisible();
  await expect(page.locator('[aria-label="Status summary"]')).toHaveCount(1);
});

test("host workflow side rail does not create horizontal scrolling", async ({ page }) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/showcase/host-workflow-recipe");
  const rail = page.getByRole("complementary", { name: "Host workflow context" });
  await expect(rail).toBeVisible();
  await expect(page.locator('[aria-label="Status summary"]')).toBeVisible();
  await expect(page.locator('[aria-label="Usage summary"]')).toBeVisible();
  const metrics = await rail.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(metrics.scrollWidth - metrics.clientWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(1);
});

test("host workflow columns do not accept horizontal panning", async ({ page }) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/showcase/host-workflow-recipe");
  const selectors = [
    ".aui-host-thread",
    ".aui-host-thread .aui-sidebar",
    ".aui-host-thread .aui-thread-column",
    ".aui-host-thread .aui-message-list",
    ".aui-host-context",
  ] as const;
  for (const selector of selectors) {
    const element = page.locator(selector).first();
    await expect(element, selector).toBeVisible();
    const metrics = await element.evaluate((node) => {
      node.scrollLeft = 80;
      return {
        scrollLeft: node.scrollLeft,
        touchAction: getComputedStyle(node).touchAction,
      };
    });
    expect(metrics.scrollLeft, selector).toBe(0);
    expect(metrics.touchAction, selector).toContain("pan-y");
  }
});
