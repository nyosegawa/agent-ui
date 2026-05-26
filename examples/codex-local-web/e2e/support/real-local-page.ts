import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

export const FAST_EXPECT_TIMEOUT = 3_000;
const APP_OPEN_TIMEOUT = 20_000;
export const APP_READY_TIMEOUT = 8_000;

export type E2EViewport = { height: number; width: number };

export async function openRealLocalApp(
  page: Page,
  viewport: E2EViewport = { width: 1280, height: 900 },
  path = "/",
) {
  await page.setViewportSize(viewport);
  const url = `http://127.0.0.1:4174${path}`;
  await page.goto(url, {
    timeout: APP_OPEN_TIMEOUT,
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("[data-testid='agent-chat']")).toBeVisible({
    timeout: APP_READY_TIMEOUT,
  });
  await expect(page.getByRole("button", { name: "Open account" })).toBeVisible({
    timeout: APP_READY_TIMEOUT,
  });
  if (path.startsWith("/threads/")) {
    await expect(page.getByRole("heading", { name: "Stored real smoke" })).toBeVisible({
      timeout: APP_READY_TIMEOUT,
    });
    await expect(page.getByRole("textbox", { name: "Message" })).toBeEditable({
      timeout: APP_READY_TIMEOUT,
    });
    return;
  }
  if (path === "/") {
    await expect(page.getByRole("form", { name: "Start a Codex thread" })).toBeVisible({
      timeout: APP_READY_TIMEOUT,
    });
  }
}

export async function openStoredThread(page: Page, viewport: E2EViewport) {
  await openRealLocalApp(page, viewport, "/threads/thread-stored");
}

export async function readyMessageInput(page: Page) {
  const message = page.getByRole("textbox", { name: "Message" });
  await expect(message).toBeEditable({ timeout: FAST_EXPECT_TIMEOUT });
  return message;
}

export async function fillMessage(page: Page, value: string) {
  const message = await readyMessageInput(page);
  await message.fill(value, { timeout: FAST_EXPECT_TIMEOUT });
  await expect(message).toHaveValue(value, { timeout: FAST_EXPECT_TIMEOUT });
}

export function sendButton(page: Page) {
  return page.locator(".aui-composer button[aria-label='Send']");
}

export async function submitComposer(page: Page) {
  const button = sendButton(page);
  await expect(button).toBeEnabled({ timeout: FAST_EXPECT_TIMEOUT });
  await button.click({ timeout: FAST_EXPECT_TIMEOUT });
}

export async function clickContextUsage(page: Page) {
  const summary = page.getByLabel("Context usage", { exact: true });
  await expect(summary).toBeVisible({ timeout: FAST_EXPECT_TIMEOUT });
  await clickHitTarget(page, summary);
}

export async function clickHitTarget(page: Page, locator: Locator) {
  await expect(locator).toBeVisible({ timeout: FAST_EXPECT_TIMEOUT });
  const box = await locator.boundingBox({ timeout: FAST_EXPECT_TIMEOUT });
  expect(box).not.toBeNull();
  const point = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  const hitTarget = await locator.evaluate((element, { x, y }) => {
    const hit = document.elementFromPoint(x, y);
    return Boolean(hit && (element === hit || element.contains(hit)));
  }, point);
  expect(hitTarget).toBe(true);
  await page.mouse.click(point.x, point.y);
}

export async function routeHome(page: Page) {
  await openRealLocalApp(page, page.viewportSize() ?? { width: 1280, height: 900 }, "/");
}

export async function startThread(page: Page, prompt: string) {
  const starter = page.getByRole("form", { name: "Start a Codex thread" });
  await expect(starter).toBeVisible({ timeout: FAST_EXPECT_TIMEOUT });
  await starter.getByRole("textbox", { name: "Message" }).fill(prompt);
  await starter.getByRole("button", { name: "Start thread" }).click({
    timeout: FAST_EXPECT_TIMEOUT,
  });
}

export async function ensureRunningTurn(page: Page) {
  if (
    await stopButton(page)
      .isVisible()
      .catch(() => false)
  )
    return;
  await fillMessage(page, "slow smoke");
  await submitComposer(page);
  await expect(stopButton(page)).toBeVisible({ timeout: FAST_EXPECT_TIMEOUT });
}

export function sendNowButton(page: Page) {
  return page.getByRole("button", { name: "Send now" });
}

export function queuedFollowUps(page: Page) {
  return page.getByRole("region", { name: "Queued follow-ups" });
}

export function stopButton(page: Page) {
  return page.locator(".aui-composer button[aria-label='Stop current turn']");
}

export async function assertComposerAnchored(page: Page) {
  const metrics = await page.evaluate(() => {
    const composer = document
      .querySelector(".aui-compose-panel")
      ?.getBoundingClientRect();
    const messageList = document
      .querySelector(".aui-message-list")
      ?.getBoundingClientRect();
    const send = document
      .querySelector(
        ".aui-composer button[aria-label='Send'], .aui-composer button[aria-label='Stop current turn']",
      )
      ?.getBoundingClientRect();
    const hitTarget = send
      ? document.elementFromPoint(send.left + send.width / 2, send.top + send.height / 2)
      : null;
    return {
      bottomGap: composer
        ? window.innerHeight - composer.bottom
        : Number.POSITIVE_INFINITY,
      horizontalOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      hitTestable: Boolean(hitTarget?.closest(".aui-composer button")),
      overlap: Boolean(composer && messageList && messageList.bottom > composer.top + 1),
    };
  });
  expect(metrics.bottomGap).toBeGreaterThanOrEqual(0);
  expect(metrics.bottomGap).toBeLessThanOrEqual(12);
  expect(metrics.horizontalOverflow).toBeLessThanOrEqual(0);
  expect(metrics.overlap).toBe(false);
  expect(metrics.hitTestable).toBe(true);
}

export async function assertNoHorizontalOverflow(page: Page) {
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(0);
}

export async function assertLocalAppBackgroundFullBleed(page: Page) {
  const shellMetrics = await page.evaluate(() => {
    const element = document.querySelector(".agent-ui-local-app");
    if (!(element instanceof HTMLElement)) throw new Error("missing local app shell");
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      viewportWidth: window.innerWidth,
      width: rect.width,
    };
  });
  expect(shellMetrics.left).toBe(0);
  expect(shellMetrics.right).toBe(shellMetrics.viewportWidth);
  expect(shellMetrics.width).toBe(shellMetrics.viewportWidth);
}

export async function messageListScroll(page: Page) {
  return page.evaluate(() => {
    const element = document.querySelector(".aui-message-list");
    if (!(element instanceof HTMLElement)) throw new Error("missing message list");
    return {
      distanceFromBottom: element.scrollHeight - element.scrollTop - element.clientHeight,
      height: element.scrollHeight,
      top: element.scrollTop,
    };
  });
}
