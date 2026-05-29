import type {
  AgentComposerController,
  QueuedFollowUp,
  QueuedFollowUpAttachment,
} from "../hooks";
import { useAgentI18n } from "../i18n";
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
  const { t } = useAgentI18n();
  if (composer.queuedFollowUps.length === 0) return null;
  const compactItems = composer.queuedFollowUps.slice(0, -3);
  const visibleItems = composer.queuedFollowUps.slice(-3);
  return (
    <section className="aui-follow-up-queue" aria-label={t("followUp.queued")}>
      {compactItems.length > 0 ? (
        <div className="aui-follow-up-compact-group">
          <div className="aui-follow-up-summary" role="status">
            {t("followUp.earlier", {
              count: compactItems.length,
              label: compactItems.length === 1 ? "follow-up" : "follow-ups",
            })}
          </div>
          <ul className="aui-follow-up-compact-list" aria-label={t("followUp.earlierQueued")}>
            {compactItems.map((item) => (
              <li className="aui-follow-up-compact-row" key={item.id}>
                <span className="aui-follow-up-compact-text">{item.text}</span>
                {item.attachments.length > 0 ? (
                  <span className="aui-follow-up-compact-attachments">
                    {t("followUp.attachments", {
                      count: item.attachments.length,
                      label: item.attachments.length === 1 ? "attachment" : "attachments",
                    })}
                  </span>
                ) : null}
                <FollowUpActions
                  composer={composer}
                  item={item}
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
                item={item}
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
  const { t } = useAgentI18n();
  return (
    <ul className="aui-follow-up-attachments" aria-label={t("followUp.queuedAttachments")}>
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
  item,
  labelSuffix,
  onRestoreAttachments,
}: {
  composer: AgentComposerController;
  item: QueuedFollowUp;
  labelSuffix?: string;
  onRestoreAttachments?: (attachments: QueuedFollowUpAttachment[]) => void;
}) {
  const { t } = useAgentI18n();
  const itemId = item.id;
  const isSending = composer.sendingFollowUpIds.includes(itemId);
  const canSendNow = Boolean(
    item.expectedTurnId && item.expectedTurnId === composer.activeTurnId,
  );
  const suffix = labelSuffix ? ` ${labelSuffix}` : "";
  const sendNow = `${t("followUp.sendNow")}${suffix}`;
  const edit = `${t("followUp.edit")}${suffix}`;
  const remove = `${t("followUp.remove")}${suffix}`;
  return (
    <div className="aui-follow-up-actions">
      {canSendNow ? (
        <button
          aria-label={sendNow}
          className={buttonClass("primary", { iconOnly: true, size: "sm" })}
          disabled={isSending}
          onClick={() => deferAction(() => composer.sendQueuedFollowUp(itemId))}
          title={sendNow}
          type="button"
        >
          <IconSend size={14} />
        </button>
      ) : null}
      <button
        aria-label={edit}
        className={buttonClass("secondary", { iconOnly: true, size: "sm" })}
        disabled={isSending}
        onClick={() => {
          const edited = composer.editQueuedFollowUp(itemId);
          if (edited) onRestoreAttachments?.(edited.attachments);
        }}
        title={edit}
        type="button"
      >
        <IconEdit size={14} />
      </button>
      <button
        aria-label={remove}
        className={buttonClass("ghost", { iconOnly: true, size: "sm" })}
        disabled={isSending}
        onClick={() => composer.removeQueuedFollowUp(itemId)}
        title={remove}
        type="button"
      >
        <IconTrash size={14} />
      </button>
    </div>
  );
}
