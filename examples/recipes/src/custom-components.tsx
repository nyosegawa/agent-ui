import type { PendingServerRequest } from "@nyosegawa/agent-ui-core";
import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";
import type { AgentTransport } from "@nyosegawa/agent-ui-core";

export function CustomApprovalCard({ approval }: { approval: PendingServerRequest }) {
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
        slots={{
          renderApproval: (approval) => <CustomApprovalCard approval={approval} />,
          renderItem: (item) => (
            <article className={`custom-item custom-item-${item.kind}`}>
              <strong>{item.kind}</strong>
              <p>{item.text}</p>
            </article>
          ),
        }}
      />
    </AgentProvider>
  );
}
