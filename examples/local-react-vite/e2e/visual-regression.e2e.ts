import { expect, test, type Page } from "@playwright/test";

const selectors = [
  ["shell", ".aui-shell"],
  ["sidebar", ".aui-sidebar"],
  ["chat", ".aui-chat"],
  ["status", ".aui-status"],
  ["usage", ".aui-usage"],
  ["runControls", ".aui-run-controls"],
  ["threadHeader", ".aui-thread-header"],
  ["messageList", ".aui-message-list"],
  ["activity", ".aui-activity-card"],
  ["diffActivity", ".aui-file-change-card"],
  ["approvals", ".aui-approvals"],
  ["composer", ".aui-composer"],
] as const;

test("matches desktop visual layout contract", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  expect(await visualContractJson(page)).toMatchSnapshot("desktop-layout.json");
});

test("matches mobile visual layout contract", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  expect(await visualContractJson(page)).toMatchSnapshot("mobile-layout.json");
});

async function visualContractJson(page: Page) {
  return `${JSON.stringify(await visualContract(page), null, 2)}\n`;
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
  }, selectors);
}
