import { expect, test, type Page } from "@playwright/test";
import {
  desktopViewport,
  expectActuallyHitTestable,
  expectVisibleInViewport,
  expectWithinViewport,
  mobileViewport,
} from "./support/visual-contracts";

test("renders a host-owned support console around Agent UI", async ({ page }) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/support-console");

  await expect(page.getByRole("heading", { name: "Support console" })).toBeVisible();
  await expect(page.getByLabel("Ticket queue")).toContainText("SUP-2048");
  await expect(page.getByLabel("Selected inquiry")).toContainText(
    "Invoice export dropped rows",
  );
  await expect(page.getByLabel("Selected inquiry")).toContainText(
    "Redact emails, phone numbers, and invoice IDs",
  );
  await expect(page.getByLabel("Audit trail")).toContainText(
    "PII fields redacted before Codex context",
  );
  await expectVisibleInViewport(page, ".aui-support-case-header");
  await expectVisibleInViewport(page, ".aui-support-workflow-grid");
  await expectVisibleInViewport(page, ".aui-support-thread");
  await expectVisibleInViewport(page, ".aui-support-review-stack");
  await expectVisibleInViewport(page, ".aui-support-primary-action");
  await expectVisibleInViewport(page, ".aui-support-audit-list");
  await expect(page.getByLabel("Agent assistant pane")).toBeVisible();
  await expect(page.locator(".aui-thread-surface")).toBeVisible();
  await expect(page.getByLabel("Message", { exact: true })).toBeVisible();
  await expectVisibleInViewport(page, ".aui-composer");
  await expectVisibleInViewport(page, ".aui-support-ticket");
  await expectCompactTicketQueue(page);
  await expect(page.getByLabel("Agent diagnostics")).toContainText("redacted");

  await page.getByRole("button", { name: /SUP-2051/ }).click();
  await expect(page.getByLabel("Selected inquiry")).toContainText(
    "Duplicate macros after reconnect",
  );
  await expect(page.getByLabel("Selected inquiry")).toContainText(
    "patient fields stay in the CRM",
  );
  await expect(page.getByLabel("Agent assistant pane")).toContainText("SUP-2051");
  await expect(page.getByLabel("Agent assistant pane")).toContainText("macro cache");

  await page.getByRole("button", { name: "Send reviewed reply" }).click();
  await expect(page.getByLabel("Reply review")).toContainText("1 sent in fixture");
  await page.getByLabel("Message", { exact: true }).fill("Can we send the safe summary?");
  await page.locator(".aui-composer button[aria-label='Send']").first().click();
  await expect(page.getByLabel("Agent assistant pane")).toContainText(
    "Fixture response recorded for SUP-2051",
  );
  await expect(expectNoDocumentOverflow(page)).resolves.toBe(true);
});

test("keeps support console assistant controls reachable on mobile", async ({ page }) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/support-console");

  await expect(page.getByRole("heading", { name: "Support console" })).toBeVisible();
  await expect(page.getByLabel("Ticket queue")).toBeVisible();
  await expect(page.getByLabel("Agent assistant pane")).toBeVisible();
  await expectWithinViewport(page, ".aui-support-console-grid");
  await expectWithinViewport(page, ".aui-support-ticket-list");
  await expectWithinViewport(page, ".aui-support-ticket:first-child");
  await expectVisibleInViewport(page, ".aui-support-agent-header");
  await expectVisibleInViewport(page, ".aui-composer");
  await expectVisibleInViewport(page, ".aui-thread-surface");
  await expectVisibleInViewport(page, ".aui-composer");
  await expectVisibleInViewport(page, ".aui-composer-settings .aui-composer-tool");

  const sendButton = page.locator(".aui-composer button[aria-label='Send']").first();
  await sendButton.scrollIntoViewIfNeeded();
  await expectActuallyHitTestable(sendButton);

  const modeMenu = page.getByRole("button", { name: "Execution mode" }).first();
  await modeMenu.scrollIntoViewIfNeeded();
  await modeMenu.click();
  await expect(page.getByRole("menu", { name: "Execution mode" })).toBeVisible();
  await expectWithinViewport(page, ".aui-menu-panel");
  await expect(expectNoDocumentOverflow(page)).resolves.toBe(true);
});

async function expectNoDocumentOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
}

async function expectCompactTicketQueue(page: Page) {
  const firstTicketHeight = await page
    .locator(".aui-support-ticket")
    .first()
    .evaluate((element) => element.getBoundingClientRect().height);
  expect(firstTicketHeight).toBeLessThanOrEqual(92);
}
