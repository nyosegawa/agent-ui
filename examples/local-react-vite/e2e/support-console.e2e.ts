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
  await expect(page.getByLabel("Agent assistant pane")).toBeVisible();
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  await expect(page.getByLabel("Message", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Agent diagnostics")).toContainText("redacted");

  await page.getByRole("button", { name: /SUP-2051/ }).click();
  await expect(page.getByLabel("Selected inquiry")).toContainText(
    "Duplicate macros after reconnect",
  );
  await expect(page.getByLabel("Selected inquiry")).toContainText(
    "patient fields stay in the CRM",
  );

  await page.getByRole("button", { name: "Send reviewed reply" }).click();
  await expect(page.getByLabel("Reply review")).toContainText("1 sent in fixture");
  await expect(expectNoDocumentOverflow(page)).resolves.toBe(true);
});

test("keeps support console assistant controls reachable on mobile", async ({ page }) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/support-console");

  await expect(page.getByRole("heading", { name: "Support console" })).toBeVisible();
  await expect(page.getByLabel("Ticket queue")).toBeVisible();
  await expect(page.getByLabel("Agent assistant pane")).toBeVisible();
  await expectWithinViewport(page, ".aui-support-console-grid");
  await expectWithinViewport(page, ".aui-support-ticket");
  await page.getByLabel("Agent assistant pane").scrollIntoViewIfNeeded();
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
