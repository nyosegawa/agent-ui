import { expect, test, type Locator } from "@playwright/test";
import {
  APP_READY_TIMEOUT,
  FAST_EXPECT_TIMEOUT,
  assertLocalAppBackgroundFullBleed,
  fillMessage,
  openRealLocalApp,
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

test("searches, paginates, and selects sidebar history in a real browser", async ({
  page,
}) => {
  await openRealLocalApp(page, { width: 1280, height: 900 });

  const sidebar = page.locator(".aui-sidebar");
  await expect(sidebar.getByRole("button", { name: /Stored real smoke/ })).toBeVisible({
    timeout: APP_READY_TIMEOUT,
  });
  await expect(
    sidebar.getByRole("button", { name: /First page real smoke/ }),
  ).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });

  await sidebar.getByLabel("Search history").fill("Searchable");
  await expect(
    sidebar.getByRole("button", { name: /Searchable real smoke/ }),
  ).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(sidebar.getByRole("button", { name: /Stored real smoke/ })).toHaveCount(
    0,
    { timeout: FAST_EXPECT_TIMEOUT },
  );

  await openRealLocalApp(page, { width: 1280, height: 900 });
  const freshSidebar = page.locator(".aui-sidebar");
  await expect(
    freshSidebar.getByRole("button", { name: /Stored real smoke/ }),
  ).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(freshSidebar.getByRole("button", { name: "Load more" })).toHaveCount(0, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  const orderBeforeSelection = await sidebarThreadOrder(freshSidebar);
  const secondPageThread = freshSidebar.getByRole("button", {
    name: /Second page real smoke/,
  });
  await expect(secondPageThread).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });

  await secondPageThread.click({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(page).toHaveURL(/\/threads\/thread-page-2$/, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.getByRole("heading", { name: "Second page real smoke" })).toBeVisible(
    {
      timeout: FAST_EXPECT_TIMEOUT,
    },
  );
  await expect
    .poll(() => sidebarThreadOrder(freshSidebar), { timeout: FAST_EXPECT_TIMEOUT })
    .toEqual(orderBeforeSelection);
});

test("opens the mobile history drawer and closes it after selecting a thread", async ({
  page,
}) => {
  await openRealLocalApp(page, { width: 390, height: 844 });

  const shell = page.getByTestId("agent-chat");
  await expect(shell).toHaveAttribute("data-sidebar-drawer", "closed", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await page.getByRole("button", { name: "Open thread history" }).click({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(shell).toHaveAttribute("data-sidebar-drawer", "open", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  const drawer = page.locator(".aui-sidebar");
  await expect(drawer.getByRole("button", { name: /Searchable real smoke/ })).toBeVisible(
    {
      timeout: APP_READY_TIMEOUT,
    },
  );

  await drawer.getByRole("button", { name: /Searchable real smoke/ }).click({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page).toHaveURL(/\/threads\/thread-search$/, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(shell).toHaveAttribute("data-sidebar-drawer", "closed", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.getByRole("heading", { name: "Searchable real smoke" })).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
});

test("sends a normal turn on an auto-resumed stored thread", async ({ page }) => {
  await openStoredThread(page, { width: 1280, height: 900 });
  await expect(page.getByText(/stored thread is loading/i)).toHaveCount(0, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.getByText(/Loading thread/i)).toHaveCount(0, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
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

test("shows the first user message before assistant output in a real browser", async ({
  page,
}) => {
  await openStoredThread(page, { width: 1280, height: 900 });
  await routeHome(page);
  await startThread(page, "slow smoke");

  const userMessage = page.locator(".aui-message-list article[data-kind='userMessage']");
  await expect(userMessage).toContainText("slow smoke", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.getByText("Echo: slow smoke")).toHaveCount(0, {
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

async function sidebarThreadOrder(sidebar: Locator) {
  return sidebar.getByRole("button").evaluateAll((buttons) =>
    buttons
      .map((button) => button.textContent?.replace(/\s+/g, " ").trim() ?? "")
      .filter((text) => text.includes("real smoke"))
      .map((text) => text.replace(/(?:Preview|Ready)\s*·.*$/, "").trim()),
  );
}
