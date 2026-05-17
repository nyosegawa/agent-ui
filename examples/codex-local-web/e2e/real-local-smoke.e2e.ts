import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const FAST_EXPECT_TIMEOUT = 3_000;
const APP_READY_TIMEOUT = 8_000;
const SHORT_TEST_TIMEOUT = 12_000;
const FLOW_TEST_TIMEOUT = 18_000;

test("hydrates stored threads through the browser websocket transport", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(SHORT_TEST_TIMEOUT);
  await openRealLocalApp(page, { width: 1280, height: 900 }, "/threads/thread-stored");
  await expect(page.getByRole("heading", { name: "Stored real smoke" })).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page).toHaveURL(/\/threads\/thread-stored$/, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
});

test("exposes live thread controls through the browser websocket transport", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(SHORT_TEST_TIMEOUT);
  await openRealLocalApp(page, { width: 1280, height: 900 }, "/threads/thread-stored");
  await expect(page.getByRole("button", { name: "New thread" })).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.locator("[class*=work][class*=trace]")).toHaveCount(0, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
});

test("resumes stored threads, sends follow-up turns, and syncs browser history", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(FLOW_TEST_TIMEOUT);
  await openRealLocalApp(page);
  await expect(page).toHaveURL(/\/threads\/thread-stored$/, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  const message = page.getByRole("textbox", { name: "Message" });
  await expect(message).toBeDisabled({ timeout: FAST_EXPECT_TIMEOUT });
  await resumeStoredThread(page);
  const readyMessage = await readyMessageInput(page);
  await readyMessage.fill("resume smoke");
  await page.locator("form.aui-composer").evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
  });
  await expect(page.getByText("Echo: resume smoke")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });

  await page.getByRole("button", { name: "New thread" }).click({ force: true });
  await expect(page).toHaveURL(/\/threads\/thread-live-\d+$/, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await page.goBack();
  await expect(page).toHaveURL(/\/threads\/thread-stored$/, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.getByRole("heading", { name: "Stored real smoke" })).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await page.goForward();
  await expect(page).toHaveURL(/\/threads\/thread-live-\d+$/, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await page.evaluate(() => {
    window.history.pushState(null, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page).toHaveURL(/\/$/, { timeout: FAST_EXPECT_TIMEOUT });
  await expect(page.getByRole("heading", { name: "Stored real smoke" })).toHaveCount(0, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.getByText("Start a Codex thread")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });

  await page.getByRole("button", { name: /Stored real smoke/ }).click({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page).toHaveURL(/\/threads\/thread-stored$/, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.getByRole("heading", { name: "Stored real smoke" })).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await page.goBack();
  await expect(page).toHaveURL(/\/$/, { timeout: FAST_EXPECT_TIMEOUT });
  await expect(page.getByText("Start a Codex thread")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await page.goForward();
  await expect(page).toHaveURL(/\/threads\/thread-stored$/, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.getByRole("heading", { name: "Stored real smoke" })).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
});

test("opens a thread by URL and accepts image plus arbitrary file attachments", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(FLOW_TEST_TIMEOUT);
  await openRealLocalApp(page, { width: 390, height: 900 }, "/threads/thread-stored");
  await expect(page.getByRole("heading", { name: "Stored real smoke" })).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await resumeStoredThread(page);
  await readyMessageInput(page);

  await page.evaluate(() => {
    const textarea = document.querySelector("textarea.aui-composer-input");
    if (!textarea) throw new Error("missing composer textarea");
    const transfer = new DataTransfer();
    transfer.items.add(new File(["png fixture"], "fixture.png", { type: "image/png" }));
    transfer.items.add(new File(["mesh"], "part.3mf", { type: "application/octet-stream" }));
    textarea.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: transfer,
      }),
    );
  });
  await expect(page.locator(".aui-composer-chip-thumbnail")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.getByText("part.3mf")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(
    page.locator(".aui-composer-chip[data-kind='file'] .aui-composer-chip-meta"),
  ).toContainText(".3mf", { timeout: FAST_EXPECT_TIMEOUT });
  await sendButton(page).click({ force: true, timeout: FAST_EXPECT_TIMEOUT });
  await expect(page.getByText(/Attached file: .*part\.3mf/)).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
});

