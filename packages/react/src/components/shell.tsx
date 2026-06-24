import type React from "react";
import type { AgentTheme } from "./theme";

export interface AgentShellProps extends React.HTMLAttributes<HTMLElement> {
  sidebar?: React.ReactNode;
  theme?: AgentTheme;
}

export function AgentShell({
  children,
  className,
  sidebar,
  theme,
  ...props
}: AgentShellProps) {
  const { Default: _Default, ...htmlProps } = props as typeof props & {
    Default?: unknown;
  };
  void _Default;
  const inheritedTheme = (props as { "data-aui-theme"?: AgentTheme })[
    "data-aui-theme"
  ];
  return (
    <section
      className={["aui-shell", className].filter(Boolean).join(" ")}
      data-sidebar-present={sidebar ? "true" : "false"}
      data-testid="agent-chat"
      {...htmlProps}
      data-aui-theme={theme ?? inheritedTheme}
    >
      {sidebar}
      {children}
    </section>
  );
}
