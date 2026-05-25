import { buttonClass } from "../components-internal";
import {
  agentLocales,
  useAgentI18n,
  type AgentLocale,
} from "../i18n";

export interface AgentLocaleSelectProps {
  "aria-label"?: string;
  disabled?: boolean;
  onChange: (locale: AgentLocale) => void;
  value: AgentLocale;
}

export function AgentLocaleSelect({
  "aria-label": ariaLabel,
  disabled = false,
  onChange,
  value,
}: AgentLocaleSelectProps) {
  const { t } = useAgentI18n();
  return (
    <label className="aui-locale-select">
      <span className="aui-visually-hidden">{ariaLabel ?? t("locale.label")}</span>
      <select
        aria-label={ariaLabel ?? t("locale.label")}
        className={buttonClass("secondary", { size: "sm" })}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value as AgentLocale)}
        value={value}
      >
        {agentLocales.map((locale) => (
          <option key={locale} value={locale}>
            {t(`locale.${locale}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
