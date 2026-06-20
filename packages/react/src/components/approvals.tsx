import type { PendingServerRequest } from "@nyosegawa/agent-ui-core";
import type React from "react";
import { useState } from "react";
import {
  IconBlock,
  IconCheck,
  IconPaperclip,
  IconShield,
  buttonClass,
} from "../components-internal";
import { AgentDiffViewer } from "../diff-viewer";
import { useAgentApprovals } from "../hooks";
import { useAgentI18n, type AgentI18nKey } from "../i18n";
import { deferAction, isRecord, stringField } from "./shared";

export function AgentApprovalQueue({
  approvals: approvalsProp,
  renderApproval,
  threadId,
}: {
  approvals?: PendingServerRequest[];
  renderApproval?: (approval: PendingServerRequest) => React.ReactNode;
  threadId?: string;
}) {
  const { t } = useAgentI18n();
  const { approvals: hookApprovals, approve } = useAgentApprovals(threadId);
  const approvals = approvalsProp ?? hookApprovals;
  const [expandedId, setExpandedId] = useState<string | undefined>();
  if (approvals.length === 0) return null;
  if (renderApproval) {
    return (
      <section className="aui-approvals" aria-label={t("approval.aria.pending")}>
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
      aria-label={
        approvals.length === 1
          ? t("approval.aria.pendingOne", { id: String(expanded.id) })
          : t("approval.aria.pending")
      }
      data-count={approvals.length}
    >
      {approvals.length > 1 ? (
        <p className="aui-approvals-count" role="status">
          {t("approval.count", { count: approvals.length })}
        </p>
      ) : null}
      <ApprovalCard
        approval={expanded}
        onApprove={() =>
          deferAction(() => void approve(expanded.id, approvalResult(expanded), expanded))
        }
        onApproveForSession={() =>
          deferAction(() =>
            void approve(expanded.id, approvalSessionResult(expanded), expanded),
          )
        }
        onReject={() =>
          deferAction(() =>
            void approve(expanded.id, declineApprovalResult(expanded), expanded),
          )
        }
      />
      {others.length > 0 ? (
        <ul className="aui-approval-more" aria-label={t("approval.aria.otherPending")}>
          {others.map((approval) => {
            const payload = isRecord(approval.payload) ? approval.payload : {};
            const risk = approvalRisk(approval.kind, payload);
            return (
              <li key={String(approval.id)}>
                <button
                  aria-label={t("approval.action.reviewAria", {
                    id: String(approval.id),
                    label: approvalRequestLabel(approval.kind, t),
                  })}
                  className="aui-approval-compact"
                  data-risk={risk}
                  onClick={() => setExpandedId(String(approval.id))}
                  type="button"
                >
                  <span className="aui-approval-compact-icon" aria-hidden="true">
                    <IconShield size={14} />
                  </span>
                  <span className="aui-approval-compact-body">
                    <strong>{approvalTitle(approval.kind, t)}</strong>
                    <small>{approvalSubtitle(approval.kind, payload, t)}</small>
                  </span>
                  <span className="aui-approval-risk" data-risk={risk}>
                    {riskLabel(risk, t)}
                  </span>
                  <span className="aui-approval-compact-cta" aria-hidden="true">
                    {t("approval.action.review")}
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
  const { t } = useAgentI18n();
  const payload = isRecord(approval.payload) ? approval.payload : {};
  const requestLabel = approvalRequestLabel(approval.kind, t);
  const risk = approvalRisk(approval.kind, payload);
  const canDecide = isDecisionApprovalKind(approval.kind);
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
            {approvalTitle(approval.kind, t)}
          </strong>
          <small>{approvalSubtitle(approval.kind, payload, t)}</small>
        </div>
        <span className="aui-approval-risk" data-risk={risk}>
          {riskLabel(risk, t)} {t("approval.riskSuffix")}
        </span>
      </header>
      <ApprovalSummary approval={approval} payload={payload} />
      {canDecide ? (
        <footer className="aui-approval-actions">
          <button
            aria-label={t("approval.action.approveAria", {
              id: String(approval.id),
              label: requestLabel,
            })}
            className={buttonClass("primary", { size: "md" })}
            onClick={onApprove}
            type="button"
          >
            <IconCheck size={14} />
            <span>{t("approval.action.approve")}</span>
          </button>
          <button
            aria-label={t("approval.action.approveForSessionAria", {
              id: String(approval.id),
              label: requestLabel,
            })}
            className={buttonClass("secondary", { size: "md" })}
            onClick={onApproveForSession}
            type="button"
          >
            {t("approval.action.approveForSession")}
          </button>
          <button
            aria-label={t("approval.action.declineAria", {
              id: String(approval.id),
              label: requestLabel,
            })}
            className={buttonClass("danger", { size: "md" })}
            onClick={onReject}
            type="button"
          >
            <IconBlock size={14} />
            <span>{t("approval.action.decline")}</span>
          </button>
        </footer>
      ) : null}
    </article>
  );
}

function isDecisionApprovalKind(kind: string): boolean {
  return kind === "commandApproval" || kind === "fileChangeApproval";
}

type ApprovalRisk = "high" | "medium" | "low";

function approvalRisk(kind: string, payload: Record<string, unknown>): ApprovalRisk {
  if (kind === "fileChangeApproval") return "medium";
  if (kind === "commandApproval") {
    const sandbox =
      typeof payload.sandbox === "string" ? payload.sandbox : payload.sandboxPolicy;
    if (typeof sandbox === "string" && /none|disable|no-sandbox/i.test(sandbox)) {
      return "high";
    }
    const command = commandDisplay(payload) ?? "";
    if (/\brm\b\s+-rf|sudo|curl\s.*sh|chmod\s+777/i.test(command)) return "high";
    return "medium";
  }
  if (kind === "dynamicTool" || kind === "permissionsApproval") return "medium";
  if (kind === "userInput" || kind === "mcpElicitation") return "low";
  return "low";
}

function riskLabel(risk: ApprovalRisk, t: (key: AgentI18nKey) => string): string {
  switch (risk) {
    case "high":
      return t("approval.risk.high");
    case "medium":
      return t("approval.risk.medium");
    default:
      return t("approval.risk.low");
  }
}

function approvalSubtitle(
  kind: string,
  payload: Record<string, unknown>,
  t: (key: AgentI18nKey, vars?: Record<string, string | number>) => string,
): string {
  const reason = stringField(payload, "reason");
  if (reason) return reason;
  switch (kind) {
    case "fileChangeApproval":
      return t("approval.summary.fileChange");
    case "commandApproval":
      return t("approval.summary.command");
    case "dynamicTool":
      return t("approval.summary.dynamicTool");
    case "permissionsApproval":
      return t("approval.summary.permissions");
    case "userInput":
      return t("approval.summary.userInput");
    case "mcpElicitation":
      return t("approval.summary.mcpInput");
    case "authRefresh":
      return t("approval.kind.authRefresh");
    case "attestation":
      return t("approval.kind.attestation");
    default:
      return t("approval.summary.default", { kind });
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
  if (approval.kind === "commandApproval") {
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

function approvalTitle(kind: string, t: (key: AgentI18nKey) => string): string {
  switch (kind) {
    case "fileChangeApproval":
      return t("approval.kind.fileChange");
    case "commandApproval":
      return t("approval.kind.command");
    case "userInput":
      return t("approval.kind.userInput");
    case "mcpElicitation":
      return t("approval.kind.mcpInput");
    case "dynamicTool":
      return t("approval.kind.dynamicTool");
    case "permissionsApproval":
      return t("approval.kind.permissions");
    case "authRefresh":
      return t("approval.kind.authRefresh");
    case "attestation":
      return t("approval.kind.attestation");
    default:
      return t("approval.kind.generic");
  }
}

function approvalRequestLabel(
  kind: string,
  t: (key: AgentI18nKey, vars?: Record<string, string | number>) => string,
): string {
  if (kind === "commandApproval") return t("approval.request.command");
  if (kind === "fileChangeApproval") return t("approval.request.fileChange");
  return t("approval.request.generic", {
    kind: kind.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase(),
  });
}

function CommandApprovalSummary({ payload }: { payload: Record<string, unknown> }) {
  const { t } = useAgentI18n();
  const command = commandDisplay(payload) ?? t("timeline.command");
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
          [t("approval.meta.workingDirectory"), cwd],
          [t("approval.meta.sandbox"), sandbox],
          [t("approval.meta.approvalPolicy"), policy],
        ]}
      />
    </div>
  );
}

function commandDisplay(payload: Record<string, unknown>): string | undefined {
  const commandLine = stringField(payload, "commandLine");
  if (commandLine) return commandLine;
  const command = payload.command ?? payload.cmd;
  if (typeof command === "string") return command;
  if (Array.isArray(command)) return shellQuoteCommand(command);
  return undefined;
}

function shellQuoteCommand(command: unknown[]): string {
  return command.map((part) => shellQuote(String(part))).join(" ");
}

function shellQuote(part: string): string {
  if (/^[A-Za-z0-9_./:=@%+-]+$/.test(part)) return part;
  return `'${part.replace(/'/g, `'\\''`)}'`;
}

function FileChangeApprovalSummary({ payload }: { payload: Record<string, unknown> }) {
  const { t } = useAgentI18n();
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
          {t("approval.summary.fileChange")}
        </p>
      ) : null}
    </div>
  );
}

function UserInputApprovalSummary({ payload }: { payload: Record<string, unknown> }) {
  const { t } = useAgentI18n();
  const prompt =
    stringField(payload, "prompt") ??
    stringField(payload, "question") ??
    stringField(payload, "message") ??
    t("approval.summary.userInput");
  return (
    <div className="aui-approval-summary">
      <p className="aui-approval-copy">{prompt}</p>
      <MetadataGrid rows={[[t("approval.meta.item"), stringField(payload, "itemId")]]} />
    </div>
  );
}

function DynamicToolApprovalSummary({ payload }: { payload: Record<string, unknown> }) {
  const { t } = useAgentI18n();
  const namespace = stringField(payload, "namespace");
  const tool = stringField(payload, "tool") ?? stringField(payload, "name") ?? t("approval.meta.tool");
  return (
    <div className="aui-approval-summary">
      <MetadataGrid
        rows={[
          [t("approval.meta.namespace"), namespace],
          [t("approval.meta.tool"), tool],
          [t("approval.meta.item"), stringField(payload, "itemId")],
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
  const { t } = useAgentI18n();
  return (
    <div className="aui-approval-summary">
      <p className="aui-approval-copy">
        {t("approval.summary.permissions")}
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
  const { t } = useAgentI18n();
  return (
    <div className="aui-approval-summary">
      <p className="aui-approval-copy">{t("approval.summary.default", { kind })}</p>
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
  if (isDecisionApprovalKind(approval.kind)) return { decision: "accept" };
  return undefined;
}

function approvalSessionResult(approval: PendingServerRequest) {
  if (isDecisionApprovalKind(approval.kind)) return { decision: "acceptForSession" };
  return undefined;
}

function declineApprovalResult(approval: PendingServerRequest) {
  if (isDecisionApprovalKind(approval.kind)) return { decision: "decline" };
  return undefined;
}
