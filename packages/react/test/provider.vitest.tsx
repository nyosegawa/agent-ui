// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  createInitialAgentState,
  FakeAgentTransport,
} from "@nyosegawa/agent-ui-core";
import { render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it } from "vitest";

import { AgentProvider as RootAgentProvider } from "../src";
import { AgentProvider } from "../src/provider";
import { useAgentThreads } from "../src/headless";
import { AgentMessageList } from "../src/primitives";

class NonReconnectableTransport extends FakeAgentTransport {
  closeCount = 0;
  connectCount = 0;
  #closed = false;

  override async close(): Promise<void> {
    this.closeCount += 1;
    this.#closed = true;
    await super.close();
  }

  override async connect(): Promise<void> {
    if (this.#closed) throw new Error("transport cannot reconnect after close");
    this.connectCount += 1;
    await super.connect();
  }
}

describe("AgentProvider", () => {
  it("does not close a non-reconnectable transport during StrictMode remount probing", async () => {
    const transport = new NonReconnectableTransport();

    const { unmount } = render(
      <StrictMode>
        <AgentProvider transport={transport}>
          <div>ready</div>
        </AgentProvider>
      </StrictMode>,
    );

    await waitFor(() => expect(transport.connectCount).toBe(1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(transport.closeCount).toBe(0);

    unmount();
    await waitFor(() => expect(transport.closeCount).toBe(1));
  });

  it("shares one provider context across root, headless, and primitives entrypoints", () => {
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-shared";
    initialState.threads["thread-shared"] = {
      activity: "idle",
      availability: "available",
      id: "thread-shared",
      metadata: {
        cwd: "/workspace/shared",
        title: "Shared provider thread",
      },
      operations: {},
      orderedTurnIds: ["turn-shared"],
      runtime: { status: { type: "idle" } },
      status: "ready",
      storage: "stored",
      thread: {
        id: "thread-shared",
        name: "Shared provider thread",
        path: "/workspace/shared",
      },
      turns: {
        "turn-shared": {
          blocksByItemId: {
            "item-shared": {
              id: "item-shared",
              kind: "text",
              status: "completed",
              text: "Rendered from primitives through the root provider.",
            },
          },
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["item-shared"],
          items: {
            "item-shared": {
              id: "item-shared",
              kind: "agentMessage",
              status: "completed",
              text: "Rendered from primitives through the root provider.",
              threadId: "thread-shared",
              turnId: "turn-shared",
            },
          },
          streamingTextByItemId: {},
          turn: {
            id: "turn-shared",
            itemsView: "full",
            status: "completed",
            threadId: "thread-shared",
          },
        },
      },
    };

    function HeadlessAndPrimitiveProbe() {
      const { activeThreadId, threads } = useAgentThreads();
      return (
        <>
          <output aria-label="active thread">{activeThreadId ?? ""}</output>
          <output aria-label="thread count">{threads.length}</output>
          <AgentMessageList threadId="thread-shared" />
        </>
      );
    }

    render(
      <RootAgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <HeadlessAndPrimitiveProbe />
      </RootAgentProvider>,
    );

    expect(screen.getByLabelText("active thread")).toHaveTextContent("thread-shared");
    expect(screen.getByLabelText("thread count")).toHaveTextContent("1");
    expect(
      screen.getByText("Rendered from primitives through the root provider."),
    ).toBeTruthy();
  });
});
