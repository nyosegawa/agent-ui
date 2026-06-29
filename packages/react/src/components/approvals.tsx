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
import type { AgentApprovalRequest } from "../approval-types";
import { useAgentApprovals } from "../hooks";
import { useAgentI18n, type AgentI18nKey } from "../i18n";
import { deferAction } from "./shared";

export function AgentApprovalQueue({
  approvals: approvalsProp,
  renderApproval,
  threadId,
}: {
  approvals?: AgentApprovalRequest[];
  renderApproval?: (approval: AgentApprovalRequest) => React.ReactNode;
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
          deferAction(() => void approve(expanded.id, "accept"))
        }
        onApproveForSession={() =>
          deferAction(() => void approve(expanded.id, "acceptForSession"))
        }
        onReject={() =>
          deferAction(() => void approve(expanded.id, "decline"))
        }
      />
      {others.length > 0 ? (
        <ul className="aui-approval-more" aria-label={t("approval.aria.otherPending")}>
          {others.map((approval) => {
            const risk = approval.risk;
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
                    <small>{approvalSubtitle(approval, t)}</small>
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
  approval: AgentApprovalRequest;
  onApprove: () => void;
  onApproveForSession: () => void;
  onReject: () => void;
}) {
  const { t } = useAgentI18n();
  const requestLabel = approvalRequestLabel(approval.kind, t);
  const risk = approval.risk;
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
          <small>{approvalSubtitle(approval, t)}</small>
        </div>
        <span className="aui-approval-risk" data-risk={risk}>
          {riskLabel(risk, t)} {t("approval.riskSuffix")}
        </span>
      </header>
      <ApprovalSummary approval={approval} />
      {approval.canDecide ? (
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

function riskLabel(
  risk: AgentApprovalRequest["risk"],
  t: (key: AgentI18nKey) => string,
): string {
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
  approval: AgentApprovalRequest,
  t: (key: AgentI18nKey, vars?: Record<string, string | number>) => string,
): string {
  if (approval.reason) return approval.reason;
  if (approval.summary) return approval.summary;
  if (approval.command) return approval.command;
  if (approval.path) return approval.path;
  switch (approval.kind) {
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
      return t("approval.summary.default", { kind: approval.kind });
  }
}

function ApprovalSummary({ approval }: { approval: AgentApprovalRequest }) {
  if (approval.kind === "fileChangeApproval") {
    return <FileChangeApprovalSummary approval={approval} />;
  }
  if (approval.kind === "commandApproval") {
    return <CommandApprovalSummary approval={approval} />;
  }
  if (approval.kind === "userInput" || approval.kind === "mcpElicitation") {
    return <UserInputApprovalSummary approval={approval} />;
  }
  if (approval.kind === "dynamicTool") {
    return <DynamicToolApprovalSummary approval={approval} />;
  }
  if (approval.kind === "permissionsApproval") {
    return <PermissionsApprovalSummary approval={approval} />;
  }
  return <GenericApprovalSummary approval={approval} />;
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

function CommandApprovalSummary({ approval }: { approval: AgentApprovalRequest }) {
  const { t } = useAgentI18n();
  const command = approval.command ?? t("timeline.command");
  return (
    <div className="aui-approval-summary">
      <pre className="aui-command-line">
        <code>$ {command}</code>
      </pre>
      <MetadataGrid
        rows={[
          [t("approval.meta.workingDirectory"), approval.cwd],
          [t("approval.meta.sandbox"), approval.sandbox],
          [t("approval.meta.approvalPolicy"), approval.approvalPolicy],
        ]}
      />
    </div>
  );
}

function FileChangeApprovalSummary({ approval }: { approval: AgentApprovalRequest }) {
  const { t } = useAgentI18n();
  return (
    <div className="aui-approval-summary">
      {approval.path ? (
        <div className="aui-approval-filepath">
          <IconPaperclip size={12} />
          <code>{approval.path}</code>
        </div>
      ) : null}
      {approval.summary ? <p className="aui-approval-copy">{approval.summary}</p> : null}
      {approval.patch ? <AgentDiffViewer patch={approval.patch} /> : null}
      {!approval.path && !approval.summary && !approval.patch ? (
        <p className="aui-approval-copy">
          {t("approval.summary.fileChange")}
        </p>
      ) : null}
    </div>
  );
}

function UserInputApprovalSummary({ approval }: { approval: AgentApprovalRequest }) {
  const { t } = useAgentI18n();
  const prompt = approval.prompt ?? t("approval.summary.userInput");
  return (
    <div className="aui-approval-summary">
      <p className="aui-approval-copy">{prompt}</p>
      <MetadataGrid rows={[[t("approval.meta.item"), approval.itemId]]} />
    </div>
  );
}

function DynamicToolApprovalSummary({ approval }: { approval: AgentApprovalRequest }) {
  const { t } = useAgentI18n();
  return (
    <div className="aui-approval-summary">
      <MetadataGrid
        rows={[
          [t("approval.meta.namespace"), approval.namespace],
          [t("approval.meta.tool"), approval.tool ?? t("approval.meta.tool")],
          [t("approval.meta.item"), approval.itemId],
        ]}
      />
      {approval.argumentsText ? (
        <pre className="aui-approval-json">
          {approval.argumentsText}
        </pre>
      ) : null}
    </div>
  );
}

function PermissionsApprovalSummary({ approval }: { approval: AgentApprovalRequest }) {
  const { t } = useAgentI18n();
  return (
    <div className="aui-approval-summary">
      <p className="aui-approval-copy">
        {t("approval.summary.permissions")}
      </p>
      <MetadataGrid
        rows={approval.details.map((detail) => [
          detailLabel(detail.label, t),
          detail.value,
        ])}
      />
    </div>
  );
}

function GenericApprovalSummary({ approval }: { approval: AgentApprovalRequest }) {
  const { t } = useAgentI18n();
  return (
    <div className="aui-approval-summary">
      <p className="aui-approval-copy">
        {approval.summary ??
          approval.prompt ??
          approval.reason ??
          t("approval.summary.default", { kind: approval.kind })}
      </p>
      <MetadataGrid
        rows={approval.details.map((detail) => [
          detailLabel(detail.label, t),
          detail.value,
        ])}
      />
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

function detailLabel(label: string, t: (key: AgentI18nKey) => string): string {
  switch (label) {
    case "approvalPolicy":
      return t("approval.meta.approvalPolicy");
    case "item":
      return t("approval.meta.item");
    case "namespace":
      return t("approval.meta.namespace");
    case "sandbox":
      return t("approval.meta.sandbox");
    case "tool":
      return t("approval.meta.tool");
    case "workingDirectory":
      return t("approval.meta.workingDirectory");
    default:
      return label;
  }
}
