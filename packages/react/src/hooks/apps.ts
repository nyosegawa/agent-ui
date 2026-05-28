import type { AgentApp } from "@nyosegawa/agent-ui-core";
import { selectApps } from "@nyosegawa/agent-ui-core";
import type { AppsListParams } from "@nyosegawa/agent-ui-codex/stable-types";
import { useCallback } from "react";
import { useAgentContext } from "../provider";
import { useCodexSession } from "./codex-session";

export function useAgentApps(threadId?: string) {
  const { dispatch, state } = useAgentContext();
  const codex = useCodexSession();
  const scopedApps = selectApps(state, threadId);
  const refreshApps = useCallback(
    async (params: AppsListParams = {}) => {
      const requestParams = threadId && !params.threadId ? { ...params, threadId } : params;
      const response = await codex.apps.list(requestParams);
      const { apps, nextCursor } = normalizeAppsList(response);
      dispatch({
        apps: requestParams.cursor ? mergeApps(scopedApps.apps, apps) : apps,
        nextCursor,
        threadId: requestParams.threadId ?? undefined,
        type: "apps/updated",
      });
      return { apps, nextCursor };
    },
    [codex, dispatch, scopedApps.apps, threadId],
  );
  const loadMoreApps = useCallback(
    async () =>
      scopedApps.nextCursor ? refreshApps({ cursor: scopedApps.nextCursor }) : undefined,
    [refreshApps, scopedApps.nextCursor],
  );
  return {
    apps: scopedApps.apps,
    loadMoreApps,
    nextCursor: scopedApps.nextCursor,
    refreshApps,
  };
}

function normalizeAppsList(response: unknown): { apps: AgentApp[]; nextCursor: string | null } {
  const record = asRecord(response);
  const rawApps = Array.isArray(record?.data)
    ? record.data
    : Array.isArray(record?.apps)
      ? record.apps
      : Array.isArray(response)
        ? response
        : [];
  return {
    apps: rawApps.flatMap((app) => {
      const appRecord = asRecord(app);
      if (!appRecord) return [];
      return [
        {
          id: String(appRecord.id ?? appRecord.uri ?? appRecord.name),
          installed:
            typeof appRecord.installed === "boolean"
              ? appRecord.installed
              : typeof appRecord.isEnabled === "boolean"
                ? appRecord.isEnabled
                : undefined,
          name: stringValue(appRecord.name),
          needsAuth:
            typeof appRecord.needsAuth === "boolean"
              ? appRecord.needsAuth
              : appRecord.isAccessible === false,
          raw: app,
          uri: stringValue(appRecord.uri) ?? stringValue(appRecord.installUrl),
        },
      ];
    }),
    nextCursor: stringValue(record?.nextCursor) ?? stringValue(record?.next_cursor) ?? null,
  };
}

function mergeApps(current: AgentApp[], next: AgentApp[]) {
  const byId = new Map(current.map((app) => [app.id, app]));
  for (const app of next) byId.set(app.id, app);
  return Array.from(byId.values());
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
