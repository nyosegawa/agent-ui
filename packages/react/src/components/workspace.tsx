import type React from "react";
import type { AgentChatProps } from "./chat";
import { AgentChat } from "./chat";

export interface AgentWorkspaceProps extends AgentChatProps {
  panel?: React.ReactNode;
  panelClassName?: string;
}

export function AgentWorkspace({
  panel,
  panelClassName,
  ...chatProps
}: AgentWorkspaceProps) {
  return (
    <section className="aui-workspace">
      <AgentChat {...chatProps} sidebar={chatProps.sidebar ?? true} />
      {panel ? (
        <aside
          className={["aui-extension-panel", panelClassName].filter(Boolean).join(" ")}
        >
          {panel}
        </aside>
      ) : null}
    </section>
  );
}
