import type { AgentTransport } from "@nyosegawa/agent-ui-core";
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
  CancelLoginAccountParams,
  GetAccountParams,
  HooksListParams,
  LoginAccountParams,
  ModelListParams,
  SkillsConfigWriteParams,
  SkillsListParams,
  ThreadArchiveParams,
  ThreadCompactStartParams,
  ThreadForkParams,
  ThreadInjectItemsParams,
  ThreadListParams,
  ThreadLoadedListParams,
  ThreadMetadataUpdateParams,
  ThreadReadParams,
  ThreadResumeParams,
  ThreadRollbackParams,
  ThreadSetNameParams,
  ThreadStartParams,
  ThreadUnarchiveParams,
  ThreadUnsubscribeParams,
  TurnInterruptParams,
  TurnStartParams,
  TurnSteerParams,
  UserInput,
} from "./generated/stable/v2";

export interface CodexSessionOptions {
  experimental?: boolean;
}

export type CodexRequestOptions = object;

export type CodexSessionUserInput = {
  type: string;
};

export interface CodexSession {
  account: {
    cancelLogin(loginId: string): Promise<unknown>;
    loginDeviceCode(): Promise<unknown>;
    logout(): Promise<unknown>;
    read(refreshToken?: boolean): Promise<unknown>;
    rateLimitsRead(): Promise<unknown>;
  };
  apps: {
    list(params?: CodexRequestOptions): Promise<unknown>;
  };
  hooks: {
    list(params?: CodexRequestOptions): Promise<unknown>;
  };
  requestExperimental<TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
  ): Promise<TResult>;
  skills: {
    configWrite(params: CodexRequestOptions): Promise<unknown>;
    list(params?: CodexRequestOptions): Promise<unknown>;
  };
  thread: {
    archive(threadId: string): Promise<unknown>;
    compactStart(threadId: string): Promise<unknown>;
    fork(
      threadId: string,
      params?: CodexRequestOptions,
    ): Promise<unknown>;
    injectItems(
      threadId: string,
      items: ThreadInjectItemsParams["items"],
    ): Promise<unknown>;
    list(params?: CodexRequestOptions): Promise<unknown>;
    loadedList(params?: CodexRequestOptions): Promise<unknown>;
    metadataUpdate(
      threadId: string,
      params?: CodexRequestOptions,
    ): Promise<unknown>;
    read(threadId: string, includeTurns?: boolean): Promise<unknown>;
    resume(
      threadId: string,
      params?: CodexRequestOptions,
    ): Promise<unknown>;
    rollback(threadId: string, numTurns: number): Promise<unknown>;
    setName(threadId: string, name: string): Promise<unknown>;
    start(params?: CodexRequestOptions): Promise<unknown>;
    unarchive(threadId: string): Promise<unknown>;
    unsubscribe(threadId: string): Promise<unknown>;
  };
  turn: {
    interrupt(threadId: string, turnId: string): Promise<unknown>;
    start(
      params: {
        input: string | CodexSessionUserInput[];
        threadId: string;
        [key: string]: unknown;
      },
    ): Promise<unknown>;
    steer(params: {
      expectedTurnId: string;
      input: string | CodexSessionUserInput[];
      threadId: string;
    }): Promise<unknown>;
  };
  models: {
    list(params?: CodexRequestOptions): Promise<unknown>;
  };
}

