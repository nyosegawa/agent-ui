import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import { describe, expect, it } from "vitest";
import { createCodexClients, createCodexSession } from "../src";
import {
  accountReadParams,
  appsListParams,
  type CodexStableMethodParams,
  disabledProductMethods,
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
} from "../src/request-builders";
import type { ClientRequest } from "../src/generated/stable";
import type {
  AppsListParams,
  GetAccountParams,
  HooksListParams,
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
} from "../src/generated/stable/v2";

type Equal<TActual, TExpected> =
  (<T>() => T extends TActual ? 1 : 2) extends
  (<T>() => T extends TExpected ? 1 : 2)
    ? true
    : false;
type Assert<T extends true> = T;
type GeneratedParams<TMethod extends ClientRequest["method"]> = Extract<
  ClientRequest,
  { method: TMethod }
>["params"];

const generatedParamTypeAssertions: [
  Assert<
    Equal<CodexStableMethodParams<"thread/start">, GeneratedParams<"thread/start">>
  >,
  Assert<Equal<CodexStableMethodParams<"turn/start">, GeneratedParams<"turn/start">>>,
  Assert<Equal<CodexStableMethodParams<"app/list">, GeneratedParams<"app/list">>>,
] = [true, true, true];

describe("Codex request builders", () => {
  it("builds stable params against generated App Server request types", () => {
    expect(accountReadParams(true)).toEqual({ refreshToken: true } satisfies GetAccountParams);
    expect(modelListParams({ includeHidden: true })).toEqual({
      includeHidden: true,
    } satisfies ModelListParams);
    expect(threadListParams({ archived: false, cwd: "/repo", searchTerm: "agent" })).toEqual({
      archived: false,
      cursor: null,
      cwd: "/repo",
      limit: 25,
      searchTerm: "agent",
      sortDirection: "desc",
      sortKey: "updated_at",
    } satisfies ThreadListParams);
    expect(threadLoadedListParams({ limit: 2 })).toEqual({
      limit: 2,
    } satisfies ThreadLoadedListParams);
    expect(threadReadParams("thread-1")).toEqual({
      includeTurns: true,
      threadId: "thread-1",
    } satisfies ThreadReadParams);
    expect(threadResumeParams("thread-1", { excludeTurns: true })).toEqual({
      excludeTurns: true,
      threadId: "thread-1",
    } satisfies ThreadResumeParams);
    expect(threadStartParams({ cwd: "/repo", model: "gpt-5.5" })).toEqual({
      cwd: "/repo",
      model: "gpt-5.5",
    } satisfies ThreadStartParams);
    expect(threadForkParams("thread-1", { ephemeral: true })).toEqual({
      ephemeral: true,
      threadId: "thread-1",
    } satisfies ThreadForkParams);
    expect(threadArchiveParams("thread-1")).toEqual({
      threadId: "thread-1",
    } satisfies ThreadArchiveParams);
    expect(threadUnarchiveParams("thread-1")).toEqual({
      threadId: "thread-1",
    } satisfies ThreadUnarchiveParams);
    expect(threadSetNameParams("thread-1", "Renamed")).toEqual({
      name: "Renamed",
      threadId: "thread-1",
    } satisfies ThreadSetNameParams);
    expect(threadMetadataUpdateParams("thread-1", { gitInfo: { branch: "main" } })).toEqual({
      gitInfo: { branch: "main" },
      threadId: "thread-1",
    } satisfies ThreadMetadataUpdateParams);
    expect(threadCompactStartParams("thread-1")).toEqual({
      threadId: "thread-1",
    } satisfies ThreadCompactStartParams);
    expect(threadRollbackParams("thread-1", 1)).toEqual({
      numTurns: 1,
      threadId: "thread-1",
    } satisfies ThreadRollbackParams);
    expect(threadInjectItemsParams("thread-1", [{ type: "message" }])).toEqual({
      items: [{ type: "message" }],
      threadId: "thread-1",
    } satisfies ThreadInjectItemsParams);
    expect(threadUnsubscribeParams("thread-1")).toEqual({
      threadId: "thread-1",
    } satisfies ThreadUnsubscribeParams);
    expect(turnStartParams({ input: "hello", threadId: "thread-1" })).toEqual({
      input: [{ text: "hello", text_elements: [], type: "text" }],
      threadId: "thread-1",
    } satisfies TurnStartParams);
    expect(
      turnSteerParams({
        expectedTurnId: "turn-1",
        input: "continue",
        threadId: "thread-1",
      }),
    ).toEqual({
      expectedTurnId: "turn-1",
      input: [{ text: "continue", text_elements: [], type: "text" }],
      threadId: "thread-1",
    } satisfies TurnSteerParams);
    expect(turnInterruptParams("thread-1", "turn-1")).toEqual({
      threadId: "thread-1",
      turnId: "turn-1",
    } satisfies TurnInterruptParams);
    expect(skillsListParams({ cwds: ["/repo"], forceReload: true })).toEqual({
      cwds: ["/repo"],
      forceReload: true,
    } satisfies SkillsListParams);
    expect(skillsConfigWriteParams({ enabled: false, name: "agent-browser" })).toEqual({
      enabled: false,
      name: "agent-browser",
    } satisfies SkillsConfigWriteParams);
    expect(hooksListParams({ cwds: ["/repo"] })).toEqual({
      cwds: ["/repo"],
    } satisfies HooksListParams);
    expect(appsListParams({ forceRefetch: true, threadId: "thread-1" })).toEqual({
      forceRefetch: true,
      threadId: "thread-1",
    } satisfies AppsListParams);
  });

  it("keeps unimplemented thread item pagination out of product APIs", () => {
    expect(disabledProductMethods).toEqual(["thread/turns/items/list"]);
  });

  it("derives method params from the generated ClientRequest union", () => {
    expect(generatedParamTypeAssertions).toEqual([true, true, true]);
  });
});

