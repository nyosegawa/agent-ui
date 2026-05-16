import type { PendingServerRequest } from "@nyosegawa/agent-ui-core";
import type React from "react";
import { useState } from "react";
import { IconBlock, IconCheck, IconPaperclip, IconShield, buttonClass } from "../components-internal";
import { AgentDiffViewer } from "../diff-viewer";
import { useAgentApprovals } from "../hooks";
import { deferAction, isRecord, stringField } from "./shared";

export function AgentApprovalQueue({
  renderApproval,
  threadId,
}: {
  renderApproval?: (approval: PendingServerRequest) => React.ReactNode;
  threadId?: string;
}) {
  const { approvals, approve } = useAgentApprovals(threadId);
  const [expandedId, setExpandedId] = useState<string | undefined>();
  if (approvals.length === 0) return null;
  if (renderApproval) {
    return (
      <section className="aui-approvals" aria-label="Pending approvals">
        {approvals.map((approval) => (
          <div key={String(approval.id)}>{renderApproval(approval)}</div>
        ))}
      </section>
    );
  }
  const expanded =
    approvals.find((approval) => String(approval.id) === expandedId) ?? approvals[0]!;
  const others = approvals.filter((approval) => approval.id !== expanded.id);
  return (
    <section
      className="aui-approvals"
      aria-label="Pending approvals"
      data-count={approvals.length}
    >
      {approvals.length > 1 ? (
        <p className="aui-approvals-count" role="status">
          {approvals.length} decisions need your review
        </p>
      ) : null}
      <ApprovalCard
        approval={expanded}
        onApprove={() =>
          deferAction(() => void approve(expanded.id, approvalResult(expanded)))
        }
        onApproveForSession={() =>
          deferAction(() =>
            void approve(expanded.id, approvalSessionResult(expanded)),
          )
        }
        onReject={() =>
          deferAction(() =>
            void approve(expanded.id, declineApprovalResult(expanded)),
          )
        }
      />
      {others.length > 0 ? (
        <ul className="aui-approval-more" aria-label="Other pending approvals">
          {others.map((approval) => {
            const payload = isRecord(approval.payload) ? approval.payload : {};
            const risk = approvalRisk(approval.kind, payload);
            return (
              <li key={String(approval.id)}>
                <button
                  aria-label={`Review ${approvalRequestLabel(approval.kind)} ${String(
                    approval.id,
                  )}`}
                  className="aui-approval-compact"
                  data-risk={risk}
                  onClick={() => setExpandedId(String(approval.id))}
                  type="button"
                >
                  <span className="aui-approval-compact-icon" aria-hidden="true">
                    <IconShield size={14} />
                  </span>
                  <span className="aui-approval-compact-body">
                    <strong>{approvalTitle(approval.kind)}</strong>
                    <small>{approvalSubtitle(approval.kind, payload)}</small>
                  </span>
                  <span className="aui-approval-risk" data-risk={risk}>
                    {riskLabel(risk)}
                  </span>
                  <span className="aui-approval-compact-cta" aria-hidden="true">
                    Review
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

export const AgentApprovalPrompt = AgentApprovalQueue;

function ApprovalCard({
  approval,
  onApprove,
  onApproveForSession,
  onReject,
}: {
  approval: PendingServerRequest;
  onApprove: () => void;
  onApproveForSession: () => void;
  onReject: () => void;
}) {
  const payload = isRecord(approval.payload) ? approval.payload : {};
  const requestLabel = approvalRequestLabel(approval.kind);
  const risk = approvalRisk(approval.kind, payload);
  return (
    <article
      aria-labelledby={`aui-approval-title-${String(approval.id)}`}
      className="aui-approval"
      data-kind={approval.kind}
      data-risk={risk}
    >
      <header className="aui-approval-header">
        <span className="aui-approval-icon" aria-hidden="true" data-risk={risk}>
          <IconShield size={18} />
        </span>
        <div className="aui-approval-title">
          <strong id={`aui-approval-title-${String(approval.id)}`}>
            {approvalTitle(approval.kind)}
          </strong>
          <small>{approvalSubtitle(approval.kind, payload)}</small>
        </div>
        <span className="aui-approval-risk" data-risk={risk}>
          {riskLabel(risk)} risk
        </span>
      </header>
      <ApprovalSummary approval={approval} payload={payload} />
      <footer className="aui-approval-actions">
        <button
          aria-label={`Approve ${requestLabel} ${String(approval.id)}`}
          className={buttonClass("primary", { size: "md" })}
          onClick={onApprove}
          type="button"
        >
          <IconCheck size={14} />
          <span>Approve</span>
        </button>
        <button
          aria-label={`Approve ${requestLabel} ${String(approval.id)} for session`}
          className={buttonClass("secondary", { size: "md" })}
          onClick={onApproveForSession}
          type="button"
        >
          Approve for session
        </button>
        <button
          aria-label={`Decline ${requestLabel} ${String(approval.id)}`}
          className={buttonClass("danger", { size: "md" })}
          onClick={onReject}
          type="button"
        >
          <IconBlock size={14} />
          <span>Decline</span>
        </button>
      </footer>
    </article>
  );
}

type ApprovalRisk = "high" | "medium" | "low";

function approvalRisk(kind: string, payload: Record<string, unknown>): ApprovalRisk {
  if (kind === "fileChangeApproval" || kind === "legacyPatchApproval") return "medium";
  if (kind === "commandApproval" || kind === "legacyExecApproval") {
    const sandbox =
      typeof payload.sandbox === "string" ? payload.sandbox : payload.sandboxPolicy;
    if (typeof sandbox === "string" && /none|disable|no-sandbox/i.test(sandbox)) {
      return "high";
    }
    const command = typeof payload.command === "string" ? payload.command : "";
    if (/\brm\b\s+-rf|sudo|curl\s.*sh|chmod\s+777/i.test(command)) return "high";
    return "medium";
  }
  if (kind === "dynamicTool" || kind === "permissionsApproval") return "medium";
  if (kind === "userInput" || kind === "mcpElicitation") return "low";
  return "low";
}

function riskLabel(risk: ApprovalRisk): string {
  switch (risk) {
    case "high":
      return "High";
    case "medium":
      return "Med";
    default:
      return "Low";
  }
}

function approvalSubtitle(kind: string, payload: Record<string, unknown>): string {
  const reason = stringField(payload, "reason");
  if (reason) return reason;
  switch (kind) {
    case "fileChangeApproval":
    case "legacyPatchApproval":
      return "Codex wants to apply file changes to your workspace.";
    case "commandApproval":
    case "legacyExecApproval":
      return "Codex wants to run a shell command in your workspace.";
    case "dynamicTool":
      return "Codex wants to call a host-registered dynamic tool.";
    case "permissionsApproval":
      return "Codex wants to use an additional permission.";
    case "userInput":
      return "Codex needs a free-form answer to continue.";
    case "mcpElicitation":
      return "An MCP server needs additional input to continue.";
    case "authRefresh":
      return "Codex wants to refresh its credentials.";
    case "attestation":
      return "Codex wants to generate a runtime attestation.";
    default:
      return `Codex is requesting a ${kind} decision.`;
  }
}

function ApprovalSummary({
  approval,
  payload,
}: {
  approval: PendingServerRequest;
  payload: Record<string, unknown>;
}) {
  if (approval.kind === "fileChangeApproval") {
    return <FileChangeApprovalSummary payload={payload} />;
  }
  if (approval.kind === "commandApproval" || approval.kind === "legacyExecApproval") {
    return <CommandApprovalSummary payload={payload} />;
  }
  if (approval.kind === "userInput" || approval.kind === "mcpElicitation") {
    return <UserInputApprovalSummary payload={payload} />;
  }
  if (approval.kind === "dynamicTool") {
    return <DynamicToolApprovalSummary payload={payload} />;
  }
  if (approval.kind === "permissionsApproval") {
    return <PermissionsApprovalSummary payload={payload} />;
  }
  return <GenericApprovalSummary kind={approval.kind} payload={payload} />;
}

function approvalTitle(kind: string): string {
  switch (kind) {
    case "fileChangeApproval":
    case "legacyPatchApproval":
      return "Review file changes";
    case "commandApproval":
    case "legacyExecApproval":
      return "Approve command";
    case "userInput":
      return "User input requested";
    case "mcpElicitation":
      return "MCP input requested";
    case "dynamicTool":
      return "Approve dynamic tool";
    case "permissionsApproval":
      return "Approve permissions";
    case "authRefresh":
      return "Refresh authentication";
    case "attestation":
      return "Generate attestation";
    default:
      return "Review request";
  }
}

function approvalRequestLabel(kind: string): string {
  if (kind === "commandApproval") return "command request";
  if (kind === "fileChangeApproval") return "file-change request";
  return `${kind.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()} request`;
}

function CommandApprovalSummary({ payload }: { payload: Record<string, unknown> }) {
  const command =
    stringField(payload, "command") ?? stringField(payload, "cmd") ?? "Command";
  const cwd = stringField(payload, "cwd") ?? stringField(payload, "workingDirectory");
  const policy = stringField(payload, "approvalPolicy");
  const sandbox =
    stringField(payload, "sandbox") ?? stringField(payload, "sandboxPolicy");
  return (
    <div className="aui-approval-summary">
      <pre className="aui-command-line">
        <code>$ {command}</code>
      </pre>
      <MetadataGrid
        rows={[
          ["Working directory", cwd],
          ["Sandbox", sandbox],
          ["Approval policy", policy],
        ]}
      />
    </div>
  );
}

function FileChangeApprovalSummary({ payload }: { payload: Record<string, unknown> }) {
  const path = stringField(payload, "path");
  const summary = stringField(payload, "summary") ?? stringField(payload, "description");
  const patch = payload.patch ?? payload.diff ?? payload.fileChanges;
  return (
    <div className="aui-approval-summary">
      {path ? (
        <div className="aui-approval-filepath">
          <IconPaperclip size={12} />
          <code>{path}</code>
        </div>
      ) : null}
      {summary ? <p className="aui-approval-copy">{summary}</p> : null}
      {patch ? <AgentDiffViewer patch={patch} /> : null}
      {!path && !summary && !patch ? (
        <p className="aui-approval-copy">
          Review the file-change request before deciding.
        </p>
      ) : null}
    </div>
  );
}

function UserInputApprovalSummary({ payload }: { payload: Record<string, unknown> }) {
  const prompt =
    stringField(payload, "prompt") ??
    stringField(payload, "question") ??
    stringField(payload, "message") ??
    "The agent is asking for user input.";
  return (
    <div className="aui-approval-summary">
      <p className="aui-approval-copy">{prompt}</p>
      <MetadataGrid rows={[["Item", stringField(payload, "itemId")]]} />
    </div>
  );
}

function DynamicToolApprovalSummary({ payload }: { payload: Record<string, unknown> }) {
  const namespace = stringField(payload, "namespace");
  const tool = stringField(payload, "tool") ?? stringField(payload, "name") ?? "tool";
  return (
    <div className="aui-approval-summary">
      <MetadataGrid
        rows={[
          ["Namespace", namespace],
          ["Tool", tool],
          ["Item", stringField(payload, "itemId")],
        ]}
      />
      {payload.arguments ? (
        <pre className="aui-approval-json">
          {JSON.stringify(payload.arguments, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

function PermissionsApprovalSummary({ payload }: { payload: Record<string, unknown> }) {
  return (
    <div className="aui-approval-summary">
      <p className="aui-approval-copy">
        Review the requested permission before allowing the agent to continue.
      </p>
      <pre className="aui-approval-json">{JSON.stringify(payload, null, 2)}</pre>
    </div>
  );
}

function GenericApprovalSummary({
  kind,
  payload,
}: {
  kind: string;
  payload: Record<string, unknown>;
}) {
  return (
    <div className="aui-approval-summary">
      <p className="aui-approval-copy">Review {kind} before deciding.</p>
      <pre className="aui-approval-json">{JSON.stringify(payload, null, 2)}</pre>
    </div>
  );
}

function MetadataGrid({ rows }: { rows: Array<[string, string | undefined]> }) {
  const visibleRows = rows.filter(([, value]) => value);
  if (visibleRows.length === 0) return null;
  return (
    <dl className="aui-metadata-grid">
      {visibleRows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}


function approvalResult(approval: PendingServerRequest) {
  if (approval.kind === "fileChangeApproval") return { decision: "accept" };
  if (approval.kind === "commandApproval") return { decision: "accept" };
  return { decision: "accept" };
}


function approvalSessionResult(approval: PendingServerRequest) {
  if (approval.kind === "fileChangeApproval") return { decision: "acceptForSession" };
  if (approval.kind === "commandApproval") return { decision: "acceptForSession" };
  return { decision: "acceptForSession" };
}


function declineApprovalResult(approval: PendingServerRequest) {
  if (approval.kind === "fileChangeApproval") return { decision: "decline" };
  if (approval.kind === "commandApproval") return { decision: "decline" };
  return { decision: "decline" };
}


