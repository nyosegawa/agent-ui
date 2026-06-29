import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";
import type { AgentApprovalDefaultProps } from "@nyosegawa/agent-ui-react";
import type { AgentTransport } from "@nyosegawa/agent-ui-core";

export function CustomApprovalCard({ approval }: AgentApprovalDefaultProps) {
  const payload = approval.payload as Record<string, unknown>;
  const primary =
    stringField(payload, "command") ??
    stringField(payload, "path") ??
    stringField(payload, "summary") ??
    stringField(payload, "reason") ??
    "Review required";
  return (
    <section className="custom-approval">
      <h2>{approval.kind === "fileChangeApproval" ? "File change" : "Command"}</h2>
      <p>{primary}</p>
    </section>
  );
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
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
