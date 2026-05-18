import type { AgentComposerController } from "../hooks";
import { IconEdit, IconSend, IconTrash, buttonClass } from "../components-internal";
import { deferAction } from "./shared";

export function QueuedFollowUpList({
  composer,
}: {
  composer: AgentComposerController;
}) {
  if (composer.queuedFollowUps.length === 0) return null;
  return (
    <section className="aui-follow-up-queue" aria-label="Queued follow-ups">
      <ul>
        {composer.queuedFollowUps.map((item) => {
          const isSending = composer.sendingFollowUpIds.includes(item.id);
          const error = composer.followUpErrors[item.id];
          return (
            <li className="aui-follow-up-card" key={item.id}>
              <p>{item.text}</p>
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
                  onClick={() => composer.editQueuedFollowUp(item.id)}
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
