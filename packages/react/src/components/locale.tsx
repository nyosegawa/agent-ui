import { IconCheck, IconGlobe } from "../components-internal";
import {
  agentLocales,
  useAgentI18n,
  type AgentLocale,
} from "../i18n";
import { AuiMenu } from "./disclosure";

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
  const label = ariaLabel ?? t("locale.label");
  return (
    <AuiMenu
      ariaLabel={label}
      className="aui-locale-menu"
      compact={false}
      disabled={disabled}
      icon={<IconGlobe size={14} />}
      label={t(`locale.${value}`)}
      triggerClassName="aui-locale-trigger"
    >
      {(close) =>
        agentLocales.map((locale) => {
          const selected = locale === value;
          return (
            <button
              aria-checked={selected}
              className="aui-menu-item"
              data-selected={selected ? "true" : undefined}
              key={locale}
              onClick={() => {
                onChange(locale);
                close();
              }}
              role="menuitemradio"
              type="button"
            >
              <span className="aui-menu-item-icon" aria-hidden="true">
                <IconGlobe size={14} />
              </span>
              <span className="aui-menu-item-body">
                <span className="aui-menu-item-label">{t(`locale.${locale}`)}</span>
              </span>
              <span className="aui-menu-item-check" aria-hidden="true">
                {selected ? <IconCheck size={14} /> : null}
              </span>
            </button>
          );
        })
      }
    </AuiMenu>
  );
}
