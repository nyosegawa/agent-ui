// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FakeAgentTransport } from "@nyosegawa/agent-ui-core";
import { AgentChat, AgentProvider } from "../src";

describe("AgentChat", () => {
  it("renders start thread action", async () => {
    render(
      <AgentProvider transport={new FakeAgentTransport()}>
        <AgentChat />
      </AgentProvider>,
    );
    expect(await screen.findByTestId("agent-chat")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start thread" })).toBeInTheDocument();
  });
});
