import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import { createCodexSession } from "../../src";
import {
  type CodexStableMethodParams,
  type CodexExperimentalMethodResult,
  type CodexStableMethodResult,
  threadResumeParams,
  type ThreadResumeParams,
} from "../../src/request-builders";
import type { ClientRequest } from "../../src/generated/stable";
import type { InitializeResponse } from "../../src/generated/stable";
import type {
  AppsListResponse,
  ThreadReadResponse,
  ThreadResumeResponse,
  TurnStartResponse,
} from "../../src/generated/stable/v2";
import type { ClientRequest as ExperimentalClientRequest } from "../../src/generated/experimental";
import type {
  ThreadTurnsListParams,
  ThreadTurnsListResponse,
} from "../../src/generated/experimental/v2";

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
type GeneratedExperimentalParams<TMethod extends ExperimentalClientRequest["method"]> =
  Extract<ExperimentalClientRequest, { method: TMethod }>["params"];

type GeneratedParamTypeAssertions = [
  Assert<
    Equal<CodexStableMethodParams<"thread/start">, GeneratedParams<"thread/start">>
  >,
  Assert<Equal<CodexStableMethodParams<"turn/start">, GeneratedParams<"turn/start">>>,
  Assert<Equal<CodexStableMethodParams<"app/list">, GeneratedParams<"app/list">>>,
  Assert<
    Equal<
      ThreadTurnsListParams,
      GeneratedExperimentalParams<"thread/turns/list">
    >
  >,
  Assert<Equal<CodexStableMethodResult<"app/list">, AppsListResponse>>,
  Assert<Equal<CodexStableMethodResult<"thread/resume">, ThreadResumeResponse>>,
  Assert<Equal<CodexStableMethodResult<"thread/read">, ThreadReadResponse>>,
  Assert<Equal<CodexStableMethodResult<"turn/start">, TurnStartResponse>>,
  Assert<Equal<CodexStableMethodResult<"initialize">, InitializeResponse>>,
  Assert<
    Equal<
      CodexExperimentalMethodResult<"thread/turns/list">,
      ThreadTurnsListResponse
    >
  >,
];
const generatedParamTypeAssertions: GeneratedParamTypeAssertions = [
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
];

declare const transport: AgentTransport;
const session = createCodexSession(transport);

threadResumeParams("thread-1", { cwd: "/repo" });
session.thread.resume("thread-1", { cwd: "/repo" });

// @ts-expect-error excludeTurns is field-level experimental and must use requestRaw().
threadResumeParams("thread-1", { excludeTurns: true });

// @ts-expect-error initialTurnsPage is field-level experimental and must use requestRaw().
threadResumeParams("thread-1", { initialTurnsPage: { limit: 10 } });

// @ts-expect-error path-based resume is field-level experimental and must use requestRaw().
session.thread.resume("thread-1", { path: "/tmp/rollout.json" });

const stableResumeParams = {
  threadId: "thread-1",
  cwd: "/repo",
} satisfies ThreadResumeParams;

const experimentalResumeParams = {
  threadId: "thread-1",
  // @ts-expect-error stable ThreadResumeParams excludes experimental resume fields.
  excludeTurns: true,
} satisfies ThreadResumeParams;

void session;
void generatedParamTypeAssertions;
void stableResumeParams;
void experimentalResumeParams;
