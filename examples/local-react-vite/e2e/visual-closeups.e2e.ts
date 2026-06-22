import { expect, test } from "@playwright/test";
import {
  desktopViewport,
  expectWithinViewport,
  mobileViewport,
} from "./support/visual-contracts";

test("fixture gallery mobile close-up stage stays inside the viewport", async ({
  page,
}) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/fixture-gallery");
  await expect(page.getByTestId("component-closeups")).toBeVisible();
  for (const selector of [
    ".aui-fixture-gallery",
    '[data-testid="component-closeups"]',
    ".aui-closeup",
    ".aui-closeup-stage",
    ".aui-closeup-stage .aui-composer",
    ".aui-closeup-stage .aui-composer-toolbar",
    ".aui-closeup-stage .aui-approval",
    ".aui-closeup-stage .aui-approval-actions",
    ".aui-closeup-stage .aui-approval-actions .aui-btn",
  ]) {
    await expectWithinViewport(page, selector);
  }
});

test("component close-up gallery renders direct primitives, not iframes", async ({
  page,
}) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/fixture-gallery");
  const closeups = page.getByTestId("component-closeups");
  await expect(closeups).toBeVisible();
  for (const title of [
    "Composer · normal",
    "Composer · focused",
    "Composer · approval pending",
    "Composer · mobile",
    "Composer · pasted image",
    "Composer · multiple attachments",
    "Composer run settings · compact",
    "Run settings panel",
    "Approval · command",
    "Approval · user input",
    "Command block",
    "Custom command block",
    "Diff / file change",
    "Sidebar search + threads",
    "Usage / status chips",
    "Usage panel",
    "Button system",
    "Thread-start controls",
  ]) {
    await expect(closeups.getByTestId(`closeup:${title}`)).toBeVisible();
  }
  await expect(closeups.locator("iframe")).toHaveCount(0);

  const commandCloseup = closeups.getByTestId("closeup:Approval · command");
  await expect(
    commandCloseup.getByRole("button", {
      name: /^Approve command request approval-command-rich-transcript$/,
    }),
  ).toBeVisible();
  await expect(commandCloseup.locator(".aui-approval")).toHaveCount(1);
  await expect(commandCloseup.locator(".aui-approval").first()).toHaveAttribute(
    "data-kind",
    "commandApproval",
  );

  const userInputCloseup = closeups.getByTestId("closeup:Approval · user input");
  await expect(userInputCloseup.locator(".aui-approval")).toHaveCount(1);
  await expect(userInputCloseup.locator(".aui-approval").first()).toHaveAttribute(
    "data-kind",
    "userInput",
  );

  const commandBlock = closeups.getByTestId("closeup:Command block");
  await expect(commandBlock.locator(".aui-transcript-card")).toHaveCount(1);
  await expect(commandBlock.locator(".aui-message-list")).toHaveCount(0);

  const customCommand = closeups.getByTestId("closeup:Custom command block");
  const customCommandMessage = customCommand.locator(
    '.aui-message[data-kind="commandExecution"]',
  );
  await expect(customCommandMessage).toBeVisible();
  await expect(customCommandMessage.getByTestId("custom-command-renderer")).toContainText(
    "Host command renderer",
  );
  await expect(customCommandMessage.locator(".aui-command-card")).toBeVisible();
  const anchoredApproval = await customCommand.evaluate(() => {
    const command = document.querySelector(
      '[data-testid="closeup:Custom command block"] .aui-message[data-kind="commandExecution"]',
    );
    const anchor = command?.nextElementSibling;
    const approval = anchor?.querySelector('.aui-approval[data-kind="commandApproval"]');
    const approveButton = anchor?.querySelector(
      'button[aria-label="Approve command request approval-command-custom-renderer"]',
    );
    return {
      anchorClass: anchor?.className ?? "",
      approvalInsideAnchor: Boolean(approval),
      approveButtonInsideAnchor: Boolean(approveButton),
    };
  });
  expect(anchoredApproval.anchorClass).toContain("aui-transcript-approval-anchor");
  expect(anchoredApproval.approvalInsideAnchor).toBe(true);
  expect(anchoredApproval.approveButtonInsideAnchor).toBe(true);

  const pastedImage = closeups.getByTestId("closeup:Composer · pasted image");
  await expect(pastedImage.locator(".aui-composer-chip")).toHaveCount(1);
});

