import type {
  AgentError,
  AgentRequestOptions,
  AgentTransport,
  RequestId,
} from "@nyosegawa/agent-ui-core";
import {
  accountReadParams,
  appsListParams,
  cancelLoginParams,
  deviceCodeLoginParams,
  hooksListParams,
  modelListParams,
  skillsConfigWriteParams,
  skillsListParams,
  threadArchiveParams,
  threadCompactStartParams,
  threadForkParams,
  threadInjectItemsParams,
  threadListParams,
  threadLoadedListParams,
  threadMetadataUpdateParams,
  threadReadParams,
  threadResumeParams,
  threadRollbackParams,
  threadSetNameParams,
  threadStartParams,
  threadUnarchiveParams,
  threadUnsubscribeParams,
  turnInterruptParams,
  turnStartParams,
  turnSteerParams,
} from "./request-builders";
import type {
  AppsListParams,
  CodexExperimentalMethodParams,
  CodexStableMethodParams,
  HooksListParams,
  ModelListParams,
  SkillsConfigWriteParams,
  SkillsListParams,
  ThreadForkParams,
  ThreadInjectItemsParams,
  ThreadListParams,
  ThreadLoadedListParams,
  ThreadMetadataUpdateParams,
  ThreadResumeParams,
  ThreadStartParams,
  TurnStartParams,
  TurnSteerParams,
  UserInput,
} from "./request-builders";
import type {
  CodexExperimentalMethodResult,
  CodexStableMethodResult,
} from "./method-results";
import {
  assertCodexExperimentalMethod,
  assertCodexProductizedMethod,
  codexInitializeParams,
  isExperimentalUnsupportedMethod,
  stableProductizedMethods,
  type CodexInitializeOptions,
  type ExperimentalAvailableMethod,
  type StableProductizedMethod,
} from "./protocol";

export interface CodexClientsOptions {
  experimental?: boolean;
}

export type CodexThreadForkOptions = Omit<ThreadForkParams, "threadId">;
export type CodexThreadMetadataUpdateOptions = Omit<
  ThreadMetadataUpdateParams,
  "threadId"
>;
export type CodexThreadResumeOptions = Omit<ThreadResumeParams, "threadId">;
export type CodexTurnStartOptions = {
  input: string | UserInput[];
  threadId: string;
} & Omit<TurnStartParams, "input" | "threadId">;
export type CodexTurnSteerOptions = {
  input: string | UserInput[];
} & Omit<TurnSteerParams, "input">;

export interface CodexConnectionClient {
  initialize(
    options: CodexInitializeOptions,
    requestOptions?: AgentRequestOptions,
  ): Promise<CodexStableMethodResult<"initialize">>;
  initialized(): void;
}

export interface CodexAccountClient {
  cancelLogin(loginId: string): Promise<CodexStableMethodResult<"account/login/cancel">>;
  loginDeviceCode(): Promise<CodexStableMethodResult<"account/login/start">>;
  logout(): Promise<CodexStableMethodResult<"account/logout">>;
  read(refreshToken?: boolean): Promise<CodexStableMethodResult<"account/read">>;
  rateLimitsRead(): Promise<CodexStableMethodResult<"account/rateLimits/read">>;
}

export interface CodexAppsClient {
  list(params?: AppsListParams): Promise<CodexStableMethodResult<"app/list">>;
}

export interface CodexHooksClient {
  list(params?: HooksListParams): Promise<CodexStableMethodResult<"hooks/list">>;
}

export interface CodexSkillsClient {
  configWrite(
    params: SkillsConfigWriteParams,
  ): Promise<CodexStableMethodResult<"skills/config/write">>;
  list(params?: SkillsListParams): Promise<CodexStableMethodResult<"skills/list">>;
}

