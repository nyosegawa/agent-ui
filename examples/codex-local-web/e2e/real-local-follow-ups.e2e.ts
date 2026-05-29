import { expect, test } from "@playwright/test";
import {
  FAST_EXPECT_TIMEOUT,
  assertComposerAnchored,
  assertNoHorizontalOverflow,
  clickContextUsage,
  ensureRunningTurn,
  fillMessage,
  messageListScroll,
  openStoredThread,
  queuedFollowUps,
  readyMessageInput,
  sendNowButton,
  stopButton,
  submitComposer,
} from "./support/real-local-page";

test("keeps queued follow-ups across the no-thread route", async ({ page }) => {
  await openStoredThread(page, { width: 1280, height: 900 });
  const message = await readyMessageInput(page);
  await fillMessage(page, "slow smoke");
  await submitComposer(page);
  await expect(stopButton(page)).toBeVisible({ timeout: FAST_EXPECT_TIMEOUT });

  await fillMessage(page, "queued across no thread");
  await message.press("Enter");
  await expect(queuedFollowUps(page)).toContainText("queued across no thread", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
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
  await expect(queuedFollowUps(page)).toContainText("queued across no thread", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await sendNowButton(page).click({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(page.getByText("Steered: queued across no thread")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
});

test("anchors composer to the viewport and uses queued follow-ups, steer, and interrupt while running", async ({
  page,
}) => {
  await openStoredThread(page, { width: 1280, height: 900 });
  await expect(page.getByLabel("Context usage", { exact: true })).toContainText("80%", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await clickContextUsage(page);
  await expect(page.getByLabel("Context usage details")).toContainText("800 / 1,000", {
    timeout: FAST_EXPECT_TIMEOUT,
  });

  await assertComposerAnchored(page);
  const message = await readyMessageInput(page);
  await fillMessage(page, "slow smoke");
  await submitComposer(page);
  await expect(stopButton(page)).toBeVisible({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(message).toBeEnabled({ timeout: FAST_EXPECT_TIMEOUT });
  await fillMessage(page, "while running");
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

  await fillMessage(page, "cmd steer");
  await message.press(process.platform === "darwin" ? "Meta+Enter" : "Control+Enter");
  await expect(page.getByText("Steered: cmd steer")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(queuedFollowUps(page)).toHaveCount(0, {
    timeout: FAST_EXPECT_TIMEOUT,
  });

  await fillMessage(page, "keep queued after stop");
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
  await expect(sendNowButton(page)).toHaveCount(0, { timeout: FAST_EXPECT_TIMEOUT });
  await queuedFollowUps(page)
    .getByRole("button", { name: "Edit" })
    .click({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(message).toHaveValue("keep queued after stop", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(queuedFollowUps(page)).toHaveCount(0, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await assertComposerAnchored(page);

  await page.setViewportSize({ width: 390, height: 900 });
  await assertComposerAnchored(page);
});

test("keeps a compact non-scrolling follow-up queue with actionable older items", async ({
  page,
}) => {
  await openStoredThread(page, { width: 1280, height: 900 });
  const message = await readyMessageInput(page);
  await fillMessage(page, "slow smoke");
  await submitComposer(page);
  await expect(stopButton(page)).toBeVisible({ timeout: FAST_EXPECT_TIMEOUT });

  for (let index = 1; index <= 5; index += 1) {
    await fillMessage(page, `queued ${index}`);
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
  await fillMessage(page, "");
  await ensureRunningTurn(page);
  for (const label of ["queued 6", "queued 7"]) {
    await fillMessage(page, label);
    await message.press("Enter");
    await expect(queuedFollowUps(page)).toContainText(label, {
      timeout: FAST_EXPECT_TIMEOUT,
    });
  }
  await page.getByRole("button", { name: "Remove queued 3" }).click({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(queuedFollowUps(page)).not.toContainText("queued 3", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await assertComposerAnchored(page);
  await ensureRunningTurn(page);

  await queuedFollowUps(page).hover({ timeout: FAST_EXPECT_TIMEOUT });
  await page.mouse.wheel(0, 480);
  await assertNoHorizontalOverflow(page);
  const queueMetrics = await page.locator(".aui-follow-up-queue").evaluate((element) => ({
    overflowY: getComputedStyle(element).overflowY,
    ulOverflowY: getComputedStyle(element.querySelector("ul")!).overflowY,
  }));
  expect(queueMetrics).toEqual({ overflowY: "visible", ulOverflowY: "visible" });

  if (
    !(await stopButton(page)
      .isVisible()
      .catch(() => false))
  ) {
    await fillMessage(page, "slow smoke");
    await submitComposer(page);
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
}) => {
  await openStoredThread(page, { width: 390, height: 900 });
  const message = await readyMessageInput(page);
  await fillMessage(page, "slow smoke");
  await submitComposer(page);
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
  await fillMessage(page, "while scrolled up");
  const pausedBefore = await messageListScroll(page);
  expect(pausedBefore.distanceFromBottom).toBeGreaterThan(80);
  await message.press("Enter");
  await sendNowButton(page).click({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(page.getByRole("button", { name: "Jump to latest" })).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  const pausedAfter = await messageListScroll(page);
  expect(pausedAfter.distanceFromBottom).toBeGreaterThan(80);
  await page
    .getByRole("button", { name: "Jump to latest" })
    .click({ timeout: FAST_EXPECT_TIMEOUT });
  const latestAfter = await messageListScroll(page);
  expect(latestAfter.top).toBeGreaterThanOrEqual(pausedAfter.top);
});