test("critical close-ups cover Phase 9 fixture states", async ({ page }) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/fixture-gallery");
  const critical = page.getByTestId("critical-states");
  await expect(critical).toBeVisible();
  for (const title of [
    "Empty state · mobile",
    "Start composer",
    "Sidebar drawer search/select",
    "Local media fallback card",
    "Optimistic pending message",
  ]) {
    await expect(critical.getByTestId(`closeup:${title}`)).toBeVisible();
  }

  const emptyState = critical.getByTestId("closeup:Empty state · mobile");
  await expect(emptyState.locator(".aui-empty .aui-first-run-starter")).toBeVisible();

  const startComposer = critical.getByTestId("closeup:Start composer");
  await expect(startComposer.getByRole("form", { name: "Start a Codex thread" })).toBeVisible();
  await expect(startComposer.getByPlaceholder("Ask Codex what to work on")).toBeVisible();
  await expect(startComposer.getByRole("button", { name: "Start thread" })).toBeVisible();

  const localMedia = critical.getByTestId("closeup:Local media fallback card");
  await expect(localMedia.locator(".aui-image-block-fallback")).toHaveText(
    "Local media unavailable",
  );
  await expect(localMedia.locator(".aui-image-block img")).toHaveCount(0);

  const pendingMessage = critical.getByTestId("closeup:Optimistic pending message");
  await expect(
    pendingMessage.locator(
      '.aui-message[data-kind="userMessage"][data-status="inProgress"]',
    ),
  ).toContainText("Start the renderer audit");
});

test("sidebar drawer close-up searches and selects on mobile", async ({ page }) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/fixture-gallery");
  const closeup = page
    .getByTestId("critical-states")
    .getByTestId("closeup:Sidebar drawer search/select");
  await expect(closeup).toBeVisible();
  await closeup.getByRole("button", { name: "Open thread history" }).click();
  const shell = closeup.getByTestId("agent-chat");
  await expect(shell).toHaveAttribute("data-sidebar-drawer", "open");
  const search = closeup.getByRole("searchbox", { name: "Search history" });
  await search.fill("renderer");
  await expect(closeup.getByRole("button", { name: /Renderer audit/ })).toBeVisible();
  await closeup.getByRole("button", { name: /Renderer audit/ }).click();
  await expect(shell).toHaveAttribute("data-sidebar-drawer", "closed");
  await expect(closeup.getByRole("heading", { name: "Renderer audit" })).toBeVisible();
  await expect(closeup).toContainText(
    "Renderer audit selected from the mobile drawer.",
  );
});

test("focused composer close-up renders the real AgentComposer", async ({ page }) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/fixture-gallery");
  const focused = page.getByTestId("closeup:Composer · focused");
  await expect(focused).toBeVisible();
  await expect(focused.locator('[data-focus-first="true"]')).toBeAttached();
  const composer = focused.locator(".aui-composer");
  await expect(composer).toHaveAttribute("aria-label", "Message composer");
  await expect(focused.locator("textarea.aui-composer-input")).toHaveValue(
    "Apply the renderer audit findings and verify the diff.",
  );
  await expect(composer).toHaveAttribute("data-focused", "true");
});

test("fixture-gallery places component close-ups before route iframe previews", async ({
  page,
}) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/fixture-gallery");
  await expect(page.getByTestId("component-closeups")).toBeVisible();
  const closeupTop = await page
    .getByTestId("component-closeups")
    .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  const firstIframeTop = await page
    .locator("iframe")
    .first()
    .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  expect(closeupTop).toBeLessThan(firstIframeTop);
  expect(closeupTop).toBeLessThan(900 * 2);
});

test("fixture-gallery keeps component close-ups near the top on mobile", async ({
  page,
}) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/fixture-gallery");
  await expect(page.getByTestId("component-closeups")).toBeVisible();
  const closeupTop = await page
    .getByTestId("component-closeups")
    .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  expect(closeupTop).toBeLessThan(900 * 3);
});
