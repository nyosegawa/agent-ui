import { buttonClass } from "../components-internal";

export type AgentTheme = "light" | "dark" | "system";

const themeOptions: Array<{ label: string; value: AgentTheme }> = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

export interface AgentThemeToggleProps {
  "aria-label"?: string;
  disabled?: boolean;
  onChange: (theme: AgentTheme) => void;
  value: AgentTheme;
}

export function AgentThemeToggle({
  "aria-label": ariaLabel = "Theme",
  disabled = false,
  onChange,
  value,
}: AgentThemeToggleProps) {
  const selectedIndex = themeOptions.findIndex((option) => option.value === value);
  const changeByIndex = (index: number) => {
    const option = themeOptions[index];
    if (option && option.value !== value) onChange(option.value);
  };

  return (
    <div
      aria-label={ariaLabel}
      className="aui-theme-toggle"
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          changeByIndex((selectedIndex + 1) % themeOptions.length);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          changeByIndex((selectedIndex - 1 + themeOptions.length) % themeOptions.length);
        } else if (event.key === "Home") {
          event.preventDefault();
          changeByIndex(0);
        } else if (event.key === "End") {
          event.preventDefault();
          changeByIndex(themeOptions.length - 1);
        }
      }}
      role="radiogroup"
    >
      {themeOptions.map((option) => {
        const selected = value === option.value;
        return (
          <button
            aria-checked={selected}
            className={buttonClass(selected ? "secondary" : "ghost", {
              className: "aui-theme-toggle-option",
              size: "sm",
            })}
            disabled={disabled}
            key={option.value}
            onClick={() => onChange(option.value)}
            role="radio"
            tabIndex={selected ? 0 : -1}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
