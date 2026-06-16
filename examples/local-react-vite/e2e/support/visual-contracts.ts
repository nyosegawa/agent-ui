import { expect, type Locator, type Page } from "@playwright/test";

export const desktopViewport = { height: 900, width: 1280 } as const;
export const mobileViewport = { height: 900, width: 390 } as const;

const alwaysVisibleSurfaceSelectors = [
  ["shell", ".aui-shell"],
  ["chat", ".aui-chat"],
  ["status", ".aui-status"],
  ["threadHeader", ".aui-thread-header"],
  ["messageList", ".aui-message-list"],
  ["activity", ".aui-transcript-card"],
  ["diffActivity", ".aui-file-change-card"],
  ["approvals", ".aui-approvals"],
  ["composer", ".aui-composer"],
  ["composerSettings", ".aui-composer-settings"],
] as const;

const desktopOnlySurfaceSelectors = [
  ["sidebar", ".aui-sidebar"],
  ["usage", ".aui-usage"],
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

export async function expectVisualLayoutContract(page: Page, mode: "desktop" | "mobile") {
  const contract = await visualContract(page);
  expect(
    contract.document.scrollWidth,
    JSON.stringify(contract.document),
  ).toBeLessThanOrEqual(contract.document.clientWidth + 1);
  const expectedSurfaces =
    mode === "desktop"
      ? [...alwaysVisibleSurfaceSelectors, ...desktopOnlySurfaceSelectors]
      : alwaysVisibleSurfaceSelectors;
  for (const [name, selector] of expectedSurfaces) {
    const surface = contract.surfaces[name];
    expect(surface, selector).toBeDefined();
    expect(surface.present, selector).toBe(true);
    expect(surface.visible, selector).toBe(true);
    expect(surface.display, selector).not.toBe("none");
    if (mode === "mobile") {
      expect(surface.width, selector).toBeLessThanOrEqual(
        contract.document.clientWidth + 1,
      );
    }
  }
  const shell = contract.surfaces.shell;
  const sidebar = contract.surfaces.sidebar;
  const chat = contract.surfaces.chat;
  if (mode === "desktop") {
    expect(shell.gridColumnCount, JSON.stringify(shell)).toBeGreaterThanOrEqual(2);
    expect(sidebar?.width, JSON.stringify(sidebar)).toBeGreaterThanOrEqual(220);
    expect(sidebar?.width, JSON.stringify(sidebar)).toBeLessThanOrEqual(340);
    expect(chat.width, JSON.stringify(chat)).toBeGreaterThan(600);
  } else {
    expect(shell.gridColumnCount, JSON.stringify(shell)).toBe(1);
    expect(chat.width, JSON.stringify(chat)).toBeGreaterThan(320);
  }
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

interface VisualSurfaceContract {
  display: string;
  gridColumnCount: number;
  height: number;
  overflowX: string;
  overflowY: string;
  present: boolean;
  visible: boolean;
  width: number;
}

interface VisualContract {
  document: {
    clientWidth: number;
    scrollWidth: number;
  };
  surfaces: Record<string, VisualSurfaceContract>;
}

async function visualContract(page: Page): Promise<VisualContract> {
  return page.evaluate(
    (entries) => {
      const gridColumnCount = (gridTemplateColumns: string): number => {
        if (!gridTemplateColumns || gridTemplateColumns === "none") return 1;
        return gridTemplateColumns.trim().split(/\s+/).length;
      };
      const snapshot: VisualContract = {
        document: {
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        },
        surfaces: {},
      };

      for (const [name, selector] of entries) {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) {
          snapshot.surfaces[name] = {
            display: "none",
            gridColumnCount: 0,
            height: 0,
            overflowX: "missing",
            overflowY: "missing",
            present: false,
            visible: false,
            width: 0,
          };
          continue;
        }
        const rect = element.getBoundingClientRect();
        const styles = getComputedStyle(element);
        snapshot.surfaces[name] = {
          display: styles.display,
          gridColumnCount: gridColumnCount(styles.gridTemplateColumns),
          height: Math.round(rect.height),
          overflowX: styles.overflowX,
          overflowY: styles.overflowY,
          present: true,
          visible: styles.visibility !== "hidden" && rect.width > 0 && rect.height > 0,
          width: Math.round(rect.width),
        };
      }

      return snapshot;
    },
    [...alwaysVisibleSurfaceSelectors, ...desktopOnlySurfaceSelectors],
  );
}
