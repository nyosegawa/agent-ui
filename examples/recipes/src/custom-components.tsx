import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";
import type { AgentApprovalDefaultProps } from "@nyosegawa/agent-ui-react";
import type { AgentTransport } from "@nyosegawa/agent-ui-core";

export function CustomApprovalCard({ approval }: AgentApprovalDefaultProps) {
  const primary =
    approval.command ??
    approval.path ??
    approval.summary ??
    approval.reason ??
    "Review required";
  return (
    <section className="custom-approval">
      <h2>{approval.kind === "fileChangeApproval" ? "File change" : "Command"}</h2>
      <p>{primary}</p>
    </section>
  );
}

export function CustomComponentsExample({ transport }: { transport: AgentTransport }) {
  return (
    <AgentProvider transport={transport}>
      <AgentChat
        components={{
          Approval: ({ approval, Default }) => (
            <>
              <CustomApprovalCard approval={approval} />
              <Default approval={approval} />
            </>
          ),
          blocks: {
            text: ({ block, Default }) => (
              <article className="custom-item custom-item-text">
                <strong>{block.kind}</strong>
                <Default block={block} />
              </article>
            ),
          },
        }}
      />
    </AgentProvider>
  );
}
