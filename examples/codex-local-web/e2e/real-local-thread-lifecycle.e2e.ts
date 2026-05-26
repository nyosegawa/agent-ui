import { expect, test } from "@playwright/test";
import {
  APP_READY_TIMEOUT,
  FAST_EXPECT_TIMEOUT,
  assertLocalAppBackgroundFullBleed,
  fillMessage,
  openStoredThread,
  readyMessageInput,
  routeHome,
  startThread,
  submitComposer,
} from "./support/real-local-page";

test("hydrates and resumes a stored thread through the browser websocket transport", async ({
  page,
}) => {
  await openStoredThread(page, { width: 1280, height: 900 });
  await page.setViewportSize({ width: 1920, height: 900 });
  await assertLocalAppBackgroundFullBleed(page);
  await readyMessageInput(page);
  expect(page.url()).toMatch(/\/threads\/thread-stored$/);
});

test("keeps global thread creation in the sidebar, not duplicated in the thread header", async ({
  page,
}) => {
  await openStoredThread(page, { width: 1280, height: 900 });
  await expect(
    page.locator(".aui-sidebar").getByRole("button", { name: "New thread" }),
  ).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(
    page.locator(".aui-thread-actions").getByRole("button", { name: "New thread" }),
  ).toHaveCount(0, { timeout: FAST_EXPECT_TIMEOUT });
});

test("sends a normal turn on an auto-resumed stored thread", async ({ page }) => {
  await openStoredThread(page, { width: 1280, height: 900 });
  await fillMessage(page, "resume smoke");
  await submitComposer(page);
  await expect(page.getByText("Echo: resume smoke")).toBeVisible({
    timeout: APP_READY_TIMEOUT,
  });
});

test("starts a new thread from home and preserves browser back/forward state", async ({
  page,
}) => {
  await openStoredThread(page, { width: 1280, height: 900 });
  await routeHome(page);
  await startThread(page, "new smoke");
  await expect(page).toHaveURL(/\/threads\/thread-live-\d+$/, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.getByText("Echo: new smoke")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });

  await page.goBack();
  await expect(page).toHaveURL(/\/$/, { timeout: FAST_EXPECT_TIMEOUT });
  await expect(page.getByRole("form", { name: "Start a Codex thread" })).toBeVisible({
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
  await expect(page).toHaveURL(/\/$/, { timeout: FAST_EXPECT_TIMEOUT });
  await expect(page.getByRole("form", { name: "Start a Codex thread" })).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await page.goForward();
  await expect(page).toHaveURL(/\/threads\/thread-live-\d+$/, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
});

test("reacts to popstate and sidebar selection without leaking stale thread content", async ({
  page,
}) => {
  await openStoredThread(page, { width: 1280, height: 900 });
  await routeHome(page);
  await startThread(page, "routed smoke");
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
  await page.goForward();
  await expect(page).toHaveURL(/\/threads\/thread-stored$/, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
});
