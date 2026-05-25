import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

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
  // The root route stays on the start screen, so open the stored thread by URL
  // rather than relying on auto-navigation to the latest thread.
  await openRealLocalApp(page, { width: 1280, height: 900 }, "/threads/thread-stored");
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
  await expect(page.getByRole("form", { name: "Start a Codex thread" })).toBeVisible({
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
  await expect(page.getByRole("form", { name: "Start a Codex thread" })).toBeVisible({
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
  await openRealLocalApp(page, { width: 390, height: 560 }, "/threads/thread-stored");
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

test("queues attachment follow-ups, restores them for edit, and sends payloads", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(FLOW_TEST_TIMEOUT);
  await openRealLocalApp(page, { width: 1280, height: 900 }, "/threads/thread-stored");
  await resumeStoredThread(page);
  const message = await readyMessageInput(page);
  await message.fill("slow smoke");
  await sendButton(page).click({ force: true, timeout: FAST_EXPECT_TIMEOUT });
  await expect(stopButton(page)).toBeVisible({ timeout: FAST_EXPECT_TIMEOUT });

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    buffer: Buffer.from("png fixture"),
    mimeType: "image/png",
    name: "queued-image.png",
  });
  await expect(page.getByText("queued-image.png")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await message.fill("queued image edit");
  await message.press("Enter");
  await expect(page.getByLabel("Queued attachments")).toContainText("queued-image.png", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.getByLabel("Pending attachments")).toHaveCount(0, {
    timeout: FAST_EXPECT_TIMEOUT,
  });

  await page.getByRole("button", { name: "Edit" }).click({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(page.getByLabel("Pending attachments")).toContainText("queued-image.png", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await message.press(process.platform === "darwin" ? "Meta+Enter" : "Control+Enter");
  await expect(page.getByText("Steered: queued image edit")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });

  await fileInput.setInputFiles({
    buffer: Buffer.from("mesh"),
    mimeType: "application/octet-stream",
    name: "queued-file.3mf",
  });
  await expect(page.getByText("queued-file.3mf")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await message.fill("queued file send now");
  await message.press("Enter");
  await expect(page.getByLabel("Queued attachments")).toContainText("queued-file.3mf", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await sendNowButton(page).click({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(page.getByText("Steered: queued file send now")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });

  await fileInput.setInputFiles({
    buffer: Buffer.from("remove"),
    mimeType: "image/png",
    name: "remove-queued.png",
  });
  await expect(page.getByText("remove-queued.png")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await message.fill("remove queued image");
  await message.press("Enter");
  await page.getByRole("button", { name: "Remove" }).click({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(queuedFollowUps(page)).toHaveCount(0, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
});

test("keeps queued follow-ups across the no-thread route", async ({ page }, testInfo) => {
  testInfo.setTimeout(FLOW_TEST_TIMEOUT);
  await openRealLocalApp(page, { width: 1280, height: 900 }, "/threads/thread-stored");
  await resumeStoredThread(page);
  const message = await readyMessageInput(page);
  await message.fill("slow smoke");
  await sendButton(page).click({ force: true, timeout: FAST_EXPECT_TIMEOUT });
  await expect(stopButton(page)).toBeVisible({ timeout: FAST_EXPECT_TIMEOUT });

  await message.fill("queued across no thread");
  await message.press("Enter");
  await expect(queuedFollowUps(page)).toContainText(
    "queued across no thread",
    { timeout: FAST_EXPECT_TIMEOUT },
  );
  await page.evaluate(() => {
    window.history.pushState(null, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page).toHaveURL(/\/$/, { timeout: FAST_EXPECT_TIMEOUT });
  await expect(page.getByRole("form", { name: "Start a Codex thread" })).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });

  await page.getByRole("button", { name: /Stored real smoke/ }).click({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page).toHaveURL(/\/threads\/thread-stored$/, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(queuedFollowUps(page)).toContainText(
    "queued across no thread",
    { timeout: FAST_EXPECT_TIMEOUT },
  );
  await sendNowButton(page).click({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(page.getByText("Steered: queued across no thread")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
});

test("anchors composer to the viewport and uses queued follow-ups, steer, and interrupt while running", async ({
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
  await message.press("Enter");
  await expect(queuedFollowUps(page)).toContainText("while running", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await sendNowButton(page).click({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(page.getByText("Steered: while running")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(queuedFollowUps(page)).toHaveCount(0, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(message).toHaveValue("", { timeout: FAST_EXPECT_TIMEOUT });

  await message.fill("cmd steer");
  await message.press(process.platform === "darwin" ? "Meta+Enter" : "Control+Enter");
  await expect(page.getByText("Steered: cmd steer")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(queuedFollowUps(page)).toHaveCount(0, {
    timeout: FAST_EXPECT_TIMEOUT,
  });

  await message.fill("keep queued after stop");
  await message.press("Enter");
  await expect(queuedFollowUps(page)).toContainText("keep queued after stop", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await stopButton(page).click({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(page.locator(".aui-status-pill")).not.toContainText("Running", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(queuedFollowUps(page)).toContainText("keep queued after stop", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await assertComposerAnchored(page);

  await page.setViewportSize({ width: 390, height: 900 });
  await assertComposerAnchored(page);
});

test("keeps a compact non-scrolling follow-up queue with actionable older items", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(FLOW_TEST_TIMEOUT);
  await openRealLocalApp(page, { width: 1280, height: 900 }, "/threads/thread-stored");
  await resumeStoredThread(page);
  const message = await readyMessageInput(page);
  await message.fill("slow smoke");
  await sendButton(page).click({ force: true, timeout: FAST_EXPECT_TIMEOUT });
  await expect(stopButton(page)).toBeVisible({ timeout: FAST_EXPECT_TIMEOUT });

  for (let index = 1; index <= 5; index += 1) {
    await message.fill(`queued ${index}`);
    await message.press("Enter");
    await expect(queuedFollowUps(page)).toContainText(`queued ${index}`, {
      timeout: FAST_EXPECT_TIMEOUT,
    });
  }

  await expect(queuedFollowUps(page)).toContainText(
    "2 earlier follow-ups kept for this thread",
    { timeout: FAST_EXPECT_TIMEOUT },
  );
  await expect(queuedFollowUps(page)).toContainText("queued 5", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.getByRole("button", { name: "Send now queued 1" })).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await page.getByRole("button", { name: "Send now queued 1" }).click({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.getByText("Steered: queued 1")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await page.getByRole("button", { name: "Edit queued 2" }).click({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(message).toHaveValue("queued 2", { timeout: FAST_EXPECT_TIMEOUT });
  await message.fill("");
  await ensureRunningTurn(page, message);
  for (const label of ["queued 6", "queued 7"]) {
    await message.fill(label);
    await message.press("Enter");
  }
  await page.getByRole("button", { name: "Remove queued 3" }).click({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(queuedFollowUps(page)).not.toContainText("queued 3", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await assertComposerAnchored(page);
  await ensureRunningTurn(page, message);

  await queuedFollowUps(page).hover({ timeout: FAST_EXPECT_TIMEOUT });
  await page.mouse.wheel(0, 480);
  await assertNoHorizontalOverflow(page);
  const queueMetrics = await page.locator(".aui-follow-up-queue").evaluate((element) => ({
    overflowY: getComputedStyle(element).overflowY,
    ulOverflowY: getComputedStyle(element.querySelector("ul")!).overflowY,
  }));
  expect(queueMetrics).toEqual({ overflowY: "visible", ulOverflowY: "visible" });

  if (!(await stopButton(page).isVisible().catch(() => false))) {
    await message.fill("slow smoke");
    await sendButton(page).click({ force: true, timeout: FAST_EXPECT_TIMEOUT });
    await expect(stopButton(page)).toBeVisible({ timeout: FAST_EXPECT_TIMEOUT });
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await assertComposerAnchored(page);
  await expect(stopButton(page)).toBeVisible({ timeout: FAST_EXPECT_TIMEOUT });
  await queuedFollowUps(page)
    .locator("li", { hasText: "queued 4" })
    .getByRole("button", { name: "Remove" })
    .click({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(queuedFollowUps(page)).not.toContainText("queued 4", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await assertNoHorizontalOverflow(page);
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
  expect(pausedBefore.distanceFromBottom).toBeGreaterThan(80);
  await message.press("Enter");
  await sendNowButton(page).click({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(page.getByRole("button", { name: "Jump to latest" })).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  const pausedAfter = await messageListScroll(page);
  expect(pausedAfter.distanceFromBottom).toBeGreaterThan(80);
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

async function ensureRunningTurn(page: Page, message: Locator) {
  if (await stopButton(page).isVisible().catch(() => false)) return;
  await message.fill("slow smoke");
  await sendButton(page).click({ force: true, timeout: FAST_EXPECT_TIMEOUT });
  await expect(stopButton(page)).toBeVisible({ timeout: FAST_EXPECT_TIMEOUT });
}

function sendNowButton(page: Page) {
  return page.getByRole("button", { name: "Send now" });
}

function queuedFollowUps(page: Page) {
  return page.getByRole("region", { name: "Queued follow-ups" });
}

function stopButton(page: Page) {
  return page.locator(".aui-composer button[aria-label='Stop current turn']");
}

async function assertComposerAnchored(page: Page) {
  const metrics = await page.evaluate(() => {
    const composer = document.querySelector(".aui-compose-panel")?.getBoundingClientRect();
    const messageList = document.querySelector(".aui-message-list")?.getBoundingClientRect();
    const send = document
      .querySelector(".aui-composer button[aria-label='Send'], .aui-composer button[aria-label='Stop current turn']")
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

async function assertNoHorizontalOverflow(page: Page) {
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(0);
}

async function messageListScroll(page: Page) {
  return page.locator(".aui-message-list").evaluate((element) => ({
    distanceFromBottom: element.scrollHeight - element.scrollTop - element.clientHeight,
    height: element.scrollHeight,
    top: element.scrollTop,
  }));
}
