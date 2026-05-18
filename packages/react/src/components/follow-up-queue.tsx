import type { AgentComposerController, QueuedFollowUpAttachment } from "../hooks";
import {
  IconApp,
  IconEdit,
  IconImage,
  IconPaperclip,
  IconPlugin,
  IconSend,
  IconTrash,
  buttonClass,
} from "../components-internal";
import { deferAction } from "./shared";

export function QueuedFollowUpList({
  composer,
  onRestoreAttachments,
}: {
  composer: AgentComposerController;
  onRestoreAttachments?: (attachments: QueuedFollowUpAttachment[]) => void;
}) {
  if (composer.queuedFollowUps.length === 0) return null;
  const visibleItems = composer.queuedFollowUps.slice(-3);
  const hiddenCount = composer.queuedFollowUps.length - visibleItems.length;
  return (
    <section className="aui-follow-up-queue" aria-label="Queued follow-ups">
      {hiddenCount > 0 ? (
        <div className="aui-follow-up-summary" role="status">
          {hiddenCount} earlier follow-up{hiddenCount === 1 ? "" : "s"} kept for this thread
        </div>
      ) : null}
      <ul>
        {visibleItems.map((item) => {
          const isSending = composer.sendingFollowUpIds.includes(item.id);
          const error = composer.followUpErrors[item.id];
          return (
            <li className="aui-follow-up-card" key={item.id}>
              <p>{item.text}</p>
              {item.attachments.length > 0 ? (
                <ul className="aui-follow-up-attachments" aria-label="Queued attachments">
                  {item.attachments.map((attachment) => (
                    <li
                      className="aui-follow-up-attachment"
                      data-kind={attachment.kind}
                      key={attachment.id}
                    >
                      {attachment.previewUrl ? (
                        <img
                          alt=""
                          className="aui-follow-up-attachment-thumbnail"
                          src={attachment.previewUrl}
                        />
                      ) : (
                        <span className="aui-follow-up-attachment-icon" aria-hidden="true">
                          {attachment.kind === "image" ? <IconImage size={13} /> : null}
                          {attachment.kind === "file" ? <IconPaperclip size={13} /> : null}
                          {attachment.kind === "app" ? <IconApp size={13} /> : null}
                          {attachment.kind === "plugin" ? <IconPlugin size={13} /> : null}
                        </span>
                      )}
                      <span className="aui-follow-up-attachment-label">
                        {attachment.label}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {error ? (
                <div className="aui-follow-up-error" role="alert">
                  {error}
                </div>
              ) : null}
              <div className="aui-follow-up-actions">
                <button
                  aria-label="Send now"
                  className={buttonClass("primary", { iconOnly: true, size: "sm" })}
                  disabled={isSending}
                  onClick={() => deferAction(() => composer.sendQueuedFollowUp(item.id))}
                  title="Send now"
                  type="button"
                >
                  <IconSend size={14} />
                </button>
                <button
                  aria-label="Edit"
                  className={buttonClass("secondary", { iconOnly: true, size: "sm" })}
                  disabled={isSending}
                  onClick={() => {
                    const edited = composer.editQueuedFollowUp(item.id);
                    if (edited) onRestoreAttachments?.(edited.attachments);
                  }}
                  title="Edit"
                  type="button"
                >
                  <IconEdit size={14} />
                </button>
                <button
                  aria-label="Remove"
                  className={buttonClass("ghost", { iconOnly: true, size: "sm" })}
                  disabled={isSending}
                  onClick={() => composer.removeQueuedFollowUp(item.id)}
                  title="Remove"
                  type="button"
                >
                  <IconTrash size={14} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
