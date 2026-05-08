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
    expect(screen.getByLabelText("Run settings")).toHaveTextContent("Execution mode");
    expect(screen.getByLabelText("Usage limits")).toHaveTextContent("gpt-5.2 5h");
    expect(screen.getByLabelText("Usage limits")).toHaveTextContent("gpt-5.2 weekly");
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
        approvalPolicy: "on-request",
        input: [{ text: "hello codex", text_elements: [], type: "text" }],
        model: "gpt-5.2",
        sandboxPolicy: {
          excludeSlashTmp: false,
          excludeTmpdirEnvVar: false,
          networkAccess: false,
          type: "workspaceWrite",
          writableRoots: [],
        },
        threadId: "thread-demo",
      },
    });
  });

  it("applies run controls to turn/start params", async () => {
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

    await user.click(await screen.findByRole("button", { name: "Read-only" }));
    await user.selectOptions(screen.getByLabelText("Model"), "gpt-5.2-codex");
    await user.selectOptions(screen.getByLabelText("Effort"), "xhigh");
    await user.type(screen.getByLabelText("Message"), "inspect only");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(transport.requests.at(-1)?.params).toMatchObject({
      approvalPolicy: "untrusted",
      effort: "xhigh",
      model: "gpt-5.2-codex",
      sandboxPolicy: { networkAccess: false, type: "readOnly" },
      threadId: "thread-demo",
    });
  });

  it("refreshes usage limits", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/rateLimits/read") {
          return {
            rateLimitsByLimitId: {
              weekly: {
                limitName: "gpt-5.2",
                secondary: {
                  resetsAt: 1778713200,
                  usedPercent: 55,
                  windowDurationMins: 10080,
                },
              },
            },
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

    await user.click(await screen.findByRole("button", { name: "Refresh" }));

    expect(await screen.findByText("55%")).toBeInTheDocument();
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

  it("loads persisted session history and reads an individual thread", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              {
                id: "thread-history",
                name: "Historical fix",
                preview: "Fix a stored bug",
                status: { type: "notLoaded" },
                turns: [],
                updatedAt: 1778000000,
              },
            ],
          };
        }
        if (request.method === "thread/read") {
          return {
            thread: {
              id: "thread-history",
              name: "Historical fix",
              preview: "Fix a stored bug",
              status: { type: "notLoaded" },
              turns: [
                {
                  id: "turn-history",
                  items: [
                    {
                      content: [{ text: "What changed?", type: "text" }],
                      id: "item-history-user",
                      type: "userMessage",
                    },
                    {
                      id: "item-history-agent",
                      text: "The stored thread was loaded.",
                      type: "agentMessage",
                    },
                    {
                      aggregatedOutput: "bun test\nok\n",
                      command: "bun test",
                      id: "item-history-command",
                      status: "completed",
                      type: "commandExecution",
                    },
                  ],
                  status: "completed",
                },
              ],
            },
          };
        }
        if (request.method === "thread/resume") {
          return {
            thread: {
              id: "thread-history",
              name: "Historical fix",
              status: { type: "idle" },
              turns: [],
            },
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

    await user.click(await screen.findByRole("button", { name: "Load" }));
    await user.click(await screen.findByRole("button", { name: /Historical fix/ }));

    expect(await screen.findByRole("heading", { name: "Historical fix" })).toBeInTheDocument();
    expect(screen.getByText("The stored thread was loaded.")).toBeInTheDocument();
    expect(screen.getByLabelText("Command output")).toHaveTextContent("ok");
    await user.click(screen.getByRole("button", { name: "Resume" }));
    expect(transport.requests.map((request) => request.method)).toEqual(
      expect.arrayContaining(["thread/list", "thread/read", "thread/resume"]),
    );
    expect(transport.requests.find((request) => request.method === "thread/resume")?.params).toEqual({
      excludeTurns: true,
      threadId: "thread-history",
    });
  });
});
