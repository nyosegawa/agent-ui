import { expect, test, type Page } from "@playwright/test";
import {
  desktopViewport,
  expectActuallyHitTestable,
  expectVisibleInViewport,
  expectWithinViewport,
  mobileViewport,
} from "./support/visual-contracts";

const tabletViewport = { height: 900, width: 900 } as const;
const compactDesktopViewport = { height: 820, width: 1180 } as const;

test("renders a support console operations surface around Agent UI", async ({ page }) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/support-console");

  await expect(page.getByRole("heading", { name: "Support reply desk" })).toBeVisible();
  await expect(page.getByLabel("Review workflow")).toContainText("Lead approval");
  await expect(page.getByLabel("Ticket queue")).toContainText("SUP-2048");
  await expect(page.getByLabel("Queue filters")).toContainText("Urgent");
  await expect(page.getByLabel("Selected inquiry")).toContainText(
    "Invoice export dropped rows",
  );
  await expect(page.getByLabel("Case readiness")).toContainText("Lead review");
  await expect(page.getByLabel("Selected inquiry")).toContainText(
    "Redact emails, phone numbers, and invoice IDs",
  );
  await expect(page.getByLabel("Response plan")).toContainText(
    "Verify corrected CSV row count",
  );
  await expect(page.getByLabel("Support assistant")).toContainText("Codex apps");
  await expect(page.getByLabel("Audit trail")).toContainText(
    "PII fields redacted before Codex context",
  );
  await expectVisibleInViewport(page, ".aui-support-case-header");
  await expectVisibleInViewport(page, ".aui-support-workflow-grid");
  await expectVisibleInViewport(page, ".aui-support-thread");
  await expectVisibleInViewport(page, ".aui-support-review-stack");
  await expectVisibleInViewport(page, ".aui-support-primary-action");
  await expectVisibleInViewport(page, ".aui-support-audit-list");
  await expect(page.getByLabel("Support assistant")).toBeVisible();
  await expect(page.locator(".aui-thread-surface")).toBeVisible();
  await expect(page.getByLabel("Message", { exact: true })).toBeVisible();
  await expectVisibleInViewport(page, ".aui-composer");
  await expectVisibleInViewport(page, ".aui-support-ticket");
  await expectCompactTicketQueue(page);
  await expectFilterHitTargets(page);
  await expect(page.getByLabel("Agent diagnostics")).toContainText("redacted");

  await page.getByRole("button", { name: /SUP-2051/ }).click();
  await expect(page.getByLabel("Selected inquiry")).toContainText(
    "Duplicate macros after reconnect",
  );
  await page.getByLabel("Queue filters").getByRole("button", { name: "Urgent" }).click();
  await expect(page.getByLabel("Ticket queue")).toContainText("SUP-2048");
  await expect(page.getByLabel("Ticket queue")).not.toContainText("SUP-2051");
  await expect(page.getByLabel("Selected inquiry")).toContainText(
    "Invoice export dropped rows",
  );
  await page.getByLabel("Queue filters").getByRole("button", { name: "All" }).click();
  await expect(page.getByLabel("Ticket queue")).toContainText("SUP-2051");

  await page.getByRole("button", { name: /SUP-2051/ }).click();
  await expect(page.getByLabel("Selected inquiry")).toContainText(
    "Duplicate macros after reconnect",
  );
  await expect(page.getByLabel("Selected inquiry")).toContainText(
    "patient fields stay in the CRM",
  );
  await expect(page.getByLabel("Conversation detail")).toContainText("Reconnect logs");
  await expect(page.getByLabel("Conversation detail")).not.toContainText(
    "Billing export job",
  );
  await expect(page.getByLabel("Support assistant")).toContainText("SUP-2051");
  await expect(page.getByLabel("Support assistant")).toContainText("macro cache");

  await page.getByRole("button", { name: "Send reviewed reply" }).click();
  await expect(page.getByLabel("Reply review")).toContainText("1 reply sent");
  await expect(page.getByLabel("Policy checks")).toContainText("PHI withheld");
  await page.getByLabel("Message", { exact: true }).fill("Can we send the safe summary?");
  await page.locator(".aui-composer button[aria-label='Send']").first().click();
  await expect(page.getByLabel("Support assistant")).toContainText(
    "Safe reply workflow updated for SUP-2051",
  );
  await page.getByRole("button", { name: /SUP-2048/ }).click();
  await expect(page.getByLabel("Reply review")).toContainText("0 replies sent");
  await page.getByRole("button", { name: /SUP-2051/ }).click();
  await expect(page.getByLabel("Reply review")).toContainText("1 reply sent");
  await expect(expectNoDocumentOverflow(page)).resolves.toBe(true);
});

