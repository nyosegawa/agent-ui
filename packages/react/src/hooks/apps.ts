import type { AgentApp } from "@nyosegawa/agent-ui-core";
import { selectApps } from "@nyosegawa/agent-ui-core";
import { normalizeAppsListResponse } from "@nyosegawa/agent-ui-codex/normalizer";
import { useCallback } from "react";
import { useAgentContext } from "../provider";
import {
  codexAppsListParams,
  type AgentAppsRefreshOptions,
} from "../request-options";
import { useCodexSession } from "./codex-session";

export type { AgentAppsRefreshOptions } from "../request-options";

export function useAgentApps(threadId?: string) {
  const { dispatch, state } = useAgentContext();
  const codex = useCodexSession();
  const scopedApps = selectApps(state, threadId);
  const refreshApps = useCallback(
    async (params: AgentAppsRefreshOptions = {}) => {
      const requestOptions = threadId && !params.threadId ? { ...params, threadId } : params;
      const requestParams = codexAppsListParams(requestOptions);
      const response = await codex.apps.list(requestParams);
      const { apps, nextCursor } = normalizeAppsListResponse(response);
      dispatch({
        apps: requestOptions.cursor ? mergeApps(scopedApps.apps, apps) : apps,
        nextCursor,
        threadId: requestOptions.threadId ?? undefined,
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

function mergeApps(current: AgentApp[], next: AgentApp[]) {
  const byId = new Map(current.map((app) => [app.id, app]));
  for (const app of next) byId.set(app.id, app);
  return Array.from(byId.values());
}