export interface CodexThreadsClient {
  archive(threadId: string): Promise<CodexStableMethodResult<"thread/archive">>;
  compactStart(threadId: string): Promise<CodexStableMethodResult<"thread/compact/start">>;
  fork(
    threadId: string,
    params?: CodexThreadForkOptions,
  ): Promise<CodexStableMethodResult<"thread/fork">>;
  injectItems(
    threadId: string,
    items: ThreadInjectItemsParams["items"],
  ): Promise<CodexStableMethodResult<"thread/inject_items">>;
  list(params?: ThreadListParams): Promise<CodexStableMethodResult<"thread/list">>;
  loadedList(
    params?: ThreadLoadedListParams,
  ): Promise<CodexStableMethodResult<"thread/loaded/list">>;
  metadataUpdate(
    threadId: string,
    params?: CodexThreadMetadataUpdateOptions,
  ): Promise<CodexStableMethodResult<"thread/metadata/update">>;
  read(
    threadId: string,
    includeTurns?: boolean,
  ): Promise<CodexStableMethodResult<"thread/read">>;
  resume(
    threadId: string,
    params?: CodexThreadResumeOptions,
  ): Promise<CodexStableMethodResult<"thread/resume">>;
  rollback(
    threadId: string,
    numTurns: number,
  ): Promise<CodexStableMethodResult<"thread/rollback">>;
  setName(
    threadId: string,
    name: string,
  ): Promise<CodexStableMethodResult<"thread/name/set">>;
  start(params?: ThreadStartParams): Promise<CodexStableMethodResult<"thread/start">>;
  unarchive(threadId: string): Promise<CodexStableMethodResult<"thread/unarchive">>;
  unsubscribe(threadId: string): Promise<CodexStableMethodResult<"thread/unsubscribe">>;
}

export interface CodexTurnsClient {
  interrupt(
    threadId: string,
    turnId: string,
  ): Promise<CodexStableMethodResult<"turn/interrupt">>;
  start(params: CodexTurnStartOptions): Promise<CodexStableMethodResult<"turn/start">>;
  steer(params: CodexTurnSteerOptions): Promise<CodexStableMethodResult<"turn/steer">>;
}

export interface CodexApprovalsClient {
  reject(requestId: RequestId, error: AgentError): Promise<void>;
  respond(requestId: RequestId, result: unknown): Promise<void>;
}

export interface CodexModelsClient {
  list(params?: ModelListParams): Promise<CodexStableMethodResult<"model/list">>;
}

export interface CodexClients {
  account: CodexAccountClient;
  apps: CodexAppsClient;
  approvals: CodexApprovalsClient;
  connection: CodexConnectionClient;
  hooks: CodexHooksClient;
  models: CodexModelsClient;
  requestExperimental<TMethod extends ExperimentalAvailableMethod>(
    method: TMethod,
    params: CodexExperimentalMethodParams<TMethod>,
  ): Promise<CodexExperimentalMethodResult<TMethod>>;
  requestRaw<TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
  ): Promise<TResult>;
  skills: CodexSkillsClient;
  threads: CodexThreadsClient;
  turns: CodexTurnsClient;
}

const codexClientMethods = [
  "initialize",
  "account/read",
  "account/login/start",
  "account/login/cancel",
  "account/logout",
  "account/rateLimits/read",
  "model/list",
  "thread/start",
  "thread/resume",
  "thread/fork",
  "thread/list",
  "thread/loaded/list",
  "thread/read",
  "thread/archive",
  "thread/unarchive",
  "thread/name/set",
  "thread/metadata/update",
  "thread/compact/start",
  "thread/rollback",
  "thread/inject_items",
  "thread/unsubscribe",
  "turn/start",
  "turn/steer",
  "turn/interrupt",
  "skills/list",
  "skills/config/write",
  "hooks/list",
  "app/list",
] as const satisfies readonly StableProductizedMethod[];