describe("Codex session facade", () => {
  it("routes thread and turn helpers through stable methods", async () => {
    const transport = new FakeTransport();
    const session = createCodexSession(transport);

    await session.thread.start({ cwd: "/repo" });
    await session.thread.resume("thread-1");
    await session.thread.fork("thread-1", { ephemeral: true });
    await session.thread.list();
    await session.thread.loadedList({ limit: 5 });
    await session.thread.read("thread-1");
    await session.thread.archive("thread-1");
    await session.thread.unarchive("thread-1");
    await session.thread.setName("thread-1", "Renamed");
    await session.thread.metadataUpdate("thread-1", { gitInfo: { branch: null } });
    await session.thread.compactStart("thread-1");
    await session.thread.rollback("thread-1", 2);
    await session.thread.injectItems("thread-1", [{ type: "message" }]);
    await session.thread.unsubscribe("thread-1");
    await session.turn.start({ input: "hello", threadId: "thread-1" });
    await session.turn.steer({
      expectedTurnId: "turn-1",
      input: "steer",
      threadId: "thread-1",
    });
    await session.turn.interrupt("thread-1", "turn-1");

    expect(transport.calls.map((call) => call.method)).toEqual([
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
    ]);
  });

  it("requires opt-in for experimental requests and disables thread item listing", async () => {
    const stable = createCodexSession(new FakeTransport());
    await expect(stable.requestExperimental("thread/turns/list", {})).rejects.toThrow(
      "requires opt-in",
    );

    const experimental = createCodexSession(new FakeTransport(), { experimental: true });
    await expect(
      experimental.requestExperimental("thread/turns/items/list", {}),
    ).rejects.toThrow("disabled");
    await expect(experimental.requestExperimental("thread/start", {})).rejects.toThrow(
      "stableProductized",
    );
    await expect(experimental.requestExperimental("command/exec", {})).rejects.toThrow(
      "hostOnly",
    );
    await expect(experimental.requestExperimental("not/a/method", {})).rejects.toThrow(
      "unknown",
    );
  });
});

describe("Codex typed clients", () => {
  it("groups stable methods by protocol primitive", async () => {
    const transport = new FakeTransport();
    const clients = createCodexClients(transport);

    await clients.connection.initialize({
      capabilities: {
        experimentalApi: true,
        requestAttestation: false,
      },
      clientInfo: {
        name: "agent-ui-test",
        title: null,
        version: "0.0.0",
      },
    });
    clients.connection.initialized();
    await clients.account.read();
    await clients.apps.list();
    await clients.hooks.list();
    await clients.models.list();
    await clients.skills.list();
    await clients.threads.start({ cwd: "/repo" });
    await clients.turns.start({ input: "hello", threadId: "thread-1" });
    await clients.approvals.respond("request-1", { ok: true });
    await clients.approvals.reject("request-2", { message: "denied" });

    expect(transport.calls.map((call) => call.method)).toEqual([
      "initialize",
      "account/read",
      "app/list",
      "hooks/list",
      "model/list",
      "skills/list",
      "thread/start",
      "turn/start",
    ]);
    expect(transport.notifications).toEqual([{ method: "initialized", params: undefined }]);
    expect(transport.responses).toEqual([
      { requestId: "request-1", result: { ok: true } },
    ]);
    expect(transport.rejections).toEqual([
      { error: { message: "denied" }, requestId: "request-2" },
    ]);
  });
});

class FakeTransport implements AgentTransport {
  readonly calls: Array<{ method: string; params: unknown }> = [];
  readonly notifications: Array<{ method: string; params: unknown }> = [];
  readonly rejections: Array<{ error: unknown; requestId: string }> = [];
  readonly responses: Array<{ requestId: string; result: unknown }> = [];
  readonly events = {
    [Symbol.asyncIterator]: async function* () {},
  };

  async close(): Promise<void> {}
  async connect(): Promise<void> {}
  notify(method: string, params?: unknown): void {
    this.notifications.push({ method, params });
  }
  async reject(requestId: string, error: unknown): Promise<void> {
    this.rejections.push({ error, requestId });
  }
  async respond(requestId: string, result: unknown): Promise<void> {
    this.responses.push({ requestId, result });
  }

  async request<TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
  ): Promise<TResult> {
    this.calls.push({ method, params });
    return {} as TResult;
  }
}
