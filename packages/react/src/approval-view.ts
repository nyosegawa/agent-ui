import type { PendingServerRequest } from "@nyosegawa/agent-ui-core/internal";
import type {
  AgentApprovalDetail,
  AgentApprovalPatch,
  AgentApprovalPatchChange,
  AgentApprovalRequest,
  AgentApprovalRequestKind,
  AgentApprovalRisk,
} from "./approval-types";

export function agentApprovalRequestView(
  request: PendingServerRequest,
): AgentApprovalRequest {
  const payload = isRecord(request.payload) ? request.payload : {};
  const command = commandDisplay(payload);
  const patch = approvalPatch(payload);
  const namespace = stringField(payload, "namespace");
  const tool =
    stringField(payload, "tool") ??
    stringField(payload, "name");
  const view: AgentApprovalRequest = {
    canDecide: isDecisionApprovalKind(request.kind),
    details: approvalDetails(request.kind, payload),
    id: request.id,
    kind: approvalKind(request.kind),
    risk: approvalRisk(request.kind, payload, command),
    ...(request.itemId ? { itemId: request.itemId } : {}),
    ...(request.threadId ? { threadId: request.threadId } : {}),
    ...(request.turnId ? { turnId: request.turnId } : {}),
    ...(command ? { command } : {}),
    ...(stringField(payload, "cwd") ?? stringField(payload, "workingDirectory")
      ? { cwd: stringField(payload, "cwd") ?? stringField(payload, "workingDirectory") }
      : {}),
    ...(stringField(payload, "sandbox") ?? stringField(payload, "sandboxPolicy")
      ? { sandbox: stringField(payload, "sandbox") ?? stringField(payload, "sandboxPolicy") }
      : {}),
    ...(stringField(payload, "approvalPolicy")
      ? { approvalPolicy: stringField(payload, "approvalPolicy") }
      : {}),
    ...(stringField(payload, "path") ? { path: stringField(payload, "path") } : {}),
    ...(stringField(payload, "summary") ?? stringField(payload, "description")
      ? {
          summary:
            stringField(payload, "summary") ?? stringField(payload, "description"),
        }
      : {}),
    ...(patch ? { patch } : {}),
    ...(promptText(payload) ? { prompt: promptText(payload) } : {}),
    ...(namespace ? { namespace } : {}),
    ...(tool ? { tool } : {}),
    ...(displayValue(payload.arguments) ? { argumentsText: displayValue(payload.arguments) } : {}),
    ...(stringField(payload, "reason") ? { reason: stringField(payload, "reason") } : {}),
  };
  return view;
}

export function legacyApprovalDecisionResult(
  decision: "accept" | "acceptForSession" | "decline",
) {
  switch (decision) {
    case "accept":
      return { decision: "approved" };
    case "acceptForSession":
      return { decision: "approved_for_session" };
    case "decline":
      return { decision: "denied" };
  }
}

export function isLegacyApprovalRequest(request: PendingServerRequest): boolean {
  const payload = isRecord(request.payload) ? request.payload : {};
  return (
    payload.upstreamMethod === "execCommandApproval" ||
    payload.upstreamMethod === "applyPatchApproval"
  );
}

function approvalKind(kind: string): AgentApprovalRequestKind {
  switch (kind) {
    case "attestation":
    case "authRefresh":
    case "commandApproval":
    case "dynamicTool":
    case "fileChangeApproval":
    case "mcpElicitation":
    case "permissionsApproval":
    case "userInput":
      return kind;
    default:
      return "unknown";
  }
}

function isDecisionApprovalKind(kind: string): boolean {
  return kind === "commandApproval" || kind === "fileChangeApproval";
}