test("anchors composer to the viewport and uses steer/interrupt while running", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(FLOW_TEST_TIMEOUT);
  await openRealLocalApp(page, { width: 1280, height: 900 }, "/threads/thread-stored");
  await resumeStoredThread(page);
  await readyMessageInput(page);
  await expect(page.getByLabel("Context usage", { exact: true })).toContainText("80%", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await page.getByLabel("Context usage", { exact: true }).click({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.getByLabel("Context usage details")).toContainText("800 / 1,000", {
    timeout: FAST_EXPECT_TIMEOUT,
  });

  await assertComposerAnchored(page);
  const message = page.getByRole("textbox", { name: "Message" });
  await message.fill("slow smoke");
  await sendButton(page).click({ force: true, timeout: FAST_EXPECT_TIMEOUT });
  await expect(stopButton(page)).toBeVisible({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(message).toBeEnabled({ timeout: FAST_EXPECT_TIMEOUT });
  await message.fill("while running");
  await sendAdditionalInstructionsButton(page).click({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(page.getByText("Steered: while running")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(message).toHaveValue("", { timeout: FAST_EXPECT_TIMEOUT });
  await stopButton(page).click({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(page.locator(".aui-status-pill")).not.toContainText("Running", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await assertComposerAnchored(page);

  await page.setViewportSize({ width: 390, height: 900 });
  await assertComposerAnchored(page);
});

test("follows streaming content only while the transcript is near the bottom", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(FLOW_TEST_TIMEOUT);
  await openRealLocalApp(page, { width: 390, height: 900 }, "/threads/thread-stored");
  await resumeStoredThread(page);
  const message = await readyMessageInput(page);
  await message.fill("slow smoke");
  await sendButton(page).click({ force: true, timeout: FAST_EXPECT_TIMEOUT });
  await expect(stopButton(page)).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  const nearBottomBefore = await messageListScroll(page);
  await expect(page.getByText("Echo: slow smoke")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  const nearBottomAfter = await messageListScroll(page);
  expect(nearBottomAfter.top).toBeGreaterThanOrEqual(nearBottomBefore.top);

  await page.locator(".aui-message-list").evaluate((element) => {
    element.scrollTop = 0;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await message.fill("while scrolled up");
  const pausedBefore = await messageListScroll(page);
  await sendAdditionalInstructionsButton(page).click({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(page.getByRole("button", { name: "Jump to latest" })).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  const pausedAfter = await messageListScroll(page);
  expect(pausedAfter.top).toBe(pausedBefore.top);
  await page.getByRole("button", { name: "Jump to latest" }).click({ force: true });
  const latestAfter = await messageListScroll(page);
  expect(latestAfter.top).toBeGreaterThanOrEqual(pausedAfter.top);
});

async function openRealLocalApp(
  page: Page,
  viewport: { height: number; width: number } = { width: 1280, height: 900 },
  path = "/",
) {
  await page.setViewportSize(viewport);
  const url = `http://127.0.0.1:4174${path}`;
  const deadline = Date.now() + APP_READY_TIMEOUT;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      await page.goto(url, { timeout: FAST_EXPECT_TIMEOUT, waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("agent-chat")).toBeVisible({
        timeout: FAST_EXPECT_TIMEOUT,
      });
      break;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(250);
    }
  }
  if (!(await page.getByTestId("agent-chat").isVisible().catch(() => false))) {
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
  await expect(page.getByText(/real-smoke@example.com/)).toBeVisible({
    timeout: APP_READY_TIMEOUT,
  });
}

async function resumeStoredThread(page: Page) {
  const resume = page.getByRole("button", { name: "Resume" });
  await expect(resume).toBeVisible({ timeout: FAST_EXPECT_TIMEOUT });
  await resume.evaluate((button) => (button as HTMLButtonElement).click(), {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.locator(".aui-status-pill", { hasText: "Ready" })).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await readyMessageInput(page);
}

async function readyMessageInput(page: Page) {
  const message = page.getByRole("textbox", { name: "Message" });
  await expect(message).toBeEnabled({ timeout: FAST_EXPECT_TIMEOUT });
  return message;
}

function sendButton(page: Page) {
  return page.locator(".aui-composer button[aria-label='Send']");
}

function sendAdditionalInstructionsButton(page: Page) {
  return page.locator(".aui-composer button[aria-label='Send additional instructions']");
}

function stopButton(page: Page) {
  return page.locator(".aui-composer button[aria-label='Stop']");
}

async function assertComposerAnchored(page: Page) {
  const metrics = await page.evaluate(() => {
    const composer = document.querySelector(".aui-compose-panel")?.getBoundingClientRect();
    const messageList = document.querySelector(".aui-message-list")?.getBoundingClientRect();
    const send = document
      .querySelector(".aui-composer button[aria-label='Send'], .aui-composer button[aria-label='Stop']")
      ?.getBoundingClientRect();
    const hitTarget = send
      ? document.elementFromPoint(send.left + send.width / 2, send.top + send.height / 2)
      : null;
    return {
      bottomGap: composer ? window.innerHeight - composer.bottom : Number.POSITIVE_INFINITY,
      horizontalOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      hitTestable: Boolean(hitTarget?.closest(".aui-composer button")),
      overlap: Boolean(
        composer && messageList && messageList.bottom > composer.top + 1,
      ),
    };
  });
  expect(metrics.bottomGap).toBeGreaterThanOrEqual(0);
  expect(metrics.bottomGap).toBeLessThanOrEqual(12);
  expect(metrics.horizontalOverflow).toBeLessThanOrEqual(0);
  expect(metrics.overlap).toBe(false);
  expect(metrics.hitTestable).toBe(true);
}

async function messageListScroll(page: Page) {
  return page.locator(".aui-message-list").evaluate((element) => ({
    height: element.scrollHeight,
    top: element.scrollTop,
  }));
}
