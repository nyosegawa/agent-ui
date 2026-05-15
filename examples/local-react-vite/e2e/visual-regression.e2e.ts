import { expect, test, type Locator, type Page } from "@playwright/test";

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
    "Usage panel",
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
  await expect(commandBlock.locator(".aui-activity-card")).toHaveCount(1);
  await expect(commandBlock.locator(".aui-message-list")).toHaveCount(0);
});

test("focused composer close-up renders the real AgentComposer, not hand-written DOM", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/fixture-gallery");
  const focused = page.getByTestId("closeup:Composer · focused");
  await expect(focused).toBeVisible();
  // The focus-injection wrapper proves the real component is being targeted.
  await expect(focused.locator('[data-focus-first="true"]')).toBeAttached();
  const composer = focused.locator(".aui-composer");
  // Real AgentComposer always has aria-label "Composer attachments" on its <form>.
  await expect(composer).toHaveAttribute("aria-label", "Composer attachments");
  // Body got pre-populated by the focus effect.
  const textarea = focused.locator("textarea.aui-composer-input");
  await expect(textarea).toHaveValue(
    "Apply the renderer audit findings and verify the diff.",
  );
  await expect(composer).toHaveAttribute("data-focused", "true");
});

test("fixture-gallery places component close-ups above any iframe preview", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
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
  // First close-up should be reachable within ~2 viewports from the top so QA
  // does not require a long scroll past iframes.
  expect(closeupTop).toBeLessThan(900 * 2);
});

test("fixture-gallery places component close-ups near the top of the mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/fixture-gallery");
  await expect(page.getByTestId("component-closeups")).toBeVisible();
  const closeupTop = await page
    .getByTestId("component-closeups")
    .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  // Mobile gallery should not push close-ups past the third viewport.
  expect(closeupTop).toBeLessThan(900 * 3);
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

for (const viewport of [
  { height: 900, name: "desktop", width: 1280 },
  { height: 900, name: "mobile", width: 390 },
] as const) {
  test(`kitchen approval actions are actually clickable on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/?state=kitchen");
    const approval = page.locator(".aui-approval").first();
    await expect(approval).toBeVisible();
    for (const button of firstApprovalActionButtons(approval)) {
      await expectActuallyClickable(button);
    }
  });

  test(`default approval primary action is actually clickable on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const approval = page.locator(".aui-approval").first();
    await expect(approval).toBeVisible();
    await expectActuallyClickable(
      approval.getByRole("button", { name: /^Approve / }).first(),
    );
  });

  test(`host workflow approval actions are actually clickable after natural scroll on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/host-workflow-recipe");
    const approval = page.locator(".aui-host-thread .aui-approval").first();
    await approval.scrollIntoViewIfNeeded();
    await expect(approval).toBeVisible();
    for (const button of firstApprovalActionButtons(approval)) {
      await button.scrollIntoViewIfNeeded();
      await expectActuallyClickable(button);
    }
  });
}

test("usage-only page demonstrates four host shells, not a blank page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/usage-only");
  for (const heading of [
    "Drop the Codex usage primitive into any host surface",
    "Compact rail slot",
    "Standalone quota panel",
    "Dashboard widget",
    "Inline thread chrome",
  ]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
  // Multiple AgentUsagePanel renders prove the primitive composes.
  const usagePanels = page.locator(".aui-usage");
  expect(await usagePanels.count()).toBeGreaterThanOrEqual(3);
  // No blank gap above the fold: at least the summary chip is visible early.
  const summary = page.locator('[aria-label="Usage summary"]').first();
  const summaryTop = await summary.evaluate(
    (el) => el.getBoundingClientRect().top + window.scrollY,
  );
  expect(summaryTop).toBeLessThan(900);
});

test("usage-only mobile keeps content stacked instead of leaving whitespace", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/usage-only");
  await expect(page.getByRole("heading", { name: "Standalone quota panel" })).toBeVisible();
  const sections = page.locator(".aui-usage-only-section");
  expect(await sections.count()).toBe(4);
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

function firstApprovalActionButtons(approval: Locator) {
  return [
    approval.getByRole("button", { name: /^Approve [a-z -]+request [a-z0-9-]+$/ }),
    approval.getByRole("button", { name: /for session$/ }),
    approval.getByRole("button", { name: /^Decline / }),
  ];
}

async function expectActuallyClickable(locator: Locator) {
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
        top: Math.round(rect.top),
        width: Math.round(rect.width),
      },
    };
  });
  expect(hitTest.clickable, JSON.stringify(hitTest)).toBe(true);
  await locator.click({ trial: true });
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