export function createCodexClients(
  transport: AgentTransport,
  options: CodexClientsOptions = {},
): CodexClients {
  assertCodexClientSurfaceProductized();

  return {
    account: {
      cancelLogin: (loginId) =>
        request(transport, "account/login/cancel", cancelLoginParams(loginId)),
      loginDeviceCode: () =>
        request(transport, "account/login/start", deviceCodeLoginParams()),
      logout: () => request(transport, "account/logout"),
      rateLimitsRead: () => request(transport, "account/rateLimits/read"),
      read: (refreshToken) =>
        request(transport, "account/read", accountReadParams(refreshToken)),
    },
    apps: {
      list: (params) => request(transport, "app/list", appsListParams(params)),
    },
    approvals: {
      reject: (requestId, error) => transport.reject(requestId, error),
      respond: (requestId, result) => transport.respond(requestId, result),
    },
    connection: {
      initialize: (initializeOptions, requestOptions) =>
        request(
          transport,
          "initialize",
          codexInitializeParams(initializeOptions),
          requestOptions,
        ),
      initialized: () => transport.notify("initialized"),
    },
    hooks: {
      list: (params) => request(transport, "hooks/list", hooksListParams(params)),
    },
    models: {
      list: (params) => request(transport, "model/list", modelListParams(params)),
    },
    requestExperimental: async (method, params) => {
      if (!options.experimental) {
        throw new Error(`Experimental Codex method requires opt-in: ${method}`);
      }
      if (isExperimentalUnsupportedMethod(method)) {
        throw new Error(`${method} is disabled until upstream implements it`);
      }
      assertCodexExperimentalMethod(method);
      return transport.request<unknown, CodexExperimentalMethodResult<typeof method>>(
        method,
        params as unknown,
      );
    },
    requestRaw: (method, params) => transport.request(method, params),
    skills: {
      configWrite: (params) =>
        request(transport, "skills/config/write", skillsConfigWriteParams(params)),
      list: (params) => request(transport, "skills/list", skillsListParams(params)),
    },
    threads: {
      archive: (threadId) =>
        request(transport, "thread/archive", threadArchiveParams(threadId)),
      compactStart: (threadId) =>
        request(
          transport,
          "thread/compact/start",
          threadCompactStartParams(threadId),
        ),
      fork: (threadId, params) =>
        request(transport, "thread/fork", threadForkParams(threadId, params)),
      injectItems: (threadId, items) =>
        request(
          transport,
          "thread/inject_items",
          threadInjectItemsParams(threadId, items),
        ),
      list: (params) =>
        request(transport, "thread/list", threadListParams(params)),
      loadedList: (params) =>
        request(transport, "thread/loaded/list", threadLoadedListParams(params)),
      metadataUpdate: (threadId, params) =>
        request(
          transport,
          "thread/metadata/update",
          threadMetadataUpdateParams(threadId, params),
        ),
      read: (threadId, includeTurns) =>
        request(
          transport,
          "thread/read",
          threadReadParams(threadId, includeTurns),
        ),
      resume: (threadId, params) =>
        request(transport, "thread/resume", threadResumeParams(threadId, params)),
      rollback: (threadId, numTurns) =>
        request(
          transport,
          "thread/rollback",
          threadRollbackParams(threadId, numTurns),
        ),
      setName: (threadId, name) =>
        request(
          transport,
          "thread/name/set",
          threadSetNameParams(threadId, name),
        ),
      start: (params) =>
        request(transport, "thread/start", threadStartParams(params)),
      unarchive: (threadId) =>
        request(
          transport,
          "thread/unarchive",
          threadUnarchiveParams(threadId),
        ),
      unsubscribe: (threadId) =>
        request(
          transport,
          "thread/unsubscribe",
          threadUnsubscribeParams(threadId),
        ),
    },
    turns: {
      interrupt: (threadId, turnId) =>
        request(
          transport,
          "turn/interrupt",
          turnInterruptParams(threadId, turnId),
        ),
      start: (params) =>
        request(transport, "turn/start", turnStartParams(params)),
      steer: (params) =>
        request(transport, "turn/steer", turnSteerParams(params)),
    },
  };
}

function request<TMethod extends StableProductizedMethod>(
  transport: AgentTransport,
  method: TMethod,
  params?: CodexStableMethodParams<TMethod>,
  options?: AgentRequestOptions,
): Promise<CodexStableMethodResult<TMethod>> {
  if (params === undefined && options === undefined) {
    return transport.request(method) as Promise<CodexStableMethodResult<TMethod>>;
  }
  return transport.request(method, params as unknown, options) as Promise<
    CodexStableMethodResult<TMethod>
  >;
}

function assertCodexClientSurfaceProductized(): void {
  for (const method of codexClientMethods) {
    assertCodexProductizedMethod(method);
  }
  if (
    codexClientMethods.length !== stableProductizedMethods.length ||
    codexClientMethods.some((method, index) => method !== stableProductizedMethods[index])
  ) {
    throw new Error("Codex client method surface does not match productized methods");
  }
}