test("keeps support console workflow reachable on mobile", async ({ page }) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/support-console");

  await expect(page.getByRole("heading", { name: "Support reply desk" })).toBeVisible();
  await expect(page.getByLabel("Ticket queue")).toBeVisible();
  await expect(page.getByLabel("Support assistant")).toBeVisible();
  await expectWithinViewport(page, ".aui-support-console-grid");
  await expectWithinViewport(page, ".aui-support-ticket-list");
  await expectWithinViewport(page, ".aui-support-ticket:first-child");
  await expectMobileSupportOrder(page);
  await expectVisibleInViewport(page, ".aui-support-case-header");
  await expectVisibleInViewport(page, ".aui-support-response-plan");
  await expectVisibleInViewport(page, ".aui-support-workflow-grid");
  await expectVisibleInViewport(page, ".aui-support-primary-action");
  await expectSupportSummaryGrid(page);
  await expectPrimaryActionSize(page);
  await expectFilterHitTargets(page);

  const sendButton = page.getByRole("button", { name: "Send reviewed reply" });
  await expectActuallyHitTestable(sendButton);
  await expect(expectNoDocumentOverflow(page)).resolves.toBe(true);
});

test("keeps support console hierarchy usable on tablet", async ({ page }) => {
  await page.setViewportSize(tabletViewport);
  await page.goto("/support-console");

  await expect(page.getByLabel("Ticket queue")).toBeVisible();
  await expect(page.getByLabel("Support assistant")).toBeVisible();
  await expect(page.getByLabel("Selected inquiry")).toBeVisible();
  await expectTabletSupportOrder(page);
  await expectVisibleInViewport(page, ".aui-support-case-header");
  await expectVisibleInViewport(page, ".aui-support-readiness");
  await expectVisibleInViewport(page, ".aui-support-response-plan");
  await expectVisibleInViewport(page, ".aui-support-workflow-grid");
  await expectVisibleInViewport(page, ".aui-support-primary-action");
  await expectSupportSummaryGrid(page);
  await expectPrimaryActionSize(page);
  await expectActuallyHitTestable(
    page.getByRole("button", { name: "Send reviewed reply" }),
  );
  await expect(expectNoDocumentOverflow(page)).resolves.toBe(true);
});

test("keeps support console readable before full desktop width", async ({ page }) => {
  await page.setViewportSize(compactDesktopViewport);
  await page.goto("/support-console");

  await expectTabletSupportOrder(page);
  const timelineWidth = await page
    .getByLabel("Conversation detail")
    .evaluate((element) => element.getBoundingClientRect().width);
  expect(timelineWidth).toBeGreaterThanOrEqual(280);
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

async function expectPrimaryActionSize(page: Page) {
  const buttonHeight = await page
    .getByRole("button", { name: "Send reviewed reply" })
    .evaluate((element) => element.getBoundingClientRect().height);
  expect(buttonHeight).toBeGreaterThanOrEqual(40);
}

async function expectFilterHitTargets(page: Page) {
  const heights = await page
    .getByLabel("Queue filters")
    .getByRole("button")
    .evaluateAll((buttons) =>
      buttons.map((button) => Math.round(button.getBoundingClientRect().height)),
    );
  for (const height of heights) expect(height).toBeGreaterThanOrEqual(40);
}

async function expectSupportSummaryGrid(page: Page) {
  const display = await page
    .locator(".aui-support-summary-grid")
    .evaluate((element) => getComputedStyle(element).display);
  expect(display).toBe("grid");
}

async function expectMobileSupportOrder(page: Page) {
  const metrics = await supportRegionMetrics(page);
  expect(metrics.queue.top, JSON.stringify(metrics)).toBeLessThan(metrics.case.top);
  expect(metrics.case.top, JSON.stringify(metrics)).toBeLessThan(metrics.assistant.top);
}

async function expectTabletSupportOrder(page: Page) {
  const metrics = await supportRegionMetrics(page);
  expect(Math.abs(metrics.queue.top - metrics.case.top), JSON.stringify(metrics)).toBeLessThan(
    32,
  );
  expect(metrics.queue.right, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.case.left + 1);
  expect(metrics.assistant.top, JSON.stringify(metrics)).toBeGreaterThan(metrics.case.top);
}

async function supportRegionMetrics(page: Page) {
  return page.evaluate(() => {
    const selectorEntries = {
      assistant: ".aui-support-agent",
      case: ".aui-support-case",
      queue: ".aui-support-queue",
    };
    const regions = Object.fromEntries(
      Object.entries(selectorEntries).map(([name, selector]) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) throw new Error(`Missing support console region: ${selector}`);
        const rect = element.getBoundingClientRect();
        return [
          name,
          {
            bottom: Math.round(rect.bottom),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            top: Math.round(rect.top),
          },
        ];
      }),
    );
    return {
      ...regions,
      viewportHeight: window.innerHeight,
    } as {
      assistant: { bottom: number; left: number; right: number; top: number };
      case: { bottom: number; left: number; right: number; top: number };
      queue: { bottom: number; left: number; right: number; top: number };
      viewportHeight: number;
    };
  });
}
