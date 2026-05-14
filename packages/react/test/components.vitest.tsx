// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import demoFixture from "../../../fixtures/app-server/demo-session.json" with { type: "json" };
import {
  createInitialAgentState,
  FakeAgentTransport,
  runEventFixture,
  type FixtureStep,
} from "@nyosegawa/agent-ui-core";
import {
  AgentChat,
  AgentApprovalQueue,
  AgentDiffViewer,
  AgentMessageList,
  AgentProvider,
  AgentShell,
  AgentThreadView,
  AgentUsagePanel,
  AgentWorkspace,
  AgentSkillsPanel,
  AgentAppsPanel,
  createSkillAppClientTools,
  loadSkillAppRegistry,
  useAgentAuth,
  useAgentServerRequests,
  useAgentSkills,
  useAgentContext,
} from "../src";

expect.extend(toHaveNoViolations);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AgentChat", () => {
  it("keeps fixture model ids visibly non-production", () => {
    const modelEvents = (demoFixture as FixtureStep[])
      .map((step) => step.event)
      .filter((event) => event.type === "models/updated");
    const ids = modelEvents.flatMap((event: any) =>
      Array.isArray(event.models)
        ? event.models.map((model: any) => String(model.id))
        : [],
    );
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => id.startsWith("fixture-"))).toBe(true);
  });

  it("renders start thread action", async () => {
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return {
            account: { email: "user@example.com", planType: "pro", type: "chatgpt" },
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
    expect(await screen.findByTestId("agent-chat")).toBeInTheDocument();
    expect(
      await screen.findByRole(
        "button",
        { name: "Start thread" },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Login" })).not.toBeInTheDocument();
  });

  it("renders only a fixed thread without following active selection", () => {
    const initialState = createInitialAgentState();
    initialState.activeThreadId = "thread-active";
    initialState.threads["thread-active"] = {
      orderedTurnIds: [],
      status: "loaded",
      thread: { id: "thread-active", name: "Active global thread" },
      turns: {},
    };
    initialState.threads["thread-fixed"] = {
      orderedTurnIds: ["turn-fixed"],
      status: "complete",
      thread: { id: "thread-fixed", name: "Fixed worker thread" },
      turns: {
        "turn-fixed": {
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["item-fixed"],
          items: {
            "item-fixed": {
              id: "item-fixed",
              kind: "agentMessage",
              status: "completed",
              text: "Only this thread should render.",
              threadId: "thread-fixed",
              turnId: "turn-fixed",
            },
          },
          streamingTextByItemId: {},
          turn: { id: "turn-fixed", threadId: "thread-fixed" },
        },
      },
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentThreadView threadId="thread-fixed" />
      </AgentProvider>,
    );

    expect(screen.getByRole("heading", { name: "Fixed worker thread" })).toBeInTheDocument();
    expect(screen.getByText("Only this thread should render.")).toBeInTheDocument();
    expect(screen.queryByText("Active global thread")).not.toBeInTheDocument();
  });

  it("renders usage as a standalone primitive without chat chrome", () => {
    const initialState = createInitialAgentState();
    initialState.account.rateLimits = {
      rateLimitsByLimitId: {
        weekly: {
          limitName: "fixture-demo-model",
          primary: { usedPercent: 12, windowDurationMins: 300 },
        },
      },
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentUsagePanel autoRefresh={false} />
      </AgentProvider>,
    );

    expect(screen.getByLabelText("Usage limits")).toHaveTextContent("12%");
    expect(screen.queryByTestId("agent-chat")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Threads" })).not.toBeInTheDocument();
  });

  it("supports shell composition with usage moved outside a sidebar-free chat", () => {
    const initialState = runEventFixture(demoFixture as FixtureStep[]);
    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentShell>
          <AgentUsagePanel autoRefresh={false} />
          <AgentChat sidebar={false} usage={false} />
        </AgentShell>
      </AgentProvider>,
    );

    expect(screen.getByLabelText("Usage limits")).toHaveTextContent("fixture-demo-model");
    expect(screen.queryByRole("navigation", { name: "Threads" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Implement approval UI" })).toBeInTheDocument();
  });

  it("renders a workspace with a side panel", () => {
    render(
      <AgentProvider
        initialState={runEventFixture(demoFixture as FixtureStep[])}
        transport={new FakeAgentTransport()}
      >
        <AgentWorkspace sidebar={false} panel={<div>Skill app content</div>} />
      </AgentProvider>,
    );

    expect(screen.getByText("Skill app content")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Implement approval UI" })).toBeInTheDocument();
  });

  it("refreshes skills through the public hook and panel", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "skills/list") {
          return {
            data: [
              {
                cwd: "/repo",
                skills: [{ enabled: true, name: "agent-browser", path: "/repo/SKILL.md" }],
              },
            ],
          };
        }
        return {};
      },
    });
    function Probe() {
      const { skills } = useAgentSkills("/repo");
      return <output>{skills.map((skill) => skill.name).join(",")}</output>;
    }
    render(
      <AgentProvider transport={transport}>
        <AgentSkillsPanel cwd="/repo" />
        <Probe />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Refresh" }));

    expect((await screen.findAllByText("agent-browser")).length).toBeGreaterThan(0);
  });

  it("writes skill config through generated params and updates local state", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "skills/list") {
          return {
            data: [
              {
                cwd: "/repo",
                skills: [
                  {
                    enabled: false,
                    name: "agent-browser",
                    path: "/repo/.agents/skills/agent-browser/SKILL.md",
                  },
                ],
              },
            ],
          };
        }
        if (request.method === "skills/config/write") {
          return { effectiveEnabled: true };
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentSkillsPanel cwd="/repo" />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Refresh" }));
    await user.click(await screen.findByRole("button", { name: "Enable" }));

    expect(transport.requests.at(-1)).toMatchObject({
      method: "skills/config/write",
      params: {
        enabled: true,
        path: "/repo/.agents/skills/agent-browser/SKILL.md",
      },
    });
    expect(await screen.findByRole("button", { name: "Disable" })).toBeInTheDocument();
  });

  it("paginates app/list and surfaces install/auth state", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method !== "app/list") return {};
        if ((request.params as { cursor?: string | null } | undefined)?.cursor === "page-2") {
          return {
            data: [
              {
                id: "drive",
                installUrl: "app://drive",
                isAccessible: true,
                isEnabled: true,
                name: "Drive",
              },
            ],
            nextCursor: null,
          };
        }
        return {
          data: [
            {
              id: "browser",
              installUrl: "app://browser",
              isAccessible: false,
              isEnabled: false,
              name: "Browser",
            },
          ],
          nextCursor: "page-2",
        };
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentAppsPanel threadId="thread-apps" />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Refresh" }));
    expect(await screen.findByText("Browser")).toBeInTheDocument();
    expect(screen.getByText("not installed")).toBeInTheDocument();
    expect(screen.getByText("auth needed")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("Drive")).toBeInTheDocument();
    expect(transport.requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          method: "app/list",
          params: { cursor: "page-2", threadId: "thread-apps" },
        }),
      ]),
    );
  });

  it("loads skill app registries from static, Vite, and remote manifests", async () => {
    const registry = await loadSkillAppRegistry({
      fetcher: async () =>
        ({
          json: async () => ({ id: "remote", title: "Remote panel" }),
          ok: true,
        }) as Response,
      manifests: [{ id: "static", title: "Static panel" }],
      remoteManifests: ["https://example.com/manifest.json"],
      viteGlob: {
        "./panel.json": async () => ({
          default: [{ id: "vite", title: "Vite panel" }],
        }),
      },
    });
    const tools = createSkillAppClientTools(registry);

    expect(registry.list().map((manifest) => manifest.id)).toEqual([
      "static",
      "vite",
      "remote",
    ]);
    expect(tools.map((tool) => tool.name)).toEqual([
      "open_skill_app",
      "update_skill_app",
      "request_skill_app_feedback",
    ]);
    expect(tools[1]?.run({ id: "static", patch: { title: "Updated" } })).toMatchObject({
      id: "static",
      title: "Updated",
    });
  });

  it("exposes all queued server requests through useAgentServerRequests", () => {
    const initialState = createInitialAgentState();
    initialState.serverRequestQueue = {
      byId: {
        "request-input": {
          id: "request-input",
          kind: "userInput",
          payload: {},
          threadId: "thread-1",
        },
      },
      order: ["request-input"],
    };
    initialState.pendingServerRequests = initialState.serverRequestQueue.byId;
    function Probe() {
      const { requests } = useAgentServerRequests("thread-1");
      return <output>{requests.map((request) => request.kind).join(",")}</output>;
    }

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <Probe />
      </AgentProvider>,
    );

    expect(screen.getByText("userInput")).toBeInTheDocument();
  });

  it("renders status banners as first-class shell content", () => {
    const initialState = createInitialAgentState();
    initialState.activeThreadId = "thread-banner";
    initialState.diagnostics.banners = [
      {
        id: "model-reroute",
        kind: "modelReroute",
        message: "Model rerouted from gpt-5.5 to gpt-5.4.",
      },
      {
        id: "mcp-oauth",
        kind: "mcpOAuth",
        message: "MCP OAuth completed for github.",
      },
    ];
    initialState.threads["thread-banner"] = {
      orderedTurnIds: [],
      status: "loaded",
      thread: { id: "thread-banner", name: "Banners" },
      turns: {},
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat sidebar={false} usage={false} />
      </AgentProvider>,
    );

    expect(screen.getByLabelText("Status banners")).toHaveTextContent("Model rerouted");
    expect(screen.getByLabelText("Status banners")).toHaveTextContent("MCP OAuth");
  });

  it("sends thread action requests through generated method params", async () => {
    const user = userEvent.setup();
    const prompt = vi.spyOn(globalThis, "prompt").mockReturnValue("Renamed thread");
    const initialState = createInitialAgentState();
    initialState.activeThreadId = "thread-actions";
    initialState.threads["thread-actions"] = {
      orderedTurnIds: ["turn-actions"],
      status: "loaded",
      thread: { id: "thread-actions", name: "Action thread" },
      turns: {
        "turn-actions": {
          blocksByItemId: {},
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: [],
          items: {},
          streamingTextByItemId: {},
          turn: { id: "turn-actions", threadId: "thread-actions" },
        },
      },
    };
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/name/set") return {};
        if (request.method === "thread/archive") return {};
        if (request.method === "thread/fork") return {};
        return {};
      },
    });
    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentChat sidebar={false} usage={false} />
      </AgentProvider>,
    );

    await user.click(screen.getByText("Rename"));
    await user.click(screen.getByText("Archive"));
    await user.click(screen.getByText("Fork"));

    expect(prompt).toHaveBeenCalled();
    expect(transport.requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          method: "thread/name/set",
          params: { name: "Renamed thread", threadId: "thread-actions" },
        }),
        expect.objectContaining({
          method: "thread/archive",
          params: { threadId: "thread-actions" },
        }),
        expect.objectContaining({
          method: "thread/fork",
          params: { threadId: "thread-actions" },
        }),
      ]),
    );
    prompt.mockRestore();
  });

  it("surfaces composer file and app/plugin attachments", async () => {
    const user = userEvent.setup();
    const prompt = vi
      .spyOn(globalThis, "prompt")
      .mockReturnValueOnce("app://browser")
      .mockReturnValueOnce("plugin://browser-tools");
    const initialState = createInitialAgentState();
    initialState.activeThreadId = "thread-compose";
    initialState.threads["thread-compose"] = {
      orderedTurnIds: [],
      status: "loaded",
      thread: { id: "thread-compose", name: "Composer" },
      turns: {},
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat sidebar={false} usage={false} />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "App" }));
    await user.click(screen.getByRole("button", { name: "Plugin" }));

    expect(screen.getByLabelText("Composer attachments")).toHaveTextContent(
      "app://browser",
    );
    expect(screen.getByLabelText("Composer attachments")).toHaveTextContent(
      "plugin://browser-tools",
    );
    prompt.mockRestore();
  });

  it("does not offer to start a thread before account bootstrap finishes", async () => {
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return new Promise(() => undefined);
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    expect(await screen.findByText("Preparing Codex")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Syncing" })).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Start thread" }),
    ).not.toBeInTheDocument();
  });

  it("bootstraps account, models, and usage on startup", async () => {
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return {
            account: { email: "real@example.com", planType: "pro", type: "chatgpt" },
          };
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
    expect(
      await screen.findByRole("option", { name: "Real Model (real-model)" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("10%")).toBeInTheDocument();
    expect(transport.requests.map((request) => request.method)).toEqual(
      expect.arrayContaining(["account/read", "model/list", "account/rateLimits/read"]),
    );
    expect(
      transport.requests.find((request) => request.method === "account/read")?.params,
    ).toEqual({ refreshToken: false });
    expect(
      transport.requests.find((request) => request.method === "account/rateLimits/read")
        ?.params,
    ).toBeUndefined();
    expect(
      transport.requests.find((request) => request.method === "model/list")?.params,
    ).toEqual({});
  });

  it("shows first-run login state when account/read is unauthenticated", async () => {
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") return { account: null };
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    expect(await screen.findByText("Connect Codex")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start device-code login" }),
    ).toBeInTheDocument();
    expect(
      transport.requests.some((request) => request.method === "account/rateLimits/read"),
    ).toBe(false);
  });

  it("refreshes account and usage after device-code login completes", async () => {
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          const reads = transport.requests.filter(
            (previous) => previous.method === "account/read",
          ).length;
          return reads === 1
            ? { account: null }
            : {
                account: {
                  email: "login-complete@example.com",
                  planType: "pro",
                  type: "chatgpt",
                },
              };
        }
        if (request.method === "account/rateLimits/read") {
          return {
            rateLimits: {
              limitId: "codex",
              primary: { usedPercent: 42, windowDurationMins: 300 },
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

    expect(await screen.findByText("Connect Codex")).toBeInTheDocument();
    transport.push({
      event: { success: true, type: "account/login/completed" },
      type: "event",
    });

    expect(await screen.findByText(/login-complete@example.com/)).toBeInTheDocument();
    expect(await screen.findByText("42%")).toBeInTheDocument();
    expect(
      transport.requests.filter((request) => request.method === "account/read"),
    ).toHaveLength(2);
    expect(
      transport.requests.some((request) => request.method === "account/rateLimits/read"),
    ).toBe(true);
  });

  it("clears local account state after logout request succeeds", async () => {
    const user = userEvent.setup();
    const initialState = createInitialAgentState();
    initialState.account = {
      account: { email: "logout@example.com", planType: "pro" },
      status: "authenticated",
    };
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/logout") return {};
        return {};
      },
    });
    function LogoutProbe() {
      const { account, logout } = useAgentAuth();
      return (
        <div>
          <span>{account.status}</span>
          <button onClick={() => void logout()} type="button">
            Logout
          </button>
        </div>
      );
    }
    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <LogoutProbe />
      </AgentProvider>,
    );

    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Logout" }));
    expect(await screen.findByText("unauthenticated")).toBeInTheDocument();
    expect(
      transport.requests.find((request) => request.method === "account/logout")?.params,
    ).toBeUndefined();
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
        fields: {
          message: "bridge recovered after stderr warning",
          path: "/tmp/bridge.log",
        },
        level: "WARN",
        target: "codex_app_server",
      }),
      type: "stderr",
    });

    expect(
      await screen.findByText(
        /WARN codex_app_server bridge recovered after stderr warning/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Diagnostics")).toBeInTheDocument();
  });

  it("does not retain raw transport events for diagnostics", async () => {
    const transport = new FakeAgentTransport();
    function WarningProbe() {
      const { state } = useAgentContext();
      return (
        <output>
          {state.configWarnings.map((warning) => JSON.stringify(warning)).join("\n")}
        </output>
      );
    }
    render(
      <AgentProvider transport={transport}>
        <WarningProbe />
      </AgentProvider>,
    );

    transport.push({
      message: "WARN bridge warning",
      type: "stderr",
    });

    expect(await screen.findByText(/WARN bridge warning/)).toBeInTheDocument();
    expect(screen.getByText(/WARN bridge warning/)).not.toHaveTextContent('"raw"');
  });

  it("keeps known Codex plugin manifest warnings out of the visible UI", async () => {
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
        fields: {
          message: "ignoring interface.defaultPrompt: maximum of 3 prompts is supported",
          path: "/Users/example/.codex/.tmp/plugins/plugin.json",
        },
        level: "WARN",
        target: "codex_core_plugins::manifest",
      }),
      type: "stderr",
    });

    expect(await screen.findByText(/real@example.com/)).toBeInTheDocument();
    expect(screen.queryByText(/Plugin manifest warnings/)).not.toBeInTheDocument();
    expect(screen.queryByText(/maximum of 3 prompts/)).not.toBeInTheDocument();
  });

  it("keeps known Codex skill icon manifest warnings out of the visible UI", async () => {
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
        fields: {
          message: "ignoring interface.icon_small: icon path must not contain '..'",
        },
        level: "WARN",
        target: "codex_core_skills::loader",
      }),
      type: "stderr",
    });

    expect(await screen.findByText(/real@example.com/)).toBeInTheDocument();
    expect(screen.queryByText(/icon path must not contain/)).not.toBeInTheDocument();
  });

  it("keeps long history messages readable behind a preview", () => {
    const initialState = createInitialAgentState();
    initialState.activeThreadId = "thread-history";
    initialState.threads["thread-history"] = {
      orderedTurnIds: ["turn-history"],
      status: "loaded",
      thread: { id: "thread-history", name: "Long history" },
      turns: {
        "turn-history": {
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["item-long"],
          items: {
            "item-long": {
              id: "item-long",
              kind: "userMessage",
              status: "completed",
              text: `${"Review this session. ".repeat(120)}\nKeep it readable.`,
              threadId: "thread-history",
              turnId: "turn-history",
            },
          },
          streamingTextByItemId: {},
          turn: { id: "turn-history", threadId: "thread-history" },
        },
      },
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat />
      </AgentProvider>,
    );

    expect(
      screen
        .getAllByText(/Review this session/)
        .some((element) => element.closest("summary")),
    ).toBe(true);
  });

  it("renders structured App Server message content without crashing", () => {
    const initialState = createInitialAgentState();
    initialState.activeThreadId = "thread-real";
    initialState.threads["thread-real"] = {
      orderedTurnIds: ["turn-real"],
      status: "running",
      thread: { id: "thread-real", name: "Real thread" },
      turns: {
        "turn-real": {
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["item-user"],
          items: {
            "item-user": {
              id: "item-user",
              kind: "userMessage",
              raw: {
                content: [
                  { text: "Reply with exactly: agent-ui-ui-check", type: "text" },
                ],
              },
              status: "completed",
              text: [
                { text: "Reply with exactly: agent-ui-ui-check", type: "text" },
              ] as any,
              threadId: "thread-real",
              turnId: "turn-real",
            },
          },
          streamingTextByItemId: {},
          turn: { id: "turn-real", threadId: "thread-real" },
        },
      },
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat />
      </AgentProvider>,
    );

    expect(screen.getByText("Reply with exactly: agent-ui-ui-check")).toBeInTheDocument();
  });

  it("renders kitchen-derived content blocks from normalized state", () => {
    const initialState = runEventFixture([
      { event: { thread: { id: "thread-blocks", name: "Block renderers" }, type: "thread/started" } },
      {
        event: {
          threadId: "thread-blocks",
          turn: { id: "turn-blocks", threadId: "thread-blocks" },
          type: "turn/started",
        },
      },
      {
        event: {
          item: {
            id: "reasoning",
            kind: "reasoning",
            raw: {
              content: [{ text: "Full hidden reasoning" }],
              summary: [{ text: "Reviewing renderer taxonomy" }],
            },
            text: "Reviewing renderer taxonomy",
            threadId: "thread-blocks",
            turnId: "turn-blocks",
          },
          threadId: "thread-blocks",
          turnId: "turn-blocks",
          type: "item/started",
        },
      },
      {
        event: {
          item: {
            id: "plan",
            kind: "plan",
            text: "- Render command\n- Render tools",
            threadId: "thread-blocks",
            turnId: "turn-blocks",
          },
          threadId: "thread-blocks",
          turnId: "turn-blocks",
          type: "item/completed",
        },
      },
      {
        event: {
          item: {
            id: "tool",
            kind: "mcpToolCall",
            raw: {
              arguments: { selector: "#app" },
              result: { ok: true },
              server: "agent-browser",
              tool: "snapshot",
            },
            threadId: "thread-blocks",
            turnId: "turn-blocks",
          },
          threadId: "thread-blocks",
          turnId: "turn-blocks",
          type: "item/completed",
        },
      },
      {
        event: {
          item: {
            id: "search",
            kind: "webSearch",
            raw: { query: "Codex App Server generated protocol" },
            threadId: "thread-blocks",
            turnId: "turn-blocks",
          },
          threadId: "thread-blocks",
          turnId: "turn-blocks",
          type: "item/completed",
        },
      },
      {
        event: {
          item: {
            id: "image",
            kind: "imageView",
            raw: { path: "/tmp/agent-ui.png" },
            threadId: "thread-blocks",
            turnId: "turn-blocks",
          },
          threadId: "thread-blocks",
          turnId: "turn-blocks",
          type: "item/completed",
        },
      },
    ] as FixtureStep[]);

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat sidebar={false} usage={false} />
      </AgentProvider>,
    );

    expect(screen.getByText("Reviewing renderer taxonomy")).toBeInTheDocument();
    expect(screen.getByLabelText("Plan")).toHaveTextContent("Render command");
    expect(screen.getByText("MCP tool")).toBeInTheDocument();
    expect(screen.getByText("snapshot")).toBeInTheDocument();
    expect(screen.getByText(/"selector": "#app"/)).toBeInTheDocument();
    expect(screen.getByLabelText("Web search")).toHaveTextContent(
      "Codex App Server generated protocol",
    );
    expect(screen.getByRole("img", { name: "/tmp/agent-ui.png" })).toBeInTheDocument();
  });

  it("disables the composer and interrupts the active turn while running", async () => {
    const user = userEvent.setup();
    const initialState = createInitialAgentState();
    initialState.activeThreadId = "thread-running";
    initialState.threads["thread-running"] = {
      orderedTurnIds: ["turn-running"],
      status: "running",
      thread: { id: "thread-running", name: "Running thread" },
      turns: {
        "turn-running": {
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: [],
          items: {},
          streamingTextByItemId: {},
          turn: { id: "turn-running", status: "running", threadId: "thread-running" },
        },
      },
    };
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "turn/interrupt") return {};
        return {};
      },
    });
    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    expect(screen.getByRole("textbox", { name: "Message" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Stop" }));

    expect(
      transport.requests.find((request) => request.method === "turn/interrupt")?.params,
    ).toEqual({ threadId: "thread-running", turnId: "turn-running" });
  });

  it("does not leave messages marked in progress after the thread completes", () => {
    const initialState = createInitialAgentState();
    initialState.activeThreadId = "thread-real";
    initialState.threads["thread-real"] = {
      orderedTurnIds: ["turn-real"],
      status: "completed",
      thread: { id: "thread-real", name: "Completed thread" },
      turns: {
        "turn-real": {
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["item-agent"],
          items: {
            "item-agent": {
              id: "item-agent",
              kind: "agentMessage",
              status: "inProgress",
              text: "agent-ui-ui-check-3",
              threadId: "thread-real",
              turnId: "turn-real",
            },
          },
          streamingTextByItemId: {},
          turn: { id: "turn-real", threadId: "thread-real" },
        },
      },
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat />
      </AgentProvider>,
    );

    expect(screen.getByText("agent-ui-ui-check-3")).toBeInTheDocument();
    expect(screen.getAllByText("completed").length).toBeGreaterThan(0);
    expect(screen.queryByText("inProgress")).not.toBeInTheDocument();
  });

  it("does not leave hydrated history messages marked in progress", () => {
    const initialState = createInitialAgentState();
    initialState.activeThreadId = "thread-history";
    initialState.threads["thread-history"] = {
      orderedTurnIds: ["turn-history"],
      status: "loaded",
      thread: { id: "thread-history", name: "Hydrated thread" },
      turns: {
        "turn-history": {
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["item-agent"],
          items: {
            "item-agent": {
              id: "item-agent",
              kind: "agentMessage",
              status: "inProgress",
              text: "hydrated response",
              threadId: "thread-history",
              turnId: "turn-history",
            },
          },
          streamingTextByItemId: {},
          turn: { id: "turn-history", threadId: "thread-history" },
        },
      },
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat />
      </AgentProvider>,
    );

    expect(screen.getByText("hydrated response")).toBeInTheDocument();
    expect(screen.getAllByText("completed").length).toBeGreaterThan(0);
    expect(screen.queryByText("inProgress")).not.toBeInTheDocument();
  });

  it("keeps large historical command output inside a per-turn work trace", () => {
    const initialState = createInitialAgentState();
    initialState.activeThreadId = "thread-history";
    const itemOrder = Array.from({ length: 80 }, (_, index) => `command-${index}`);
    initialState.threads["thread-history"] = {
      orderedTurnIds: ["turn-history"],
      status: "loaded",
      thread: { id: "thread-history", name: "Command-heavy history" },
      turns: {
        "turn-history": {
          commandOutputByItemId: Object.fromEntries(
            itemOrder.map((id, index) => [id, `output ${index}\n`]),
          ),
          filePatchByItemId: {},
          itemOrder,
          items: Object.fromEntries(
            itemOrder.map((id, index) => [
              id,
              {
                id,
                kind: "commandExecution",
                raw: { command: `echo ${index}` },
                status: "completed",
                text: `echo ${index}`,
                threadId: "thread-history",
                turnId: "turn-history",
              },
            ]),
          ),
          streamingTextByItemId: {},
          turn: { id: "turn-history", threadId: "thread-history" },
        },
      },
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat />
      </AgentProvider>,
    );

    expect(
      screen.getByText("72 older work steps collapsed in this turn"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Work trace")).toHaveTextContent("80 commands");
    expect(screen.getByText("echo 79")).toBeInTheDocument();
    expect(screen.getAllByText("output 79")).toHaveLength(2);
    expect(document.querySelector(".aui-worklog")).not.toBeInTheDocument();
    expect(screen.queryByText("echo 0")).not.toBeInTheDocument();
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

    expect(
      await screen.findByRole("heading", { name: "Implement approval UI" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Threads" })).toBeInTheDocument();
    expect(screen.getByText("Protocol docs update")).toBeInTheDocument();
    expect(screen.getByLabelText("Work trace")).toHaveTextContent(
      "1 command, 1 file change",
    );
    expect(screen.getByLabelText("Command output")).toHaveTextContent("7 tests passed");
    expect(screen.getByLabelText("Diff preview")).toHaveTextContent("AgentDiffPanel");
    expect(screen.getAllByLabelText("CodeMirror patch viewer").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Run settings")).toHaveTextContent("Execution mode");
    expect(screen.getByLabelText("Usage limits")).toHaveTextContent(
      "fixture-demo-model 5h",
    );
    expect(screen.getByLabelText("Usage limits")).toHaveTextContent(
      "fixture-demo-model weekly",
    );
    expect(screen.getByText("Review file changes")).toBeInTheDocument();
    expect(screen.getByText("Approval policy")).toBeInTheDocument();
    expect(screen.getByText("workspace-write")).toBeInTheDocument();
    expect(screen.queryByText(/"approvalPolicy"/)).not.toBeInTheDocument();

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
      await screen.findByRole("button", {
        name: "Decline command request approval-command",
      }),
    );

    expect(transport.responses.get("approval-command")).toEqual({ decision: "decline" });
  });

  it("renders non-command server requests with specific approval context", async () => {
    const user = userEvent.setup();
    const initialState = createInitialAgentState();
    initialState.serverRequestQueue = {
      byId: {
        "request-input": {
          id: "request-input",
          kind: "userInput",
          payload: { prompt: "Choose a deployment target", itemId: "item-input" },
          threadId: "thread-approval",
        },
      },
      order: ["request-input"],
    };
    initialState.pendingServerRequests = initialState.serverRequestQueue.byId;
    const transport = new FakeAgentTransport();
    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentApprovalQueue threadId="thread-approval" />
      </AgentProvider>,
    );

    expect(screen.getByText("User input requested")).toBeInTheDocument();
    expect(screen.getByText("Choose a deployment target")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Decline user input request request-input" }),
    );

    expect(transport.responses.get("request-input")).toEqual({ decision: "decline" });
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
    const initialState = runEventFixture(demoFixture as FixtureStep[]);
    if (initialState.activeThreadId) {
      initialState.threads[initialState.activeThreadId]!.status = "complete";
    }
    initialState.pendingServerRequests = {};
    render(
      <AgentProvider initialState={initialState} transport={transport}>
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

  it("sends composer attachments as structured turn input items", async () => {
    const user = userEvent.setup();
    const prompt = vi
      .spyOn(globalThis, "prompt")
      .mockReturnValueOnce("app://browser")
      .mockReturnValueOnce("plugin://browser-tools");
    const transport = new FakeAgentTransport();
    const initialState = runEventFixture(demoFixture as FixtureStep[]);
    if (initialState.activeThreadId) {
      initialState.threads[initialState.activeThreadId]!.status = "complete";
    }
    initialState.pendingServerRequests = {};
    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "App" }));
    await user.click(screen.getByRole("button", { name: "Plugin" }));
    await user.type(screen.getByLabelText("Message"), "verify with attachments");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(prompt).toHaveBeenCalled();
    expect(transport.requests.at(-1)?.params).toMatchObject({
      input: [
        { text: "verify with attachments", text_elements: [], type: "text" },
        { name: "app://browser", path: "app://browser", type: "mention" },
        {
          name: "plugin://browser-tools",
          path: "plugin://browser-tools",
          type: "mention",
        },
      ],
    });
  });

  it("applies run controls to turn/start params", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    const initialState = runEventFixture(demoFixture as FixtureStep[]);
    if (initialState.activeThreadId) {
      initialState.threads[initialState.activeThreadId]!.status = "complete";
    }
    initialState.pendingServerRequests = {};
    render(
      <AgentProvider initialState={initialState} transport={transport}>
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

  it("renders conversation messages as safe markdown", () => {
    render(
      <AgentMessageList
        thread={{
          orderedTurnIds: ["turn-markdown"],
          status: "complete",
          thread: { id: "thread-markdown", name: "Markdown" },
          turns: {
            "turn-markdown": {
              commandOutputByItemId: {},
              filePatchByItemId: {},
              itemOrder: ["item-markdown"],
              items: {
                "item-markdown": {
                  id: "item-markdown",
                  kind: "agentMessage",
                  status: "completed",
                  text:
                    "## Result\n\n- `bun test` passed\n- [Docs](https://example.com)\n\n```sh\nbun test\n```\n\n| File | State |\n| --- | --- |\n| README.md | updated |\n\n<script>alert('x')</script>",
                  threadId: "thread-markdown",
                  turnId: "turn-markdown",
                },
              },
              streamingTextByItemId: {},
              turn: {
                id: "turn-markdown",
                status: "completed",
                threadId: "thread-markdown",
              },
            },
          },
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Result" })).toBeInTheDocument();
    expect(screen.getAllByText("bun test")).toHaveLength(2);
    expect(screen.getByText("passed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("<script>alert('x')</script>")).toBeInTheDocument();
  });

  it("lets renderItem hide selected messages and fall back for the rest", () => {
    render(
      <AgentMessageList
        renderItem={(item) => {
          if (item.id === "item-hidden") return null;
          return undefined;
        }}
        thread={{
          orderedTurnIds: ["turn-filter"],
          status: "complete",
          thread: { id: "thread-filter", name: "Filter" },
          turns: {
            "turn-filter": {
              commandOutputByItemId: {},
              filePatchByItemId: {},
              itemOrder: ["item-hidden", "item-visible"],
              items: {
                "item-hidden": {
                  id: "item-hidden",
                  kind: "userMessage",
                  status: "completed",
                  text: "Internal prompt",
                  threadId: "thread-filter",
                  turnId: "turn-filter",
                },
                "item-visible": {
                  id: "item-visible",
                  kind: "agentMessage",
                  status: "completed",
                  text: "Visible answer",
                  threadId: "thread-filter",
                  turnId: "turn-filter",
                },
              },
              streamingTextByItemId: {},
              turn: {
                id: "turn-filter",
                status: "completed",
                threadId: "thread-filter",
              },
            },
          },
        }}
      />,
    );

    expect(screen.queryByText("Internal prompt")).not.toBeInTheDocument();
    expect(screen.getByText("Visible answer")).toBeInTheDocument();
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
          return {
            thread: {
              id: "thread-new",
              name: "New real thread",
              status: { type: "idle" },
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

    await screen.findByRole("option", { name: "Real Model (real-model)" });
    await user.selectOptions(screen.getByLabelText("Model"), "real-model");
    await user.type(screen.getByLabelText("Working directory"), "/tmp/agent-ui");
    await user.click(screen.getByRole("button", { name: "Start thread" }));

    expect(
      transport.requests.find((request) => request.method === "thread/start")?.params,
    ).toEqual({
      cwd: "/tmp/agent-ui",
      model: "real-model",
    });
    expect(await screen.findByText("Ready")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resume" })).not.toBeInTheDocument();
  });

  it("restores cwd from started and resumed thread responses", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return { account: { email: "real@example.com", planType: "pro" } };
        }
        if (request.method === "thread/start") {
          return {
            thread: {
              cwd: "/Users/example/project",
              id: "thread-start-cwd",
              name: "Thread with cwd",
              path: "/Users/example/.codex/sessions/2026/05/10/start.jsonl",
              status: { type: "idle" },
            },
          };
        }
        if (request.method === "thread/list") {
          return {
            data: [
              {
                cwd: "/Users/example/old-project",
                id: "thread-old-cwd",
                name: "Old project",
                path: "/Users/example/.codex/sessions/2026/05/10/old.jsonl",
                status: { type: "notLoaded" },
              },
            ],
          };
        }
        if (request.method === "thread/read") {
          return {
            thread: {
              cwd: "/Users/example/old-project",
              id: "thread-old-cwd",
              name: "Old project",
              path: "/Users/example/.codex/sessions/2026/05/10/old.jsonl",
              status: { type: "notLoaded" },
              turns: [{ id: "turn-old-cwd", items: [], status: "completed" }],
            },
          };
        }
        if (request.method === "thread/resume") {
          return {
            thread: {
              cwd: "/Users/example/old-project",
              id: "thread-old-cwd",
              name: "Old project",
              path: "/Users/example/.codex/sessions/2026/05/10/old.jsonl",
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

    await user.click(await screen.findByRole("button", { name: "New thread" }));
    expect(await screen.findByText("/Users/example/project")).toBeInTheDocument();
    expect(screen.getByLabelText("Working directory")).toHaveValue(
      "/Users/example/project",
    );

    await user.click(screen.getByRole("button", { name: "Load" }));
    await user.click(await screen.findByRole("button", { name: /Old project/ }));
    expect(await screen.findByText("Preview")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Resume" }));
    expect(await screen.findByText("Ready")).toBeInTheDocument();
    expect(screen.getByLabelText("Working directory")).toHaveValue(
      "/Users/example/old-project",
    );
    expect(screen.queryByText(/\.codex\/sessions/)).not.toBeInTheDocument();
  });

  it("collapses and expands the history sidebar", async () => {
    const user = userEvent.setup();
    render(
      <AgentProvider transport={new FakeAgentTransport()}>
        <AgentChat />
      </AgentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "Collapse history" }));
    expect(screen.queryByLabelText("Search history")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Expand history" }));
    expect(screen.getByLabelText("Search history")).toBeInTheDocument();
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
        if (request.method === "account/read") {
          return { account: { email: "real@example.com", planType: "pro" } };
        }
        if (request.method === "thread/start") {
          return { thread: { id: "thread-empty-model", name: "Model metadata test" } };
        }
        if (request.method === "model/list") {
          return {
            data: [{ displayName: "Metadata-light model", id: "metadata-light-model" }],
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

    await user.click(await screen.findByRole("button", { name: "Start thread" }));
    await screen.findByRole("option", {
      name: "Metadata-light model (metadata-light-model)",
    });
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
    expect(
      transport.requests.find((request) => request.method === "account/login/start")
        ?.params,
    ).toEqual({ type: "chatgptDeviceCode" });

    await user.click(screen.getAllByRole("button", { name: "Cancel login" })[0]!);
    expect(
      transport.requests.find((request) => request.method === "account/login/cancel")
        ?.params,
    ).toEqual({ loginId: "login-123" });
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
                path: "/Users/example/.codex/sessions/2026/05/09/rollout-demo.jsonl",
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
              path: "/Users/example/.codex/sessions/2026/05/09/rollout-demo.jsonl",
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

    expect(
      await screen.findByRole("heading", { name: "Historical fix" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Codex session")).toBeInTheDocument();
    expect(screen.queryByText(/rollout-demo\.jsonl/)).not.toBeInTheDocument();
    expect(screen.getByText("The stored thread was loaded.")).toBeInTheDocument();
    expect(screen.getByLabelText("Command output")).toHaveTextContent("ok");
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeDisabled();
    expect(screen.getByText("Resume this stored thread before sending a new message.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Resume" }));
    expect(await screen.findByText("Ready")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).not.toBeDisabled();
    expect(screen.queryByText("notLoaded")).not.toBeInTheDocument();
    expect(transport.requests.map((request) => request.method)).toEqual(
      expect.arrayContaining(["thread/list", "thread/read", "thread/resume"]),
    );
    expect(
      transport.requests.find((request) => request.method === "thread/resume")?.params,
    ).toEqual({
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

  it("ignores stored thread rows without stable ids", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              { name: "Broken row" },
              {
                id: "thread-valid-row",
                name: "Valid row",
                status: { type: "notLoaded" },
              },
            ],
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

    expect(await screen.findAllByText("Valid row")).not.toHaveLength(0);
    expect(screen.queryByText("Broken row")).not.toBeInTheDocument();
  });

  it("previews the latest stored thread after startup history load", async () => {
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              {
                cwd: "/Users/example/latest-project",
                id: "thread-auto-preview",
                name: "Latest stored session",
                path: "/Users/example/.codex/sessions/2026/05/10/latest.jsonl",
                status: { type: "notLoaded" },
                updatedAt: 1778000000,
              },
            ],
          };
        }
        if (request.method === "thread/read") {
          return {
            thread: {
              cwd: "/Users/example/latest-project",
              id: "thread-auto-preview",
              name: "Latest stored session",
              path: "/Users/example/.codex/sessions/2026/05/10/latest.jsonl",
              status: { type: "notLoaded" },
              turns: [
                {
                  id: "turn-auto-preview",
                  items: [
                    {
                      id: "item-auto-preview",
                      text: "This stored session opens in the main pane.",
                      type: "agentMessage",
                    },
                  ],
                },
              ],
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

    expect(
      await screen.findByRole("heading", { name: "Latest stored session" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("This stored session opens in the main pane."),
    ).toBeInTheDocument();
    expect(screen.getByText("/Users/example/latest-project")).toBeInTheDocument();
    expect(screen.getByLabelText("Working directory")).toHaveValue(
      "/Users/example/latest-project",
    );
    expect(
      transport.requests.find((request) => request.method === "thread/read")?.params,
    ).toEqual({
      includeTurns: true,
      threadId: "thread-auto-preview",
    });
  });

  it("loads additional stored thread pages when thread/list returns a cursor", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method !== "thread/list") return {};
        if (
          (request.params as { cursor?: string | null } | undefined)?.cursor === "page-2"
        ) {
          return {
            data: [
              {
                cwd: "/Users/example/second-project",
                id: "thread-page-2",
                name: "Second page thread",
                status: { type: "notLoaded" },
                updatedAt: 1778000600,
              },
            ],
            nextCursor: null,
          };
        }
        return {
          data: [
            {
              id: "thread-page-1",
              name: "First page thread",
              cwd: "/Users/example/first-project",
              status: { type: "notLoaded" },
              updatedAt: 1778000000,
            },
          ],
          nextCursor: "page-2",
        };
      },
    });
    const { container } = render(
      <AgentProvider transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "Load" }));
    expect(await screen.findAllByText("First page thread")).not.toHaveLength(0);
    expect((await screen.findAllByText(/first-project/)).length).toBeGreaterThan(0);
    expect(await screen.findByText(/1 thread loaded · more available/)).toBeInTheDocument();
    const feedback = container.querySelector(".aui-history-feedback");
    expect(feedback).toContainElement(screen.getByText(/1 thread loaded/));
    expect(feedback).toContainElement(screen.getByRole("button", { name: "Load more" }));
    expect(screen.getByRole("navigation", { name: "Threads" })).not.toBe(feedback);
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("Second page thread")).toBeInTheDocument();
    expect((await screen.findAllByText(/second-project/)).length).toBeGreaterThan(0);
    expect(await screen.findByText(/2 threads loaded · all loaded/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
    expect(
      transport.requests.find(
        (request) =>
          request.method === "thread/list" &&
          (request.params as { cursor?: string | null }).cursor === "page-2",
      ),
    ).toBeTruthy();
  });

  it("loads all stored thread pages until the cursor is exhausted", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method !== "thread/list") return {};
        const cursor = (request.params as { cursor?: string | null } | undefined)?.cursor;
        if (cursor === "page-2") {
          return {
            data: [
              {
                cwd: "/Users/example/page-two",
                id: "thread-load-all-2",
                name: "Load all page two",
                status: { type: "notLoaded" },
              },
            ],
            nextCursor: "page-3",
          };
        }
        if (cursor === "page-3") {
          return {
            data: [
              {
                cwd: "/Users/example/page-three",
                id: "thread-load-all-3",
                name: "Load all page three",
                status: { type: "notLoaded" },
              },
            ],
            nextCursor: null,
          };
        }
        return {
          data: [
            {
              cwd: "/Users/example/page-one",
              id: "thread-load-all-1",
              name: "Load all page one",
              status: { type: "notLoaded" },
            },
          ],
          nextCursor: "page-2",
        };
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "Load" }));
    await user.click(await screen.findByRole("button", { name: "Load all" }));

    expect(await screen.findByText("Load all page three")).toBeInTheDocument();
    expect(screen.getByText(/3 threads loaded · all loaded/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load all" })).not.toBeInTheDocument();
    expect(
      transport.requests.filter((request) => request.method === "thread/list").length,
    ).toBeGreaterThanOrEqual(3);
  });
});
