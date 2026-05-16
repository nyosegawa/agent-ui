/* eslint-disable no-undef */

import { chromium } from "@playwright/test";

const url = process.env.AGENT_UI_REAL_LOCAL_WEB_URL ?? "http://127.0.0.1:5175/";
const viewports = [
  { height: 900, name: "desktop", width: 1280 },
  { height: 900, name: "mobile", width: 390 },
];

const selectors = [
  ".aui-shell",
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
  ".aui-composer-toolbar",
  ".aui-composer-tool",
  ".aui-approvals",
  ".aui-approval",
  ".aui-menu-panel",
];

const baseViewportSelectors = [
  [".aui-thread-surface", "thread surface"],
  [".aui-message-list", "message list"],
  [".aui-compose-panel", "compose panel"],
  [".aui-composer", "composer"],
  [".aui-composer-tool", "composer run-settings menu trigger"],
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

    // Desktop keeps the sidebar inline; mobile keeps it behind the Threads
    // drawer trigger, so the required surfaces differ per viewport.
    const closedViewportSelectors =
      viewport.name === "desktop"
        ? [
            ...baseViewportSelectors,
            [".aui-sidebar", "sidebar"],
            [".aui-thread-list", "thread list"],
          ]
        : [
            ...baseViewportSelectors,
            [".aui-threads-trigger", "threads drawer trigger"],
          ];

    const closedAudit = await auditPage(page, closedViewportSelectors, viewport.name);
    await page.locator(".aui-composer-tool").first().click({ timeout: 10_000 });
    const openAudit = await auditPage(
      page,
      [...baseViewportSelectors, [".aui-menu-panel", "run-settings menu"]],
      viewport.name,
    );
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
    if (audit.hasWorkTrace)
      failures.push(`${result.viewport}:${phase}: Work trace found`);
    if (audit.hasLoadAll) failures.push(`${result.viewport}:${phase}: Load all found`);
    if (!audit.hasMainThread)
      failures.push(`${result.viewport}:${phase}: main thread missing`);
    if (!audit.hasSidebar)
      failures.push(`${result.viewport}:${phase}: thread history affordance missing`);
    if (!audit.hasComposer)
      failures.push(`${result.viewport}:${phase}: composer missing`);
    if (audit.messageOverlapsComposer) {
      failures.push(`${result.viewport}:${phase}: message list overlaps composer`);
    }
    if (audit.approvalOutsideTranscript) {
      failures.push(
        `${result.viewport}:${phase}: approval surface is outside the transcript scroll area`,
      );
    }
    if (audit.approvalsIndependentScrollPane) {
      failures.push(
        `${result.viewport}:${phase}: approval surface is an independent scroll pane`,
      );
    }
    if (audit.approvalPresent && audit.messageListHeight < 160) {
      failures.push(
        `${result.viewport}:${phase}: message list crushed to ${audit.messageListHeight}px under a pending approval`,
      );
    }
    for (const hidden of audit.notVisibleInViewport) {
      failures.push(`${result.viewport}:${phase}: not visible in viewport ${hidden}`);
    }
    for (const offender of audit.overflowOffenders) {
      failures.push(`${result.viewport}:${phase}: overflow ${offender}`);
    }
    if (!audit.sendButton?.visibleInViewport) {
      failures.push(`${result.viewport}:${phase}: send button outside viewport`);
    }
    // While a run-settings menu is open its backdrop intentionally covers the
    // composer, so send hit-testing is only meaningful in the closed phase.
    if (phase === "closed" && !audit.sendButton?.hitTestable) {
      failures.push(
        `${result.viewport}:${phase}: send button not hit-testable ${JSON.stringify(
          audit.sendButton,
        )}`,
      );
    }
  }
}

console.log(JSON.stringify(results, null, 2));
if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

