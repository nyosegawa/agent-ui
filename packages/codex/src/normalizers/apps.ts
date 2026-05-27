import type { AgentApp, AgentEvent } from "@nyosegawa/agent-ui-core";
import { booleanValue, asRecord, optionalStringValue, stringValue } from "./shared";

export function normalizeAppsNotification(
  method: string,
  params: Record<string, unknown>,
): AgentEvent[] | undefined {
  switch (method) {
    case "app/list/updated":
      return [
        {
          type: "apps/updated",
          apps: normalizeApps(params.data ?? params.apps ?? []),
          nextCursor: optionalStringValue(params.nextCursor ?? params.next_cursor) ?? null,
          threadId: optionalStringValue(params.threadId ?? params.thread_id),
        },
      ];
    default:
      return undefined;
  }
}

export function normalizeApps(raw: unknown): AgentApp[] {
  const apps = Array.isArray(raw) ? raw : [];
  return apps.flatMap((app) => {
    const record = asRecord(app);
    if (!record) return [];
    return [
      {
        id: String(record.id ?? record.uri ?? record.name),
        installed: booleanValue(record.installed ?? record.isEnabled),
        name: stringValue(record.name),
        needsAuth: booleanValue(record.needsAuth) ?? record.isAccessible === false,
        raw: app,
        uri: stringValue(record.uri ?? record.installUrl),
      },
    ];
  });
}

export function normalizeAppsListResponse(response: unknown): {
  apps: AgentApp[];
  nextCursor: string | null;
} {
  const record = asRecord(response);
  return {
    apps: normalizeApps(record?.data ?? record?.apps ?? response),
    nextCursor: optionalStringValue(record?.nextCursor ?? record?.next_cursor) ?? null,
  };
}
