import { expect, test } from "@playwright/test";
import {
  FAST_EXPECT_TIMEOUT,
  fillMessage,
  openStoredThread,
  queuedFollowUps,
  readyMessageInput,
  sendNowButton,
  stopButton,
  submitComposer,
} from "./support/real-local-page";

test("opens a thread by URL and accepts image plus arbitrary file attachments", async ({
  page,
}) => {
  await openStoredThread(page, { width: 390, height: 560 });

  await page.evaluate(() => {
    const textarea = document.querySelector("textarea.aui-composer-input");
    if (!textarea) throw new Error("missing composer textarea");
    const transfer = new DataTransfer();
    transfer.items.add(new File(["png fixture"], "fixture.png", { type: "image/png" }));
    transfer.items.add(
      new File(["mesh"], "part.3mf", { type: "application/octet-stream" }),
    );
    textarea.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: transfer,
      }),
    );
  });
  await expect(page.locator(".aui-composer-chip-thumbnail")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.getByText("part.3mf")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(
    page.locator(".aui-composer-chip[data-kind='file'] .aui-composer-chip-meta"),
  ).toContainText(".3mf", { timeout: FAST_EXPECT_TIMEOUT });
  await submitComposer(page);
  await expect(page.getByText(/Attached file: .*part\.3mf/)).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
});

test("queues attachment follow-ups, restores them for edit, and sends payloads", async ({
  page,
}) => {
  await openStoredThread(page, { width: 1280, height: 900 });
  const message = await readyMessageInput(page);
  await fillMessage(page, "slow smoke");
  await submitComposer(page);
  await expect(stopButton(page)).toBeVisible({ timeout: FAST_EXPECT_TIMEOUT });

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    buffer: Buffer.from("png fixture"),
    mimeType: "image/png",
    name: "queued-image.png",
  });
  await expect(page.getByText("queued-image.png")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await fillMessage(page, "queued image edit");
  await message.press("Enter");
  await expect(page.getByLabel("Queued attachments")).toContainText("queued-image.png", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await expect(page.getByLabel("Pending attachments")).toHaveCount(0, {
    timeout: FAST_EXPECT_TIMEOUT,
  });

  await page
    .getByRole("button", { name: "Edit" })
    .click({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(page.getByLabel("Pending attachments")).toContainText("queued-image.png", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await message.press(process.platform === "darwin" ? "Meta+Enter" : "Control+Enter");
  await expect(page.getByText("Steered: queued image edit")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });

  await fileInput.setInputFiles({
    buffer: Buffer.from("mesh"),
    mimeType: "application/octet-stream",
    name: "queued-file.3mf",
  });
  await expect(page.getByText("queued-file.3mf")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await fillMessage(page, "queued file send now");
  await message.press("Enter");
  await expect(page.getByLabel("Queued attachments")).toContainText("queued-file.3mf", {
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await sendNowButton(page).click({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(page.getByText("Steered: queued file send now")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });

  await fileInput.setInputFiles({
    buffer: Buffer.from("remove"),
    mimeType: "image/png",
    name: "remove-queued.png",
  });
  await expect(page.getByText("remove-queued.png")).toBeVisible({
    timeout: FAST_EXPECT_TIMEOUT,
  });
  await fillMessage(page, "remove queued image");
  await message.press("Enter");
  await page
    .getByRole("button", { name: "Remove" })
    .click({ timeout: FAST_EXPECT_TIMEOUT });
  await expect(queuedFollowUps(page)).toHaveCount(0, {
    timeout: FAST_EXPECT_TIMEOUT,
  });
});
