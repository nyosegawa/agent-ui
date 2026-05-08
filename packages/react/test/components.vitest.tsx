// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it } from "vitest";
import demoFixture from "../../../fixtures/app-server/demo-session.json" with { type: "json" };
import {
  FakeAgentTransport,
  runEventFixture,
  type FixtureStep,
} from "@nyosegawa/agent-ui-core";
import { AgentChat, AgentProvider } from "../src";

expect.extend(toHaveNoViolations);

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

  it("renders the fixture UI and resolves file-change approvals", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    const { container } = render(
      <AgentProvider
        initialState={runEventFixture(demoFixture as FixtureStep[])}
        transport={transport}
      >
        <AgentChat />
      </AgentProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Implement approval UI" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Threads" })).toBeInTheDocument();
    expect(screen.getByText("Protocol docs update")).toBeInTheDocument();
    expect(screen.getByLabelText("Command output")).toHaveTextContent("7 tests passed");
    expect(screen.getByLabelText("Diff preview")).toHaveTextContent("AgentDiffPanel");
    expect(screen.getByText("Review file changes")).toBeInTheDocument();

    const approveButtons = screen.getAllByRole("button", { name: "Approve" });
    await user.click(approveButtons[1]!);

    expect(transport.responses.get("approval-file")).toEqual({ decision: "approved" });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sends composer input as stable Codex user input items", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    render(
      <AgentProvider
        initialState={runEventFixture(demoFixture as FixtureStep[])}
        transport={transport}
      >
        <AgentChat />
      </AgentProvider>,
    );

    await user.type(await screen.findByLabelText("Message"), "hello codex");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(transport.requests.at(-1)).toEqual({
      id: 0,
      method: "turn/start",
      params: {
        input: [{ text: "hello codex", text_elements: [], type: "text" }],
        threadId: "thread-demo",
      },
    });
  });

  it("shows device-code login details from account/login/start", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/login/start") {
          return {
            userCode: "ABCD-EFGH",
            verificationUrl: "https://chatgpt.com/device",
          };
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "Login" }));

    expect(screen.getByRole("link", { name: "Open device login" })).toHaveAttribute(
      "href",
      "https://chatgpt.com/device",
    );
    expect(screen.getByText("ABCD-EFGH")).toBeInTheDocument();
  });
});
