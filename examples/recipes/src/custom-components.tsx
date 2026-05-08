import type { PendingServerRequest } from "@nyosegawa/agent-ui-core";
import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";
import type { AgentTransport } from "@nyosegawa/agent-ui-core";

export function CustomApprovalCard({ approval }: { approval: PendingServerRequest }) {
  const payload = approval.payload as Record<string, unknown>;
  return (
    <section className="custom-approval">
      <h2>{approval.kind === "fileChangeApproval" ? "File change" : "Command"}</h2>
      <p>{String(payload.reason ?? payload.summary ?? "Review required")}</p>
      <pre>{JSON.stringify(payload, null, 2)}</pre>
    </section>
  );
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
