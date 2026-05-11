export type GetAccountParams = { refreshToken: boolean };
export type LoginAccountParams = { type: "chatgptDeviceCode" };
export type CancelLoginAccountParams = { loginId: string };
export type ModelListParams = {
  cursor?: string | null;
  includeHidden?: boolean | null;
  limit?: number | null;
};
export type ThreadListParams = {
  cursor?: string | null;
  limit?: number | null;
  searchTerm?: string | null;
  sortDirection?: "asc" | "desc" | null;
  sortKey?: string | null;
};
export type ThreadReadParams = { includeTurns: boolean; threadId: string };
export type ThreadResumeParams = { excludeTurns?: boolean; threadId: string } & Record<
  string,
  unknown
>;
export type ThreadStartParams = {
  cwd?: string | null;
  model?: string | null;
} & Record<string, unknown>;
export type TurnStartParams = {
  cwd?: string | null;
  effort?: string | null;
  input: CodexUserInput[];
  model?: string | null;
  threadId: string;
} & Record<string, unknown>;

export type CodexUserInput =
  | { text: string; text_elements: []; type: "text" }
  | { type: "image"; url: string }
  | { path: string; type: "localImage" }
  | { name: string; path: string; type: "skill" }
  | { name: string; path: string; type: "mention" };
export type TurnInterruptParams = { threadId: string; turnId: string };

export function accountReadParams(refreshToken = false): GetAccountParams {
  return { refreshToken };
}

export function deviceCodeLoginParams(): LoginAccountParams {
  return { type: "chatgptDeviceCode" };
}

export function cancelLoginParams(loginId: string): CancelLoginAccountParams {
  return { loginId };
}

export function modelListParams(): ModelListParams {
  return {};
}

export function threadListParams(
  params: {
    cursor?: string | null;
    limit?: number;
    searchTerm?: string;
  } = {},
): ThreadListParams {
  return {
    cursor: params.cursor ?? null,
    limit: params.limit ?? 25,
    searchTerm: params.searchTerm || null,
    sortDirection: "desc",
    sortKey: "updated_at",
  };
}

export function threadReadParams(
  threadId: string,
  includeTurns = true,
): ThreadReadParams {
  return { includeTurns, threadId };
}

export function threadResumeParams(
  threadId: string,
  params?: Record<string, unknown>,
): ThreadResumeParams {
  return { ...params, threadId };
}

export function threadStartParams(options: {
  cwd?: string;
  modelId?: string;
  params?: Record<string, unknown>;
}): ThreadStartParams {
  return {
    ...(options.modelId ? { model: options.modelId } : {}),
    ...(options.cwd ? { cwd: options.cwd } : {}),
    ...(options.params ?? {}),
  };
}

export function turnStartParams(options: {
  cwd?: string;
  effort?: string;
  executionParams?: Record<string, unknown>;
  input: string | CodexUserInput[];
  modelId?: string;
  params?: Record<string, unknown>;
  threadId: string;
}): TurnStartParams {
  return {
    ...(options.executionParams ?? {}),
    ...(options.cwd ? { cwd: options.cwd } : {}),
    ...(options.modelId ? { model: options.modelId } : {}),
    ...(options.effort ? { effort: options.effort } : {}),
    ...(options.params ?? {}),
    input:
      typeof options.input === "string"
        ? [{ text: options.input, text_elements: [], type: "text" }]
        : options.input,
    threadId: options.threadId,
  };
}

export function turnInterruptParams(
  threadId: string,
  turnId: string,
): TurnInterruptParams {
  return { threadId, turnId };
}
