import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

test("hydrates and resumes stored threads through the browser websocket transport", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(60_000);
  await openRealLocalApp(page);
  const storedThread = page.getByRole("button", { name: /Stored real smoke/ });
  await expect(storedThread).toBeVisible();
  await storedThread.evaluate((button) => button.click());
  await expect(page.getByText("Stored thread hydrated.")).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole("button", { name: "Resume" }).click({ force: true });
  await expect(page.locator(".aui-status-pill")).toHaveText("Preview");
});

test("starts a live turn and resolves approval through the browser websocket transport", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(60_000);
  await openRealLocalApp(page);
  await page.getByLabel("Model", { exact: true }).selectOption("smoke-model");
  await page
    .getByRole("button", { name: "New thread" })
    .evaluate((button) => button.click());
  await expect(page.getByRole("heading", { name: "Live real smoke" })).toBeVisible();
  await page.getByRole("textbox", { name: "Message" }).evaluate((element) => {
    const textarea = element as HTMLTextAreaElement;
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    valueSetter?.call(textarea, "run smoke");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator(".aui-composer").evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
  });
  await expect(page.getByText("Streaming smoke response.")).toBeVisible();
  await expect(page.locator(".aui-command-preview")).toContainText("fake command output");
  await expect(page.getByLabel("Command output")).toContainText("fake command output");
  await expect(page.locator(".aui-file-change-card")).toContainText("File changes");
  await expect(page.getByText("Approve command")).toBeVisible();
  await expect(page.locator(".aui-status-pill")).toHaveText("Needs approval");
  const approvalButton = page.getByRole("button", {
    name: /^Approve command request approval-\d+$/,
  });
  await approvalButton.evaluate((button) => button.click());
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

  await page.setViewportSize({ width: 390, height: 900 });
  await page.reload();
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  await expect(page.getByLabel("Run settings")).toBeVisible();
  await expect(noHorizontalOverflow(page)).resolves.toBe(true);
  await expect(chatAppearsBeforeSidebar(page)).resolves.toBe(true);
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
}
