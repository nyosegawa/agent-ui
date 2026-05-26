import { expect, type Locator, type Page } from "@playwright/test";

export const desktopViewport = { height: 900, width: 1280 } as const;
export const mobileViewport = { height: 900, width: 390 } as const;

const visualSnapshotSelectors = [
  ["shell", ".aui-shell"],
  ["sidebar", ".aui-sidebar"],
  ["chat", ".aui-chat"],
  ["status", ".aui-status"],
  ["usage", ".aui-usage"],
  ["threadHeader", ".aui-thread-header"],
  ["messageList", ".aui-message-list"],
  ["activity", ".aui-transcript-card"],
  ["diffActivity", ".aui-file-change-card"],
  ["approvals", ".aui-approvals"],
  ["composer", ".aui-composer"],
  ["composerSettings", ".aui-composer-settings"],
] as const;

export const viewportSurfaceSelectors = [
  ".aui-thread-surface",
  ".aui-approvals",
  ".aui-approval",
  ".aui-compose-panel",
  ".aui-composer",
  ".aui-composer-toolbar",
  ".aui-composer-settings",
  ".aui-composer-tool",
  ".aui-approval-actions",
  ".aui-approval-actions .aui-btn",
] as const;

export function firstApprovalActionButtons(approval: Locator) {
  return [
    approval.getByRole("button", { name: /^Approve [a-z -]+request [a-z0-9-]+$/ }),
    approval.getByRole("button", { name: /for session$/ }),
    approval.getByRole("button", { name: /^Decline / }),
  ];
}

export async function visualContractJson(page: Page) {
  return `${JSON.stringify(await visualContract(page), null, 2)}\n`;
}

export async function expectActuallyClickable(locator: Locator) {
  await expect(locator).toBeVisible();
  const hitTest = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    return {
      clickable: hit === element || element.contains(hit),
      hitClass: hit instanceof HTMLElement ? hit.className : null,
      hitTag: hit?.tagName ?? null,
      hitText: hit?.textContent?.trim().slice(0, 80) ?? null,
      rect: {
        bottom: Math.round(rect.bottom),
        height: Math.round(rect.height),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
      },
    };
  });
  expect(hitTest.clickable, JSON.stringify(hitTest)).toBe(true);
  await locator.click({ trial: true });
}

export async function expectActuallyHitTestable(locator: Locator) {
  await expect(locator).toBeVisible();
  const hitTest = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    return {
      clickable: hit === element || element.contains(hit),
      hitClass: hit instanceof HTMLElement ? hit.className : null,
      hitTag: hit?.tagName ?? null,
      rect: {
        bottom: Math.round(rect.bottom),
        height: Math.round(rect.height),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
      },
    };
  });
  expect(hitTest.clickable, JSON.stringify(hitTest)).toBe(true);
}

export async function expectWithinViewport(page: Page, selector: string) {
  const failures = await page.locator(selector).evaluateAll((elements, selector) => {
    return elements.flatMap((element) => {
      const rect = element.getBoundingClientRect();
      const styles = getComputedStyle(element);
      if (
        styles.display === "none" ||
        styles.visibility === "hidden" ||
        rect.width === 0 ||
        rect.height === 0
      ) {
        return [];
      }
      const viewportWidth = window.innerWidth;
      const epsilon = 1;
      if (
        rect.left < -epsilon ||
        rect.right > viewportWidth + epsilon ||
        rect.width > viewportWidth + epsilon
      ) {
        return [
          {
            selector,
            text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) ?? "",
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            viewportWidth,
          },
        ];
      }
      return [];
    });
  }, selector);
  expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
}

export async function expectVisibleInViewport(page: Page, selector: string) {
  const result = await page
    .locator(selector)
    .first()
    .evaluate((element, selector) => {
      const rect = element.getBoundingClientRect();
      const visible =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.right > 0 &&
        rect.left < window.innerWidth &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight;
      return {
        selector,
        visible,
        rect: {
          bottom: Math.round(rect.bottom),
          height: Math.round(rect.height),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          top: Math.round(rect.top),
          width: Math.round(rect.width),
        },
        viewport: {
          height: window.innerHeight,
          width: window.innerWidth,
        },
      };
    }, selector);
  expect(result.visible, JSON.stringify(result)).toBe(true);
}

export async function expectFullyWithinViewport(page: Page, selector: string) {
  const result = await page
    .locator(selector)
    .first()
    .evaluate((element, selector) => {
      const rect = element.getBoundingClientRect();
      return {
        selector,
        inside:
          rect.left >= 0 &&
          rect.right <= window.innerWidth &&
          rect.top >= 0 &&
          rect.bottom <= window.innerHeight,
        rect: {
          bottom: Math.round(rect.bottom),
          height: Math.round(rect.height),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          top: Math.round(rect.top),
          width: Math.round(rect.width),
        },
        viewport: {
          height: window.innerHeight,
          width: window.innerWidth,
        },
      };
    }, selector);
  expect(result.inside, JSON.stringify(result)).toBe(true);
}

export async function elementMetrics(page: Page, selector: string) {
  return page.evaluate((selector) => {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Missing element for ${selector}`);
    const rect = element.getBoundingClientRect();
    const styles = getComputedStyle(element);
    return {
      fontSize: styles.fontSize,
      height: Math.round(rect.height),
      minHeight: styles.minHeight,
      width: Math.round(rect.width),
    };
  }, selector);
}

async function visualContract(page: Page) {
  return page.evaluate((entries) => {
    const snapshot: Record<string, unknown> = {
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      },
    };

    for (const [name, selector] of entries) {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) {
        snapshot[name] = { present: false };
        continue;
      }
      const rect = element.getBoundingClientRect();
      const styles = getComputedStyle(element);
      snapshot[name] = {
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        borderRadius: styles.borderRadius,
        display: styles.display,
        gridTemplateColumns: styles.gridTemplateColumns,
        height: Math.round(rect.height),
        overflowX: styles.overflowX,
        overflowY: styles.overflowY,
        present: true,
        visible: styles.visibility !== "hidden" && rect.width > 0 && rect.height > 0,
        width: Math.round(rect.width),
      };
    }

    return snapshot;
  }, visualSnapshotSelectors);
}
