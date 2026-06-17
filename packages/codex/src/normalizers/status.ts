import type { AgentEvent } from "@nyosegawa/agent-ui-core";
import { asRecord } from "./shared";
import { joinSummaryDetails, numberValue } from "./status-utils";

export function normalizeStatusNotification(
  method: string,
  params: Record<string, unknown>,
): AgentEvent[] | undefined {
  switch (method) {
    case "warning":
      return [
        {
          type: "warning/added",
          warning: {
            audience: ["user"],
            id: String(params.id ?? params.code ?? params.message ?? "codex-warning"),
            message: String(params.message ?? params.warning ?? "Codex warning"),
            raw: params,
          },
        },
      ];
    case "error": {
      const error = asRecord(params.error);
      return [
        {
          type: "error/added",
          error: {
            audience: ["user"],
            code: numberValue(params.code ?? error?.code),
            data:
              params.data ??
              error?.data ??
              error?.codexErrorInfo ??
              error?.additionalDetails,
            message: String(error?.message ?? params.message ?? "Codex error"),
          },
        },
      ];
    }
    case "skills/changed":
      return [
        {
          type: "status/banner/added",
          banner: {
            audience: ["user"],
            id: "skills-changed",
            kind: "system",
            message: "Skills changed. Re-run skills/list to refresh metadata.",
            raw: params,
          },
        },
      ];
    case "model/rerouted":
      return [
        {
          type: "status/banner/added",
          banner: {
            audience: ["user"],
            id: `model-rerouted:${params.threadId ?? ""}:${params.turnId ?? ""}`,
            kind: "modelReroute",
            message: `Model rerouted from ${String(params.fromModel ?? "unknown")} to ${String(params.toModel ?? "unknown")}.`,
            raw: params,
          },
        },
      ];
    case "deprecationNotice":
      return [
        {
          type: "status/banner/added",
          banner: {
            audience: ["user"],
            id: `deprecation:${params.summary ?? "notice"}`,
            kind: "deprecationNotice",
            message: joinSummaryDetails(params.summary, params.details, "Deprecation notice"),
            raw: params,
          },
        },
      ];
    case "configWarning":
      return [
        {
          type: "status/banner/added",
          banner: {
            audience: ["user"],
            id: `config-warning:${params.path ?? params.summary ?? "warning"}`,
            kind: "configWarning",
            message: joinSummaryDetails(params.summary, params.details, "Config warning"),
            raw: params,
          },
        },
        {
          type: "warning/added",
          warning: {
            audience: ["developer", "audit"],
            id: `config-warning:${params.path ?? params.summary ?? "warning"}`,
            message: joinSummaryDetails(params.summary, params.details, "Config warning"),
            raw: params,
          },
        },
      ];
    case "mcpServer/oauthLogin/completed":
      return [
        {
          type: "status/banner/added",
          banner: {
            audience: ["user"],
            id: `mcp-oauth:${params.name ?? "server"}`,
            kind: "mcpOAuth",
            message:
              params.success === false
                ? `MCP OAuth failed for ${String(params.name ?? "server")}.`
                : `MCP OAuth completed for ${String(params.name ?? "server")}.`,
            raw: params,
            severity: params.success === false ? "critical" : "info",
          },
        },
      ];
    case "mcpServer/startupStatus/updated":
      return normalizeMcpServerStartupStatus(params);
    default:
      return undefined;
  }
}

function normalizeMcpServerStartupStatus(params: Record<string, unknown>): AgentEvent[] {
  const name = String(params.name ?? "server");
  const status = String(params.status ?? "unknown");
  const threadId = typeof params.threadId === "string" ? params.threadId : undefined;
  const events: AgentEvent[] = [
    {
      type: "notification/received",
      notification: {
        audience: ["developer", "audit"],
        id: `mcp-startup:${threadId ?? "global"}:${name}:${status}`,
        method: "mcpServer/startupStatus/updated",
        params,
      },
    },
  ];
  if (!threadId) return events;
  if (status !== "failed") {
    events.push({ id: `mcp-startup:${threadId}:${name}`, type: "status/banner/removed" });
    return events;
  }
  events.push({
    type: "status/banner/added",
    banner: {
      audience: ["user"],
      id: `mcp-startup:${threadId}:${name}`,
      kind: "system",
      message: `MCP server ${name} failed to start for this thread.`,
      raw: params,
      severity: "warning",
    },
  });
  return events;
}