export function createCodexSession(
  transport: AgentTransport,
  options: CodexSessionOptions = {},
): CodexSession {
  return {
    account: {
      cancelLogin: (loginId) =>
        request<CancelLoginAccountParams>(transport, "account/login/cancel", cancelLoginParams(loginId)),
      loginDeviceCode: () =>
        request<LoginAccountParams>(transport, "account/login/start", deviceCodeLoginParams()),
      logout: () => request(transport, "account/logout"),
      rateLimitsRead: () => request(transport, "account/rateLimits/read"),
      read: (refreshToken) =>
        request<GetAccountParams>(transport, "account/read", accountReadParams(refreshToken)),
    },
    apps: {
      list: (params) =>
        request<AppsListParams>(transport, "app/list", appsListParams(params as AppsListParams)),
    },
    hooks: {
      list: (params) =>
        request<HooksListParams>(
          transport,
          "hooks/list",
          hooksListParams(params as HooksListParams),
        ),
    },
    models: {
      list: (params) =>
        request<ModelListParams>(
          transport,
          "model/list",
          modelListParams(params as ModelListParams),
        ),
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
        request<SkillsConfigWriteParams>(
          transport,
          "skills/config/write",
          skillsConfigWriteParams(params as SkillsConfigWriteParams),
        ),
      list: (params) =>
        request<SkillsListParams>(
          transport,
          "skills/list",
          skillsListParams(params as SkillsListParams),
        ),
    },
    thread: {
      archive: (threadId) =>
        request<ThreadArchiveParams>(transport, "thread/archive", threadArchiveParams(threadId)),
      compactStart: (threadId) =>
        request<ThreadCompactStartParams>(
          transport,
          "thread/compact/start",
          threadCompactStartParams(threadId),
        ),
      fork: (threadId, params) =>
        request<ThreadForkParams>(
          transport,
          "thread/fork",
          threadForkParams(threadId, params as Omit<ThreadForkParams, "threadId">),
        ),
      injectItems: (threadId, items) =>
        request<ThreadInjectItemsParams>(
          transport,
          "thread/inject_items",
          threadInjectItemsParams(threadId, items),
        ),
      list: (params) =>
        request<ThreadListParams>(
          transport,
          "thread/list",
          threadListParams(params as ThreadListParams),
        ),
      loadedList: (params) =>
        request<ThreadLoadedListParams>(
          transport,
          "thread/loaded/list",
          threadLoadedListParams(params as ThreadLoadedListParams),
        ),
      metadataUpdate: (threadId, params) =>
        request<ThreadMetadataUpdateParams>(
          transport,
          "thread/metadata/update",
          threadMetadataUpdateParams(
            threadId,
            params as Omit<ThreadMetadataUpdateParams, "threadId">,
          ),
        ),
      read: (threadId, includeTurns) =>
        request<ThreadReadParams>(
          transport,
          "thread/read",
          threadReadParams(threadId, includeTurns),
        ),
      resume: (threadId, params) =>
        request<ThreadResumeParams>(
          transport,
          "thread/resume",
          threadResumeParams(threadId, params as Omit<ThreadResumeParams, "threadId">),
        ),
      rollback: (threadId, numTurns) =>
        request<ThreadRollbackParams>(
          transport,
          "thread/rollback",
          threadRollbackParams(threadId, numTurns),
        ),
      setName: (threadId, name) =>
        request<ThreadSetNameParams>(
          transport,
          "thread/name/set",
          threadSetNameParams(threadId, name),
        ),
      start: (params) =>
        request<ThreadStartParams>(
          transport,
          "thread/start",
          threadStartParams(params as ThreadStartParams),
        ),
      unarchive: (threadId) =>
        request<ThreadUnarchiveParams>(
          transport,
          "thread/unarchive",
          threadUnarchiveParams(threadId),
        ),
      unsubscribe: (threadId) =>
        request<ThreadUnsubscribeParams>(
          transport,
          "thread/unsubscribe",
          threadUnsubscribeParams(threadId),
        ),
    },
    turn: {
      interrupt: (threadId, turnId) =>
        request<TurnInterruptParams>(
          transport,
          "turn/interrupt",
          turnInterruptParams(threadId, turnId),
        ),
      start: (params) =>
        request<TurnStartParams>(
          transport,
          "turn/start",
          turnStartParams(
            params as { input: string | UserInput[]; threadId: string } & Omit<
              TurnStartParams,
              "input" | "threadId"
            >,
          ),
        ),
      steer: (params) =>
        request<TurnSteerParams>(
          transport,
          "turn/steer",
          turnSteerParams(
            params as {
              expectedTurnId: string;
              input: string | UserInput[];
              threadId: string;
            },
          ),
        ),
    },
  };
}

function request<TParams>(
  transport: AgentTransport,
  method: string,
  params?: TParams,
): Promise<unknown> {
  return params === undefined ? transport.request(method) : transport.request(method, params);
}
