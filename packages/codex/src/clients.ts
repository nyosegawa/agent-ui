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
  CodexStableMethod,
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
import {
  codexInitializeParams,
  type CodexInitializeOptions,
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
  ): Promise<unknown>;
  initialized(): void;
}

export interface CodexAccountClient {
  cancelLogin(loginId: string): Promise<unknown>;
  loginDeviceCode(): Promise<unknown>;
  logout(): Promise<unknown>;
  read(refreshToken?: boolean): Promise<unknown>;
  rateLimitsRead(): Promise<unknown>;
}

export interface CodexAppsClient {
  list(params?: AppsListParams): Promise<unknown>;
}

export interface CodexHooksClient {
  list(params?: HooksListParams): Promise<unknown>;
}

export interface CodexSkillsClient {
  configWrite(params: SkillsConfigWriteParams): Promise<unknown>;
  list(params?: SkillsListParams): Promise<unknown>;
}

export interface CodexThreadsClient {
  archive(threadId: string): Promise<unknown>;
  compactStart(threadId: string): Promise<unknown>;
  fork(threadId: string, params?: CodexThreadForkOptions): Promise<unknown>;
  injectItems(
    threadId: string,
    items: ThreadInjectItemsParams["items"],
  ): Promise<unknown>;
  list(params?: ThreadListParams): Promise<unknown>;
  loadedList(params?: ThreadLoadedListParams): Promise<unknown>;
  metadataUpdate(
    threadId: string,
    params?: CodexThreadMetadataUpdateOptions,
  ): Promise<unknown>;
  read(threadId: string, includeTurns?: boolean): Promise<unknown>;
  resume(threadId: string, params?: CodexThreadResumeOptions): Promise<unknown>;
  rollback(threadId: string, numTurns: number): Promise<unknown>;
  setName(threadId: string, name: string): Promise<unknown>;
  start(params?: ThreadStartParams): Promise<unknown>;
  unarchive(threadId: string): Promise<unknown>;
  unsubscribe(threadId: string): Promise<unknown>;
}

export interface CodexTurnsClient {
  interrupt(threadId: string, turnId: string): Promise<unknown>;
  start(params: CodexTurnStartOptions): Promise<unknown>;
  steer(params: CodexTurnSteerOptions): Promise<unknown>;
}

export interface CodexApprovalsClient {
  reject(requestId: RequestId, error: AgentError): Promise<void>;
  respond(requestId: RequestId, result: unknown): Promise<void>;
}

export interface CodexModelsClient {
  list(params?: ModelListParams): Promise<unknown>;
}

export interface CodexClients {
  account: CodexAccountClient;
  apps: CodexAppsClient;
  approvals: CodexApprovalsClient;
  connection: CodexConnectionClient;
  hooks: CodexHooksClient;
  models: CodexModelsClient;
  requestExperimental<TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
  ): Promise<TResult>;
  skills: CodexSkillsClient;
  threads: CodexThreadsClient;
  turns: CodexTurnsClient;
}

export function createCodexClients(
  transport: AgentTransport,
  options: CodexClientsOptions = {},
): CodexClients {
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
      if (method === "thread/turns/items/list") {
        throw new Error("thread/turns/items/list is disabled until upstream implements it");
      }
      return transport.request(method, params);
    },
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

function request<TMethod extends CodexStableMethod>(
  transport: AgentTransport,
  method: TMethod,
  params?: CodexStableMethodParams<TMethod>,
  options?: AgentRequestOptions,
): Promise<unknown> {
  if (params === undefined && options === undefined) {
    return transport.request(method);
  }
  return transport.request(method, params as unknown, options);
}
