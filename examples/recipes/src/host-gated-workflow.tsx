import { useState } from "react";
import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import type { AgentUserInput } from "@nyosegawa/agent-ui-react";
import {
  AgentComposerInput,
  AgentComposerSubmitButton,
  AgentComposerToolbar,
  AgentProvider,
  AgentThreadTimeline,
  useAgentComposerController,
  useAgentThreadController,
} from "@nyosegawa/agent-ui-react";

type HostGateStatus = "draft" | "ready" | "approved";

interface HostWorkflowPlan {
  id: string;
  summary: string;
  status: HostGateStatus;
}

function HostGatedWorkflow() {
  const [plan, setPlan] = useState<HostWorkflowPlan>({
    id: "plan-001",
    status: "draft",
    summary: "Draft a migration plan, wait for host approval, then run Codex.",
  });
  const thread = useAgentThreadController();
  const composer = useAgentComposerController(thread.threadId);
  const gateApproved = plan.status === "approved";
  return (
    <main>
      <HostApprovalBar
        onApprove={() => setPlan((current) => ({ ...current, status: "approved" }))}
        onMarkReady={() => setPlan((current) => ({ ...current, status: "ready" }))}
        plan={plan}
      />
      <section aria-label="Workflow transcript">
        {thread.thread ? (
          <AgentThreadTimeline thread={thread.thread} threadId={thread.threadId} />
        ) : null}
      </section>
      <form
        aria-label="Delayed host composer"
        onSubmit={(event) => {
          event.preventDefault();
          if (!gateApproved || !composer.canSubmit) return;
          if (thread.threadId) {
            void composer.submit();
            return;
          }
          const input: AgentUserInput[] = [{ text: composer.value, type: "text" }];
          void composer.startThreadWithInput(input, {
            threadOptions: {
              config: { hostPlanId: plan.id },
              threadSource: "user",
            },
            turnOptions: {
              cwd: "/workspace/approved-project",
              approvalPolicy: "on-request",
            },
          });
        }}
      >
        <AgentComposerInput
          aria-label="Message"
          disabled={!gateApproved || composer.isSubmitting}
          onChange={(event) => composer.setValue(event.currentTarget.value)}
          placeholder={
            gateApproved
              ? "Send approved work to Codex"
              : "Approve the host plan before sending"
          }
          value={composer.value}
        />
        <AgentComposerToolbar
          end={
            <>
              {composer.isRunning ? (
                <button onClick={() => void composer.stop()} type="button">
                  Stop
                </button>
              ) : null}
              <AgentComposerSubmitButton
                canSubmit={gateApproved && composer.canSubmit}
                isStopAction={false}
                label="Send approved work"
              />
            </>
          }
          start={<span>{gateApproved ? "Approved" : "Waiting for host gate"}</span>}
        />
      </form>
    </main>
  );
}

function HostApprovalBar({
  onApprove,
  onMarkReady,
  plan,
}: {
  onApprove: () => void;
  onMarkReady: () => void;
  plan: HostWorkflowPlan;
}) {
  return (
    <aside aria-label="Host approval">
      <strong>{plan.summary}</strong>
      <p>Status: {plan.status}</p>
      <button disabled={plan.status !== "draft"} onClick={onMarkReady} type="button">
        Mark plan ready
      </button>
      <button disabled={plan.status !== "ready"} onClick={onApprove} type="button">
        Approve plan
      </button>
    </aside>
  );
}

export function HostGatedWorkflowExample({ transport }: { transport: AgentTransport }) {
  return (
    <AgentProvider transport={transport}>
      <HostGatedWorkflow />
    </AgentProvider>
  );
}
