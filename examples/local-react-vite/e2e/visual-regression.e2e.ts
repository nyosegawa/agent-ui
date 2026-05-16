import { expect, test, type Locator, type Page } from "@playwright/test";

const selectors = [
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

const surfaceSelectors = [
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
];

test("kitchen mobile keeps approval and composer surfaces inside the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/?state=kitchen");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  for (const selector of surfaceSelectors) {
    await expectWithinViewport(page, selector);
  }
});

for (const route of ["/", "/host-workflow-recipe"] as const) {
  test(`${route} mobile keeps thread controls inside the viewport`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(route);
    await expect(page.locator(".aui-thread-surface").first()).toBeVisible();
    for (const selector of surfaceSelectors) {
      await expectWithinViewport(page, selector);
    }
  });
}

test("composer mode menu opens within the viewport on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  const modeMenu = page.getByRole("button", { name: "Execution mode" });
  await modeMenu.scrollIntoViewIfNeeded();
  await modeMenu.click();
  const panel = page.getByRole("menu", { name: "Execution mode" });
  await expect(panel).toBeVisible();
  await expectWithinViewport(page, ".aui-menu-panel");
});

for (const route of ["/", "/host-workflow-recipe"] as const) {
  for (const viewport of [
    { height: 900, name: "desktop", width: 1280 },
    { height: 900, name: "mobile", width: 390 },
  ] as const) {
    test(`${route} keeps transcript, composer, and run-settings menus reachable on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(route);
      await expect(page.locator(".aui-thread-surface").first()).toBeVisible();
      for (const selector of [
        ".aui-thread-surface",
        ".aui-message-list",
        ".aui-compose-panel",
        ".aui-composer",
        ".aui-approvals",
        ".aui-approval-actions .aui-btn",
        ".aui-composer-tool",
      ]) {
        if (route === "/host-workflow-recipe") {
          await page.locator(selector).first().scrollIntoViewIfNeeded();
        }
        await expectVisibleInViewport(page, selector);
      }
      if (route === "/host-workflow-recipe") {
        await page
          .locator(".aui-composer button[aria-label='Send']")
          .first()
          .scrollIntoViewIfNeeded();
      }
      await expectActuallyHitTestable(
        page.locator(".aui-composer button[aria-label='Send']").first(),
      );
      const modeMenu = page.getByRole("button", { name: "Execution mode" }).first();
      await modeMenu.scrollIntoViewIfNeeded();
      await modeMenu.click();
      await expectVisibleInViewport(page, ".aui-menu-panel");
      await page.keyboard.press("Escape");
    });
  }
}

test("fixture gallery mobile close-up stage stays inside the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/fixture-gallery");
  await expect(page.getByTestId("component-closeups")).toBeVisible();
  for (const selector of [
    ".aui-fixture-gallery",
    '[data-testid="component-closeups"]',
    ".aui-closeup",
    ".aui-closeup-stage",
    ".aui-closeup-stage .aui-composer",
    ".aui-closeup-stage .aui-composer-toolbar",
    ".aui-closeup-stage .aui-approval",
    ".aui-closeup-stage .aui-approval-actions",
    ".aui-closeup-stage .aui-approval-actions .aui-btn",
  ]) {
    await expectWithinViewport(page, selector);
  }
});

test("component close-up gallery renders direct primitives, not iframes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/fixture-gallery");
  const closeups = page.getByTestId("component-closeups");
  await expect(closeups).toBeVisible();
  for (const title of [
    "Composer · normal",
    "Composer · focused",
    "Composer · approval pending",
    "Composer · mobile",
    "Composer · pasted image",
    "Composer · multiple attachments",
    "Mode menu · open",
    "Model / effort menu · open",
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
    commandCloseup.getByRole("button", {
      name: /^Approve command request approval-command-kitchen$/,
    }),
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
  await expect(commandBlock.locator(".aui-transcript-card")).toHaveCount(1);
  await expect(commandBlock.locator(".aui-message-list")).toHaveCount(0);
  // Pasted-image close-up shows a real attachment chip.
  const pastedImage = closeups.getByTestId("closeup:Composer · pasted image");
  await expect(pastedImage.locator(".aui-composer-chip")).toHaveCount(1);
});

test("focused composer close-up renders the real AgentComposer, not hand-written DOM", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/fixture-gallery");
  const focused = page.getByTestId("closeup:Composer · focused");
  await expect(focused).toBeVisible();
  await expect(focused.locator('[data-focus-first="true"]')).toBeAttached();
  const composer = focused.locator(".aui-composer");
  await expect(composer).toHaveAttribute("aria-label", "Composer attachments");
  const textarea = focused.locator("textarea.aui-composer-input");
  await expect(textarea).toHaveValue(
    "Apply the renderer audit findings and verify the diff.",
  );
  await expect(composer).toHaveAttribute("data-focused", "true");
});

test("fixture-gallery places component close-ups above any iframe preview", async ({
  page,
}) => {
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
  expect(closeupTop).toBeLessThan(900 * 2);
});

test("fixture-gallery places component close-ups near the top of the mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/fixture-gallery");
  await expect(page.getByTestId("component-closeups")).toBeVisible();
  const closeupTop = await page
    .getByTestId("component-closeups")
    .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  expect(closeupTop).toBeLessThan(900 * 3);
});

test("composer is a single bordered card with inline icon toolbar and primary send", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/?state=kitchen");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  const composer = page.locator(".aui-composer").first();
  await expect(composer).toBeVisible();
  await expect(composer).toHaveAttribute("data-disabled", "true");
  await expect(composer.locator(".aui-composer-notice")).toContainText(
    "pending approval",
  );
  const send = composer.getByRole("button", { name: "Send" });
  await expect(send).toBeDisabled();
  // Mode / model menus stay reachable even while the textarea is disabled.
  await expect(composer.getByRole("button", { name: "Execution mode" })).toBeEnabled();
  await expect(composer.getByRole("button", { name: "Model and effort" })).toBeEnabled();
});

test("composer is the primary, bordered card with App / Plugin mention buttons", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/fixture-gallery");
  const closeup = page.getByTestId("closeup:Composer · normal");
  const composer = closeup.locator(".aui-composer");
  await expect(composer).toBeVisible();
  await expect(composer).not.toHaveAttribute("data-disabled", "true");
  await expect(composer.getByRole("button", { name: "App" })).toBeVisible();
  await expect(composer.getByRole("button", { name: "Plugin" })).toBeVisible();
  await expect(composer.getByRole("button", { name: "Send" })).toBeVisible();
});

test("approval card renders shield + risk + green Approve + danger Decline", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/?state=kitchen");
  const approval = page.locator(".aui-approval").first();
  await expect(approval).toBeVisible();
  await expect(approval.locator(".aui-approval-risk")).toBeVisible();
  await expect(
    approval.getByRole("button", { name: /^Approve [a-z ]+request [a-z0-9-]+$/ }),
  ).toBeVisible();
  await expect(approval.getByRole("button", { name: /for session$/ })).toBeVisible();
  await expect(approval.getByRole("button", { name: /^Decline / })).toBeVisible();
});

test("approval queue keeps additional pending requests as compact picker rows", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/?state=kitchen");
  await expect(page.locator(".aui-approvals")).toContainText(
    "3 decisions need your review",
  );
  // One expanded card, the rest compact.
  await expect(page.locator(".aui-approval")).toHaveCount(1);
  const compactRows = page.locator(".aui-approval-compact");
  expect(await compactRows.count()).toBe(2);
  await compactRows.first().click();
  await expect(page.locator(".aui-approval")).toHaveCount(1);
});

for (const viewport of [
  { height: 900, name: "desktop", width: 1280 },
  { height: 900, name: "mobile", width: 390 },
] as const) {
  test(`kitchen approval actions are actually clickable on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/?state=kitchen");
    const approval = page.locator(".aui-approval").first();
    await expect(approval).toBeVisible();
    for (const button of firstApprovalActionButtons(approval)) {
      await button.scrollIntoViewIfNeeded();
      await expectActuallyClickable(button);
    }
  });

  test(`default approval primary action is actually clickable on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const approval = page.locator(".aui-approval").first();
    await expect(approval).toBeVisible();
    const approve = approval.getByRole("button", { name: /^Approve / }).first();
    await approve.scrollIntoViewIfNeeded();
    await expectActuallyClickable(approve);
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

for (const viewport of [
  { height: 900, name: "desktop", width: 1280 },
  { height: 900, name: "mobile", width: 390 },
] as const) {
  test(`kitchen approval renders inside the transcript, not a separate pane on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/?state=kitchen");
    await expect(page.locator(".aui-thread-surface").first()).toBeVisible();
    const layout = await page.evaluate(() => {
      const round = (value: number) => Math.round(value);
      const messageList = document.querySelector(".aui-message-list");
      const approvals = document.querySelector(".aui-approvals");
      const approval = document.querySelector(".aui-approval");
      const composePanel = document.querySelector(".aui-compose-panel");
      const messageRect = messageList?.getBoundingClientRect();
      const approvalsRect = approvals?.getBoundingClientRect();
      const composeRect = composePanel?.getBoundingClientRect();
      const approvalsStyle = approvals ? getComputedStyle(approvals) : null;
      return {
        approvalAboveComposer:
          approvalsRect && composeRect
            ? round(approvalsRect.bottom) <= round(composeRect.top) + 1
            : false,
        approvalInsideTranscript: Boolean(
          messageList && approvals && messageList.contains(approvals),
        ),
        approvalPresent: Boolean(approval),
        approvalsIndependentScrollPane: approvals
          ? ["auto", "scroll"].includes(approvalsStyle?.overflowY ?? "") &&
            approvals.scrollHeight - approvals.clientHeight > 4
          : true,
        approvalsMaxHeight: approvalsStyle?.maxHeight ?? null,
        documentNoOverflow:
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
        messageListHeight: messageRect ? round(messageRect.height) : 0,
      };
    });
    expect(layout.approvalPresent, JSON.stringify(layout)).toBe(true);
    // Approval is a transcript item, not a row stacked above the composer.
    expect(layout.approvalInsideTranscript, JSON.stringify(layout)).toBe(true);
    expect(layout.approvalsIndependentScrollPane, JSON.stringify(layout)).toBe(false);
    expect(layout.approvalsMaxHeight, JSON.stringify(layout)).toBe("none");
    // The transcript is not crushed by the pending approval.
    expect(layout.messageListHeight, JSON.stringify(layout)).toBeGreaterThanOrEqual(160);
    expect(layout.approvalAboveComposer, JSON.stringify(layout)).toBe(true);
    expect(layout.documentNoOverflow, JSON.stringify(layout)).toBe(true);
  });
}

