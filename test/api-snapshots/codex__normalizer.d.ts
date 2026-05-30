import { AgentApp, AgentModel, AgentEvent, AgentTurn } from '@nyosegawa/agent-ui-core';

interface MethodMessage {
    id?: string | number;
    method: string;
    params?: unknown;
}

declare function normalizeApps(raw: unknown): AgentApp[];
declare function normalizeAppsListResponse(response: unknown): {
    apps: AgentApp[];
    nextCursor: string | null;
};

declare function normalizeModelListResponse(response: unknown): AgentModel[];

type ThreadTurnsListSortDirection = "asc" | "desc";
interface NormalizeTurnsPageOptions {
    threadId: string;
    itemsView?: AgentTurn["itemsView"];
    sortDirection?: ThreadTurnsListSortDirection;
}
interface NormalizedTurnsPage {
    events: AgentEvent[];
    itemsView?: AgentTurn["itemsView"];
    sortDirection: ThreadTurnsListSortDirection;
    turns: AgentTurn[];
}
interface NormalizedThreadTurnsListResponse extends NormalizedTurnsPage {
    backwardsCursor: string | null;
    nextCursor: string | null;
}
interface NormalizeThreadResumeResponseOptions extends NormalizeTurnsPageOptions {
    activate?: boolean;
}
interface NormalizedThreadResumeResponse {
    events: AgentEvent[];
    initialTurnsPage?: NormalizedThreadTurnsListResponse;
}
declare function normalizeThreadReadResponse(response: unknown, options?: {
    activate?: boolean;
}): AgentEvent[];
declare function normalizeThreadTurnsListResponse(response: unknown, options: NormalizeTurnsPageOptions): NormalizedThreadTurnsListResponse;
declare function normalizeThreadResumeResponse(response: unknown, options?: Partial<NormalizeThreadResumeResponseOptions>): NormalizedThreadResumeResponse;
declare function normalizeTurnsPage(rawTurns: readonly unknown[], options: NormalizeTurnsPageOptions): NormalizedTurnsPage;

declare function normalizeCodexServerMessage(message: MethodMessage): AgentEvent[];

export { normalizeApps, normalizeAppsListResponse, normalizeCodexServerMessage, normalizeModelListResponse, normalizeThreadReadResponse, normalizeThreadResumeResponse, normalizeThreadTurnsListResponse, normalizeTurnsPage };
