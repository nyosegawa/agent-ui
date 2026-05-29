// @vitest-environment jsdom

import { FakeAgentTransport } from "@nyosegawa/agent-ui-core";
import { render, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it } from "vitest";

import { AgentProvider } from "../src/provider";

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
});
