import type { AgentComposerController } from "../hooks";
import { IconAlert, IconClose, IconRefresh, buttonClass } from "../components-internal";
import { useAgentI18n } from "../i18n";
import { deferAction } from "./shared";

export function FailedPendingMessageList({
  composer,
}: {
  composer: AgentComposerController;
}) {
  const { t } = useAgentI18n();
  if (composer.failedPendingMessages.length === 0) return null;
  return (
    <section
      aria-label={t("composer.failedMessages")}
      aria-live="polite"
      className="aui-composer-failed-list"
      role="status"
    >
      {composer.failedPendingMessages.map((message) => (
        <article className="aui-composer-failed-card" key={message.operationId}>
          <div className="aui-composer-failed-icon" aria-hidden="true">
            <IconAlert size={16} />
          </div>
          <div className="aui-composer-failed-copy">
            <h2>{t("composer.failedMessageTitle")}</h2>
            <p>{message.error ?? t("composer.failedMessageBody")}</p>
          </div>
          <div className="aui-composer-failed-actions">
            {message.retryable ? (
              <button
                className={buttonClass("primary", { size: "sm" })}
                onClick={() =>
                  deferAction(async () => {
                    try {
                      await composer.retryFailedPendingMessage(message.operationId);
                    } catch (caught) {
                      composer.setError(
                        caught instanceof Error ? caught.message : String(caught),
                      );
                    }
                  })
                }
                type="button"
              >
                <IconRefresh size={14} />
                <span>{t("composer.retryFailedMessage")}</span>
              </button>
            ) : null}
            <button
              aria-label={t("composer.dismissFailedMessage")}
              className={buttonClass("ghost", { iconOnly: true, size: "sm" })}
              onClick={() => composer.cancelFailedPendingMessage(message.operationId)}
              title={t("composer.dismissFailedMessage")}
              type="button"
            >
              <IconClose size={13} />
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
