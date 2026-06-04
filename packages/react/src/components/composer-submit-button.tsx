import { IconSend, IconStop, buttonClass } from "../components-internal";
import { useAgentI18n } from "../i18n";

export interface AgentComposerSubmitButtonProps {
  canSubmit: boolean;
  className?: string;
  iconSize?: number;
  isStopAction: boolean;
  label?: string;
  title?: string;
}

export function AgentComposerSubmitButton({
  canSubmit,
  className,
  iconSize = 16,
  isStopAction,
  label,
  title,
}: AgentComposerSubmitButtonProps) {
  const { t } = useAgentI18n();
  const buttonLabel =
    label ?? (isStopAction ? t("composer.stopCurrentTurn") : t("composer.send"));
  const buttonTitle =
    title ??
    (isStopAction ? t("composer.stopCurrentTurn") : t("composer.sendMessage"));
  return (
    <button
      aria-label={buttonLabel}
      className={buttonClass(isStopAction ? "danger" : "primary", {
        className,
        iconOnly: true,
      })}
      disabled={!canSubmit}
      title={buttonTitle}
      type="submit"
    >
      {isStopAction ? <IconStop size={iconSize} /> : <IconSend size={iconSize} />}
    </button>
  );
}
