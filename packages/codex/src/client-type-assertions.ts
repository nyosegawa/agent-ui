import type { AgentTransport } from "@nyosegawa/agent-ui-core";

import type { ThreadListResponse } from "./generated/stable/v2";
import type { ThreadTurnsListResponse } from "./generated/experimental/v2";
import type { CodexClients } from "./clients";
import { createCodexClients } from "./clients";

type Equal<TActual, TExpected> =
  (<T>() => T extends TActual ? 1 : 2) extends
  (<T>() => T extends TExpected ? 1 : 2)
    ? true
    : false;
type Assert<T extends true> = T;

declare const transport: AgentTransport;

type StableClientResultAssertions = [
  Assert<Equal<Awaited<ReturnType<CodexClients["threads"]["list"]>>, ThreadListResponse>>,
];

const experimentalClients = createCodexClients(transport, { experimental: true });
const experimentalResult = experimentalClients.requestExperimental("thread/turns/list", {
  threadId: "thread-1",
});
void experimentalResult;

type ExperimentalClientResultAssertions = [
  Assert<Equal<Awaited<typeof experimentalResult>, ThreadTurnsListResponse>>,
];

// @ts-expect-error thread/turns/list requires a string threadId from the generated schema.
experimentalClients.requestExperimental("thread/turns/list", { threadId: 123 });

void (null as unknown as StableClientResultAssertions);
void (null as unknown as ExperimentalClientResultAssertions);

export {};
