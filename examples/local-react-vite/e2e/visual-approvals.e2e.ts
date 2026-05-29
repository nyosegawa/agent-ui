import { expect, test } from "@playwright/test";
import {
  desktopViewport,
  expectActuallyClickable,
  expectActuallyHitTestable,
  firstApprovalActionButtons,
  mobileViewport,
} from "./support/visual-contracts";

test("approval card renders risk, approve, session approve, and decline actions", async ({
  page,
}) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/rich-transcript");
  const approval = page.locator(".aui-approval").first();
  await expect(approval).toBeVisible();
  await expect(approval.locator(".aui-approval-risk")).toBeVisible();
  await expect(
    approval.getByRole("button", { name: /^Approve [a-z ]+request [a-z0-9-]+$/ }),
  ).toBeVisible();
  await expect(approval.getByRole("button", { name: /for session$/ })).toBeVisible();
  await expect(approval.getByRole("button", { name: /^Decline / })).toBeVisible();
});

test("approval queue excludes host requests from compact picker rows", async ({
  page,
}) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/rich-transcript");
  await expect(page.locator(".aui-approvals")).not.toContainText(
    "3 decisions need your review",
  );
  await expect(page.locator(".aui-approval")).toHaveCount(1);
  const compactRows = page.locator(".aui-approval-compact");
  await expect(compactRows).toHaveCount(0);
});

test("mobile keeps composer and approval actions hit-testable in the transcript", async ({
  page,
}) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/rich-transcript");
  await expect(page.locator(".aui-thread-surface").first()).toBeVisible();

  const approval = page.locator(".aui-approval").first();
  await approval.scrollIntoViewIfNeeded();
  await expect(approval).toBeVisible();
  for (const button of firstApprovalActionButtons(approval)) {
    await button.scrollIntoViewIfNeeded();
    await expectActuallyClickable(button);
  }

  const send = page.locator(".aui-composer button[aria-label='Send']").first();
  await send.scrollIntoViewIfNeeded();
  await expectActuallyHitTestable(send);
});

for (const viewport of [
  { ...desktopViewport, name: "desktop" },
  { ...mobileViewport, name: "mobile" },
] as const) {
  test(`rich transcript approval actions are actually clickable on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/rich-transcript");
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

  test(`rich transcript approval stays inside transcript flow on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/rich-transcript");
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
          document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        messageListHeight: messageRect ? round(messageRect.height) : 0,
      };
    });
    expect(layout.approvalPresent, JSON.stringify(layout)).toBe(true);
    expect(layout.approvalInsideTranscript, JSON.stringify(layout)).toBe(true);
    expect(layout.approvalsIndependentScrollPane, JSON.stringify(layout)).toBe(false);
    expect(layout.approvalsMaxHeight, JSON.stringify(layout)).toBe("none");
    expect(layout.messageListHeight, JSON.stringify(layout)).toBeGreaterThanOrEqual(160);
    expect(layout.approvalAboveComposer, JSON.stringify(layout)).toBe(true);
    expect(layout.documentNoOverflow, JSON.stringify(layout)).toBe(true);
  });
}
