import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

test("hydrates and resumes stored threads through the browser websocket transport", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(90_000);
  await openRealLocalApp(page);
  const storedThread = page.getByRole("button", { name: /Stored real smoke/ });
  await expect(storedThread).toBeVisible();
  await expect(page.getByText("Stored thread hydrated.")).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole("button", { name: "Resume" }).click({ force: true });
  await expect(page.locator(".aui-status-pill")).toHaveText("Ready");
});

test("starts a live turn and resolves approval through the browser websocket transport", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(90_000);
  await openRealLocalApp(page);
  await page.getByRole("button", { name: "New thread" }).click({ force: true });
  await expect(page.getByRole("heading", { name: "Live real smoke" })).toBeVisible({
    timeout: 30_000,
  });
  const messageBox = page.getByRole("textbox", { name: "Message" });
  await messageBox.fill("run smoke", { timeout: 30_000 });
  await page.getByRole("button", { name: "Send" }).click({ force: true });
  await expect(page.getByText("Streaming smoke response.")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator(".aui-command-preview")).toContainText(
    "fake command output",
    { timeout: 30_000 },
  );
  await expect(page.getByLabel("Command output")).toContainText("fake command output", {
    timeout: 30_000,
  });
  await expect(page.locator(".aui-work-trace > summary")).toContainText(
    "1 command, 1 file change",
    { timeout: 30_000 },
  );
  await expect(page.locator(".aui-file-change-card")).toHaveCount(1, {
    timeout: 30_000,
  });
  await expect(page.locator(".aui-status-pill")).toHaveText("Needs approval", {
    timeout: 30_000,
  });
  const approvalCard = page.locator(".aui-approval").first();
  await expect(approvalCard).toContainText("Approve command", { timeout: 30_000 });
  const approvalButton = approvalCard
    .locator("button")
    .filter({ hasText: "Approve" })
    .first();
  await expect(approvalButton).toBeVisible({ timeout: 30_000 });
  await approvalButton.click({ force: true });
  await expect(page.locator(".aui-approval")).toHaveCount(0, { timeout: 30_000 });
});

test("real local app shell has stable desktop and mobile layout contracts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("http://127.0.0.1:4174");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  await expect(
    page.locator('select[aria-label="Model"] option[value="smoke-model"]'),
  ).toHaveText("Smoke Model (smoke-model)");
  await expect(noHorizontalOverflow(page)).resolves.toBe(true);
  const desktopRunControls = page.getByLabel("Run settings");
  await expect(desktopRunControls).toBeVisible();
  await expect(page.locator(".aui-composer")).toBeInViewport();
  await expect(independentScrollSurfaces(page)).resolves.toBe(true);
  await page.getByRole("button", { name: "Collapse history" }).click();
  await expect(page.getByRole("button", { name: "Expand history" })).toBeVisible();
  await page.getByRole("button", { name: "Expand history" }).click();
  await expect(page.getByLabel("Search history")).toBeVisible();

  await page.setViewportSize({ width: 390, height: 900 });
  await page.reload();
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  await expect(page.locator(".aui-run-settings-details summary")).toContainText(
    "Run settings",
  );
  await expect(page.getByLabel("Run settings")).not.toBeVisible();
  await expect(noHorizontalOverflow(page)).resolves.toBe(true);
  await expect(chatAppearsBeforeSidebar(page)).resolves.toBe(true);
  await expect(page.locator(".aui-composer")).toBeInViewport();
  await expect(usableMessageTimeline(page)).resolves.toBe(true);
  await expect(headerDoesNotOverlapTimeline(page)).resolves.toBe(true);
});

async function noHorizontalOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
}

async function chatAppearsBeforeSidebar(page: Page) {
  return page.evaluate(() => {
    const chat = document.querySelector(".aui-chat")?.getBoundingClientRect();
    const sidebar = document.querySelector(".aui-sidebar")?.getBoundingClientRect();
    if (!chat || !sidebar) return false;
    return chat.top <= sidebar.top;
  });
}

async function independentScrollSurfaces(page: Page) {
  return page.evaluate(() => {
    const sidebar = document.querySelector(".aui-thread-list");
    const messages = document.querySelector(".aui-message-list");
    if (!sidebar || !messages) return false;
    const sidebarOverflow = getComputedStyle(sidebar).overflowY;
    const messageOverflow = getComputedStyle(messages).overflowY;
    return (
      ["auto", "scroll"].includes(sidebarOverflow) &&
      ["auto", "scroll"].includes(messageOverflow)
    );
  });
}

async function usableMessageTimeline(page: Page) {
  return page.evaluate(() => {
    const messages = document.querySelector(".aui-message-list")?.getBoundingClientRect();
    const composer = document.querySelector(".aui-composer")?.getBoundingClientRect();
    if (!messages || !composer) return false;
    return messages.height >= 180 && composer.bottom <= window.innerHeight;
  });
}

async function headerDoesNotOverlapTimeline(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector(".aui-thread-header")?.getBoundingClientRect();
    const actions = document.querySelector(".aui-thread-actions")?.getBoundingClientRect();
    const messages = document.querySelector(".aui-message-list")?.getBoundingClientRect();
    if (!header || !actions || !messages) return false;
    return actions.bottom <= header.bottom && header.bottom <= messages.top;
  });
}

async function openRealLocalApp(page: Page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("http://127.0.0.1:4174");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  await expect(page.getByText(/real-smoke@example.com/)).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.locator('select[aria-label="Model"] option[value="smoke-model"]'),
  ).toHaveText("Smoke Model (smoke-model)", { timeout: 30_000 });
  await expect(page.getByLabel("Usage limits")).toContainText("codex 5h", {
    timeout: 30_000,
  });
  await expect(page.getByLabel("Usage limits")).toContainText("codex weekly", {
    timeout: 30_000,
  });
  await expect(page.locator(".aui-composer")).toBeInViewport();
}