test("usage-only page demonstrates four host shells, not a blank page", async ({
  page,
}) => {
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
  const usagePanels = page.locator(".aui-usage");
  expect(await usagePanels.count()).toBeGreaterThanOrEqual(3);
  const summary = page.locator('[aria-label="Usage summary"]').first();
  const summaryTop = await summary.evaluate(
    (el) => el.getBoundingClientRect().top + window.scrollY,
  );
  expect(summaryTop).toBeLessThan(900);
});

test("usage-only mobile keeps content stacked instead of leaving whitespace", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/usage-only");
  await expect(
    page.getByRole("heading", { name: "Standalone quota panel" }),
  ).toBeVisible();
  const sections = page.locator(".aui-usage-only-section");
  expect(await sections.count()).toBe(4);
});

test("host workflow recipe never duplicates the status summary", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/host-workflow-recipe");
  await expect(
    page.getByRole("heading", { name: "Verify Codex local build" }),
  ).toBeVisible();
  await expect(page.locator('[aria-label="Status summary"]')).toHaveCount(1);
});

test("mobile composer keeps tap targets above 32px and hides keyboard hint", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  const composer = page.locator(".aui-composer").first();
  await expect(composer).toBeVisible();
  await expect(composer.locator(".aui-composer-hint")).toBeHidden();
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

async function expectActuallyHitTestable(locator: Locator) {
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
        top: Math.round(rect.top),
        width: Math.round(rect.width),
      },
    };
  });
  expect(hitTest.clickable, JSON.stringify(hitTest)).toBe(true);
}

async function expectWithinViewport(page: Page, selector: string) {
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

async function expectVisibleInViewport(page: Page, selector: string) {
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
