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
  const compactItems = composer.queuedFollowUps.slice(0, -3);
  const visibleItems = composer.queuedFollowUps.slice(-3);
  return (
    <section className="aui-follow-up-queue" aria-label="Queued follow-ups">
      {compactItems.length > 0 ? (
        <div className="aui-follow-up-compact-group">
          <div className="aui-follow-up-summary" role="status">
            {compactItems.length} earlier follow-up
            {compactItems.length === 1 ? "" : "s"} kept for this thread
          </div>
          <ul className="aui-follow-up-compact-list" aria-label="Earlier queued follow-ups">
            {compactItems.map((item) => (
              <li className="aui-follow-up-compact-row" key={item.id}>
                <span className="aui-follow-up-compact-text">{item.text}</span>
                {item.attachments.length > 0 ? (
                  <span className="aui-follow-up-compact-attachments">
                    {item.attachments.length} attachment
                    {item.attachments.length === 1 ? "" : "s"}
                  </span>
                ) : null}
                <FollowUpActions
                  composer={composer}
                  itemId={item.id}
                  labelSuffix={item.text}
                  onRestoreAttachments={onRestoreAttachments}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <ul className="aui-follow-up-list">
        {visibleItems.map((item) => {
          const error = composer.followUpErrors[item.id];
          return (
            <li className="aui-follow-up-card" key={item.id}>
              <p>{item.text}</p>
              {item.attachments.length > 0 ? (
                <FollowUpAttachments attachments={item.attachments} />
              ) : null}
              {error ? (
                <div className="aui-follow-up-error" role="alert">
                  {error}
                </div>
              ) : null}
              <FollowUpActions
                composer={composer}
                itemId={item.id}
                onRestoreAttachments={onRestoreAttachments}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function FollowUpAttachments({ attachments }: { attachments: QueuedFollowUpAttachment[] }) {
  return (
    <ul className="aui-follow-up-attachments" aria-label="Queued attachments">
      {attachments.map((attachment) => (
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
          <span className="aui-follow-up-attachment-label">{attachment.label}</span>
        </li>
      ))}
    </ul>
  );
}

function FollowUpActions({
  composer,
  itemId,
  labelSuffix,
  onRestoreAttachments,
}: {
  composer: AgentComposerController;
  itemId: string;
  labelSuffix?: string;
  onRestoreAttachments?: (attachments: QueuedFollowUpAttachment[]) => void;
}) {
  const isSending = composer.sendingFollowUpIds.includes(itemId);
  const suffix = labelSuffix ? ` ${labelSuffix}` : "";
  return (
    <div className="aui-follow-up-actions">
      <button
        aria-label={`Send now${suffix}`}
        className={buttonClass("primary", { iconOnly: true, size: "sm" })}
        disabled={isSending}
        onClick={() => deferAction(() => composer.sendQueuedFollowUp(itemId))}
        title={`Send now${suffix}`}
        type="button"
      >
        <IconSend size={14} />
      </button>
      <button
        aria-label={`Edit${suffix}`}
        className={buttonClass("secondary", { iconOnly: true, size: "sm" })}
        disabled={isSending}
        onClick={() => {
          const edited = composer.editQueuedFollowUp(itemId);
          if (edited) onRestoreAttachments?.(edited.attachments);
        }}
        title={`Edit${suffix}`}
        type="button"
      >
        <IconEdit size={14} />
      </button>
      <button
        aria-label={`Remove${suffix}`}
        className={buttonClass("ghost", { iconOnly: true, size: "sm" })}
        disabled={isSending}
        onClick={() => composer.removeQueuedFollowUp(itemId)}
        title={`Remove${suffix}`}
        type="button"
      >
        <IconTrash size={14} />
      </button>
    </div>
  );
}