async function auditPage(page, requiredViewportSelectors, viewportName) {
  return page.evaluate(
    ({ checkedSelectors, requiredViewportSelectors, viewportName }) => {
      function isVisibleInViewport(rect) {
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          rect.right > 0 &&
          rect.left < window.innerWidth &&
          rect.bottom > 0 &&
          rect.top < window.innerHeight
        );
      }

      function serializeRect(rect) {
        return {
          bottom: Math.round(rect.bottom),
          height: Math.round(rect.height),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          top: Math.round(rect.top),
          width: Math.round(rect.width),
        };
      }

      const overflowOffenders = [];
      const notVisibleInViewport = [];
      const rects = {};
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
      for (const [selector, label] of requiredViewportSelectors) {
        const element = document.querySelector(selector);
        const rect = element?.getBoundingClientRect();
        rects[selector] = rect ? serializeRect(rect) : null;
        if (!rect || !isVisibleInViewport(rect)) {
          notVisibleInViewport.push(
            `${label}:${rect ? JSON.stringify(serializeRect(rect)) : "missing"}`,
          );
        }
      }
      const messageListEl = document.querySelector(".aui-message-list");
      const messageRect = messageListEl?.getBoundingClientRect();
      const composePanelRect = document
        .querySelector(".aui-compose-panel")
        ?.getBoundingClientRect();
      // Pending approvals must stay inside the transcript scroll area and
      // must never become an independent scroll pane that crushes the list.
      const approvalsEl = document.querySelector(".aui-approvals");
      const approvalCardEl = document.querySelector(".aui-approval");
      const approvalsStyle = approvalsEl ? getComputedStyle(approvalsEl) : null;
      const approvalsIndependentScrollPane = approvalsEl
        ? ["auto", "scroll"].includes(approvalsStyle?.overflowY ?? "") &&
          approvalsEl.scrollHeight - approvalsEl.clientHeight > 4
        : false;
      const approvalOutsideTranscript = Boolean(
        approvalsEl && messageListEl && !messageListEl.contains(approvalsEl),
      );
      const composerRect = document
        .querySelector(".aui-composer")
        ?.getBoundingClientRect();
      const sendButton = document.querySelector(
        ".aui-composer button[aria-label='Send']",
      );
      const sendRect = sendButton?.getBoundingClientRect();
      const sendCenter =
        sendRect && sendRect.width > 0 && sendRect.height > 0
          ? {
              x: sendRect.left + sendRect.width / 2,
              y: sendRect.top + sendRect.height / 2,
            }
          : null;
      const hit =
        sendCenter &&
        sendCenter.x >= 0 &&
        sendCenter.x <= window.innerWidth &&
        sendCenter.y >= 0 &&
        sendCenter.y <= window.innerHeight
          ? document.elementFromPoint(sendCenter.x, sendCenter.y)
          : null;
      const hasSidebar =
        viewportName === "desktop"
          ? Boolean(document.querySelector(".aui-sidebar .aui-thread-list"))
          : Boolean(document.querySelector(".aui-threads-trigger"));
      return {
        approvalOutsideTranscript,
        approvalPresent: Boolean(approvalCardEl),
        approvalsIndependentScrollPane,
        hasComposer: Boolean(document.querySelector(".aui-compose-panel .aui-composer")),
        hasLoadAll: document.body.textContent?.includes("Load all") ?? false,
        messageListHeight: messageRect ? Math.round(messageRect.height) : 0,
        hasMainThread: Boolean(
          document.querySelector(".aui-thread-surface .aui-message-list"),
        ),
        hasSidebar,
        hasWorkTrace: Boolean(document.querySelector("[class*=work][class*=trace]")),
        messageOverlapsComposer:
          messageRect && composerRect
            ? Math.round(messageRect.bottom) > Math.round(composerRect.top)
            : false,
        notVisibleInViewport,
        overflowOffenders,
        rects,
        sendButton: sendButton
          ? {
              disabled:
                sendButton instanceof HTMLButtonElement ? sendButton.disabled : null,
              hitClass: hit instanceof HTMLElement ? hit.className : null,
              hitTag: hit?.tagName ?? null,
              hitTestable: Boolean(
                hit === sendButton || (hit instanceof Node && sendButton.contains(hit)),
              ),
              rect: sendRect ? serializeRect(sendRect) : null,
              visibleInViewport: sendRect ? isVisibleInViewport(sendRect) : false,
            }
          : null,
        transcriptBeforeComposer:
          messageRect && composePanelRect
            ? Math.round(messageRect.bottom) <= Math.round(composePanelRect.top)
            : false,
      };
    },
    { checkedSelectors: selectors, requiredViewportSelectors, viewportName },
  );
}
