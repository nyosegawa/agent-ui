import { expect, test, type Page } from "@playwright/test";

test("renders Agent UI chat", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Theme" })).toBeVisible();
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.getByTestId("agent-chat")).toHaveAttribute("data-aui-theme", "dark");
  await page.getByRole("radio", { name: "Light" }).click();
  await expect(page.getByTestId("agent-chat")).toHaveAttribute("data-aui-theme", "light");
  await expect(
    page.getByRole("heading", { name: "Implement approval UI" }),
  ).toBeVisible();
  await page.getByLabel("Command output").first().click();
  await expect(page.getByLabel("Command output")).toContainText("7 tests passed");
  await page.getByLabel("Diff preview").first().click();
  await expect(page.getByLabel("Diff preview")).toContainText("AgentDiffViewer");
  await expect(page.getByRole("button", { name: "Approve" }).first()).toBeVisible();

  // Mode / model / effort live in the composer toolbar as compact menus —
  // there is no separate "Run settings" disclosure anymore.
  await expect(page.locator(".aui-run-settings-popover")).toHaveCount(0);
  const modeMenu = page.getByRole("button", { name: "Execution mode" });
  await expect(modeMenu).toBeVisible();
  await modeMenu.click();
  await expect(page.getByRole("menu", { name: "Execution mode" })).toBeVisible();
  await expect(
    page.getByRole("menuitemradio", { name: /Read-only/ }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu", { name: "Execution mode" })).toHaveCount(0);

  await expect(page.getByLabel("Usage limits")).toContainText(
    "fixture-demo-model weekly",
  );

  // History search has no standalone Load button; typing auto-filters it.
  await expect(page.getByLabel("Search history")).toBeVisible();
  await expect(page.getByRole("button", { name: "Load", exact: true })).toHaveCount(0);
  await page.getByLabel("Search history").fill("stored");
  await page.getByRole("button", { name: /Stored session/ }).click();
  await expect(page.getByRole("heading", { name: "Stored session" })).toBeVisible();
  await expect(
    page.getByText("Stored session history can be read before resuming."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.locator(".aui-status-pill")).toContainText("Ready");
  await expect(page.getByLabel("Message", { exact: true })).toBeEnabled();

  await expect(horizontalOverflowOffenders(page)).resolves.toEqual([]);
  await expect(headerDoesNotOverlapTimeline(page)).resolves.toBe(true);
});

test("does not overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  // Thread history is a drawer reached from the composer-adjacent Threads
  // trigger, not a permanently stacked panel.
  await expect(page.getByRole("button", { name: "Open thread history" })).toBeVisible();
  await expect(page.getByLabel("Message", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Execution mode" })).toBeVisible();
  await expect(horizontalOverflowOffenders(page)).resolves.toEqual([]);
  await expect(headerDoesNotOverlapTimeline(page)).resolves.toBe(true);
});

test("opens the thread history drawer on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  await expect(page.locator(".aui-sidebar")).toHaveCount(0);
  await page.getByRole("button", { name: "Open thread history" }).click();
  await expect(page.locator(".aui-sidebar")).toBeVisible();
  await expect(page.getByLabel("Search history")).toBeVisible();
  await page.getByRole("button", { name: "Close history" }).click();
  await expect(page.locator(".aui-sidebar")).toHaveCount(0);
});

async function headerDoesNotOverlapTimeline(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector(".aui-thread-header")?.getBoundingClientRect();
    const actions = document.querySelector(".aui-thread-actions")?.getBoundingClientRect();
    const messages = document.querySelector(".aui-message-list")?.getBoundingClientRect();
    if (!header || !actions || !messages) return false;
    return actions.bottom <= header.bottom + 1 && header.bottom <= messages.top + 1;
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
      ".aui-markdown",
      ".aui-command-output",
      ".aui-diff",
      ".aui-thread-title",
      ".aui-thread-list-item",
      ".aui-thread-list-meta",
      ".aui-composer",
      ".aui-composer-toolbar",
      ".aui-composer-tool",
      ".aui-approvals",
      ".aui-approval",
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

async function contextUsagePopoverIsNotClippedByComposer(page: Page) {
  return page.evaluate(() => {
    const composer = document.querySelector(".aui-composer")?.getBoundingClientRect();
    const popoverElement = document.querySelector(".aui-context-usage-popover");
    const popover = popoverElement?.getBoundingClientRect();
    if (!composer || !popover || !popoverElement) return false;
    const hit = document.elementFromPoint(popover.left + 16, popover.top + 16);
    return popover.top < composer.top && Boolean(hit && popoverElement.contains(hit));
  });
}

test("renders deterministic empty, login, and bridge-error states", async ({ page }) => {
  await page.goto("/qa");
  await expect(page.getByRole("heading", { name: "Agent UI visual QA" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Bridge error/ })).toBeVisible();

  await page.goto("/?state=empty");
  const account = page.getByRole("button", { name: "Open account" });
  await expect(account).toBeVisible();
  await expect(account).toHaveAttribute("title", /fixture@example.com/);
  await account.click();
  const accountDialog = page.getByRole("dialog", { name: "Account details" });
  await expect(accountDialog).toContainText("fixture@example.com");
  await expect(accountDialog).toContainText("Usage");
  await page.keyboard.press("Escape");
  await expect(page.getByText("No threads found.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start thread" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start thread" })).toBeDisabled();
  // New threads expose cwd / project selection at thread start, fully inside
  // the first-run starter composer.
  await page.getByRole("textbox", { name: "Message" }).fill("start a fixture thread");
  await expect(page.getByRole("button", { name: "Start thread" })).toBeEnabled();
  const cwdTrigger = page.getByRole("button", { name: "Working directory" });
  await expect(cwdTrigger).toBeVisible();
  await cwdTrigger.click();
  await expect(page.getByRole("menu", { name: "Working directory" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Open folder..." })).toBeVisible();
  const cwdFits = await cwdTrigger.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.left >= -1 && rect.right <= window.innerWidth + 1;
  });
  expect(cwdFits).toBe(true);
  await expect(page.getByLabel("Usage limits")).toContainText(
    "fixture-demo-model weekly",
  );

  await page.goto("/?state=unauth");
  await expect(page.getByText("Connect Codex")).toBeVisible();
  await page.getByRole("button", { name: "Start device-code login" }).click();
  await expect(page.getByText("ABCD-EFGH")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open device login" })).toHaveAttribute(
    "href",
    "https://chatgpt.com/activate",
  );

  await page.goto("/?state=bridge-error");
  await expect(page.getByLabel("Diagnostics")).toContainText(
    "Fixture bridge failed before connecting to Codex App Server.",
  );
  await expect(page.getByText("Codex bridge unavailable")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start thread" })).toHaveCount(0);

  await page.goto("/rich-transcript?theme=dark");
  await expect(
    page.getByRole("heading", { name: "Rich transcript fixture" }),
  ).toBeVisible();
  await expect(page.getByTestId("agent-chat")).toHaveAttribute("data-aui-theme", "dark");
  const shellBackground = await page
    .getByTestId("agent-chat")
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(shellBackground).not.toBe("rgb(247, 246, 241)");
  await expect(page.getByLabel("Status summary")).toContainText("2 warning");
  await expect(page.getByLabel("Status details")).toContainText("Model rerouted");
  await expect(page.getByLabel("Critical status")).toHaveCount(0);
  await expect(page.getByLabel("Plan")).toContainText("Render rich blocks");
  await expect(page.getByLabel("Web search")).toContainText(
    "Codex App Server generated protocol",
  );
  await expect(page.getByText("MCP tool")).toBeVisible();
  await expect(page.getByText("User input requested")).toBeVisible();
  await expect(page.getByLabel("Context usage", { exact: true })).toContainText("58%");
  await page.getByLabel("Context usage", { exact: true }).click();
  await expect(page.getByLabel("Context usage details")).toContainText("5,800 / 10,000");
  await expect(contextUsagePopoverIsNotClippedByComposer(page)).resolves.toBe(true);
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
});

test("renders primitive composition examples", async ({ page }) => {
  await page.goto("/scoped-thread-pane");
  await expect(page.getByRole("heading", { name: "Scoped thread pane" }).first()).toBeVisible();
  await expect(page.getByText("This pane stays locked to thread-fixed.")).toBeVisible();
  await expect(page.getByText("Active host thread")).toHaveCount(0);

  await page.goto("/usage-only");
  await expect(
    page.getByRole("heading", {
      name: "Drop the Codex usage primitive into any host surface",
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Usage limits").first()).toContainText(
    "fixture-demo-model weekly",
  );
  await expect(page.getByLabel("Message composer")).toHaveCount(0);

  await page.goto("/app-connectors");
  await expect(page.getByRole("heading", { name: "App connectors" })).toBeVisible();
  await page.getByRole("button", { name: "Refresh" }).click();
  await expect(page.getByText("Browser")).toBeVisible();
  await expect(page.getByText("Drive")).toBeVisible();

  await page.goto("/host-workflow-recipe");
  await expect(page.getByLabel("Host primitive composition")).toBeVisible();
  await expect(page.getByLabel("Host workflow context")).toContainText(
    "Host workflow context",
  );
  await expect(page.getByLabel("Host-owned panel")).toContainText("Validation status");
  await expect(page.getByLabel("Host-owned panel")).toContainText("Pending requests");
  await expect(page.getByLabel("Host-owned panel")).toContainText("Usage windows");
  await expect(page.getByRole("heading", { name: "Rich transcript fixture" })).toBeVisible();
});

test("mobile keeps secondary chrome reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/rich-transcript");
  await expect(page.getByLabel("Agent context")).toBeVisible();
  await expect(page.getByLabel("Status summary")).toBeVisible();
  await expect(page.getByLabel("Usage limits")).toBeVisible();
  const railDisplay = await page
    .locator(".aui-chat-rail")
    .evaluate((element) => getComputedStyle(element).display);
  expect(railDisplay).not.toBe("none");
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
});

test("fixture gallery previews load meaningful content", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/fixture-gallery");
  await expect(page.getByRole("heading", { name: "Agent UI visual QA" })).toBeVisible();
  const richTranscriptFrame = page.frameLocator(
    'iframe[title="Rich transcript fixture desktop"]',
  );
  await expect(
    richTranscriptFrame.getByRole("heading", { name: "Rich transcript fixture" }),
  ).toBeVisible();
  const hostFrame = page.frameLocator('iframe[title="Host workflow recipe desktop"]');
  await expect(hostFrame.getByLabel("Host primitive composition")).toBeVisible();
  const reloadButtons = await page.getByRole("button", { name: "Reload preview" }).count();
  expect(reloadButtons).toBeGreaterThan(0);
});

test("desktop and mobile screenshot buffers are not blank", async ({ page }) => {
  for (const target of [
    { height: 900, url: "/rich-transcript", width: 1280 },
    { height: 900, url: "/host-workflow-recipe", width: 390 },
  ]) {
    await page.setViewportSize({ width: target.width, height: target.height });
    await page.goto(target.url);
    await expect(page.locator("body")).toBeVisible();
    const screenshot = await page.screenshot({ fullPage: false });
    expect(screenshot.length).toBeGreaterThan(20_000);
    expect(new Set(screenshot).size).toBeGreaterThan(120);
  }
});
