import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

test("hydrates stored threads through the browser websocket transport", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(20_000);
  await openRealLocalApp(page, { width: 1280, height: 900 }, "/threads/thread-stored");
  await expect(page.getByRole("heading", { name: "Stored real smoke" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await expect(page).toHaveURL(/\/threads\/thread-stored$/);
});

test("exposes live thread controls through the browser websocket transport", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(20_000);
  await openRealLocalApp(page, { width: 1280, height: 900 }, "/threads/thread-stored");
  await expect(page.getByRole("button", { name: "New thread" })).toBeVisible();
  await page.getByRole("button", { name: /Stored real smoke/ }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await expect(page.locator("[class*=work][class*=trace]")).toHaveCount(0);
});

test("resumes stored threads, sends follow-up turns, and syncs browser history", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(20_000);
  await openRealLocalApp(page);
  await expect(page).toHaveURL(/\/threads\/thread-stored$/);
  const message = page.getByRole("textbox", { name: "Message" });
  await expect(message).toBeDisabled();
  await page.getByRole("button", { name: "Resume" }).click({ force: true });
  await expect(page.locator(".aui-status-pill", { hasText: "Ready" })).toBeVisible();
  const readyMessage = page.getByRole("textbox", { name: "Message" });
  await expect(readyMessage).toBeEnabled();
  await readyMessage.fill("resume smoke");
  await page.locator("form.aui-composer").evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
  });
  await expect(page.getByText("Echo: resume smoke")).toBeVisible();

  await page.getByRole("button", { name: "New thread" }).click({ force: true });
  await expect(page).toHaveURL(/\/threads\/thread-live-\d+$/);
  await page.evaluate(() => window.history.back());
  await page.waitForFunction(() => window.location.pathname.endsWith("/threads/thread-stored"));
  await expect(page.getByRole("heading", { name: "Stored real smoke" })).toBeVisible();
  await page.evaluate(() => window.history.forward());
  await page.waitForFunction(() => /\/threads\/thread-live-\d+$/.test(window.location.pathname));
  await page.evaluate(() => {
    window.history.pushState(null, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Stored real smoke" })).toHaveCount(0);
  await expect(page.getByText("Start a Codex thread")).toBeVisible();

  await page.getByRole("button", { name: /Stored real smoke/ }).click();
  await expect(page).toHaveURL(/\/threads\/thread-stored$/);
  await expect(page.getByRole("heading", { name: "Stored real smoke" })).toBeVisible();
  await page.evaluate(() => window.history.back());
  await page.waitForFunction(() => window.location.pathname === "/");
  await expect(page.getByText("Start a Codex thread")).toBeVisible();
  await page.evaluate(() => window.history.forward());
  await page.waitForFunction(() =>
    window.location.pathname.endsWith("/threads/thread-stored"),
  );
  await expect(page.getByRole("heading", { name: "Stored real smoke" })).toBeVisible();
});

test("opens a thread by URL and accepts image plus arbitrary file attachments", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(20_000);
  await openRealLocalApp(page, { width: 390, height: 900 }, "/threads/thread-stored");
  await expect(page.getByRole("heading", { name: "Stored real smoke" })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click({ force: true });
  await expect(page.getByRole("textbox", { name: "Message" })).toBeEnabled();

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
  await expect(page.locator(".aui-composer-chip-thumbnail")).toBeVisible();
  await expect(page.getByText("part.3mf")).toBeVisible();
  await expect(
    page.locator(".aui-composer-chip[data-kind='file'] .aui-composer-chip-meta"),
  ).toHaveText(/\.3mf · \d+ B/);
  await page.locator("form.aui-composer").evaluate((form) => {
    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
  });
  await expect(page.getByText(/Attached file: .*part\.3mf/)).toBeVisible();
});

test("anchors composer to the viewport and uses steer/interrupt while running", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(45_000);
  await openRealLocalApp(page, { width: 1280, height: 900 }, "/threads/thread-stored");
  await page.getByRole("button", { name: "Resume" }).click({ force: true });
  await expect(page.getByRole("textbox", { name: "Message" })).toBeEnabled();
  await expect(page.getByLabel("Context usage", { exact: true })).toContainText("80%");
  await page.getByLabel("Context usage", { exact: true }).click();
  await expect(page.getByLabel("Context usage details")).toContainText("800 / 1,000");
  await page.getByLabel("Context usage", { exact: true }).click();

  await assertComposerAnchored(page);
  const message = page.getByRole("textbox", { name: "Message" });
  await message.fill("slow smoke");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await expect(message).toBeEnabled();
  await message.fill("while running");
  await page.getByRole("button", { name: "Send additional instructions" }).click();
  await expect(page.getByText("Steered: while running")).toBeVisible();
  await expect(message).toHaveValue("");
  await page.getByRole("button", { name: "Stop" }).click();
  await expect(page.locator(".aui-status-pill")).not.toContainText("Running");
  await assertComposerAnchored(page);

  await page.setViewportSize({ width: 390, height: 900 });
  await assertComposerAnchored(page);
});

test("follows streaming content only while the transcript is near the bottom", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(45_000);
  await openRealLocalApp(page, { width: 390, height: 900 }, "/threads/thread-stored");
  await page.getByRole("button", { name: "Resume" }).click({ force: true });
  const message = page.getByRole("textbox", { name: "Message" });
  await message.fill("slow smoke");
  await page.getByRole("button", { name: "Send" }).click();
  const nearBottomBefore = await messageListScroll(page);
  await expect(page.getByText("Echo: slow smoke")).toBeVisible();
  const nearBottomAfter = await messageListScroll(page);
  expect(nearBottomAfter.top).toBeGreaterThanOrEqual(nearBottomBefore.top);

  await page.locator(".aui-message-list").evaluate((element) => {
    element.scrollTop = 0;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await message.fill("while scrolled up");
  const pausedBefore = await messageListScroll(page);
  await page.getByRole("button", { name: "Send additional instructions" }).click();
  await expect(page.getByRole("button", { name: "Jump to latest" })).toBeVisible();
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
  await page.goto(`http://127.0.0.1:4174${path}`);
  await expect(page.getByTestId("agent-chat")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/real-smoke@example.com/)).toBeVisible({
    timeout: 10_000,
  });
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
