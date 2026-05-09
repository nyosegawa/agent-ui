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
import { AgentChat, AgentDiffViewer, AgentProvider } from "../src";

expect.extend(toHaveNoViolations);

describe("AgentChat", () => {
  it("keeps fixture model ids visibly non-production", () => {
    const modelEvents = (demoFixture as FixtureStep[])
      .map((step) => step.event)
      .filter((event) => event.type === "models/updated");
    const ids = modelEvents.flatMap((event: any) =>
      Array.isArray(event.models) ? event.models.map((model: any) => String(model.id)) : [],
    );
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => id.startsWith("fixture-"))).toBe(true);
  });

  it("renders start thread action", async () => {
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return { account: { email: "user@example.com", planType: "pro", type: "chatgpt" } };
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );
    expect(await screen.findByTestId("agent-chat")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start thread" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Login" })).not.toBeInTheDocument();
  });

  it("bootstraps account, models, and usage on startup", async () => {
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return { account: { email: "real@example.com", planType: "pro", type: "chatgpt" } };
        }
        if (request.method === "model/list") {
          return {
            data: [
              {
                defaultReasoningEffort: "medium",
                displayName: "Real Model",
                id: "real-model",
                isDefault: true,
                supportedReasoningEfforts: [{ reasoningEffort: "medium" }],
              },
            ],
          };
        }
        if (request.method === "account/rateLimits/read") {
          return {
            rateLimits: {
              limitId: "codex",
              primary: { usedPercent: 10, windowDurationMins: 300 },
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

    expect(await screen.findByText(/real@example.com/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Login" })).not.toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "Real Model (real-model)" })).toBeInTheDocument();
    expect(await screen.findByText("10%")).toBeInTheDocument();
    expect(transport.requests.map((request) => request.method)).toEqual(
      expect.arrayContaining(["account/read", "model/list", "account/rateLimits/read"]),
    );
    expect(transport.requests.find((request) => request.method === "account/read")?.params).toEqual(
      { refreshToken: false },
    );
    expect(
      transport.requests.find((request) => request.method === "account/rateLimits/read")?.params,
    ).toBeUndefined();
    expect(transport.requests.find((request) => request.method === "model/list")?.params).toEqual(
      {},
    );
  });

  it("shows first-run login state when account/read is unauthenticated", async () => {
    render(
      <AgentProvider
        transport={
          new FakeAgentTransport({
            onRequest(request) {
              if (request.method === "account/read") return { account: null };
              return {};
            },
          })
        }
      >
        <AgentChat />
      </AgentProvider>,
    );

    expect(await screen.findByText("Connect Codex")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start device-code login" })).toBeInTheDocument();
  });

  it("formats App Server stderr diagnostics into readable messages", async () => {
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return { account: { email: "real@example.com", planType: "pro" } };
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    transport.push({
      message: JSON.stringify({
        fields: { message: "ignoring invalid plugin config", path: "/tmp/plugin.json" },
        level: "WARN",
        target: "codex_core_plugins::manifest",
      }),
      type: "stderr",
    });

    expect(
      await screen.findByText(/WARN codex_core_plugins::manifest ignoring invalid plugin config/),
    ).toBeInTheDocument();
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
    expect(screen.getByLabelText("CodeMirror patch viewer")).toBeInTheDocument();
    expect(screen.getByLabelText("Run settings")).toHaveTextContent("Execution mode");
    expect(screen.getByLabelText("Usage limits")).toHaveTextContent("fixture-demo-model 5h");
    expect(screen.getByLabelText("Usage limits")).toHaveTextContent(
      "fixture-demo-model weekly",
    );
    expect(screen.getByText("Review file changes")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Approve file-change request approval-file" }),
    );

    expect(transport.responses.get("approval-file")).toEqual({ decision: "accept" });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("summarizes structured App Server patch payloads", async () => {
    render(
      <AgentDiffViewer
        patch={{
          changes: [
            {
              diff: "@@ -1 +1,2 @@\n-old\n+new\n+next\n",
              kind: "update",
              path: "packages/react/src/components.tsx",
            },
            {
              diff: "+added\n",
              kind: "add",
              path: "docs/testing.md",
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("2 files")).toBeInTheDocument();
    expect(screen.getByText("+3")).toBeInTheDocument();
    expect(screen.getByText("-1")).toBeInTheDocument();
    expect(screen.getByLabelText("Changed files")).toHaveTextContent(
      "packages/react/src/components.tsx",
    );
    expect(screen.getByLabelText("Changed files")).toHaveTextContent("docs/testing.md");
  });

  it("declines approvals with schema-backed decisions", async () => {
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

    await user.click(
      await screen.findByRole("button", { name: "Decline command request approval-command" }),
    );

    expect(transport.responses.get("approval-command")).toEqual({ decision: "decline" });
  });

  it("approves command and file-change requests for the session", async () => {
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

    await user.click(
      await screen.findByRole("button", {
        name: "Approve command request approval-command for session",
      }),
    );
    await user.click(
      await screen.findByRole("button", {
        name: "Approve file-change request approval-file for session",
      }),
    );

    expect(transport.responses.get("approval-command")).toEqual({
      decision: "acceptForSession",
    });
    expect(transport.responses.get("approval-file")).toEqual({
      decision: "acceptForSession",
    });
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

    expect(transport.requests.at(-1)).toMatchObject({
      method: "turn/start",
      params: {
        approvalPolicy: "on-request",
        input: [{ text: "hello codex", text_elements: [], type: "text" }],
        model: "fixture-demo-model",
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
    await user.selectOptions(screen.getByLabelText("Model"), "fixture-demo-coding-model");
    await user.selectOptions(screen.getByLabelText("Effort"), "high");
    await user.type(screen.getByLabelText("Working directory"), "/tmp/agent-ui");
    await user.type(screen.getByLabelText("Message"), "inspect only");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(transport.requests.at(-1)?.params).toMatchObject({
      approvalPolicy: "untrusted",
      cwd: "/tmp/agent-ui",
      effort: "high",
      model: "fixture-demo-coding-model",
      sandboxPolicy: { networkAccess: false, type: "readOnly" },
      threadId: "thread-demo",
    });
  });

  it("starts new threads with selected model and working directory", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return { account: { email: "real@example.com", planType: "pro" } };
        }
        if (request.method === "model/list") {
          return {
            data: [
              {
                displayName: "Real Model",
                id: "real-model",
                supportedReasoningEfforts: [],
              },
            ],
          };
        }
        if (request.method === "thread/start") {
          return { thread: { id: "thread-new", name: "New real thread", status: { type: "idle" } } };
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    await screen.findByRole("option", { name: "Real Model (real-model)" });
    await user.selectOptions(screen.getByLabelText("Model"), "real-model");
    await user.type(screen.getByLabelText("Working directory"), "/tmp/agent-ui");
    await user.click(screen.getByRole("button", { name: "Start thread" }));

    expect(transport.requests.find((request) => request.method === "thread/start")?.params).toEqual({
      cwd: "/tmp/agent-ui",
      model: "real-model",
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
                limitName: "fixture-demo-model",
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

  it("does not fabricate effort options when model metadata has none", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/start") {
          return { thread: { id: "thread-empty-model", name: "Model metadata test" } };
        }
        if (request.method === "model/list") {
          return { data: [{ displayName: "Metadata-light model", id: "metadata-light-model" }] };
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "Start thread" }));
    await screen.findByRole("option", { name: "Metadata-light model (metadata-light-model)" });
    expect(screen.getByLabelText("Effort")).toBeDisabled();
    expect(screen.queryByRole("option", { name: "xhigh" })).not.toBeInTheDocument();
  });

  it("shows device-code login details from account/login/start", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/login/start") {
          return {
            loginId: "login-123",
            userCode: "ABCD-EFGH",
            verificationUrl: "https://chatgpt.com/device",
          };
        }
        if (request.method === "account/login/cancel") return {};
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
    expect(transport.requests.find((request) => request.method === "account/login/start")?.params).toEqual(
      { type: "chatgptDeviceCode" },
    );

    await user.click(screen.getAllByRole("button", { name: "Cancel login" })[0]!);
    expect(transport.requests.find((request) => request.method === "account/login/cancel")?.params).toEqual(
      { loginId: "login-123" },
    );
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

  it("passes real thread/list search params and shows empty history state", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") return { data: [], nextCursor: null };
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    await user.clear(await screen.findByLabelText("Search history"));
    await user.type(screen.getByLabelText("Search history"), "missing session");
    await user.click(screen.getByRole("button", { name: "Load" }));

    expect(await screen.findByText("No threads found.")).toBeInTheDocument();
    const lastThreadListRequest = transport.requests
      .filter((request) => request.method === "thread/list")
      .at(-1);
    expect(lastThreadListRequest?.params).toMatchObject({
      limit: 25,
      searchTerm: "missing session",
      sortDirection: "desc",
      sortKey: "updated_at",
    });
  });
});