function approvalRisk(
  kind: string,
  payload: Record<string, unknown>,
  command: string | undefined,
): AgentApprovalRisk {
  if (kind === "fileChangeApproval") return "medium";
  if (kind === "commandApproval") {
    const sandbox = stringField(payload, "sandbox") ?? stringField(payload, "sandboxPolicy");
    if (sandbox && /none|disable|no-sandbox/i.test(sandbox)) return "high";
    if (command && /\brm\b\s+-rf|sudo|curl\s.*sh|chmod\s+777/i.test(command)) {
      return "high";
    }
    return "medium";
  }
  if (kind === "dynamicTool" || kind === "permissionsApproval") return "medium";
  return "low";
}

function approvalDetails(
  kind: string,
  payload: Record<string, unknown>,
): AgentApprovalDetail[] {
  const rows: Array<[string, string | undefined]> = [];
  if (kind === "commandApproval") {
    rows.push(
      ["workingDirectory", stringField(payload, "cwd") ?? stringField(payload, "workingDirectory")],
      ["sandbox", stringField(payload, "sandbox") ?? stringField(payload, "sandboxPolicy")],
      ["approvalPolicy", stringField(payload, "approvalPolicy")],
    );
  } else if (kind === "dynamicTool") {
    rows.push(
      ["namespace", stringField(payload, "namespace")],
      ["tool", stringField(payload, "tool") ?? stringField(payload, "name")],
      ["item", stringField(payload, "itemId")],
    );
  } else if (kind === "userInput" || kind === "mcpElicitation") {
    rows.push(["item", stringField(payload, "itemId")]);
  }
  return rows.flatMap(([label, value]) => (value ? [{ label, value }] : []));
}

function approvalPatch(payload: Record<string, unknown>): AgentApprovalPatch | undefined {
  const patchText = textField(payload, "patch") ?? textField(payload, "diff");
  if (patchText) return patchText;
  const changes = approvalPatchChanges(payload.changes);
  if (changes.length > 0) return { changes };
  const fileChanges = approvalFileChanges(payload.fileChanges);
  if (fileChanges.length > 0) return { changes: fileChanges };
  return undefined;
}

function approvalPatchChanges(value: unknown): AgentApprovalPatchChange[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((change) => {
    if (!isRecord(change)) return [];
    const path = stringField(change, "path");
    if (!path) return [];
    return [
      {
        diff: textField(change, "diff") ?? "",
        kind: stringField(change, "kind") ?? "update",
        path,
      },
    ];
  });
}

function approvalFileChanges(value: unknown): AgentApprovalPatchChange[] {
  if (!isRecord(value)) return [];
  return Object.entries(value).flatMap(([path, change]) => {
    if (!isRecord(change)) return [];
    const type = stringField(change, "type");
    if (!type) return [];
    if (type === "update") {
      const movePath = stringField(change, "move_path");
      return [
        {
          diff: stringField(change, "unified_diff") ?? "",
          kind: movePath ? `move -> ${movePath}` : "update",
          path,
        },
      ];
    }
    const content = textField(change, "content") ?? "";
    return [
      {
        diff: contentToDiff(content, type === "delete" ? "-" : "+"),
        kind: type,
        path,
      },
    ];
  });
}

function contentToDiff(content: string, prefix: "+" | "-"): string {
  return content
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

function commandDisplay(payload: Record<string, unknown>): string | undefined {
  const commandLine = stringField(payload, "commandLine");
  if (commandLine) return commandLine;
  const command = payload.command ?? payload.cmd;
  if (typeof command === "string") return command;
  if (Array.isArray(command)) return command.map((part) => shellQuote(String(part))).join(" ");
  return undefined;
}

function shellQuote(part: string): string {
  if (/^[A-Za-z0-9_./:=@%+-]+$/.test(part)) return part;
  return `'${part.replace(/'/g, `'\\''`)}'`;
}

function promptText(payload: Record<string, unknown>): string | undefined {
  return (
    stringField(payload, "prompt") ??
    stringField(payload, "question") ??
    stringField(payload, "message")
  );
}

function displayValue(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function textField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
