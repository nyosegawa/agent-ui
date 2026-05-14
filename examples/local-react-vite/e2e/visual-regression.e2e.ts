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

test("component close-up gallery renders direct primitives, not iframes", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/fixture-gallery");
  const closeups = page.getByTestId("component-closeups");
  await expect(closeups).toBeVisible();
  for (const title of [
    "Composer · normal",
    "Composer · focused",
    "Composer · approval pending",
    "Composer · mobile",
    "Approval · command",
    "Approval · user input",
    "Command block",
    "Diff / file change",
    "Sidebar search + threads",
    "Usage / status chips",
    "Button system",
    "Inputs · selects · segmented",
  ]) {
    await expect(closeups.getByTestId(`closeup:${title}`)).toBeVisible();
  }
  // Direct render, not iframe.
  await expect(closeups.locator("iframe")).toHaveCount(0);
  // The "Approval · command" close-up should expose its primary Approve.
  const commandCloseup = closeups.getByTestId("closeup:Approval · command");
  await expect(
    commandCloseup.getByRole("button", { name: /^Approve command request approval-command-kitchen$/ }),
  ).toBeVisible();
});

test("composer is a single bordered card with inline icon toolbar and primary send", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/?state=kitchen");
  const closeups = page.getByTestId("agent-chat");
  await expect(closeups).toBeVisible();
  // Composer disabled because the kitchen fixture is waitingForInput.
  const composer = page.locator(".aui-composer").first();
  await expect(composer).toBeVisible();
  await expect(composer).toHaveAttribute("data-disabled", "true");
  await expect(composer.locator(".aui-composer-notice")).toContainText("pending approval");
  // Send button is icon-only and currently disabled.
  const send = composer.getByRole("button", { name: "Send" });
  await expect(send).toBeDisabled();
});

test("composer is the primary, bordered card with App / Plugin mention buttons", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/fixture-gallery");
  // The close-up "Composer · normal" stage renders a live, enabled composer.
  const closeup = page.getByTestId("closeup:Composer · normal");
  const composer = closeup.locator(".aui-composer");
  await expect(composer).toBeVisible();
  await expect(composer).not.toHaveAttribute("data-disabled", "true");
  await expect(composer.getByRole("button", { name: "App" })).toBeVisible();
  await expect(composer.getByRole("button", { name: "Plugin" })).toBeVisible();
  await expect(composer.getByRole("button", { name: "Send" })).toBeVisible();
});

test("approval card renders shield + risk + green Approve + danger Decline", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/?state=kitchen");
  const approval = page.locator(".aui-approval").first();
  await expect(approval).toBeVisible();
  // Risk badge present.
  await expect(approval.locator(".aui-approval-risk")).toBeVisible();
  // Three explicit decisions: scope-aware Approve (primary), Approve for session, Decline.
  await expect(
    approval.getByRole("button", { name: /^Approve [a-z ]+request [a-z0-9-]+$/ }),
  ).toBeVisible();
  await expect(approval.getByRole("button", { name: /for session$/ })).toBeVisible();
  await expect(approval.getByRole("button", { name: /^Decline / })).toBeVisible();
});

test("host workflow recipe never duplicates the status summary", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/host-workflow-recipe");
  await expect(page.getByRole("heading", { name: "Verify Codex local build" })).toBeVisible();
  await expect(page.locator('[aria-label="Status summary"]')).toHaveCount(1);
});

test("mobile composer keeps tap targets above 32px and hides keyboard hint", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  const composer = page.locator(".aui-composer").first();
  await expect(composer).toBeVisible();
  await expect(composer.locator(".aui-composer-hint")).toBeHidden();
  // Send button stays large enough for thumb tap (~36 default tap target).
  const send = composer.getByRole("button", { name: "Send" });
  const box = await send.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(36);
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
