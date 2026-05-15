/* eslint-disable no-undef */

import { chromium } from "@playwright/test";

const url = process.env.AGENT_UI_REAL_LOCAL_WEB_URL ?? "http://127.0.0.1:5175/";
const viewports = [
  { height: 900, name: "desktop", width: 1280 },
  { height: 900, name: "mobile", width: 390 },
];

const selectors = [
  ".aui-shell",
  ".aui-sidebar",
  ".aui-thread-surface",
  ".aui-thread-header",
  ".aui-message-list",
  ".aui-turn",
  ".aui-message",
  ".aui-transcript-card",
  ".aui-command-output",
  ".aui-diff",
  ".aui-thread-list-item",
  ".aui-compose-panel",
  ".aui-composer",
  ".aui-run-settings-popover",
  ".aui-run-settings-sheet",
];

const browser = await chromium.launch();
const results = [];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    page.setDefaultTimeout(30_000);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".aui-thread-surface .aui-message-list");
    await page.waitForSelector(".aui-compose-panel .aui-composer");
    const title = await page.evaluate(() => document.title);
    await page.waitForSelector("[data-testid='agent-chat']");
    const closedAudit = await auditPage(page);
    await page.locator(".aui-run-settings-popover summary").first().click({ timeout: 10_000 });
    const openAudit = await auditPage(page);
    results.push({ closedAudit, openAudit, title, viewport: viewport.name });
    await page.close();
  }
} finally {
  await browser.close();
}

const failures = [];
for (const result of results) {
  for (const [phase, audit] of [
    ["closed", result.closedAudit],
    ["run-settings-open", result.openAudit],
  ]) {
    if (audit.hasWorkTrace) failures.push(`${result.viewport}:${phase}: Work trace found`);
    if (audit.hasLoadAll) failures.push(`${result.viewport}:${phase}: Load all found`);
    if (!audit.hasMainThread) failures.push(`${result.viewport}:${phase}: main thread missing`);
    if (!audit.hasSidebar) failures.push(`${result.viewport}:${phase}: sidebar missing`);
    if (!audit.hasComposer) failures.push(`${result.viewport}:${phase}: composer missing`);
    for (const offender of audit.overflowOffenders) {
      failures.push(`${result.viewport}:${phase}: overflow ${offender}`);
    }
  }
}

console.log(JSON.stringify(results, null, 2));
if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

async function auditPage(page) {
  return page.evaluate((checkedSelectors) => {
    const overflowOffenders = [];
    const viewportRight = window.innerWidth + 0.5;
    const viewportLeft = -0.5;
    for (const selector of checkedSelectors) {
      for (const element of document.querySelectorAll(selector)) {
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (rect.left < viewportLeft || rect.right > viewportRight) {
          overflowOffenders.push(
            `${selector}:${Math.round(rect.left)}:${Math.round(rect.right)}`,
          );
        }
      }
    }
    return {
      hasComposer: Boolean(document.querySelector(".aui-compose-panel .aui-composer")),
      hasLoadAll: document.body.textContent?.includes("Load all") ?? false,
      hasMainThread: Boolean(document.querySelector(".aui-thread-surface .aui-message-list")),
      hasSidebar: Boolean(document.querySelector(".aui-sidebar .aui-thread-list")),
      hasWorkTrace: Boolean(document.querySelector("[class*=work][class*=trace]")),
      overflowOffenders,
    };
  }, selectors);
}
