import { expect, test, type Page } from "@playwright/test";

test("renders Agent UI chat", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Implement approval UI" }),
  ).toBeVisible();
  await expect(page.getByLabel("Command output")).toContainText("7 tests passed");
  await expect(page.getByLabel("Diff preview")).toContainText("AgentDiffPanel");
  await expect(page.getByRole("button", { name: "Approve" }).first()).toBeVisible();
  // Run settings live behind a summary chip inside the composer.
  await expect(page.locator(".aui-run-settings-popover summary")).toContainText("Run settings");
  await page.locator(".aui-run-settings-popover summary").click();
  await expect(page.getByLabel("Run settings")).toContainText("Execution mode");
  await expect(page.getByLabel("Usage limits")).toContainText(
    "fixture-demo-model weekly",
  );
  await expect(page.getByLabel("Search history")).toBeVisible();
  await page.getByRole("button", { name: "Load" }).click();
  await page.getByRole("button", { name: /Stored session/ }).click();
  await expect(page.getByRole("heading", { name: "Stored session" })).toBeVisible();
  await expect(
    page.getByText("Stored session history can be read before resuming."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.locator(".aui-status-pill")).toContainText("Ready");
  // Re-open run settings to verify the resumed run-settings restoration.
  await page.locator(".aui-run-settings-popover").first().evaluate((element) => {
    (element as HTMLDetailsElement).open = true;
  });
  await expect(page.getByLabel("Run settings")).toBeVisible();
  await expect(page.getByLabel("Model", { exact: true })).toHaveValue(
    "fixture-demo-model",
  );
  await expect(page.getByLabel("Effort", { exact: true })).toHaveValue("");
  await expect(page.getByRole("button", { exact: true, name: "Review" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(horizontalOverflowOffenders(page)).resolves.toEqual([]);
  await expect(headerDoesNotOverlapTimeline(page)).resolves.toBe(true);
});

test("does not overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  await expect(page.locator(".aui-run-settings-popover summary").first()).toContainText(
    "Run settings",
  );
  await expect(page.getByLabel("Run settings")).not.toBeVisible();
  await expect(horizontalOverflowOffenders(page)).resolves.toEqual([]);
  await expect(headerDoesNotOverlapTimeline(page)).resolves.toBe(true);
});

async function headerDoesNotOverlapTimeline(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector(".aui-thread-header")?.getBoundingClientRect();
    const actions = document.querySelector(".aui-thread-actions")?.getBoundingClientRect();
    const messages = document.querySelector(".aui-message-list")?.getBoundingClientRect();
    if (!header || !actions || !messages) return false;
    return actions.bottom <= header.bottom && header.bottom <= messages.top;
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
      ".aui-run-settings-popover",
      ".aui-composer",
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

test("renders deterministic empty, login, and bridge-error states", async ({ page }) => {
  await page.goto("/qa");
  await expect(page.getByRole("heading", { name: "Agent UI visual QA" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Bridge error/ })).toBeVisible();

  await page.goto("/?state=empty");
  await expect(page.getByText("fixture@example.com")).toBeVisible();
  await expect(page.getByText("No threads found.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start thread" })).toBeVisible();
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

  await page.goto("/?state=kitchen");
  await expect(
    page.getByRole("heading", { name: "Kitchen-quality Codex UX" }),
  ).toBeVisible();
  await expect(page.getByLabel("Status summary")).toContainText("2 warning");
  await expect(page.getByLabel("Status details")).toContainText("Model rerouted");
  await expect(page.getByLabel("Critical status")).toHaveCount(0);
  await expect(page.getByLabel("Plan")).toContainText("Render rich blocks");
  await expect(page.getByLabel("Web search")).toContainText(
    "Codex App Server generated protocol",
  );
  await expect(page.getByText("MCP tool")).toBeVisible();
  await expect(page.getByText("User input requested")).toBeVisible();
  await expect(page.getByLabel("Token usage")).toContainText("5,800");
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
});

test("renders generic vNext composition examples", async ({ page }) => {
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
  await expect(page.getByRole("heading", { name: "Kitchen-quality Codex UX" })).toBeVisible();
});

test("mobile keeps secondary chrome reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/?state=kitchen");
  await expect(page.getByLabel("Agent context")).toBeVisible();
  await expect(page.getByLabel("Status summary")).toBeVisible();
  await expect(page.getByLabel("Usage limits")).toBeVisible();
  await expect(page.getByLabel("Diagnostics")).toHaveCount(0);
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
  const kitchenFrame = page.frameLocator('iframe[title="Kitchen-quality Codex UX desktop"]');
  await expect(
    kitchenFrame.getByRole("heading", { name: "Kitchen-quality Codex UX" }),
  ).toBeVisible();
  const hostFrame = page.frameLocator('iframe[title="Host workflow recipe desktop"]');
  await expect(hostFrame.getByLabel("Host primitive composition")).toBeVisible();
  const reloadButtons = await page.getByRole("button", { name: "Reload preview" }).count();
  expect(reloadButtons).toBeGreaterThan(0);
});

test("desktop and mobile screenshot buffers are not blank", async ({ page }) => {
  for (const target of [
    { height: 900, url: "/?state=kitchen", width: 1280 },
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
