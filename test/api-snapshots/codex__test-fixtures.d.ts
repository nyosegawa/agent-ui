import { AgentEvent, FakeTransportRequest, FakeAgentTransport } from '@nyosegawa/agent-ui-core';

interface CodexAppServerSuccessFixtureOptions {
    autoCompleteTurns?: boolean;
    cwd?: string;
    model?: string;
    responseText?: string | ((turn: CodexAppServerFixtureTurn) => string);
}
interface CodexAppServerFixtureThread {
    cwd: string;
    id: string;
    model: string;
    turns: CodexAppServerFixtureTurn[];
}
interface CodexAppServerFixtureTurn {
    agentItemId: string;
    inputText: string;
    status: "inProgress" | "completed" | "interrupted";
    steers: string[];
    text: string;
    threadId: string;
    turnId: string;
}
interface CodexAppServerSuccessFixture {
    readonly events: readonly AgentEvent[];
    readonly requests: readonly FakeTransportRequest[];
    readonly threads: readonly CodexAppServerFixtureThread[];
    readonly transport: FakeAgentTransport;
    activeTurn(threadId?: string): CodexAppServerFixtureTurn | undefined;
    completeTurn(threadId?: string, turnId?: string): CodexAppServerFixtureTurn | undefined;
    reset(): void;
}
declare function createCodexAppServerSuccessFixture(options?: CodexAppServerSuccessFixtureOptions): CodexAppServerSuccessFixture;

export { type CodexAppServerFixtureThread, type CodexAppServerFixtureTurn, type CodexAppServerSuccessFixture, type CodexAppServerSuccessFixtureOptions, createCodexAppServerSuccessFixture };
