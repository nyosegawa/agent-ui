import { IconSend, IconStop, buttonClass } from "../components-internal";
import { useAgentI18n } from "../i18n";

export function ComposerSubmitButton({
  canSubmit,
  isStopAction,
}: {
  canSubmit: boolean;
  isStopAction: boolean;
}) {
  const { t } = useAgentI18n();
  return (
    <button
      aria-label={isStopAction ? t("composer.stopCurrentTurn") : t("composer.send")}
      className={buttonClass(isStopAction ? "danger" : "primary", {
        iconOnly: true,
      })}
      disabled={!canSubmit}
      title={isStopAction ? t("composer.stopCurrentTurn") : t("composer.sendMessage")}
      type="submit"
    >
      {isStopAction ? <IconStop size={16} /> : <IconSend size={16} />}
    </button>
  );
}
