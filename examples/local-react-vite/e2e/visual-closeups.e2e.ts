import { expect, test } from "@playwright/test";
import {
  desktopViewport,
  expectWithinViewport,
  mobileViewport,
} from "./support/visual-contracts";

test("fixture gallery mobile close-up stage stays inside the viewport", async ({
  page,
}) => {
  await page.setViewportSize(mobileViewport);
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
  await page.setViewportSize(desktopViewport);
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
  await expect(closeups.locator("iframe")).toHaveCount(0);

  const commandCloseup = closeups.getByTestId("closeup:Approval · command");
  await expect(
    commandCloseup.getByRole("button", {
      name: /^Approve command request approval-command-rich-transcript$/,
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

  const pastedImage = closeups.getByTestId("closeup:Composer · pasted image");
  await expect(pastedImage.locator(".aui-composer-chip")).toHaveCount(1);
});

test("focused composer close-up renders the real AgentComposer", async ({ page }) => {
  await page.setViewportSize(desktopViewport);
  await page.goto("/fixture-gallery");
  const focused = page.getByTestId("closeup:Composer · focused");
  await expect(focused).toBeVisible();
  await expect(focused.locator('[data-focus-first="true"]')).toBeAttached();
  const composer = focused.locator(".aui-composer");
  await expect(composer).toHaveAttribute("aria-label", "Composer attachments");
  await expect(focused.locator("textarea.aui-composer-input")).toHaveValue(
    "Apply the renderer audit findings and verify the diff.",
  );
  await expect(composer).toHaveAttribute("data-focused", "true");
});

test("fixture-gallery places component close-ups before route iframe previews", async ({
  page,
}) => {
  await page.setViewportSize(desktopViewport);
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

test("fixture-gallery keeps component close-ups near the top on mobile", async ({
  page,
}) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/fixture-gallery");
  await expect(page.getByTestId("component-closeups")).toBeVisible();
  const closeupTop = await page
    .getByTestId("component-closeups")
    .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  expect(closeupTop).toBeLessThan(900 * 3);
});
