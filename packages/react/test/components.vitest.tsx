// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import demoFixture from "../../../fixtures/app-server/demo-session.json" with { type: "json" };
import {
  createInitialAgentState,
  FakeAgentTransport,
  selectDiagnosticWarnings,
  selectPendingOperations,
  type AgentThreadView as CoreAgentThreadView,
  type AgentThreadScope,
  type ThreadState,
} from "@nyosegawa/agent-ui-core";
import {
  runEventFixture,
  type FixtureStep,
} from "@nyosegawa/agent-ui-core/internal";
import {
  AgentChat,
  AgentProvider,
  type AgentThreadHistorySyncedEvent,
} from "../src";
import {
  AgentAttachmentChips,
  AgentComposer,
  AgentComposerInput,
  AgentApprovalQueue,
  AgentDiffViewer,
  AgentMessageList,
  AgentShell,
  AgentComposerSubmitButton,
  AgentComposerToolbar,
  AgentCriticalNoticeList,
  AgentStatusDetails,
  AgentStatusSummary,
  AgentStartComposer,
  AgentThemeToggle,
  AgentThreadSidebar,
  AgentThreadView,
  AgentUsagePanel,
  AgentUsageSummary,
  AgentLocaleSelect,
  AgentSkillsPanel,
  AgentAppsPanel,
  ThreadList,
  formatThreadStatus,
} from "../src/primitives";
import {
  useAgentAccount,
  useAgentApps,
  useAgentApprovals,
  useAgentServerRequests,
  useAgentHooks,
  useAgentRunSettings,
  useAgentSkills,
  useAgentDiagnostics,
  useAgentThread,
  useAgentThreadReader,
  useAgentThreads,
  useAgentThreadListController,
  useAgentChatController,
  useAgentComposerController,
  useAgentTranscriptController,
  useAgentTranscriptScrollController,
  useAgentTurn,
  type AgentApprovalRequest,
} from "../src/headless";
import { useInternalAgentComposerController } from "../src/hooks/composer";
import { useInternalAgentContext } from "../src/provider";
import { useTranscriptFollowScroll } from "../src/timeline/scroll-follow";

function localImageInput(path: string) {
  return { path, type: "localImage" as const };
}

function textInput(text: string) {
  return { text, text_elements: [], type: "text" as const };
}

function approvalView(
  approval: Pick<AgentApprovalRequest, "id" | "kind"> &
    Partial<Omit<AgentApprovalRequest, "id" | "kind">>,
): AgentApprovalRequest {
  return {
    canDecide:
      approval.canDecide ??
      (approval.kind === "commandApproval" || approval.kind === "fileChangeApproval"),
    details: approval.details ?? [],
    risk: approval.risk ?? "low",
    ...approval,
  };
}

function resolvedImageAttachment(path: string, label?: string, previewUrl?: string) {
  return {
    displayName: label,
    input: localImageInput(path),
    path,
    previewUrl,
  };
}

function resolvedTextAttachment(path: string, label?: string) {
  return {
    displayName: label,
    input: textInput(`Attached file: ${path}`),
    path,
  };
}

describe("thread waiting status labels", () => {
  it("maps every waiting reason to the user-visible status label", () => {
    expect(
      formatThreadStatus("waitingForInput", { waitingReasons: ["approval"] }),
    ).toBe("Needs approval");
    expect(
      formatThreadStatus("waitingForInput", { waitingReasons: ["permission"] }),
    ).toBe("Needs permission");
    expect(
      formatThreadStatus("waitingForInput", { waitingReasons: ["userInput"] }),
    ).toBe("Needs input");
    expect(
      formatThreadStatus("waitingForInput", { waitingReasons: ["mcpElicitation"] }),
    ).toBe("Needs MCP input");
    expect(
      formatThreadStatus("waitingForInput", { waitingReasons: ["authRefresh"] }),
    ).toBe("Needs authentication");
    expect(
      formatThreadStatus("waitingForInput", { waitingReasons: ["attestation"] }),
    ).toBe("Needs attestation");
    expect(
      formatThreadStatus("waitingForInput", { waitingReasons: ["unknown"] }),
    ).toBe("Needs attention");
    expect(
      formatThreadStatus("waitingForInput", {
        waitingReasons: ["approval", "permission"],
      }),
    ).toBe("Needs attention");
  });

  it("uses waiting reasons in thread list metadata", () => {
    const thread: CoreAgentThreadView = {
      displayStatus: "waitingForInput",
      id: "thread-approval",
      isActive: false,
      isArchived: false,
      isPreview: false,
      isRunning: false,
      needsInput: true,
      title: "Approval thread",
      waitingReasons: ["approval"],
    };

    render(
      <AgentProvider transport={new FakeAgentTransport()}>
        <ThreadList threads={[thread]} />
      </AgentProvider>,
    );

    expect(screen.getByRole("button", { name: /Approval thread/ })).toHaveTextContent(
      "Needs approval",
    );
  });
});

function renderMessageListWithThread(
  thread: ThreadState,
  props: Omit<ComponentProps<typeof AgentMessageList>, "threadId"> = {},
) {
  const initialState = createInitialAgentState();
  initialState.threads[thread.thread.id] = thread;
  return render(
    <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
      <AgentMessageList {...props} threadId={thread.thread.id} />
    </AgentProvider>,
  );
}

function ThreadListControllerProbe({
  label,
  onHistorySynced,
  scope,
}: {
  label: string;
  onHistorySynced?: (event: AgentThreadHistorySyncedEvent) => void;
  scope: AgentThreadScope;
}) {
  const { state } = useInternalAgentContext();
  const controller = useAgentThreadListController(scope, { onHistorySynced });
  const activeThreadId = state.threadLifecycle.activeThreadId;
  const [resumeResult, setResumeResult] = useState("");
  const [resumeThreadId, setResumeThreadId] = useState("");
  return (
    <section aria-label={label}>
      <input
        aria-label={`${label} search`}
        onChange={(event) => controller.setSearchTerm(event.currentTarget.value)}
        value={controller.searchTerm}
      />
      <button onClick={() => void controller.refresh()} type="button">
        {label} refresh
      </button>
      <button onClick={() => void controller.loadNextPage()} type="button">
        {label} load more
      </button>
      <button
        onClick={() => {
          const firstThreadId = controller.threads[0]?.id;
          if (firstThreadId) void controller.previewThread(firstThreadId);
        }}
        type="button"
      >
        {label} preview first
      </button>
      <button
        onClick={() => {
          const firstThreadId = controller.threads[0]?.id;
          if (firstThreadId) {
            void controller.resumeThread(firstThreadId).then((threadId) => {
              setResumeThreadId(threadId);
            });
          }
        }}
        type="button"
      >
        {label} resume first
      </button>
      <button
        onClick={() => {
          const firstThreadId = controller.threads[0]?.id;
          if (firstThreadId) {
            void controller.resumeThreadWithResult(firstThreadId).then((result) => {
              setResumeResult(`${result.threadId}:${result.requestedThreadId ?? "none"}`);
            });
          }
        }}
        type="button"
      >
        {label} resume first with result
      </button>
      <output aria-label={`${label} active thread`}>{activeThreadId ?? ""}</output>
      <output aria-label={`${label} cursor`}>{controller.nextCursor ?? ""}</output>
      <output aria-label={`${label} status`}>
        {controller.isLoading ? "loading" : (controller.error?.message ?? "ready")}
      </output>
      <output aria-label={`${label} threads`}>
        {controller.threads.map((thread) => thread.title ?? thread.id).join(",")}
      </output>
      <output aria-label={`${label} scope search`}>
        {controller.collection?.scope.kind === "history"
          ? (controller.collection.scope.searchTerm ?? "")
          : ""}
      </output>
      <output aria-label={`${label} resume result`}>{resumeResult || "none"}</output>
      <output aria-label={`${label} resume thread id`}>{resumeThreadId || "none"}</output>
    </section>
  );
}

function RunSettingsProbe() {
  const { runSettings } = useAgentRunSettings();
  return <output aria-label="current cwd">{runSettings.cwd ?? ""}</output>;
}

expect.extend(toHaveNoViolations);

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mockCompactLayout(matches = true) {
  mockResponsiveLayout({ compact: matches, contextSheet: matches });
}

function mockResponsiveLayout({
  compact = false,
  contextSheet = compact,
}: {
  compact?: boolean;
  contextSheet?: boolean;
}) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches:
        query === "(max-width: 640px)"
          ? compact
          : query === "(max-width: 980px)"
            ? contextSheet
            : false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  );
}

function runningComposerState() {
  const initialState = createInitialAgentState();
  initialState.threadLifecycle.activeThreadId = "thread-running";
  initialState.threads["thread-running"] = {
    activity: "running",
    availability: "available",
    id: "thread-running",
    metadata: {},
    operations: {},
    orderedTurnIds: ["turn-running"],
    runtime: {
      activeTurnId: "turn-running",
      status: { activeFlags: [], type: "active" },
    },
    status: "running",
    storage: "unknown",
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
  return initialState;
}

function idleComposerState() {
  const initialState = runningComposerState();
  const thread = initialState.threads["thread-running"];
  initialState.threadLifecycle.activeThreadId = "thread-idle";
  delete initialState.threads["thread-running"];
  initialState.threads["thread-idle"] = {
    ...thread,
    activity: "idle",
    id: "thread-idle",
    orderedTurnIds: [],
    runtime: { status: { type: "idle" } },
    status: "ready",
    thread: { id: "thread-idle", name: "Idle thread" },
    turns: {},
  };
  return initialState;
}

function twoRunningThreadsState() {
  const initialState = runningComposerState();
  initialState.threads["thread-running"].thread.name = "Thread A";
  initialState.threads["thread-b"] = {
    activity: "running",
    availability: "available",
    id: "thread-b",
    metadata: {},
    operations: {},
    orderedTurnIds: ["turn-b"],
    runtime: {
      activeTurnId: "turn-b",
      status: { activeFlags: [], type: "active" },
    },
    status: "running",
    storage: "unknown",
    thread: { id: "thread-b", name: "Thread B" },
    turns: {
      "turn-b": {
        commandOutputByItemId: {},
        filePatchByItemId: {},
        itemOrder: [],
        items: {},
        streamingTextByItemId: {},
        turn: { id: "turn-b", status: "running", threadId: "thread-b" },
      },
    },
  };
  return initialState;
}

function ActiveThreadHarness(props: React.ComponentProps<typeof AgentChat>) {
  const { activeThreadId, setActiveThread } = useAgentThreads();
  return (
    <>
      <button type="button" onClick={() => setActiveThread("thread-running")}>
        Show thread A
      </button>
      <button type="button" onClick={() => setActiveThread("thread-b")}>
        Show thread B
      </button>
      <button type="button" onClick={() => setActiveThread(undefined)}>
        Show no thread
      </button>
      <span data-testid="active-thread">{activeThreadId}</span>
      {activeThreadId ? (
        <AgentThreadView
          composerIntegrations={props.composerIntegrations}
          resolveLocalAttachment={props.resolveLocalAttachment}
        />
      ) : (
        <div>No active thread</div>
      )}
    </>
  );
}

function ResumeThreadHarness({ requestedId }: { requestedId: string }) {
  const { state } = useInternalAgentContext();
  const { resumeThread } = useAgentThread();
  const [resumeResult, setResumeResult] = useState("");
  const activeThreadId = state.threadLifecycle.activeThreadId;
  const activeThread = activeThreadId ? state.threads[activeThreadId] : undefined;
  const pageItemText = activeThread?.turns["turn-page"]?.items["item-page"]?.text;

  return (
    <>
      <button
        type="button"
        onClick={() =>
          void resumeThread(requestedId)
            .then((result) => {
              setResumeResult(`${result.threadId}:${result.requestedThreadId ?? "none"}`);
            })
            .catch((caught: unknown) => {
              setResumeResult(caught instanceof Error ? caught.message : String(caught));
            })
        }
      >
        Resume requested thread
      </button>
      <output aria-label="active thread">{activeThreadId ?? "none"}</output>
      <output aria-label="thread status">{activeThread?.status ?? "none"}</output>
      <output aria-label="thread title">{activeThread?.thread.name ?? "none"}</output>
      <output aria-label="initial page item">{pageItemText ?? "none"}</output>
      <output aria-label="resume result">{resumeResult || "none"}</output>
    </>
  );
}

function ResumeDiagnosticsProbe() {
  const { developerDiagnostics, auditDiagnostics, userDiagnostics } =
    useAgentDiagnostics();
  return (
    <>
      <output aria-label="developer resume diagnostics">
        {developerDiagnostics.warnings
          .map((warning) =>
            JSON.stringify({
              id: warning.id,
              message: warning.message,
              raw: warning.raw,
              reasonCode: warning.reasonCode,
              requestedThreadId: warning.requestedThreadId,
              threadId: warning.threadId,
            }),
          )
          .join("\n") || "none"}
      </output>
      <output aria-label="audit resume diagnostics">
        {auditDiagnostics.warnings.map((warning) => warning.reasonCode).join(",") ||
          "none"}
      </output>
      <output aria-label="user resume diagnostics">
        {userDiagnostics.warnings.map((warning) => warning.reasonCode).join(",") ||
          "none"}
      </output>
    </>
  );
}

function ReadThreadHarness({ threadId }: { threadId: string }) {
  const { state } = useInternalAgentContext();
  const { readThread } = useAgentThreadReader();
  const activeThreadId = state.threadLifecycle.activeThreadId;
  const previewThread = state.threads[threadId];
  const previewItemText =
    previewThread?.turns["turn-preview"]?.items["item-preview"]?.text;

  return (
    <>
      <button
        type="button"
        onClick={() => void readThread(threadId, { activate: false, includeTurns: true })}
      >
        Read preview thread
      </button>
      <output aria-label="active thread">{activeThreadId ?? "none"}</output>
      <output aria-label="preview thread status">
        {previewThread?.status ?? "none"}
      </output>
      <output aria-label="preview thread item">{previewItemText ?? "none"}</output>
    </>
  );
}

function ActiveThreadStateProbe() {
  const { state } = useInternalAgentContext();
  const activeThreadId = state.threadLifecycle.activeThreadId;
  const activeThread = activeThreadId ? state.threads[activeThreadId] : undefined;
  const turnId = activeThread?.orderedTurnIds[0];
  const turn = turnId ? activeThread?.turns[turnId] : undefined;
  const itemId = turn?.itemOrder[0];
  const item = itemId ? turn?.items[itemId] : undefined;
  const pendingOperations = activeThreadId
    ? selectPendingOperations(state, activeThreadId)
    : [];
  return (
    <>
      <output aria-label="active thread id">{activeThreadId ?? "none"}</output>
      <output aria-label="active turn id">{turnId ?? "none"}</output>
      <output aria-label="active item id">{itemId ?? "none"}</output>
      <output aria-label="active item text">{item?.text ?? "none"}</output>
      <output aria-label="active item status">{item?.status ?? "none"}</output>
      <output aria-label="active item thread id">{item?.threadId ?? "none"}</output>
      <output aria-label="pending operation count">
        {String(pendingOperations.length)}
      </output>
      <output aria-label="pending operation status">
        {pendingOperations[0]?.status ?? "none"}
      </output>
    </>
  );
}

function ComposerOperationProbe() {
  const [retryError, setRetryError] = useState("");
  const composer = useInternalAgentComposerController();
  const operationId = Object.keys(composer.operationsById)[0];
  const operation = operationId ? composer.getOperation(operationId) : undefined;
  return (
    <>
      <output aria-label="composer operation id">{operationId ?? "none"}</output>
      <output aria-label="composer operation status">
        {operation?.status ?? "none"}
      </output>
      <output aria-label="composer retry error">{retryError || "none"}</output>
      <button
        disabled={!operationId}
        onClick={() => {
          if (operationId) {
            void composer.retryOperation(operationId).catch((caught: unknown) => {
              setRetryError(caught instanceof Error ? caught.message : String(caught));
            });
          }
        }}
        type="button"
      >
        Retry operation
      </button>
      <button
        disabled={!operationId}
        onClick={() => {
          if (operationId) {
            void composer.retryOperation(operationId).catch((caught: unknown) => {
              setRetryError(caught instanceof Error ? caught.message : String(caught));
            });
            void composer.retryOperation(operationId).catch((caught: unknown) => {
              setRetryError(caught instanceof Error ? caught.message : String(caught));
            });
          }
        }}
        type="button"
      >
        Retry operation twice
      </button>
      <button
        disabled={!operationId}
        onClick={() => {
          if (operationId) composer.cancelOperation(operationId);
        }}
        type="button"
      >
        Cancel operation
      </button>
    </>
  );
}

function PublicComposerControllerProbe() {
  const [retryError, setRetryError] = useState("");
  const composer = useAgentComposerController();
  const failedPendingMessage = composer.failedPendingMessages[0];
  return (
    <>
      <output aria-label="public composer can submit">
        {String(composer.canSubmit)}
      </output>
      <output aria-label="public composer disabled reason">
        {composer.disabledReason ?? "none"}
      </output>
      <output aria-label="public composer submit mode">{composer.submitMode}</output>
      <output aria-label="public failed pending count">
        {String(composer.failedPendingMessages.length)}
      </output>
      <output aria-label="public failed pending error">
        {failedPendingMessage?.error ?? "none"}
      </output>
      <output aria-label="public failed pending id">
        {failedPendingMessage?.operationId ?? "none"}
      </output>
      <output aria-label="public retry error">{retryError || "none"}</output>
      <button
        disabled={!failedPendingMessage}
        onClick={() => {
          if (failedPendingMessage) {
            void composer
              .retryFailedPendingMessage(failedPendingMessage.operationId)
              .catch((caught: unknown) => {
                setRetryError(caught instanceof Error ? caught.message : String(caught));
              });
          }
        }}
        type="button"
      >
        Retry failed pending message
      </button>
      <button
        disabled={!failedPendingMessage}
        onClick={() => {
          if (failedPendingMessage) {
            composer.cancelFailedPendingMessage(failedPendingMessage.operationId);
          }
        }}
        type="button"
      >
        Cancel failed pending message
      </button>
    </>
  );
}

function PublicFirstMessageStartProbe() {
  const [result, setResult] = useState("none");
  const [error, setError] = useState("none");
  const composer = useAgentComposerController();
  return (
    <>
      <input
        aria-label="Public first message"
        onChange={(event) => composer.setValue(event.currentTarget.value)}
        value={composer.value}
      />
      <button
        type="button"
        onClick={() => {
          void composer
            .startThreadWithInput(composer.value)
            .then((nextResult) => {
              setResult(nextResult.threadId);
            })
            .catch((caught: unknown) => {
              setError(caught instanceof Error ? caught.message : String(caught));
            });
        }}
      >
        Public start with input
      </button>
      <button
        type="button"
        onClick={() => {
          void composer
            .startThreadWithInput([{ text: "   ", text_elements: [], type: "text" }])
            .then((nextResult) => {
              setResult(nextResult.threadId);
            })
            .catch((caught: unknown) => {
              setError(caught instanceof Error ? caught.message : String(caught));
            });
        }}
      >
        Public start with blank array input
      </button>
      <output aria-label="public start result">{result}</output>
      <output aria-label="public start error">{error}</output>
    </>
  );
}

function PublicChatControllerProbe() {
  const [result, setResult] = useState("none");
  const [error, setError] = useState("none");
  const controller = useAgentChatController();
  const formatResult = (nextResult: Awaited<ReturnType<typeof controller.sendMessage>>) =>
    `${nextResult.type}:${nextResult.threadId ?? "none"}`;
  return (
    <>
      <output aria-label="public chat value">{controller.value}</output>
      <output aria-label="public chat thread id">{controller.threadId ?? "none"}</output>
      <output aria-label="public chat result">{result}</output>
      <output aria-label="public chat error">{error}</output>
      <button
        type="button"
        onClick={() => controller.setValue("external draft")}
      >
        Set external draft
      </button>
      <button
        type="button"
        onClick={() => {
          void controller
            .sendMessage("external first")
            .then((nextResult) => {
              setResult(formatResult(nextResult));
            })
            .catch((caught: unknown) => {
              setError(caught instanceof Error ? caught.message : String(caught));
            });
        }}
      >
        Send external first
      </button>
      <button
        type="button"
        onClick={() => {
          void controller
            .sendMessage("external follow up")
            .then((nextResult) => {
              setResult(formatResult(nextResult));
            })
            .catch((caught: unknown) => {
              setError(caught instanceof Error ? caught.message : String(caught));
            });
        }}
      >
        Send external follow up
      </button>
      <button
        type="button"
        onClick={() => {
          void controller
            .sendMessage("external follow up with options", {
              turnOptions: {
                effort: "high",
                model: "external-model",
                serviceTier: "flex",
              },
            })
            .then((nextResult) => {
              setResult(formatResult(nextResult));
            })
            .catch((caught: unknown) => {
              setError(caught instanceof Error ? caught.message : String(caught));
            });
        }}
      >
        Send external follow up with options
      </button>
    </>
  );
}

function PublicFirstMessageStartWithOptionsProbe() {
  const [result, setResult] = useState("none");
  const [error, setError] = useState("none");
  const composer = useAgentComposerController();
  const { setPolicyId } = useAgentRunSettings();
  return (
    <>
      <button type="button" onClick={() => setPolicyId("review")}>
        Set review policy
      </button>
      <button
        type="button"
        onClick={() => {
          void composer
            .startThreadWithInput(
              [
                textInput("inspect image"),
                localImageInput("/tmp/agent-ui-first-turn.png"),
              ],
              {
                threadOptions: {
                  approvalPolicy: "on-request",
                  cwd: "/host/project",
                  model: "thread-model",
                  sandbox: "workspace-write",
                  threadSource: "user",
                },
                turnOptions: {
                  approvalPolicy: "never",
                  cwd: "/host/project/turn",
                  effort: "high",
                  model: "turn-model",
                  serviceTier: "flex",
                },
              },
            )
            .then((nextResult) => {
              setResult(JSON.stringify(nextResult));
            })
            .catch((caught: unknown) => {
              setError(caught instanceof Error ? caught.message : String(caught));
            });
        }}
      >
        Public start with options
      </button>
      <output aria-label="public start options result">{result}</output>
      <output aria-label="public start options error">{error}</output>
    </>
  );
}

async function queueAcrossThreadViewRemount(
  user: ReturnType<typeof userEvent.setup>,
  first: string,
  second: string,
) {
  await user.type(screen.getByRole("textbox", { name: "Message" }), first);
  await user.keyboard("{Enter}");
  await user.click(screen.getByRole("button", { name: "Show no thread" }));
  expect(screen.queryByRole("textbox", { name: "Message" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Show thread A" }));
  await user.type(screen.getByRole("textbox", { name: "Message" }), second);
  await user.keyboard("{Enter}");
  expect(screen.getByLabelText("Queued follow-ups")).toHaveTextContent(first);
  expect(screen.getByLabelText("Queued follow-ups")).toHaveTextContent(second);
}

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
      await screen.findByRole("button", { name: "Start thread" }, { timeout: 5000 }),
    ).toBeDisabled();
    await userEvent
      .setup()
      .type(screen.getByRole("textbox", { name: "Message" }), "hello");
    expect(screen.getByRole("button", { name: "Start thread" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Login" })).not.toBeInTheDocument();
  });

  it("applies explicit themes without forcing a theme by default", async () => {
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return { account: { email: "user@example.com", planType: "pro" } };
        }
        return {};
      },
    });
    const { rerender } = render(
      <AgentProvider transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );
    expect(await screen.findByTestId("agent-chat")).not.toHaveAttribute("data-aui-theme");

    rerender(
      <AgentProvider transport={transport}>
        <AgentChat theme="dark" />
      </AgentProvider>,
    );
    expect(screen.getByTestId("agent-chat")).toHaveAttribute("data-aui-theme", "dark");
  });

  it("keeps AgentShell theme opt-in while preserving explicit data attributes", () => {
    const { rerender } = render(<AgentShell>Body</AgentShell>);
    expect(screen.getByTestId("agent-chat")).not.toHaveAttribute("data-aui-theme");

    rerender(<AgentShell data-aui-theme="system">Body</AgentShell>);
    expect(screen.getByTestId("agent-chat")).toHaveAttribute("data-aui-theme", "system");

    rerender(
      <AgentShell data-aui-theme="system" theme="dark">
        Body
      </AgentShell>,
    );
    expect(screen.getByTestId("agent-chat")).toHaveAttribute("data-aui-theme", "dark");
  });

  it("does not forward replacement-only Default prop to AgentShell DOM", () => {
    render(
      <AgentShell
        {...({
          Default: AgentShell,
        } as React.ComponentProps<typeof AgentShell> & { Default: typeof AgentShell })}
      >
        Body
      </AgentShell>,
    );

    expect(screen.getByTestId("agent-chat")).not.toHaveAttribute("Default");
  });

  it("renders preset transcript items through the components map", () => {
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-components";
    initialState.threads["thread-components"] = {
      orderedTurnIds: ["turn-components"],
      status: "complete",
      thread: { id: "thread-components", name: "Components" },
      turns: {
        "turn-components": {
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["item-components"],
          items: {
            "item-components": {
              id: "item-components",
              kind: "agentMessage",
              status: "completed",
              text: "Default transcript text",
              threadId: "thread-components",
              turnId: "turn-components",
            },
          },
          streamingTextByItemId: {},
          turn: {
            id: "turn-components",
            status: "completed",
            threadId: "thread-components",
          },
        },
      },
    };
    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat
          components={{
            blocks: {
              text: ({ block }) => (
              <article>
                  Custom block {block.id}: {block.text}
              </article>
              ),
            },
          }}
        />
      </AgentProvider>,
    );

    expect(
      screen.getByText("Custom block item-components: Default transcript text"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Default transcript text")).not.toBeInTheDocument();
  });

  it("lets sidebar replacements delegate history control to Default", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/");
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          const searchTerm = (request.params as { searchTerm?: string } | undefined)
            ?.searchTerm;
          if (searchTerm === "wrapped history") {
            return {
              data: [
                {
                  id: "thread-sidebar-wrapper",
                  name: "Wrapped sidebar thread",
                  status: { type: "notLoaded" },
                },
              ],
              nextCursor: null,
            };
          }
          return { data: [], nextCursor: null };
        }
        if (request.method === "thread/read") {
          return {
            thread: {
              id: "thread-sidebar-canonical",
              name: "Canonical wrapped sidebar thread",
              status: { type: "idle" },
              turns: [
                {
                  id: "turn-sidebar-canonical",
                  items: [
                    {
                      id: "item-sidebar-canonical",
                      text: "Hydrated wrapped sidebar transcript",
                      type: "agent_message",
                    },
                  ],
                },
              ],
            },
          };
        }
        if (request.method === "thread/resume") {
          return {
            thread: {
              id: "thread-rich-history",
              name: "Rich stored session",
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
        <AgentChat
          components={{
            Sidebar: ({ Default, ...props }) => (
              <div aria-label="Host sidebar wrapper">
                <Default {...props} />
              </div>
            ),
          }}
          threadUrlRouting
        />
      </AgentProvider>,
    );

    expect(screen.getByLabelText("Host sidebar wrapper")).toBeInTheDocument();
    const search = await screen.findByLabelText("Search history");
    await user.clear(search);
    await user.type(search, "wrapped history{Enter}");
    expect(
      await screen.findByRole("button", { name: /Wrapped sidebar thread/ }),
    ).toBeInTheDocument();
    const searchRequest = transport.requests.find(
      (request) =>
        request.method === "thread/list" &&
        (request.params as { searchTerm?: string }).searchTerm === "wrapped history",
    );
    expect(searchRequest?.params).toMatchObject({
      limit: 25,
      searchTerm: "wrapped history",
    });
    await user.click(screen.getByRole("button", { name: /Wrapped sidebar thread/ }));
    expect(
      await screen.findByText("Hydrated wrapped sidebar transcript"),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(window.location.pathname).toBe("/threads/thread-sidebar-canonical"),
    );
    expect(
      transport.requests.find((request) => request.method === "thread/read")?.params,
    ).toEqual({
      includeTurns: true,
      threadId: "thread-sidebar-wrapper",
    });
    await user.click(screen.getByRole("button", { name: "Collapse history" }));
    expect(screen.queryByLabelText("Search history")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Expand history" }));
    expect(screen.getByLabelText("Search history")).toBeInTheDocument();
  });

  it("lets composer panel replacements delegate submit semantics to Default", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-composer-wrapper";
    initialState.threads["thread-composer-wrapper"] = {
      orderedTurnIds: [],
      status: "loaded",
      thread: { id: "thread-composer-wrapper", name: "Composer wrapper" },
      turns: {},
    };
    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentChat
          components={{
            ComposerPanel: ({ Default, ...props }) => (
              <section aria-label="Host composer wrapper">
                <Default {...props} />
              </section>
            ),
          }}
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    const message = screen.getByRole("textbox", { name: "Message" });
    await user.type(message, "line one");
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    await user.type(message, "line two");
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "turn/start",
    );
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(
        transport.requests.find((request) => request.method === "turn/start"),
      ).toMatchObject({
        params: {
          input: [{ text: "line one\nline two", type: "text" }],
          threadId: "thread-composer-wrapper",
        },
      }),
    );
  });

  it("lets AgentChat replace status and thread header surfaces with Default fallbacks", () => {
    const initialState = idleComposerState();
    initialState.threadLifecycle.activeThreadId = "thread-idle";
    initialState.threads["thread-idle"].thread.name = "Composable header";
    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat
          components={{
            StatusBar: ({ Default, ...props }) => (
              <div aria-label="Host status wrapper">
                <Default {...props} />
                <button type="button">Host status action</button>
              </div>
            ),
            ThreadHeader: ({ Default, ...props }) => (
              <section aria-label="Host thread header">
                <Default {...props} />
              </section>
            ),
          }}
          sidebar={false}
          threadHeaderEnd={({ thread }) => (
            <button type="button">Host thread action {thread.id}</button>
          )}
          usage={false}
        />
      </AgentProvider>,
    );

    expect(screen.getByLabelText("Host status wrapper")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Host status action" })).toBeInTheDocument();
    expect(screen.getByLabelText("Host thread header")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Host thread action thread-idle" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Composable header" })).toBeInTheDocument();
  });

  it("applies fixed AgentChat start options through the first-message lifecycle", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return { account: { email: "user@example.com", planType: "pro" } };
        }
        if (request.method === "thread/start") {
          return {
            thread: {
              id: "thread-fixed-start",
              name: "Fixed start",
              status: { type: "idle" },
            },
          };
        }
        if (request.method === "turn/start") return {};
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat
          startOptions={{
            threadOptions: {
              cwd: "/workspace/fixed-project",
              sandbox: "workspace-write",
              threadSource: "user",
            },
            turnOptions: {
              effort: "high",
              model: "fixed-turn-model",
              serviceTier: "flex",
            },
          }}
        />
      </AgentProvider>,
    );

    expect(
      await screen.findByRole("status", {
        name: "Working directory: /workspace/fixed-project",
      }),
    ).toHaveTextContent("fixed-project");
    expect(screen.queryByRole("button", { name: "Working directory" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open folder" })).not.toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Message" }), "fixed start");
    await user.click(screen.getByRole("button", { name: "Start thread" }));

    await waitFor(() =>
      expect(
        transport.requests.find((request) => request.method === "turn/start")
          ?.params,
      ).toMatchObject({
        effort: "high",
        input: [{ text: "fixed start", text_elements: [], type: "text" }],
        model: "fixed-turn-model",
        serviceTier: "flex",
        threadId: "thread-fixed-start",
      }),
    );
    expect(
      transport.requests.find((request) => request.method === "thread/start")?.params,
    ).toMatchObject({
      cwd: "/workspace/fixed-project",
      sandbox: "workspace-write",
      threadSource: "user",
    });
  });

  it("supports controlled mobile drawer and context sheet state", async () => {
    const user = userEvent.setup();
    mockCompactLayout(true);

    function ControlledOverlayHarness() {
      const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
      const [contextSheetOpen, setContextSheetOpen] = useState(false);
      return (
        <>
          <AgentChat
            controls={{
              contextSheetOpen,
              onContextSheetOpenChange: setContextSheetOpen,
              onSidebarCollapsedChange: setSidebarCollapsed,
              sidebarCollapsed,
            }}
            usage
          />
          <output aria-label="controlled sidebar collapsed">
            {String(sidebarCollapsed)}
          </output>
          <output aria-label="controlled context sheet open">
            {String(contextSheetOpen)}
          </output>
        </>
      );
    }

    render(
      <AgentProvider initialState={idleComposerState()} transport={new FakeAgentTransport()}>
        <ControlledOverlayHarness />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open thread history" }));
    expect(screen.getByLabelText("controlled sidebar collapsed")).toHaveTextContent(
      "false",
    );
    expect(screen.getByRole("button", { name: "Dismiss thread history" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.getByLabelText("controlled sidebar collapsed")).toHaveTextContent(
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Agent context" }));
    expect(screen.getByLabelText("controlled context sheet open")).toHaveTextContent(
      "true",
    );
    expect(screen.getAllByRole("button", { name: "Agent context" })).not.toHaveLength(0);
    await user.keyboard("{Escape}");
    expect(screen.getByLabelText("controlled context sheet open")).toHaveTextContent(
      "false",
    );
  });

  it("keeps controlled mobile overlays mutually exclusive", async () => {
    mockCompactLayout(true);

    function BothOpenOverlayHarness() {
      return (
        <AgentChat
          controls={{
            contextSheetOpen: true,
            sidebarCollapsed: false,
          }}
          usage
        />
      );
    }

    render(
      <AgentProvider initialState={idleComposerState()} transport={new FakeAgentTransport()}>
        <BothOpenOverlayHarness />
      </AgentProvider>,
    );

    expect(screen.getByRole("button", { name: "Dismiss thread history" })).toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "Agent context" })).not.toBeInTheDocument();
  });

  it("does not refocus controlled overlays on unrelated host rerenders", async () => {
    const user = userEvent.setup();
    mockCompactLayout(true);
    let forceHostRerender = () => {};

    function ControlledOverlayRerenderHarness() {
      const [rerenders, setRerenders] = useState(0);
      const [contextSheetOpen, setContextSheetOpen] = useState(false);
      useEffect(() => {
        forceHostRerender = () => setRerenders((current) => current + 1);
        return () => {
          forceHostRerender = () => {};
        };
      }, []);
      return (
        <>
          <AgentChat
            controls={{
              contextSheetOpen,
              onContextSheetOpenChange: setContextSheetOpen,
            }}
            statusBarEnd={<span data-testid="rerender-count">{rerenders}</span>}
            usage
          />
          <button type="button">External focus target</button>
        </>
      );
    }

    render(
      <AgentProvider initialState={idleComposerState()} transport={new FakeAgentTransport()}>
        <ControlledOverlayRerenderHarness />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Agent context" }));
    await waitFor(() =>
      expect(screen.getByRole("complementary", { name: "Agent context" })).toHaveFocus(),
    );
    screen.getByRole("button", { name: "External focus target" }).focus();
    expect(screen.getByRole("button", { name: "External focus target" })).toHaveFocus();
    act(() => forceHostRerender());
    expect(screen.getByRole("button", { name: "External focus target" })).toHaveFocus();
    expect(screen.getByTestId("rerender-count")).toHaveTextContent("1");
  });

  it("offers an external theme toggle primitive", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AgentThemeToggle value="system" onChange={onChange} />);

    expect(screen.getByRole("radio", { name: "System" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await user.click(screen.getByRole("radio", { name: "Dark" }));
    expect(onChange).toHaveBeenCalledWith("dark");
    await user.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith("dark");
  });

  it("localizes AgentChat chrome through the locale prop", async () => {
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return { account: { email: "user@example.com", planType: "pro" } };
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat locale="ja" />
      </AgentProvider>,
    );

    expect(await screen.findByRole("button", { name: "スレッドを開始" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "メッセージ" })).toHaveAttribute(
      "placeholder",
      "Codex に作業内容を依頼",
    );
  });

  it("lets hosts override localized message dictionaries", async () => {
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return { account: { email: "user@example.com", planType: "pro" } };
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat
          messages={{
            "aria.message": "Prompt",
            "firstRun.placeholder": "Describe the work",
            "firstRun.startThread": "Launch",
          }}
        />
      </AgentProvider>,
    );

    expect(await screen.findByRole("button", { name: "Launch" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Prompt" })).toHaveAttribute(
      "placeholder",
      "Describe the work",
    );
  });

  it("offers a controlled locale selector primitive", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AgentLocaleSelect value="en" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /Language:/ }));
    await user.click(screen.getByRole("menuitemradio", { name: "French" }));
    expect(onChange).toHaveBeenCalledWith("fr");
  });

  it("renders only a fixed thread without following active selection", () => {
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-active";
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

    expect(
      screen.getByRole("heading", { name: "Fixed worker thread" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByText("Only this thread should render.")).toBeInTheDocument();
    expect(screen.queryByText("Active global thread")).not.toBeInTheDocument();
  });

  it("renders large stored transcripts incrementally while preserving order", async () => {
    const user = userEvent.setup();
    const initialState = createInitialAgentState();
    const itemOrder = Array.from({ length: 80 }, (_, index) => `cmd-${index + 1}`);
    initialState.threads["thread-large"] = {
      orderedTurnIds: ["turn-large"],
      status: "loaded",
      thread: { id: "thread-large", name: "Large transcript" },
      turns: {
        "turn-large": {
          commandOutputByItemId: Object.fromEntries(
            itemOrder.map((id, index) => [id, `output ${index + 1}\n`.repeat(4)]),
          ),
          filePatchByItemId: {},
          itemOrder,
          items: Object.fromEntries(
            itemOrder.map((id, index) => [
              id,
              {
                id,
                kind: "commandExecution",
                metadata: { command: `echo ${index + 1}` },
                status: "completed",
                text: `echo ${index + 1}`,
                threadId: "thread-large",
                turnId: "turn-large",
              },
            ]),
          ),
          streamingTextByItemId: {},
          turn: { id: "turn-large", threadId: "thread-large" },
        },
      },
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentMessageList threadId="thread-large" />
      </AgentProvider>,
    );

    expect(screen.getAllByLabelText("Command output")).toHaveLength(48);
    expect(screen.getByText("32 earlier items hidden")).toBeInTheDocument();
    expect(screen.queryByText("echo 1")).not.toBeInTheDocument();
    expect(screen.getByText("echo 33")).toBeInTheDocument();
    expect(screen.getByText("echo 80")).toBeInTheDocument();
    expect(screen.queryByText(/output 80\noutput 80/)).not.toBeInTheDocument();

    await user.click(screen.getByText("Show earlier items"));
    expect(screen.getAllByLabelText("Command output")).toHaveLength(80);
    expect(screen.getByText("echo 1")).toBeInTheDocument();
    expect(screen.getByText("echo 80")).toBeInTheDocument();
  });

  it("exposes transcript entries without internal optimistic operation objects", () => {
    const initialState = createInitialAgentState();
    initialState.threads["thread-transcript-entries"] = {
      orderedTurnIds: ["turn-transcript-entries"],
      status: "waitingForInput",
      thread: { id: "thread-transcript-entries", name: "Transcript entries" },
      turns: {
        "turn-transcript-entries": {
          blocksByItemId: {
            "cmd-1": {
              command: "bun test",
              id: "cmd-1",
              kind: "commandExecution",
              metadata: { command: "bun test" },
            },
          },
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["user-pending", "cmd-1", "assistant-1"],
          items: {
            "assistant-1": {
              id: "assistant-1",
              kind: "agentMessage",
              status: "completed",
              text: "Done.",
              threadId: "thread-transcript-entries",
              turnId: "turn-transcript-entries",
            },
            "cmd-1": {
              id: "cmd-1",
              kind: "commandExecution",
              metadata: { command: "bun test" },
              status: "completed",
              threadId: "thread-transcript-entries",
              turnId: "turn-transcript-entries",
            },
            "user-pending": {
              id: "user-pending",
              kind: "userMessage",
              status: "failed",
              text: "Please run tests.",
              threadId: "thread-transcript-entries",
              turnId: "turn-transcript-entries",
            },
          },
          streamingTextByItemId: {},
          turn: {
            id: "turn-transcript-entries",
            threadId: "thread-transcript-entries",
          },
        },
      },
    };
    initialState.threadLifecycle.operations["operation-internal"] = {
      id: "operation-internal",
      kind: "firstMessage",
      status: "failed",
      threadId: "thread-transcript-entries",
    };
    function TranscriptEntriesProbe() {
      const controller = useAgentTranscriptController("thread-transcript-entries", {
        approvalAnchors: {
          renderApprovalAnchor: () => null,
          requests: [
            approvalView({
              command: "bun test",
              id: "approval-command",
              itemId: "cmd-1",
              kind: "commandApproval",
              risk: "medium",
              threadId: "thread-transcript-entries",
              turnId: "turn-transcript-entries",
            }),
          ],
        },
      });
      return (
        <output aria-label="transcript entries">
          {JSON.stringify(
            controller.entries.map((entry) => ({
              approvals: entry.approvals.map((approval) => approval.id),
              blockKind: entry.block.kind,
              blockRaw: "raw" in entry.block,
              density: entry.density,
              displayStatus: entry.displayStatus,
              hasOperations: "operations" in entry,
              id: entry.itemId,
              itemRaw: entry.item ? "raw" in entry.item : false,
              pending: entry.pending?.status,
              role: entry.role,
              status: entry.status,
            })),
          )}
        </output>
      );
    }

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <TranscriptEntriesProbe />
      </AgentProvider>,
    );

    const entries = JSON.parse(
      screen.getByLabelText("transcript entries").textContent ?? "[]",
    );
    expect(entries).toEqual([
      {
        approvals: [],
        blockKind: "text",
        blockRaw: false,
        density: "default",
        displayStatus: "failed",
        hasOperations: false,
        id: "user-pending",
        itemRaw: false,
        pending: "failed",
        role: "user",
        status: "failed",
      },
      {
        approvals: ["approval-command"],
        blockKind: "commandExecution",
        blockRaw: false,
        density: "default",
        displayStatus: "completed",
        hasOperations: false,
        id: "cmd-1",
        itemRaw: false,
        role: "command",
        status: "completed",
      },
      {
        approvals: [],
        blockKind: "text",
        blockRaw: false,
        density: "default",
        displayStatus: "completed",
        hasOperations: false,
        id: "assistant-1",
        itemRaw: false,
        role: "assistant",
        status: "completed",
      },
    ]);
  });

  it("applies transcript density defaults, critical-only filtering, and per-block overrides", () => {
    const initialState = createInitialAgentState();
    initialState.threads["thread-density"] = {
      orderedTurnIds: ["turn-density"],
      status: "loaded",
      thread: { id: "thread-density", name: "Transcript density" },
      turns: {
        "turn-density": {
          blocksByItemId: {
            "cmd-1": {
              command: "bun test",
              id: "cmd-1",
              kind: "commandExecution",
            },
          },
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["user-failed", "cmd-1", "assistant-1"],
          items: {
            "assistant-1": {
              id: "assistant-1",
              kind: "agentMessage",
              status: "completed",
              text: "All done.",
              threadId: "thread-density",
              turnId: "turn-density",
            },
            "cmd-1": {
              id: "cmd-1",
              kind: "commandExecution",
              status: "completed",
              threadId: "thread-density",
              turnId: "turn-density",
            },
            "user-failed": {
              id: "user-failed",
              kind: "userMessage",
              status: "failed",
              text: "Run checks.",
              threadId: "thread-density",
              turnId: "turn-density",
            },
          },
          streamingTextByItemId: {},
          turn: { id: "turn-density", threadId: "thread-density" },
        },
      },
    };

    function DensityProbe() {
      const controller = useAgentTranscriptController("thread-density", {
        approvalAnchors: {
          renderApprovalAnchor: () => null,
          requests: [
            approvalView({
              command: "bun test",
              id: "approval-command",
              itemId: "cmd-1",
              kind: "commandApproval",
              risk: "medium",
              threadId: "thread-density",
              turnId: "turn-density",
            }),
          ],
        },
        density: {
          default: "compact",
          byBlockKind: {
            commandExecution: "verbose",
            text: "critical-only",
          },
        },
      });
      return (
        <output aria-label="density entries">
          {JSON.stringify({
            density: controller.density,
            entries: controller.entries.map((entry) => ({
              approvals: entry.approvals.map((approval) => approval.id),
              density: entry.density,
              id: entry.itemId,
            })),
          })}
        </output>
      );
    }

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <DensityProbe />
      </AgentProvider>,
    );

    const output = JSON.parse(
      screen.getByLabelText("density entries").textContent ?? "{}",
    );
    expect(output).toEqual({
      density: "compact",
      entries: [
        { approvals: [], density: "critical-only", id: "user-failed" },
        { approvals: ["approval-command"], density: "verbose", id: "cmd-1" },
      ],
    });
  });

  it("renders transcript density attributes for the default message list", () => {
    const initialState = createInitialAgentState();
    initialState.threads["thread-density-dom"] = {
      orderedTurnIds: ["turn-density-dom"],
      status: "loaded",
      thread: { id: "thread-density-dom", name: "Transcript density DOM" },
      turns: {
        "turn-density-dom": {
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["user-1"],
          items: {
            "user-1": {
              id: "user-1",
              kind: "userMessage",
              status: "completed",
              text: "Use compact density.",
              threadId: "thread-density-dom",
              turnId: "turn-density-dom",
            },
          },
          streamingTextByItemId: {},
          turn: { id: "turn-density-dom", threadId: "thread-density-dom" },
        },
      },
    };

    const { container } = render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentMessageList
          density="compact"
          threadId="thread-density-dom"
        />
      </AgentProvider>,
    );

    expect(container.querySelector(".aui-message-list")).toHaveAttribute(
      "data-density",
      "compact",
    );
    expect(container.querySelector(".aui-message")).toHaveAttribute(
      "data-density",
      "compact",
    );
  });

  it("keeps turn-level approval anchors visible in critical-only transcript density", () => {
    const initialState = createInitialAgentState();
    initialState.threads["thread-critical-approval"] = {
      orderedTurnIds: ["turn-critical-approval"],
      status: "waitingForInput",
      thread: { id: "thread-critical-approval", name: "Critical approval" },
      turns: {
        "turn-critical-approval": {
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["user-1", "assistant-1"],
          items: {
            "assistant-1": {
              id: "assistant-1",
              kind: "agentMessage",
              status: "completed",
              text: "Waiting for approval.",
              threadId: "thread-critical-approval",
              turnId: "turn-critical-approval",
            },
            "user-1": {
              id: "user-1",
              kind: "userMessage",
              status: "completed",
              text: "Run the next step.",
              threadId: "thread-critical-approval",
              turnId: "turn-critical-approval",
            },
          },
          streamingTextByItemId: {},
          turn: { id: "turn-critical-approval", threadId: "thread-critical-approval" },
        },
      },
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentMessageList
          approvalAnchors={{
            renderApprovalAnchor: (approval) => (
              <button type="button">{String(approval.id)}</button>
            ),
            requests: [
              {
                id: "approval-turn-only",
                kind: "userInput",
                payload: { prompt: "Continue?" },
                threadId: "thread-critical-approval",
                turnId: "turn-critical-approval",
              },
            ],
          }}
          density="critical-only"
          threadId="thread-critical-approval"
        />
      </AgentProvider>,
    );

    expect(screen.getByText("approval-turn-only")).toBeInTheDocument();
    expect(
      screen.getByText("approval-turn-only").closest(".aui-transcript-approval-anchor"),
    ).toBeTruthy();
    expect(screen.getByText("Waiting for approval.")).toBeInTheDocument();
    expect(screen.queryByText("Run the next step.")).toBeNull();
  });

  it("renders command execution blocks with a closed summary and lazy output body", async () => {
    const user = userEvent.setup();
    const initialState = createInitialAgentState();
    initialState.threads["thread-command-block"] = {
      orderedTurnIds: ["turn-command-block"],
      status: "loaded",
      thread: { id: "thread-command-block", name: "Command block" },
      turns: {
        "turn-command-block": {
          blocksByItemId: {
            "cmd-1": {
              command: "bun test packages/react",
              durationMs: 1250,
              exitCode: 0,
              id: "cmd-1",
              kind: "commandExecution",
              status: "completed",
            },
          },
          commandOutputByItemId: {
            "cmd-1": "first passing line\nsecond passing line\n",
          },
          filePatchByItemId: {},
          itemOrder: ["cmd-1"],
          items: {
            "cmd-1": {
              id: "cmd-1",
              kind: "commandExecution",
              metadata: { command: "bun test packages/react" },
              status: "completed",
              threadId: "thread-command-block",
              turnId: "turn-command-block",
            },
          },
          streamingTextByItemId: {},
          turn: { id: "turn-command-block", threadId: "thread-command-block" },
        },
      },
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentMessageList threadId="thread-command-block" />
      </AgentProvider>,
    );

    const command = screen.getByLabelText("Command output");
    expect(command).toHaveTextContent("bun test packages/react");
    expect(command).toHaveTextContent("completed · exit 0 · 1.3s · 2 lines");
    expect(command).toHaveTextContent("first passing line");
    expect(screen.queryByText("second passing line")).not.toBeInTheDocument();

    await user.click(within(command).getByText("bun test packages/react"));
    expect(screen.getByText(/second passing line/)).toBeInTheDocument();
  });

  it("renders file change blocks with a closed summary and lazy diff body", async () => {
    const user = userEvent.setup();
    const initialState = createInitialAgentState();
    const change = {
      diff: "diff --git a/src/app.ts b/src/app.ts\n@@\n-old value\n+new value\n",
      kind: "update",
      path: "src/app.ts",
    };
    initialState.threads["thread-file-block"] = {
      orderedTurnIds: ["turn-file-block"],
      status: "loaded",
      thread: { id: "thread-file-block", name: "File block" },
      turns: {
        "turn-file-block": {
          blocksByItemId: {
            "file-1": {
              changes: [change],
              id: "file-1",
              kind: "fileChange",
              status: "completed",
            },
          },
          commandOutputByItemId: {},
          filePatchByItemId: {
            "file-1": { changes: [change] },
          },
          itemOrder: ["file-1"],
          items: {
            "file-1": {
              id: "file-1",
              kind: "fileChange",
              metadata: { changes: [change] },
              status: "completed",
              threadId: "thread-file-block",
              turnId: "turn-file-block",
            },
          },
          streamingTextByItemId: {},
          turn: { id: "turn-file-block", threadId: "thread-file-block" },
        },
      },
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentMessageList threadId="thread-file-block" />
      </AgentProvider>,
    );

    const diff = screen.getByLabelText("Diff preview");
    expect(diff).toHaveTextContent("1 file changed");
    expect(diff).toHaveTextContent("completed");
    expect(screen.queryByText("src/app.ts")).not.toBeInTheDocument();
    expect(screen.queryByText(/new value/)).not.toBeInTheDocument();

    await user.click(within(diff).getByText("1 file changed"));
    expect(screen.getAllByText("src/app.ts").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("CodeMirror patch viewer")).toBeInTheDocument();
    expect(screen.getAllByText(/new value/).length).toBeGreaterThan(0);
  });

  it("keeps execution context visible when a stored turn ends with file changes", async () => {
    const user = userEvent.setup();
    const initialState = createInitialAgentState();
    const fillerItems = Array.from({ length: 78 }, (_, index) => `message-${index + 1}`);
    const itemOrder = ["tool-node-repl", ...fillerItems, "file-change"];
    initialState.threads["thread-context"] = {
      orderedTurnIds: ["turn-context"],
      status: "loaded",
      thread: { id: "thread-context", name: "Stored tool context" },
      turns: {
        "turn-context": {
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder,
          items: {
            "tool-node-repl": {
              id: "tool-node-repl",
              kind: "mcpToolCall",
              metadata: {
                arguments: { title: "Inspect Agent UI DOM" },
                result: {
                  content: [
                    { text: "DOM audit found no horizontal overflow.", type: "text" },
                  ],
                  structuredContent: null,
                },
                server: "node_repl",
                status: "completed",
                tool: "js",
              },
              status: "completed",
              threadId: "thread-context",
              turnId: "turn-context",
            },
            ...Object.fromEntries(
              fillerItems.map((id, index) => [
                id,
                {
                  id,
                  kind: "agentMessage",
                  status: "completed",
                  text: `filler ${index + 1}`,
                  threadId: "thread-context",
                  turnId: "turn-context",
                },
              ]),
            ),
            "file-change": {
              id: "file-change",
              kind: "fileChange",
              metadata: {
                changes: [{ kind: "update", path: "packages/react/src/timeline.tsx" }],
              },
              status: "completed",
              threadId: "thread-context",
              turnId: "turn-context",
            },
          },
          streamingTextByItemId: {},
          turn: { id: "turn-context", threadId: "thread-context" },
        },
      },
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentMessageList threadId="thread-context" />
      </AgentProvider>,
    );

    expect(screen.getByText("32 earlier items hidden")).toBeInTheDocument();
    expect(screen.getByLabelText("MCP tool")).toHaveTextContent("node_repl / js");
    expect(screen.getByLabelText("MCP tool")).toHaveTextContent("DOM audit found");
    expect(screen.getByLabelText("Diff preview")).toHaveTextContent("1 file changed");
    expect(screen.queryByText("Inspect Agent UI DOM")).not.toBeInTheDocument();

    await user.click(screen.getByText("node_repl / js"));
    expect(screen.getByText(/Inspect Agent UI DOM/)).toBeInTheDocument();
  });

  it("keeps user and assistant messages expanded without disclosure chrome", () => {
    const initialState = createInitialAgentState();
    initialState.threads["thread-chat"] = {
      orderedTurnIds: ["turn-chat"],
      status: "complete",
      thread: { id: "thread-chat", name: "Plain chat" },
      turns: {
        "turn-chat": {
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["user-1", "assistant-1"],
          items: {
            "assistant-1": {
              id: "assistant-1",
              kind: "agentMessage",
              status: "completed",
              text: "The transcript remains readable without clicking.",
              threadId: "thread-chat",
              turnId: "turn-chat",
            },
            "user-1": {
              id: "user-1",
              kind: "userMessage",
              status: "completed",
              text: "Please summarize the refactor.",
              threadId: "thread-chat",
              turnId: "turn-chat",
            },
          },
          streamingTextByItemId: {},
          turn: { id: "turn-chat", threadId: "thread-chat" },
        },
      },
    };

    const { container } = render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentMessageList threadId="thread-chat" />
      </AgentProvider>,
    );

    expect(screen.getByText("Please summarize the refactor.")).toBeInTheDocument();
    expect(
      screen.getByText("The transcript remains readable without clicking."),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("details")).toHaveLength(0);
  });

  it("anchors approvals after source item metadata and falls back to transcript tail without metadata", () => {
    const initialState = createInitialAgentState();
    initialState.threads["thread-anchor"] = {
      id: "thread-anchor",
      orderedTurnIds: ["turn-anchor"],
      status: "waitingForInput",
      thread: { id: "thread-anchor", name: "Anchored approvals" },
      turns: {
        "turn-anchor": {
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["item-command", "item-after"],
          items: {
            "item-after": {
              id: "item-after",
              kind: "agentMessage",
              status: "completed",
              text: "Assistant text after command.",
              threadId: "thread-anchor",
              turnId: "turn-anchor",
            },
            "item-command": {
              id: "item-command",
              kind: "commandExecution",
              metadata: { command: "bun test" },
              status: "completed",
              threadId: "thread-anchor",
              turnId: "turn-anchor",
            },
          },
          streamingTextByItemId: {},
          turn: { id: "turn-anchor", threadId: "thread-anchor" },
        },
      },
    };
    initialState.serverRequestQueue = {
      byId: {
        "string:approval-anchored": {
          id: "approval-anchored",
          itemId: "item-command",
          kind: "commandApproval",
          payload: { command: "bun test" },
          threadId: "thread-anchor",
        },
        "string:approval-tail": {
          id: "approval-tail",
          kind: "commandApproval",
          payload: { command: "bun lint", reason: "Tail fallback" },
          threadId: "thread-anchor",
        },
      },
      order: ["string:approval-anchored", "string:approval-tail"],
    };

    const { container } = render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentThreadView
          components={{
            Approval: ({ approval, Default }) => (
              <section>
                Custom approval {String(approval.id)}
                <Default approval={approval} />
              </section>
            ),
          }}
          threadId="thread-anchor"
        />
      </AgentProvider>,
    );

    const command = container.querySelector('[data-kind="commandExecution"]');
    const anchored = screen
      .getByText("Custom approval approval-anchored")
      .closest(".aui-transcript-approval-anchor");
    expect(command?.nextElementSibling).toBe(anchored);
    expect(
      within(anchored as HTMLElement).getByRole("button", {
        name: "Approve command request approval-anchored",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tail fallback")).toBeInTheDocument();
    expect(screen.getByText("Custom approval approval-tail")).toBeInTheDocument();
    expect(
      container.querySelector(".aui-transcript-tail .aui-approval"),
    ).toHaveTextContent("Tail fallback");
    expect(container.querySelector(".aui-transcript-tail")).toHaveTextContent(
      "Custom approval approval-tail",
    );
  });

  it("anchors item-only approvals and falls back when the item is missing", () => {
    const initialState = createInitialAgentState();
    initialState.threads["thread-item-only"] = {
      id: "thread-item-only",
      orderedTurnIds: ["turn-item-only"],
      status: "waitingForInput",
      thread: { id: "thread-item-only", name: "Item-only approvals" },
      turns: {
        "turn-item-only": {
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["item-command"],
          items: {
            "item-command": {
              id: "item-command",
              kind: "commandExecution",
              metadata: { command: "bun test" },
              status: "completed",
              threadId: "thread-item-only",
              turnId: "turn-item-only",
            },
          },
          streamingTextByItemId: {},
          turn: { id: "turn-item-only", threadId: "thread-item-only" },
        },
      },
    };
    initialState.serverRequestQueue = {
      byId: {
        "string:approval-item-only": {
          id: "approval-item-only",
          itemId: "item-command",
          kind: "commandApproval",
          payload: { command: "bun test" },
          threadId: "thread-item-only",
        },
        "string:approval-unmatched": {
          id: "approval-unmatched",
          itemId: "missing-item",
          kind: "commandApproval",
          payload: { command: "bun lint" },
          threadId: "thread-item-only",
        },
      },
      order: ["string:approval-item-only", "string:approval-unmatched"],
    };

    const { container } = render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentThreadView
          renderApproval={(approval) => <span>{String(approval.id)}</span>}
          threadId="thread-item-only"
        />
      </AgentProvider>,
    );

    const command = container.querySelector('[data-kind="commandExecution"]');
    const anchored = command?.nextElementSibling;
    expect(anchored).toHaveClass("aui-transcript-approval-anchor");
    expect(anchored).toHaveTextContent("approval-item-only");
    expect(container.querySelector(".aui-transcript-tail")).toHaveTextContent(
      "approval-unmatched",
    );
    expect(container.querySelector(".aui-transcript-tail")).not.toHaveTextContent(
      "approval-item-only",
    );
  });

  it("anchors turn-only approvals after the turn source context", () => {
    const initialState = createInitialAgentState();
    initialState.threads["thread-turn-only"] = {
      id: "thread-turn-only",
      orderedTurnIds: ["turn-turn-only"],
      status: "waitingForInput",
      thread: { id: "thread-turn-only", name: "Turn-only approvals" },
      turns: {
        "turn-turn-only": {
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["item-message"],
          items: {
            "item-message": {
              id: "item-message",
              kind: "agentMessage",
              status: "completed",
              text: "Turn source context",
              threadId: "thread-turn-only",
              turnId: "turn-turn-only",
            },
          },
          streamingTextByItemId: {},
          turn: { id: "turn-turn-only", threadId: "thread-turn-only" },
        },
      },
    };
    initialState.serverRequestQueue = {
      byId: {
        "string:approval-turn-only": {
          id: "approval-turn-only",
          kind: "commandApproval",
          payload: { command: "bun test" },
          threadId: "thread-turn-only",
          turnId: "turn-turn-only",
        },
      },
      order: ["string:approval-turn-only"],
    };

    const { container } = render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentThreadView
          renderApproval={(approval) => <span>{String(approval.id)}</span>}
          threadId="thread-turn-only"
        />
      </AgentProvider>,
    );

    const source = screen.getByText("Turn source context").closest(".aui-message");
    const anchored = source?.nextElementSibling;
    expect(anchored).toHaveClass("aui-transcript-approval-anchor");
    expect(anchored).toHaveTextContent("approval-turn-only");
    expect(container.querySelector(".aui-transcript-tail")).toBeNull();
  });

  it("pins an approval source item that is outside the initial window", () => {
    const initialState = createInitialAgentState();
    const itemOrder = Array.from({ length: 52 }, (_, index) => `item-${index}`);
    initialState.threads["thread-windowed-approval"] = {
      id: "thread-windowed-approval",
      orderedTurnIds: ["turn-windowed-approval"],
      status: "waitingForInput",
      thread: { id: "thread-windowed-approval", name: "Windowed approval" },
      turns: {
        "turn-windowed-approval": {
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder,
          items: Object.fromEntries(
            itemOrder.map((itemId, index) => [
              itemId,
              {
                id: itemId,
                kind: "agentMessage",
                status: "completed",
                text: `Message ${index}`,
                threadId: "thread-windowed-approval",
                turnId: "turn-windowed-approval",
              },
            ]),
          ),
          streamingTextByItemId: {},
          turn: {
            id: "turn-windowed-approval",
            threadId: "thread-windowed-approval",
          },
        },
      },
    };
    initialState.serverRequestQueue = {
      byId: {
        "string:approval-hidden-source": {
          id: "approval-hidden-source",
          itemId: "item-0",
          kind: "commandApproval",
          payload: { command: "bun test" },
          threadId: "thread-windowed-approval",
          turnId: "turn-windowed-approval",
        },
      },
      order: ["string:approval-hidden-source"],
    };

    const { container } = render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentThreadView
          renderApproval={(approval) => <span>{String(approval.id)}</span>}
          threadId="thread-windowed-approval"
        />
      </AgentProvider>,
    );

    const source = screen.getByText("Message 0").closest(".aui-message");
    expect(screen.getByText("Message 51")).toBeInTheDocument();
    const anchored = source?.nextElementSibling;
    expect(anchored).toHaveClass("aui-transcript-approval-anchor");
    expect(anchored).toHaveTextContent("approval-hidden-source");
    expect(container.querySelector(".aui-transcript-tail")).toBeNull();
  });

  it("offers a distinct jump affordance when a pinned approval is outside the viewport", async () => {
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    const scrollIntoView = vi.fn();
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function () {
        if (this.classList.contains("aui-message-list")) {
          return {
            bottom: 320,
            height: 320,
            left: 0,
            right: 480,
            top: 0,
            width: 480,
            x: 0,
            y: 0,
          } as DOMRect;
        }
        if (this.classList.contains("aui-transcript-approval-anchor")) {
          return {
            bottom: -520,
            height: 140,
            left: 0,
            right: 480,
            top: -660,
            width: 480,
            x: 0,
            y: -660,
          } as DOMRect;
        }
        return originalRect.call(this);
      },
    );
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    const initialState = createInitialAgentState();
    const itemOrder = Array.from({ length: 54 }, (_, index) => `item-${index}`);
    initialState.threads["thread-hidden-approval-jump"] = {
      id: "thread-hidden-approval-jump",
      orderedTurnIds: ["turn-hidden-approval-jump"],
      status: "waitingForInput",
      thread: { id: "thread-hidden-approval-jump", name: "Hidden approval jump" },
      turns: {
        "turn-hidden-approval-jump": {
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder,
          items: Object.fromEntries(
            itemOrder.map((itemId, index) => [
              itemId,
              {
                id: itemId,
                kind: "agentMessage",
                status: "completed",
                text: `Message ${index}`,
                threadId: "thread-hidden-approval-jump",
                turnId: "turn-hidden-approval-jump",
              },
            ]),
          ),
          streamingTextByItemId: {},
          turn: {
            id: "turn-hidden-approval-jump",
            threadId: "thread-hidden-approval-jump",
          },
        },
      },
    };
    initialState.serverRequestQueue = {
      byId: {
        "string:approval-hidden-jump": {
          id: "approval-hidden-jump",
          itemId: "item-0",
          kind: "commandApproval",
          payload: { command: "bun run test:e2e:fixtures" },
          threadId: "thread-hidden-approval-jump",
          turnId: "turn-hidden-approval-jump",
        },
      },
      order: ["string:approval-hidden-jump"],
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentThreadView threadId="thread-hidden-approval-jump" />
      </AgentProvider>,
    );

    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    const jump = await screen.findByRole("button", { name: "Jump to pending approval" });
    expect(jump).toHaveClass("aui-jump-approval");

    fireEvent.click(jump);

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "smooth" });
  });

  it("resets follow-scroll affordances when the thread changes", async () => {
    function FollowScrollProbe({
      scrollKey,
      threadId,
    }: {
      scrollKey: number;
      threadId: string;
    }) {
      const { handleScroll, listRef, showJumpLatest } = useTranscriptFollowScroll({
        scrollKey,
        threadId,
        turnCount: 1,
      });
      return (
        <>
          <ol
            ref={(node) => {
              listRef.current = node;
              if (!node) return;
              let scrollTop = 0;
              Object.defineProperties(node, {
                clientHeight: { configurable: true, get: () => 100 },
                scrollHeight: { configurable: true, get: () => 1_000 },
                scrollTop: {
                  configurable: true,
                  get: () => scrollTop,
                  set: (value: number) => {
                    scrollTop = value;
                  },
                },
              });
            }}
          />
          <button
            onClick={() => {
              if (listRef.current) listRef.current.scrollTop = 0;
              handleScroll();
            }}
            type="button"
          >
            Mark scrolled
          </button>
          {showJumpLatest ? <span>Jump visible</span> : null}
        </>
      );
    }

    const { rerender } = render(<FollowScrollProbe scrollKey={0} threadId="thread-a" />);

    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    fireEvent.click(screen.getByRole("button", { name: "Mark scrolled" }));
    rerender(<FollowScrollProbe scrollKey={1} threadId="thread-a" />);
    expect(await screen.findByText("Jump visible")).toBeInTheDocument();

    rerender(<FollowScrollProbe scrollKey={2} threadId="thread-b" />);

    await waitFor(() =>
      expect(screen.queryByText("Jump visible")).not.toBeInTheDocument(),
    );
  });

  it("lets hosts own transcript scroll refs and invoke public scroll actions", async () => {
    const showEarlierItems = vi.fn();
    const scrollIntoView = vi.fn();
    const scrollToLatest = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    function TranscriptScrollControllerProbe() {
      const scrollRef = useRef<HTMLOListElement | null>(null);
      const controller = useAgentTranscriptScrollController({
        hiddenItemCount: 2,
        onShowEarlierItems: showEarlierItems,
        scrollContainerRef: scrollRef,
        threadId: "thread-scroll-controller",
        turnCount: 1,
      });
      return (
        <>
          <ol
            aria-label="Host transcript scroller"
            ref={(node) => {
              scrollRef.current = node;
              if (!node) return;
              let scrollTop = 0;
              Object.defineProperties(node, {
                clientHeight: { configurable: true, get: () => 120 },
                scrollHeight: { configurable: true, get: () => 900 },
                scrollTop: {
                  configurable: true,
                  get: () => scrollTop,
                  set: (value: number) => {
                    scrollTop = value;
                  },
                },
              });
              node.scrollTo = vi.fn(({ top }: ScrollToOptions) => {
                scrollToLatest(top);
                scrollTop = Number(top ?? scrollTop);
              });
            }}
          >
            <li
              className="aui-transcript-approval-anchor"
              ref={(node) => {
                if (!node) return;
                node.getBoundingClientRect = () =>
                  ({
                    bottom: -200,
                    height: 80,
                    left: 0,
                    right: 300,
                    top: -280,
                    width: 300,
                    x: 0,
                    y: -280,
                  }) as DOMRect;
              }}
            >
              pending approval
            </li>
          </ol>
          <button onClick={controller.handleScroll} type="button">
            Measure scroll
          </button>
          <button onClick={controller.jumpToLatest} type="button">
            Jump latest
          </button>
          <button onClick={controller.jumpToPendingApproval} type="button">
            Jump approval
          </button>
          <button onClick={controller.showEarlierItems} type="button">
            Show earlier
          </button>
          <span>
            {controller.canShowEarlierItems ? "Earlier available" : "No earlier"}
          </span>
          {controller.showJumpApproval ? <span>Approval jump visible</span> : null}
        </>
      );
    }

    render(<TranscriptScrollControllerProbe />);

    expect(screen.getByText("Earlier available")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Measure scroll" }));
    expect(await screen.findByText("Approval jump visible")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Jump latest" }));
    expect(scrollToLatest).toHaveBeenCalledWith(900);

    fireEvent.click(screen.getByRole("button", { name: "Jump approval" }));
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "smooth" });

    fireEvent.click(screen.getByRole("button", { name: "Show earlier" }));
    expect(showEarlierItems).toHaveBeenCalledTimes(1);
  });

  it("removes resolved inline approvals and resumes the waiting thread", async () => {
    const user = userEvent.setup();
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-approval-resolution";
    initialState.threadLifecycle.collections[
      initialState.threadLifecycle.defaultCollectionKey
    ]!.ids = ["thread-approval-resolution"];
    initialState.threads["thread-approval-resolution"] = {
      activity: "waitingForInput",
      availability: "available",
      id: "thread-approval-resolution",
      metadata: {},
      operations: {},
      orderedTurnIds: ["turn-approval-resolution"],
      runtime: {
        activeTurnId: "turn-approval-resolution",
        status: { activeFlags: ["waitingOnApproval"], type: "active" },
      },
      status: "waitingForInput",
      storage: "unknown",
      thread: { id: "thread-approval-resolution", name: "Approval resolution" },
      turns: {
        "turn-approval-resolution": {
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["item-command"],
          items: {
            "item-command": {
              id: "item-command",
              kind: "commandExecution",
              metadata: { command: "bun test" },
              status: "completed",
              threadId: "thread-approval-resolution",
              turnId: "turn-approval-resolution",
            },
          },
          streamingTextByItemId: {},
          turn: {
            id: "turn-approval-resolution",
            threadId: "thread-approval-resolution",
          },
        },
      },
    };
    initialState.serverRequestQueue = {
      byId: {
        "string:approval-command": {
          id: "approval-command",
          itemId: "item-command",
          kind: "commandApproval",
          payload: { command: "bun test" },
          threadId: "thread-approval-resolution",
          turnId: "turn-approval-resolution",
        },
      },
      order: ["string:approval-command"],
    };
    const transport = new FakeAgentTransport();

    function ApprovalStateProbe() {
      const { state } = useInternalAgentContext();
      const thread = state.threads["thread-approval-resolution"];
      const pending = state.serverRequestQueue.order.join(",") || "none";
      return (
        <output aria-label="approval state">{`${thread?.activity}:${pending}`}</output>
      );
    }

    const { container } = render(
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentThreadView threadId="thread-approval-resolution" />
        <ApprovalStateProbe />
      </AgentProvider>,
    );

    const command = container.querySelector('[data-kind="commandExecution"]');
    const approvalButton = await screen.findByRole("button", {
      name: "Approve command request approval-command",
    });
    const anchored = approvalButton.closest(".aui-transcript-approval-anchor");
    expect(command?.nextElementSibling).toBe(anchored);
    expect(screen.getByLabelText("approval state")).toHaveTextContent(
      "waitingForInput:string:approval-command",
    );

    await user.click(approvalButton);
    await waitFor(() =>
      expect(transport.responses.get("string:approval-command")).toEqual({
        decision: "accept",
      }),
    );

    act(() => {
      transport.push({
        event: { requestId: "approval-command", type: "serverRequest/resolved" },
        type: "event",
      });
    });

    await waitFor(() =>
      expect(
        screen.queryByRole("button", {
          name: "Approve command request approval-command",
        }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText("approval state")).toHaveTextContent("running:none");
  });

  it("keeps tool cards readable when closed and exposes details when opened", async () => {
    const user = userEvent.setup();
    const initialState = createInitialAgentState();
    initialState.threads["thread-tool"] = {
      orderedTurnIds: ["turn-tool"],
      status: "loaded",
      thread: { id: "thread-tool", name: "Tool detail boundary" },
      turns: {
        "turn-tool": {
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["tool-bool", "tool-error"],
          items: {
            "tool-bool": {
              id: "tool-bool",
              kind: "mcpToolCall",
              metadata: {
                arguments: { expression: "Boolean(process.env.CI)" },
                result: true,
                server: "node_repl",
                status: "completed",
                tool: "js",
              },
              status: "completed",
              threadId: "thread-tool",
              turnId: "turn-tool",
            },
            "tool-error": {
              id: "tool-error",
              kind: "dynamicToolCall",
              metadata: {
                arguments: { path: "/tmp/missing" },
                error: "Error: ENOENT\n    at readFile (/tmp/tool.js:10:3)",
                name: "read_file",
                status: "failed",
              },
              status: "failed",
              threadId: "thread-tool",
              turnId: "turn-tool",
            },
          },
          streamingTextByItemId: {},
          turn: { id: "turn-tool", threadId: "thread-tool" },
        },
      },
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentMessageList threadId="thread-tool" />
      </AgentProvider>,
    );

    expect(screen.getByLabelText("MCP tool")).toHaveTextContent("node_repl / js");
    expect(screen.getByLabelText("MCP tool")).toHaveTextContent("Result captured");
    expect(screen.queryByText("Boolean(process.env.CI)")).not.toBeInTheDocument();
    expect(screen.queryByText(/ENOENT/)).not.toBeInTheDocument();
    expect(screen.queryByText("true")).not.toBeInTheDocument();

    await user.click(screen.getByText("node_repl / js"));
    expect(screen.getByText("Arguments")).toBeInTheDocument();
    expect(screen.getByText("Result")).toBeInTheDocument();
    expect(screen.getByText(/Boolean\(process\.env\.CI\)/)).toBeInTheDocument();
    expect(screen.getByText("true")).toBeInTheDocument();

    await user.click(screen.getByText("read_file"));
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText(/ENOENT/)).toBeInTheDocument();
  });

  it("renders collab tool blocks with thread metadata inline", () => {
    const initialState = createInitialAgentState();
    initialState.threads["thread-collab-tool"] = {
      orderedTurnIds: ["turn-collab-tool"],
      status: "loaded",
      thread: { id: "thread-collab-tool", name: "Collab tool" },
      turns: {
        "turn-collab-tool": {
          blocksByItemId: {
            "collab-1": {
              id: "collab-1",
              kind: "collabToolCall",
              metadata: {
                newThreadId: "new-1",
                receiverThreadId: "receiver-1",
                senderThreadId: "sender-1",
              },
              status: "completed",
              text: "Sub-agent completed review.",
              tool: "delegate_review",
            },
          },
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["collab-1"],
          items: {
            "collab-1": {
              id: "collab-1",
              kind: "collabToolCall",
              status: "completed",
              threadId: "thread-collab-tool",
              turnId: "turn-collab-tool",
            },
          },
          streamingTextByItemId: {},
          turn: { id: "turn-collab-tool", threadId: "thread-collab-tool" },
        },
      },
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentMessageList threadId="thread-collab-tool" />
      </AgentProvider>,
    );

    const collab = screen.getByLabelText("Collab tool");
    expect(collab).toHaveTextContent("delegate_review");
    expect(collab).toHaveTextContent("Sub-agent completed review.");
    expect(collab).toHaveTextContent("From");
    expect(collab).toHaveTextContent("sender-1");
    expect(collab).toHaveTextContent("To");
    expect(collab).toHaveTextContent("receiver-1");
    expect(collab).toHaveTextContent("Thread");
    expect(collab).toHaveTextContent("new-1");
  });

  it("keeps thread list title and metadata visible for stored threads", async () => {
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              {
                cwd: "/Users/sakasegawa/src/agent-ui",
                id: "thread-stored",
                name: "Review stored transcript",
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
        <AgentThreadSidebar activeThreadId="thread-stored" />
      </AgentProvider>,
    );

    const row = await screen.findByRole("button", { name: /Review stored transcript/ });
    expect(row).toHaveTextContent("Review stored transcript");
    expect(row).toHaveTextContent("Preview");
    expect(row).toHaveTextContent("agent-ui");
    expect(screen.queryByRole("button", { name: /Load all/i })).not.toBeInTheDocument();
  });

  it("reports the canonical thread id after sidebar hydration", async () => {
    const user = userEvent.setup();
    const onSelectThread = vi.fn();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              {
                id: "thread-alias",
                name: "Aliased stored transcript",
                status: { type: "notLoaded" },
              },
            ],
          };
        }
        if (request.method === "thread/read") {
          return {
            thread: {
              id: "thread-canonical",
              name: "Aliased stored transcript",
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
        <AgentThreadSidebar
          activeThreadId="thread-alias"
          onSelectThread={onSelectThread}
        />
      </AgentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: /Aliased stored transcript/ }));

    await waitFor(() => expect(onSelectThread).toHaveBeenCalledWith("thread-canonical"));
    expect(
      transport.requests.find((request) => request.method === "thread/read")?.params,
    ).toEqual({
      includeTurns: true,
      threadId: "thread-alias",
    });
  });

  it("does not report sidebar selection when hydration fails", async () => {
    const user = userEvent.setup();
    const onSelectThread = vi.fn();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              {
                id: "thread-read-fails",
                name: "Read fails",
                status: { type: "notLoaded" },
              },
            ],
          };
        }
        if (request.method === "thread/read") throw new Error("read failed");
        return {};
      },
    });

    render(
      <AgentProvider transport={transport}>
        <AgentThreadSidebar
          activeThreadId="thread-read-fails"
          onSelectThread={onSelectThread}
        />
      </AgentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: /Read fails/ }));

    await waitFor(() =>
      expect(transport.requests.some((request) => request.method === "thread/read")).toBe(
        true,
      ),
    );
    expect(onSelectThread).not.toHaveBeenCalled();
  });

  it("renders usage as a standalone primitive without chat chrome", () => {
    const initialState = createInitialAgentState();
    initialState.usage.accountRateLimits = {
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

  it("defaults to transcript-first chrome without usage or diagnostics rail", () => {
    const initialState = runEventFixture(demoFixture as FixtureStep[]);
    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat />
      </AgentProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Implement approval UI" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Agent context")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Usage limits")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Diagnostics")).not.toBeInTheDocument();
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
    expect(
      screen.getByRole("heading", { name: "Implement approval UI" }),
    ).toBeInTheDocument();
  });

  it("exposes status and usage primitives without the AgentChat preset", () => {
    const initialState = createInitialAgentState();
    initialState.usage.accountRateLimits = {
      rateLimitsByLimitId: {
        weekly: {
          limitName: "fixture-demo-model",
          secondary: { usedPercent: 55, windowDurationMins: 10080 },
        },
      },
    };
    initialState.diagnostics.banners = [
      {
        id: "model",
        kind: "modelReroute",
        message: "Model rerouted from fixture-heavy-model.",
      },
      {
        id: "config",
        kind: "configWarning",
        message: "Config warning normalized.",
      },
    ];

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentStatusSummary />
        <AgentStatusDetails />
        <AgentUsageSummary />
      </AgentProvider>,
    );

    expect(screen.getByLabelText("Status summary")).toHaveTextContent(
      "1 warning · 2 total",
    );
    const statusDetails = screen.getByLabelText("Status details");
    expect(statusDetails).toHaveTextContent("Model rerouted");
    expect(statusDetails.querySelector("details")).not.toHaveAttribute("open");
    expect(screen.getByLabelText("Usage summary")).toHaveTextContent("55%");
  });

  it("keeps developer and audit status banners out of visible status UI", () => {
    const initialState = createInitialAgentState();
    initialState.diagnostics.banners = [
      {
        id: "debug-status",
        audience: ["developer", "audit"],
        kind: "system",
        message: "Debug-only bridge status",
        severity: "critical",
      },
      {
        id: "user-status",
        audience: ["user"],
        kind: "configWarning",
        message: "User-visible config warning",
      },
    ];

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentStatusSummary />
        <AgentStatusDetails includeCritical />
        <AgentCriticalNoticeList />
      </AgentProvider>,
    );

    expect(screen.getByLabelText("Status summary")).toHaveTextContent(
      "1 warning · 1 total",
    );
    expect(screen.getByLabelText("Status details")).toHaveTextContent(
      "User-visible config warning",
    );
    expect(screen.queryByText("Debug-only bridge status")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Critical status")).not.toBeInTheDocument();
  });

  it("keeps normal rate-limit notices out of critical thread warnings", () => {
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-rate";
    initialState.diagnostics.banners = [
      {
        id: "rate-normal",
        kind: "rateLimit",
        message: "Weekly rate-limit usage is below the warning threshold.",
      },
    ];
    initialState.threads["thread-rate"] = {
      orderedTurnIds: [],
      status: "complete",
      thread: { id: "thread-rate", name: "Rate status" },
      turns: {},
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat diagnostics sidebar={false} />
      </AgentProvider>,
    );

    expect(screen.queryByLabelText("Critical status")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Status details")).toHaveTextContent(
      "below the warning threshold",
    );
  });

  it("uses structured status severity instead of parsing localized banner text", () => {
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-localized-status";
    initialState.diagnostics.banners = [
      {
        id: "localized-critical",
        kind: "system",
        message: "認証処理に失敗しました。",
        severity: "critical",
      },
      {
        id: "localized-rate",
        kind: "rateLimit",
        message: "週間利用量",
        raw: {
          rateLimits: {
            primary: { usedPercent: 82 },
          },
        },
      },
    ];
    initialState.threads["thread-localized-status"] = {
      orderedTurnIds: [],
      status: "complete",
      thread: { id: "thread-localized-status", name: "Localized status" },
      turns: {},
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat diagnostics sidebar={false} />
      </AgentProvider>,
    );

    expect(screen.getByLabelText("Status summary")).toHaveTextContent(
      "1 critical · 1 warning · 2 total",
    );
    expect(screen.getByLabelText("Critical status")).toHaveTextContent(
      "認証処理に失敗しました。",
    );
    expect(screen.getByLabelText("Status details")).toHaveTextContent("週間利用量");
  });

  it("marks structured reached rate limits as critical without message parsing", () => {
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-rate-reached";
    initialState.diagnostics.banners = [
      {
        id: "rate-reached",
        kind: "rateLimit",
        message: "利用上限に達しました。",
        raw: {
          rateLimits: {
            primary: { usedPercent: 50 },
            rateLimitReachedType: "primary",
          },
        },
      },
    ];
    initialState.threads["thread-rate-reached"] = {
      orderedTurnIds: [],
      status: "complete",
      thread: { id: "thread-rate-reached", name: "Rate reached" },
      turns: {},
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat diagnostics sidebar={false} />
      </AgentProvider>,
    );

    expect(screen.getByLabelText("Critical status")).toHaveTextContent(
      "利用上限に達しました。",
    );
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
                skills: [
                  { enabled: true, name: "agent-browser", path: "/repo/SKILL.md" },
                ],
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

  it("normalizes upstream hook keys as stable hook ids", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "hooks/list") {
          return {
            data: [
              {
                cwd: "/repo",
                hooks: [
                  { enabled: true, key: "session-start:lint", name: "SessionStart" },
                  { enabled: false, name: "Missing key" },
                  { enabled: true },
                ],
              },
            ],
          };
        }
        return {};
      },
    });
    function Probe() {
      const { hooks, refreshHooks } = useAgentHooks("/repo");
      return (
        <>
          <button onClick={() => void refreshHooks()} type="button">
            Refresh hooks
          </button>
          <output aria-label="hook ids">{hooks.map((hook) => hook.id).join(",")}</output>
        </>
      );
    }

    render(
      <AgentProvider transport={transport}>
        <Probe />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Refresh hooks" }));

    expect(await screen.findByLabelText("hook ids")).toHaveTextContent(
      "session-start:lint,Missing key",
    );
    expect(screen.getByLabelText("hook ids")).not.toHaveTextContent("undefined");
  });

  it("paginates app/list and surfaces upstream enabled/accessibility state", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method !== "app/list") return {};
        if (
          (request.params as { cursor?: string | null } | undefined)?.cursor === "page-2"
        ) {
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
              description: "Open browser",
              id: "browser",
              installUrl: "app://browser",
              isAccessible: false,
              isEnabled: false,
              metadata: { category: "automation" },
              name: "Browser",
            },
          ],
          nextCursor: "page-2",
        };
      },
    });
    function AppsProbe() {
      const { apps } = useAgentApps("thread-apps");
      return <output aria-label="app metadata">{JSON.stringify(apps[0] ?? {})}</output>;
    }
    render(
      <AgentProvider transport={transport}>
        <AgentAppsPanel threadId="thread-apps" />
        <AppsProbe />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Refresh" }));
    expect(await screen.findByText("Browser")).toBeInTheDocument();
    expect(screen.getByText("disabled")).toBeInTheDocument();
    expect(screen.getByText("unavailable")).toBeInTheDocument();
    expect(screen.queryByText("not installed")).not.toBeInTheDocument();
    expect(screen.queryByText("auth needed")).not.toBeInTheDocument();
    expect(screen.getByLabelText("app metadata")).toHaveTextContent("Open browser");
    expect(screen.getByLabelText("app metadata")).toHaveTextContent("automation");
    expect(screen.getByLabelText("app metadata")).not.toHaveTextContent("needsAuth");
    expect(screen.getByLabelText("app metadata")).not.toHaveTextContent("installed");
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

  it("keeps app/list state isolated by thread id", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method !== "app/list") return {};
        const threadId = (request.params as { threadId?: string } | undefined)?.threadId;
        return {
          data: [
            {
              id: threadId === "thread-a" ? "a" : "b",
              isAccessible: true,
              isEnabled: true,
              name: threadId === "thread-a" ? "App A" : "App B",
            },
          ],
          nextCursor: null,
        };
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentAppsPanel threadId="thread-a" />
        <AgentAppsPanel threadId="thread-b" />
      </AgentProvider>,
    );

    await user.click(screen.getAllByRole("button", { name: "Refresh" })[0]!);
    await user.click(screen.getAllByRole("button", { name: "Refresh" })[1]!);

    expect(await screen.findByText("App A")).toBeInTheDocument();
    expect(await screen.findByText("App B")).toBeInTheDocument();
  });

  it("exposes turn steer through the public turn controller", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    function Probe() {
      const { steerTurn } = useAgentTurn("thread-steer");
      return (
        <button onClick={() => void steerTurn("turn-1", "continue")} type="button">
          Steer
        </button>
      );
    }

    render(
      <AgentProvider transport={transport}>
        <Probe />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Steer" }));

    expect(transport.requests.at(-1)).toMatchObject({
      method: "turn/steer",
      params: {
        expectedTurnId: "turn-1",
        input: [{ text: "continue", type: "text" }],
        threadId: "thread-steer",
      },
    });
  });

  it("exposes all queued server requests through neutral respond and reject actions", async () => {
    const user = userEvent.setup();
    const initialState = createInitialAgentState();
    initialState.serverRequestQueue = {
      byId: {
        "string:request-input": {
          id: "request-input",
          kind: "userInput",
          payload: {},
          threadId: "thread-1",
        },
      },
      order: ["string:request-input"],
    };
    const transport = new FakeAgentTransport();
    function Probe() {
      const serverRequests = useAgentServerRequests("thread-1");
      return (
        <>
          <output>
            {serverRequests.requests.map((request) => request.kind).join(",")}
          </output>
          <output aria-label="server request hook keys">
            {Object.keys(serverRequests).sort().join(",")}
          </output>
          <button
            onClick={() =>
              void serverRequests.respond("request-input", { value: "provided by host" })
            }
            type="button"
          >
            Respond
          </button>
          <button
            onClick={() =>
              void serverRequests.reject("request-input", {
                code: -32001,
                message: "Host rejected",
              })
            }
            type="button"
          >
            Reject
          </button>
        </>
      );
    }

    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <Probe />
      </AgentProvider>,
    );

    expect(screen.getByText("userInput")).toBeInTheDocument();
    expect(screen.getByLabelText("server request hook keys")).toHaveTextContent(
      "reject,requests,respond",
    );

    await user.click(screen.getByRole("button", { name: "Respond" }));
    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(transport.responses.get("string:request-input")).toEqual({
      value: "provided by host",
    });
    expect(transport.rejections.get("string:request-input")).toEqual({
      code: -32001,
      message: "Host rejected",
    });
  });

  it("exposes only command and file approvals through useAgentApprovals", () => {
    const initialState = createInitialAgentState();
    initialState.serverRequestQueue = {
      byId: {
        "string:request-command": {
          id: "request-command",
          kind: "commandApproval",
          payload: {},
          threadId: "thread-1",
        },
        "string:request-file": {
          id: "request-file",
          kind: "fileChangeApproval",
          payload: {},
          threadId: "thread-1",
        },
        "string:request-permissions": {
          id: "request-permissions",
          kind: "permissionsApproval",
          payload: {},
          threadId: "thread-1",
        },
        "string:request-mcp": {
          id: "request-mcp",
          kind: "mcpElicitation",
          payload: {},
          threadId: "thread-1",
        },
        "string:request-input": {
          id: "request-input",
          kind: "userInput",
          payload: {},
          threadId: "thread-1",
        },
        "string:request-dynamic": {
          id: "request-dynamic",
          kind: "dynamicTool",
          payload: {},
          threadId: "thread-1",
        },
        "string:request-auth": {
          id: "request-auth",
          kind: "authRefresh",
          payload: {},
          threadId: "thread-1",
        },
        "string:request-attestation": {
          id: "request-attestation",
          kind: "attestation",
          payload: {},
          threadId: "thread-1",
        },
      },
      order: [
        "string:request-permissions",
        "string:request-command",
        "string:request-mcp",
        "string:request-file",
        "string:request-input",
        "string:request-dynamic",
        "string:request-auth",
        "string:request-attestation",
      ],
    };
    function Probe() {
      const { approvals } = useAgentApprovals("thread-1");
      return <output>{approvals.map((approval) => approval.kind).join(",")}</output>;
    }

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <Probe />
      </AgentProvider>,
    );

    expect(screen.getByText("commandApproval,fileChangeApproval")).toBeInTheDocument();
  });

  it("renders status banners as first-class shell content", () => {
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-banner";
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
        <AgentChat diagnostics sidebar={false} usage={false} />
      </AgentProvider>,
    );

    expect(screen.getByLabelText("Status summary")).toHaveTextContent(
      "2 background notices",
    );
    expect(screen.getByLabelText("Status details")).toHaveTextContent("Model rerouted");
    expect(screen.getByLabelText("Status details")).toHaveTextContent("MCP OAuth");
  });

  it("keeps mid-width status details behind the context trigger", async () => {
    const user = userEvent.setup();
    mockResponsiveLayout({ compact: false, contextSheet: true });
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-banner";
    initialState.diagnostics.banners = [
      {
        id: "model-reroute",
        kind: "modelReroute",
        message: "Model rerouted from gpt-5.5 to gpt-5.4.",
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
        <AgentChat diagnostics sidebar={false} usage={false} />
      </AgentProvider>,
    );

    expect(screen.queryByLabelText("Status details")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Agent context" }));

    expect(screen.getByLabelText("Status details")).toHaveTextContent("Model rerouted");
  });

  it("sends thread action requests through generated method params", async () => {
    const user = userEvent.setup();
    const prompt = vi.spyOn(globalThis, "prompt").mockReturnValue("Renamed thread");
    const initialState = createInitialAgentState();
    initialState.account = {
      account: { email: "user@example.com", planType: "pro" },
      status: "authenticated",
    };
    initialState.connection = { status: "connected" };
    initialState.threadLifecycle.activeThreadId = "thread-actions";
    initialState.threadLifecycle.collections.all.ids = ["thread-actions"];
    initialState.threads["thread-actions"] = {
      activity: "idle",
      availability: "available",
      id: "thread-actions",
      metadata: { title: "Action thread" },
      operations: {},
      orderedTurnIds: ["turn-actions"],
      storage: "stored",
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

  it("surfaces neutral composer integration attachments through host resolvers", async () => {
    const user = userEvent.setup();
    const prompt = vi.spyOn(globalThis, "prompt");
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-compose";
    initialState.threads["thread-compose"] = {
      orderedTurnIds: [],
      status: "loaded",
      thread: { id: "thread-compose", name: "Composer" },
      turns: {},
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat
          composerIntegrations={[
            {
              id: "browser",
              label: "Browser",
              resolve: () => ({
                input: { name: "Browser", path: "agent://integration/browser", type: "mention" },
                label: "Browser",
              }),
            },
            {
              id: "workspace-search",
              label: "Workspace search",
              resolve: () => ({
                input: textInput("Use the workspace search integration."),
                label: "Workspace search",
              }),
            },
          ]}
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Browser" }));
    await user.click(screen.getByRole("button", { name: "Workspace search" }));

    expect(screen.getByLabelText("Pending attachments")).toHaveTextContent("Browser");
    expect(screen.getByLabelText("Pending attachments")).toHaveTextContent(
      "Workspace search",
    );
    expect(prompt).not.toHaveBeenCalled();
  });

  it("hides composer integration buttons when no host integration is provided", async () => {
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-compose-noresolver";
    initialState.threads["thread-compose-noresolver"] = {
      orderedTurnIds: [],
      status: "loaded",
      thread: { id: "thread-compose-noresolver", name: "Composer" },
      turns: {},
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat
          resolveLocalMediaUrl={(path, item) => {
            expect(path).toBe("/tmp/agent-ui.png");
            expect(item?.id).toBe("image");
            return { kind: "url", previewUrl: "/agent-ui/assets/image" };
          }}
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    expect(screen.queryByRole("button", { name: "Browser" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Workspace search" })).not.toBeInTheDocument();
  });

  it("never opens browser prompts from the composer", async () => {
    const user = userEvent.setup();
    const prompt = vi.spyOn(globalThis, "prompt");
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-compose-prompt";
    initialState.threads["thread-compose-prompt"] = {
      orderedTurnIds: [],
      status: "loaded",
      thread: { id: "thread-compose-prompt", name: "Composer" },
      turns: {},
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat
          composerIntegrations={[
            { id: "browser", label: "Browser", resolve: () => null },
            { id: "workspace-search", label: "Workspace search", resolve: () => null },
          ]}
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Browser" }));
    await user.click(screen.getByRole("button", { name: "Workspace search" }));
    await user.type(screen.getByLabelText("Message"), "still works without prompt");

    expect(prompt).not.toHaveBeenCalled();
  });

  it("handles rejected composer integration resolvers without adding attachments", async () => {
    const user = userEvent.setup();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-compose-reject";
    initialState.threads["thread-compose-reject"] = {
      orderedTurnIds: [],
      status: "loaded",
      thread: { id: "thread-compose-reject", name: "Composer" },
      turns: {},
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat
          composerIntegrations={[
            {
              id: "browser",
              label: "Browser",
              resolve: () => Promise.reject(new Error("resolver failed")),
            },
          ]}
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Browser" }));

    expect(screen.queryByLabelText("Pending attachments")).not.toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(
      "AgentComposer integration resolver failed for browser",
      expect.any(Error),
    );
    warn.mockRestore();
  });

  it("rejects composer integration attachments without explicit input", async () => {
    const user = userEvent.setup();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-compose-invalid-integration";
    initialState.threads["thread-compose-invalid-integration"] = {
      orderedTurnIds: [],
      status: "loaded",
      thread: { id: "thread-compose-invalid-integration", name: "Composer" },
      turns: {},
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat
          composerIntegrations={[
            {
              id: "empty-integration",
              label: "Empty integration",
              resolve: () =>
                ({
                  input: [],
                  label: "Empty integration",
                }) as never,
            },
            {
              id: "missing-input",
              label: "Missing input",
              resolve: () =>
                ({
                  label: "Missing input",
                }) as never,
            },
          ]}
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Empty integration" }));
    await user.click(screen.getByRole("button", { name: "Missing input" }));

    expect(screen.queryByLabelText("Pending attachments")).not.toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(
      "AgentComposer integration resolver returned no input for empty-integration",
    );
    expect(warn).toHaveBeenCalledWith(
      "AgentComposer integration resolver returned no input for missing-input",
    );
    warn.mockRestore();
  });

  it("renders image attachments with a thumbnail behind the single attach control", async () => {
    const user = userEvent.setup();
    const resolvedKinds: string[] = [];
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-image";
    initialState.threads["thread-image"] = {
      orderedTurnIds: [],
      status: "loaded",
      thread: { id: "thread-image", name: "Composer" },
      turns: {},
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat
          resolveLocalAttachment={(file, kind) => {
            resolvedKinds.push(kind);
            return kind === "image"
              ? resolvedImageAttachment(
                  `/tmp/agent-ui-image-test/${file.name}`,
                  file.name,
                )
              : resolvedTextAttachment(
                  `/tmp/agent-ui-image-test/${file.name}`,
                  file.name,
                );
          }}
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    const attachFile = screen.getByRole("button", { name: "Attach file" });
    expect(attachFile).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Attach/ })).toHaveLength(1);

    const imageInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(imageInput, [
      new File(["binary"], "shot.png", { type: "" }),
      new File(["model"], "part.3mf", { type: "" }),
    ]);

    const chip = screen
      .getByLabelText("Pending attachments")
      .querySelector('.aui-composer-chip[data-kind="image"]');
    expect(chip).not.toBeNull();
    expect(chip?.querySelector("img.aui-composer-chip-thumbnail")).not.toBeNull();
    expect(screen.getByText("part.3mf")).toBeInTheDocument();
    expect(resolvedKinds).toEqual(["image", "file"]);
  });

  it("requires a host resolver before local files become Codex inputs", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-compose";
    initialState.threads["thread-compose"] = {
      orderedTurnIds: [],
      status: "loaded",
      thread: { id: "thread-compose", name: "Composer" },
      turns: {},
    };

    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentThreadView
          resolveLocalAttachment={(file) =>
            resolvedImageAttachment(`/tmp/agent-ui-test/${file.name}`, file.name)
          }
          threadId="thread-compose"
        />
      </AgentProvider>,
    );

    const input = screen.getByLabelText("Attach files") as HTMLInputElement;
    await user.upload(input, new File(["image"], "fixture.png", { type: "image/png" }));
    await user.type(screen.getByLabelText("Message"), "inspect this");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(transport.requests.at(-1)).toMatchObject({
      method: "turn/start",
      params: {
        input: [
          { text: "inspect this", type: "text" },
          { path: "/tmp/agent-ui-test/fixture.png", type: "localImage" },
        ],
        threadId: "thread-compose",
      },
    });
  });

  it("labels standalone AgentComposer form, shortcuts, and attachments", async () => {
    const user = userEvent.setup();
    render(
      <AgentProvider
        initialState={runningComposerState()}
        transport={new FakeAgentTransport()}
      >
        <AgentComposer
          resolveLocalAttachment={(file) =>
            resolvedImageAttachment(`/uploads/${file.name}`, file.name)
          }
          threadId="thread-running"
        />
      </AgentProvider>,
    );

    expect(screen.getByRole("form", { name: "Message composer" })).toBeInTheDocument();
    const message = screen.getByRole("textbox", { name: "Message" });
    expect(message).toHaveAccessibleDescription("Enter to send");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toHaveAttribute("aria-label", "Attach files");

    await user.upload(input, new File(["image"], "fixture.png", { type: "image/png" }));

    expect(screen.getByRole("list", { name: "Pending attachments" })).toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: /fixture\.png/ })).toBeInTheDocument();
  });

  it("renders public composer styled parts without the preset", async () => {
    const user = userEvent.setup();
    const onStartThread = vi.fn();
    render(
      <AgentProvider transport={new FakeAgentTransport()}>
        <AgentAttachmentChips
          attachments={[
            {
              id: "chip-1",
              kind: "file",
              label: "notes.3mf",
              extension: ".3mf",
              sizeLabel: "5 KB",
            },
          ]}
        />
        <AgentComposerInput aria-label="Standalone message" defaultValue="draft" />
        <span id="host-help">Host help</span>
        <span id="shortcut-help">Shortcut help</span>
        <AgentComposerInput
          aria-describedby="host-help"
          aria-label="Described message"
          shortcutHintId="shortcut-help"
        />
        <AgentComposerToolbar
          start={<button type="button">Left tool</button>}
          end={<AgentComposerSubmitButton canSubmit isStopAction={false} />}
        />
        <AgentStartComposer onStartThread={onStartThread} />
      </AgentProvider>,
    );

    expect(screen.getByRole("list", { name: "Pending attachments" })).toBeInTheDocument();
    expect(
      screen.getByRole("listitem", { name: /notes\.3mf .3mf 5 KB/ }),
    ).toHaveAttribute("data-kind", "file");
    expect(screen.getByRole("textbox", { name: "Standalone message" })).toHaveClass(
      "aui-composer-input",
    );
    expect(screen.getByRole("textbox", { name: "Described message" })).toHaveAttribute(
      "aria-describedby",
      "host-help shortcut-help",
    );
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
    expect(screen.getByRole("form", { name: "Start a Codex thread" })).toHaveClass(
      "aui-first-run-starter",
    );
    const starterPrompt = screen.getByRole("textbox", { name: "Message" });
    expect(starterPrompt).toHaveClass("aui-composer-input");
    expect(starterPrompt).toHaveClass("aui-first-run-prompt");
    expect(document.querySelector(".aui-first-run-toolbar")).toHaveClass(
      "aui-composer-toolbar",
    );
    await user.type(starterPrompt, "hello");
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    expect(onStartThread).not.toHaveBeenCalled();
    await user.keyboard("{Enter}");
    expect(onStartThread).toHaveBeenCalledWith("hello");
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
    const user = userEvent.setup();
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
        <AgentChat usage />
      </AgentProvider>,
    );

    await screen.findByRole("button", { name: "Open account" });
    expect(screen.queryByText(/real@example.com/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Login" })).not.toBeInTheDocument();
    expect(await screen.findByText("10%")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open account" }));
    const dialog = await screen.findByRole("dialog", { name: "Account details" });
    expect(within(dialog).getByText("real@example.com")).toBeInTheDocument();
    expect(within(dialog).getByText("pro")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Usage limits")).toHaveTextContent("10%");
    await user.keyboard("{Escape}");
    // The starter composer exposes loaded models through the model/effort menu.
    await user.click(await screen.findByRole("button", { name: /Model and effort:/ }));
    expect(
      await screen.findByRole("menuitemradio", { name: /Real Model/ }),
    ).toBeInTheDocument();
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
        <AgentChat usage />
      </AgentProvider>,
    );

    expect(await screen.findByText("Connect Codex")).toBeInTheDocument();
    transport.push({
      event: { success: true, type: "account/login/completed" },
      type: "event",
    });

    expect(
      await screen.findByRole("button", { name: "Open account" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/login-complete@example.com/)).not.toBeInTheDocument();
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
      const { account, logout } = useAgentAccount();
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

  it("classifies App Server stderr diagnostics for developer and audit audiences", async () => {
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return { account: { email: "real@example.com", planType: "pro" } };
        }
        return {};
      },
    });
    function DiagnosticAudienceProbe() {
      const { developerDiagnostics, auditDiagnostics, userDiagnostics } =
        useAgentDiagnostics();
      return (
        <output>
          <span data-testid="developer-diagnostics">
            {developerDiagnostics.warnings.map((warning) => warning.message).join("\n")}
          </span>
          <span data-testid="audit-diagnostics">
            {auditDiagnostics.warnings.map((warning) => warning.message).join("\n")}
          </span>
          <span data-testid="user-diagnostics">
            {userDiagnostics.warnings.map((warning) => warning.message).join("\n")}
          </span>
        </output>
      );
    }
    render(
      <AgentProvider transport={transport}>
        <AgentChat diagnostics />
        <DiagnosticAudienceProbe />
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

    const developerDiagnostics = await screen.findByTestId("developer-diagnostics");
    expect(developerDiagnostics).toHaveTextContent(
      /WARN codex_app_server bridge recovered after stderr warning/,
    );
    expect(screen.getByTestId("audit-diagnostics")).toHaveTextContent(
      /WARN codex_app_server bridge recovered after stderr warning/,
    );
    expect(screen.getByTestId("user-diagnostics")).not.toHaveTextContent(
      /bridge recovered after stderr warning/,
    );
    expect(screen.queryByLabelText("Diagnostics")).not.toBeInTheDocument();
  });

  it("does not retain raw transport events for diagnostics", async () => {
    const transport = new FakeAgentTransport();
    function WarningProbe() {
      const { state } = useInternalAgentContext();
      return (
        <output>
          {selectDiagnosticWarnings(state)
            .map((warning) => JSON.stringify(warning))
            .join("\n")}
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

    expect(
      await screen.findByRole("button", { name: "Open account" }),
    ).toBeInTheDocument();
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

    expect(
      await screen.findByRole("button", { name: "Open account" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/icon path must not contain/)).not.toBeInTheDocument();
  });

  it("keeps long history messages expanded without a preview disclosure", () => {
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-history";
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

    expect(screen.getByText(/Review this session/)).toBeInTheDocument();
    expect(
      document.querySelector(".aui-message-body-collapsible"),
    ).not.toBeInTheDocument();
  });

  it("renders structured App Server message content without crashing", () => {
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-real";
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
              metadata: { content: "Reply with exactly: agent-ui-ui-check" },
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

  it("renders rich transcript content blocks from normalized state", async () => {
    const user = userEvent.setup();
    const initialState = runEventFixture([
      {
        event: {
          thread: { id: "thread-blocks", name: "Block renderers" },
          type: "thread/started",
        },
      },
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
            metadata: {
              content: "Full hidden reasoning",
              summary: "Reviewing renderer taxonomy",
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
            metadata: {
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
            metadata: { query: "Codex App Server generated protocol" },
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
            metadata: { path: "/tmp/agent-ui.png" },
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
        <AgentChat
          resolveLocalMediaUrl={(path, item) => {
            expect(path).toBe("/tmp/agent-ui.png");
            expect(item?.id).toBe("image");
            return { kind: "url", previewUrl: "/agent-ui/assets/image" };
          }}
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    expect(screen.getByText("Reviewing renderer taxonomy")).toBeInTheDocument();
    expect(screen.getByLabelText("Plan")).toHaveTextContent("Render command");
    expect(screen.getByText("MCP tool")).toBeInTheDocument();
    expect(screen.getByText("agent-browser / snapshot")).toBeInTheDocument();
    expect(screen.getByLabelText("MCP tool")).toHaveTextContent(
      "agent-browser / snapshot",
    );
    expect(screen.getByLabelText("MCP tool")).toHaveTextContent("Result captured");
    expect(screen.queryByText(/"selector": "#app"/)).not.toBeInTheDocument();
    await user.click(screen.getByText("agent-browser / snapshot"));
    expect(screen.getByText(/"selector": "#app"/)).toBeInTheDocument();
    expect(screen.getByLabelText("Web search")).toHaveTextContent(
      "Codex App Server generated protocol",
    );
    const image = screen.getByRole("img", { name: "agent-ui.png" });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/agent-ui/assets/image");
  });

  it("renders local media fallback instead of raw filesystem image src", async () => {
    const initialState = runEventFixture([
      {
        event: {
          snapshot: true,
          status: "loaded",
          thread: { id: "thread-local-media" },
          turns: [{ id: "turn-local-media", threadId: "thread-local-media" }],
          type: "thread/upserted",
        },
      },
      {
        event: {
          item: {
            id: "image",
            kind: "imageView",
            metadata: { path: "/tmp/secret-screenshot.png" },
            threadId: "thread-local-media",
            turnId: "turn-local-media",
          },
          threadId: "thread-local-media",
          turnId: "turn-local-media",
          type: "item/completed",
        },
      },
    ] as FixtureStep[]);
    initialState.threadLifecycle.activeThreadId = "thread-local-media";

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat sidebar={false} usage={false} />
      </AgentProvider>,
    );

    expect(screen.queryByRole("img", { name: "secret-screenshot.png" })).toBeNull();
    expect(screen.getByText("Local media unavailable")).toBeInTheDocument();
    expect(document.querySelector(".aui-image-block img")).toBeNull();
  });

  it("renders structured local media resources without exposing raw paths as captions", async () => {
    const initialState = runEventFixture([
      {
        event: {
          snapshot: true,
          status: "loaded",
          thread: { id: "thread-structured-media" },
          turns: [{ id: "turn-structured-media", threadId: "thread-structured-media" }],
          type: "thread/upserted",
        },
      },
      {
        event: {
          item: {
            id: "structured-image",
            kind: "imageView",
            metadata: { path: "/tmp/agent-ui-local-media/private/diagram.png" },
            threadId: "thread-structured-media",
            turnId: "turn-structured-media",
          },
          threadId: "thread-structured-media",
          turnId: "turn-structured-media",
          type: "item/completed",
        },
      },
    ] as FixtureStep[]);
    initialState.threadLifecycle.activeThreadId = "thread-structured-media";

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat
          resolveLocalMediaUrl={() => ({
            displayName: "diagram.png",
            previewUrl: "/agent-ui/assets/diagram",
            redactedPath: "[agent-ui-local-media]/diagram.png",
          })}
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    expect(screen.getByRole("img", { name: "diagram.png" })).toHaveAttribute(
      "src",
      "/agent-ui/assets/diagram",
    );
    expect(screen.getByText("diagram.png")).toBeInTheDocument();
    expect(screen.queryByText(/private/)).not.toBeInTheDocument();
  });

  it("renders structured video media from mime type when the local path is opaque", async () => {
    const initialState = runEventFixture([
      {
        event: {
          snapshot: true,
          status: "loaded",
          thread: { id: "thread-structured-video" },
          turns: [{ id: "turn-structured-video", threadId: "thread-structured-video" }],
          type: "thread/upserted",
        },
      },
      {
        event: {
          item: {
            id: "structured-video",
            kind: "imageView",
            metadata: { path: "/tmp/agent-ui-local-media/opaque-resource" },
            threadId: "thread-structured-video",
            turnId: "turn-structured-video",
          },
          threadId: "thread-structured-video",
          turnId: "turn-structured-video",
          type: "item/completed",
        },
      },
    ] as FixtureStep[]);
    initialState.threadLifecycle.activeThreadId = "thread-structured-video";

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat
          resolveLocalMediaUrl={() => ({
            displayName: "recording",
            mimeType: "video/mp4",
            previewUrl: "/agent-ui/assets/recording",
          })}
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    const video = document.querySelector(".aui-image-block video");
    expect(video).toHaveAttribute("src", "/agent-ui/assets/recording");
    expect(document.querySelector(".aui-image-block img")).toBeNull();
    expect(screen.getByText("recording")).toBeInTheDocument();
  });

  it("falls back when resolved video media fails to load", async () => {
    const initialState = runEventFixture([
      {
        event: {
          snapshot: true,
          status: "loaded",
          thread: { id: "thread-video-failure" },
          turns: [{ id: "turn-video-failure", threadId: "thread-video-failure" }],
          type: "thread/upserted",
        },
      },
      {
        event: {
          item: {
            id: "video",
            kind: "imageView",
            metadata: { path: "/tmp/private-recording.mp4" },
            threadId: "thread-video-failure",
            turnId: "turn-video-failure",
          },
          threadId: "thread-video-failure",
          turnId: "turn-video-failure",
          type: "item/completed",
        },
      },
    ] as FixtureStep[]);
    initialState.threadLifecycle.activeThreadId = "thread-video-failure";

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat
          resolveLocalMediaUrl={() => ({
            displayName: "private-recording.mp4",
            mimeType: "video/mp4",
            previewUrl: "/agent-ui/assets/missing-video",
          })}
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    const video = document.querySelector(".aui-image-block video");
    expect(video).toHaveAttribute("src", "/agent-ui/assets/missing-video");
    fireEvent.error(video!);
    expect(screen.getByText("Local media unavailable")).toBeInTheDocument();
    expect(document.querySelector(".aui-image-block video")).toBeNull();
    expect(screen.queryByText(/tmp/)).toBeNull();
  });

  it("falls back when resolved local media fails to load", async () => {
    const initialState = runEventFixture([
      {
        event: {
          snapshot: true,
          status: "loaded",
          thread: { id: "thread-local-media-failure" },
          turns: [
            { id: "turn-local-media-failure", threadId: "thread-local-media-failure" },
          ],
          type: "thread/upserted",
        },
      },
      {
        event: {
          item: {
            id: "image",
            kind: "imageView",
            metadata: { path: "/tmp/failing-screenshot.png" },
            threadId: "thread-local-media-failure",
            turnId: "turn-local-media-failure",
          },
          threadId: "thread-local-media-failure",
          turnId: "turn-local-media-failure",
          type: "item/completed",
        },
      },
    ] as FixtureStep[]);
    initialState.threadLifecycle.activeThreadId = "thread-local-media-failure";

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat
          resolveLocalMediaUrl={() => ({
            kind: "url",
            previewUrl: "/agent-ui/assets/missing-image",
          })}
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    const image = screen.getByRole("img", { name: "failing-screenshot.png" });
    expect(image).toHaveAttribute("src", "/agent-ui/assets/missing-image");
    fireEvent.error(image);
    expect(screen.getByText("Local media unavailable")).toBeInTheDocument();
    expect(document.querySelector(".aui-image-block img")).toBeNull();
  });

  it("renders browser-safe image block resources without a local media resolver", async () => {
    const initialState = runEventFixture([
      {
        event: {
          snapshot: true,
          status: "loaded",
          thread: { id: "thread-safe-image-resource" },
          turns: [
            {
              id: "turn-safe-image-resource",
              threadId: "thread-safe-image-resource",
            },
          ],
          type: "thread/upserted",
        },
      },
      {
        event: {
          item: {
            id: "safe-image-resource",
            kind: "imageView",
            metadata: {
              displayName: "Generated preview",
              imageUrl: "https://example.test/preview.png",
            },
            threadId: "thread-safe-image-resource",
            turnId: "turn-safe-image-resource",
          },
          threadId: "thread-safe-image-resource",
          turnId: "turn-safe-image-resource",
          type: "item/completed",
        },
      },
    ] as FixtureStep[]);
    initialState.threadLifecycle.activeThreadId = "thread-safe-image-resource";
    const resolveLocalMediaUrl = vi.fn(() => ({
      kind: "url",
      previewUrl: "/agent-ui/assets/incorrect",
    }));

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat
          resolveLocalMediaUrl={resolveLocalMediaUrl}
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    expect(screen.getByRole("img", { name: "Generated preview" })).toHaveAttribute(
      "src",
      "https://example.test/preview.png",
    );
    expect(resolveLocalMediaUrl).not.toHaveBeenCalled();
    expect(screen.queryByText("Local media unavailable")).toBeNull();
  });

  it("redacts Windows local media directories in fallback captions", async () => {
    const initialState = runEventFixture([
      {
        event: {
          snapshot: true,
          status: "loaded",
          thread: { id: "thread-windows-media" },
          turns: [{ id: "turn-windows-media", threadId: "thread-windows-media" }],
          type: "thread/upserted",
        },
      },
      {
        event: {
          item: {
            id: "image",
            kind: "imageView",
            metadata: { path: String.raw`C:\Users\me\secret.png` },
            threadId: "thread-windows-media",
            turnId: "turn-windows-media",
          },
          threadId: "thread-windows-media",
          turnId: "turn-windows-media",
          type: "item/completed",
        },
      },
    ] as FixtureStep[]);
    initialState.threadLifecycle.activeThreadId = "thread-windows-media";

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat sidebar={false} usage={false} />
      </AgentProvider>,
    );

    expect(screen.getByText("Local media unavailable")).toBeInTheDocument();
    expect(screen.getByText("secret.png")).toBeInTheDocument();
    expect(screen.queryByText(/Users\\me/)).toBeNull();
  });

  it("retries transcript local media when the resolved URL changes", async () => {
    const initialState = runEventFixture([
      {
        event: {
          snapshot: true,
          status: "loaded",
          thread: { id: "thread-media-refresh" },
          turns: [{ id: "turn-media-refresh", threadId: "thread-media-refresh" }],
          type: "thread/upserted",
        },
      },
      {
        event: {
          item: {
            id: "image",
            kind: "imageView",
            metadata: { path: "/tmp/refresh.png" },
            threadId: "thread-media-refresh",
            turnId: "turn-media-refresh",
          },
          threadId: "thread-media-refresh",
          turnId: "turn-media-refresh",
          type: "item/completed",
        },
      },
    ] as FixtureStep[]);
    initialState.threadLifecycle.activeThreadId = "thread-media-refresh";
    const { rerender } = render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat
          resolveLocalMediaUrl={() => ({
            kind: "url",
            previewUrl: "/agent-ui/assets/old-refresh",
          })}
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    const image = screen.getByRole("img", { name: "refresh.png" });
    fireEvent.error(image);
    expect(screen.getByText("Local media unavailable")).toBeInTheDocument();

    rerender(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat
          resolveLocalMediaUrl={() => ({
            kind: "url",
            previewUrl: "/agent-ui/assets/new-refresh",
          })}
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    await waitFor(() =>
      expect(screen.getByRole("img", { name: "refresh.png" })).toHaveAttribute(
        "src",
        "/agent-ui/assets/new-refresh",
      ),
    );
  });

  it("renders reasoning in disclosure and compaction items inline", async () => {
    const user = userEvent.setup();
    const initialState = createInitialAgentState();
    initialState.threads["thread-reasoning-compaction"] = {
      orderedTurnIds: ["turn-reasoning-compaction"],
      status: "loaded",
      thread: { id: "thread-reasoning-compaction", name: "Reasoning" },
      turns: {
        "turn-reasoning-compaction": {
          blocksByItemId: {
            "reasoning-1": {
              content: "Full hidden reasoning trace",
              id: "reasoning-1",
              kind: "thinking",
              summary: "Reviewing renderer taxonomy",
            },
          },
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["reasoning-1", "compaction-1"],
          items: {
            "compaction-1": {
              id: "compaction-1",
              kind: "contextCompaction",
              status: "completed",
              text: "Earlier transcript context was compacted.",
              threadId: "thread-reasoning-compaction",
              turnId: "turn-reasoning-compaction",
            },
            "reasoning-1": {
              id: "reasoning-1",
              kind: "reasoning",
              status: "completed",
              threadId: "thread-reasoning-compaction",
              turnId: "turn-reasoning-compaction",
            },
          },
          streamingTextByItemId: {},
          turn: {
            id: "turn-reasoning-compaction",
            threadId: "thread-reasoning-compaction",
          },
        },
      },
    };

    const { container } = render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentMessageList threadId="thread-reasoning-compaction" />
      </AgentProvider>,
    );

    const reasoning = screen.getByText("Reviewing renderer taxonomy").closest("details");
    expect(reasoning).toHaveTextContent("Thinking");
    expect(reasoning).toHaveTextContent("Full hidden reasoning trace");
    expect(reasoning).not.toHaveAttribute("open");
    await user.click(screen.getByText("Reviewing renderer taxonomy"));
    expect(reasoning).toHaveAttribute("open");

    const compaction = container.querySelector('[data-kind="contextCompaction"]');
    expect(compaction).toHaveTextContent("Compaction");
    expect(compaction).toHaveTextContent("Earlier transcript context was compacted.");
    expect(compaction?.querySelector("details")).toBeNull();
  });

  it("keeps the running composer editable and stops the active turn from the primary button", async () => {
    const user = userEvent.setup();
    const initialState = runningComposerState();
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

    expect(screen.getByRole("textbox", { name: "Message" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Stop current turn", hidden: false }),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: "Stop current turn" })).toHaveLength(
      1,
    );
    await user.click(screen.getByRole("button", { name: "Stop current turn" }));

    await waitFor(() =>
      expect(
        transport.requests.find((request) => request.method === "turn/interrupt")?.params,
      ).toEqual({ threadId: "thread-running", turnId: "turn-running" }),
    );
  });

  it("keeps running empty Enter local and does not interrupt the turn", async () => {
    const user = userEvent.setup();
    const initialState = runningComposerState();
    const transport = new FakeAgentTransport();
    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    screen.getByRole("textbox", { name: "Message" }).focus();
    await user.keyboard("{Enter}");

    expect(screen.queryByLabelText("Queued follow-ups")).not.toBeInTheDocument();
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "turn/interrupt",
    );
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "turn/start",
    );
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "turn/steer",
    );
  });

  it("queues running Enter submits locally instead of starting or steering", async () => {
    const user = userEvent.setup();
    const initialState = runningComposerState();
    const transport = new FakeAgentTransport();
    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    const message = screen.getByRole("textbox", { name: "Message" });
    await user.type(message, "focus on tests");
    await user.keyboard("{Enter}");

    expect(screen.getByLabelText("Queued follow-ups")).toHaveTextContent(
      "focus on tests",
    );
    expect(message).toHaveValue("");
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "turn/start",
    );
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "turn/steer",
    );
  });

  it("starts a new turn with Cmd+Enter when no turn is running", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-ready";
    initialState.threads["thread-ready"] = {
      orderedTurnIds: [],
      status: "complete",
      thread: { id: "thread-ready", name: "Ready thread" },
      turns: {},
    };
    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    const message = screen.getByRole("textbox", { name: "Message" });
    await user.type(message, "start from shortcut");
    await user.keyboard("{Meta>}{Enter}{/Meta}");

    await waitFor(() =>
      expect(transport.requests.at(-1)).toMatchObject({
        method: "turn/start",
        params: {
          input: [{ text: "start from shortcut", type: "text" }],
          threadId: "thread-ready",
        },
      }),
    );
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "turn/steer",
    );
  });

  it("sends running Cmd+Enter immediately with turn/steer", async () => {
    const user = userEvent.setup();
    const initialState = runningComposerState();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "turn/steer") {
          return { turnId: "turn-running" };
        }
        return {};
      },
    });
    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    const message = screen.getByRole("textbox", { name: "Message" });
    await user.type(message, "focus on tests");
    await user.keyboard("{Meta>}{Enter}{/Meta}");

    await waitFor(() =>
      expect(transport.requests.at(-1)).toMatchObject({
        method: "turn/steer",
        params: {
          expectedTurnId: "turn-running",
          input: [{ text: "focus on tests", type: "text" }],
          threadId: "thread-running",
        },
      }),
    );
    expect(message).toHaveValue("");
    expect(screen.queryByLabelText("Queued follow-ups")).not.toBeInTheDocument();
  });

  it("sends queued follow-ups with turn/steer and removes them after success", async () => {
    const user = userEvent.setup();
    const initialState = runningComposerState();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "turn/steer") return { turnId: "turn-running" };
        return {};
      },
    });
    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    const message = screen.getByRole("textbox", { name: "Message" });
    await user.type(message, "send queued now");
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: "Send now" }));

    await waitFor(() =>
      expect(transport.requests.at(-1)).toMatchObject({
        method: "turn/steer",
        params: {
          expectedTurnId: "turn-running",
          input: [{ text: "send queued now", type: "text" }],
          threadId: "thread-running",
        },
      }),
    );
    await waitFor(() =>
      expect(screen.queryByLabelText("Queued follow-ups")).not.toBeInTheDocument(),
    );
  });

  it("keeps queued follow-ups scoped to their active thread", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "turn/steer") return { turnId: "turn-running" };
        return {};
      },
    });
    render(
      <AgentProvider initialState={twoRunningThreadsState()} transport={transport}>
        <ActiveThreadHarness />
      </AgentProvider>,
    );

    const message = screen.getByRole("textbox", { name: "Message" });
    await user.type(message, "thread A queued");
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("Queued follow-ups")).toHaveTextContent(
      "thread A queued",
    );

    await user.click(screen.getByRole("button", { name: "Show thread B" }));
    expect(screen.getByTestId("active-thread")).toHaveTextContent("thread-b");
    expect(screen.queryByLabelText("Queued follow-ups")).not.toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Message" }), "thread B queued");
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("Queued follow-ups")).toHaveTextContent(
      "thread B queued",
    );
    expect(screen.getByLabelText("Queued follow-ups")).not.toHaveTextContent(
      "thread A queued",
    );

    await user.click(screen.getByRole("button", { name: "Show thread A" }));
    expect(screen.getByLabelText("Queued follow-ups")).toHaveTextContent(
      "thread A queued",
    );
    expect(screen.getByLabelText("Queued follow-ups")).not.toHaveTextContent(
      "thread B queued",
    );
    await user.click(screen.getByRole("button", { name: "Show thread B" }));
    await user.click(screen.getByRole("button", { name: "Send now" }));

    await waitFor(() =>
      expect(transport.requests.at(-1)).toMatchObject({
        method: "turn/steer",
        params: {
          expectedTurnId: "turn-b",
          input: [{ text: "thread B queued", type: "text" }],
          threadId: "thread-b",
        },
      }),
    );
    expect(
      transport.requests.some(
        (request) =>
          request.method === "turn/steer" &&
          (request.params as any).threadId === "thread-b" &&
          (request.params as any).input?.[0]?.text === "thread A queued",
      ),
    ).toBe(false);
  });

  it("keeps queued follow-ups when the thread view unmounts for a no-thread route", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "turn/steer") return { turnId: "turn-running" };
        return {};
      },
    });
    render(
      <AgentProvider initialState={twoRunningThreadsState()} transport={transport}>
        <ActiveThreadHarness />
      </AgentProvider>,
    );

    await user.type(screen.getByRole("textbox", { name: "Message" }), "survives unmount");
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("Queued follow-ups")).toHaveTextContent(
      "survives unmount",
    );

    await user.click(screen.getByRole("button", { name: "Show no thread" }));
    expect(screen.getByText("No active thread")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Message" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show thread A" }));
    expect(screen.getByLabelText("Queued follow-ups")).toHaveTextContent(
      "survives unmount",
    );
    await user.click(screen.getByRole("button", { name: "Send now" }));

    await waitFor(() =>
      expect(transport.requests.at(-1)).toMatchObject({
        method: "turn/steer",
        params: {
          expectedTurnId: "turn-running",
          input: [{ text: "survives unmount", type: "text" }],
          threadId: "thread-running",
        },
      }),
    );
  });

  it("keeps remounted same-timestamp queued follow-ups independently sendable", async () => {
    const user = userEvent.setup();
    vi.spyOn(Date, "now").mockReturnValue(1_234);
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "turn/steer") return { turnId: "turn-running" };
        return {};
      },
    });
    render(
      <AgentProvider initialState={twoRunningThreadsState()} transport={transport}>
        <ActiveThreadHarness />
      </AgentProvider>,
    );
    await queueAcrossThreadViewRemount(user, "same ms send A", "same ms send B");

    const firstItem = screen.getByText("same ms send A").closest("li");
    expect(firstItem).not.toBeNull();
    await user.click(within(firstItem!).getByRole("button", { name: "Send now" }));

    await waitFor(() =>
      expect(transport.requests.at(-1)).toMatchObject({
        method: "turn/steer",
        params: {
          expectedTurnId: "turn-running",
          input: [{ text: "same ms send A", type: "text" }],
          threadId: "thread-running",
        },
      }),
    );
    expect(screen.getByLabelText("Queued follow-ups")).toHaveTextContent(
      "same ms send B",
    );
    expect(screen.queryByText("same ms send A")).not.toBeInTheDocument();
  });

  it("keeps remounted same-timestamp queued follow-ups independently editable", async () => {
    const user = userEvent.setup();
    vi.spyOn(Date, "now").mockReturnValue(1_234);
    render(
      <AgentProvider
        initialState={twoRunningThreadsState()}
        transport={new FakeAgentTransport()}
      >
        <ActiveThreadHarness />
      </AgentProvider>,
    );
    await queueAcrossThreadViewRemount(user, "same ms edit A", "same ms edit B");

    const firstItem = screen.getByText("same ms edit A").closest("li");
    expect(firstItem).not.toBeNull();
    await user.click(within(firstItem!).getByRole("button", { name: "Edit" }));

    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue(
      "same ms edit A",
    );
    expect(screen.getByLabelText("Queued follow-ups")).toHaveTextContent(
      "same ms edit B",
    );
    expect(screen.getByLabelText("Queued follow-ups")).not.toHaveTextContent(
      "same ms edit A",
    );
  });

  it("keeps remounted same-timestamp queued follow-ups independently removable", async () => {
    const user = userEvent.setup();
    vi.spyOn(Date, "now").mockReturnValue(1_234);
    render(
      <AgentProvider
        initialState={twoRunningThreadsState()}
        transport={new FakeAgentTransport()}
      >
        <ActiveThreadHarness />
      </AgentProvider>,
    );
    await queueAcrossThreadViewRemount(user, "same ms remove A", "same ms remove B");

    const firstItem = screen.getByText("same ms remove A").closest("li");
    expect(firstItem).not.toBeNull();
    await user.click(within(firstItem!).getByRole("button", { name: "Remove" }));

    expect(screen.getByLabelText("Queued follow-ups")).toHaveTextContent(
      "same ms remove B",
    );
    expect(screen.queryByText("same ms remove A")).not.toBeInTheDocument();
  });

  it("keeps a queued follow-up when the active turn changes before Send now", async () => {
    const user = userEvent.setup();
    function TurnChanger() {
      const { dispatch } = useInternalAgentContext();
      return (
        <button
          type="button"
          onClick={() =>
            dispatch({
              threadId: "thread-running",
              turn: { id: "turn-new", status: "running", threadId: "thread-running" },
              type: "turn/started",
            })
          }
        >
          Start replacement turn
        </button>
      );
    }
    const transport = new FakeAgentTransport();
    render(
      <AgentProvider initialState={runningComposerState()} transport={transport}>
        <TurnChanger />
        <AgentThreadView />
      </AgentProvider>,
    );

    const message = screen.getByRole("textbox", { name: "Message" });
    await user.type(message, "old turn queued");
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: "Start replacement turn" }));

    expect(screen.queryByRole("button", { name: "Send now" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    expect(screen.getByLabelText("Queued follow-ups")).toHaveTextContent(
      "old turn queued",
    );
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "turn/steer",
    );
  });

  it("hides Send now for queued follow-ups after their expected turn completes", async () => {
    const user = userEvent.setup();
    function TurnCompleter() {
      const { dispatch } = useInternalAgentContext();
      return (
        <button
          type="button"
          onClick={() =>
            dispatch({
              threadId: "thread-running",
              turn: {
                id: "turn-running",
                status: "completed",
                threadId: "thread-running",
              },
              type: "turn/completed",
            })
          }
        >
          Complete turn
        </button>
      );
    }
    const transport = new FakeAgentTransport();
    render(
      <AgentProvider initialState={runningComposerState()} transport={transport}>
        <TurnCompleter />
        <AgentThreadView />
      </AgentProvider>,
    );

    const message = screen.getByRole("textbox", { name: "Message" });
    await user.type(message, "post turn queued");
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Send now" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Complete turn" }));

    expect(screen.queryByRole("button", { name: "Send now" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(message).toHaveValue("post turn queued");
    expect(screen.queryByLabelText("Queued follow-ups")).not.toBeInTheDocument();
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "turn/steer",
    );
  });

  it("keeps a queued follow-up and shows item error when Send now fails", async () => {
    const user = userEvent.setup();
    const initialState = runningComposerState();
    const failingTransport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "turn/steer") {
          throw new Error("ActiveTurnNotSteerable review");
        }
        return {};
      },
    });
    render(
      <AgentProvider initialState={initialState} transport={failingTransport}>
        <AgentChat />
      </AgentProvider>,
    );
    const failingMessage = screen.getByRole("textbox", { name: "Message" });
    await user.type(failingMessage, "do not lose this");
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: "Send now" }));

    await screen.findByText(/cannot accept additional instructions/i);
    expect(screen.getByLabelText("Queued follow-ups")).toHaveTextContent(
      "do not lose this",
    );
    expect(failingMessage).toHaveValue("");
  });

  it("keeps a queued follow-up when the server reports expected turn mismatch", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "turn/steer") {
          throw new Error("expected turn mismatch");
        }
        return {};
      },
    });
    render(
      <AgentProvider initialState={runningComposerState()} transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    const message = screen.getByRole("textbox", { name: "Message" });
    await user.type(message, "mismatch stays queued");
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: "Send now" }));

    await screen.findByText(/active turn changed/i);
    expect(screen.getByLabelText("Queued follow-ups")).toHaveTextContent(
      "mismatch stays queued",
    );
  });

  it("edits and removes queued follow-ups", async () => {
    const user = userEvent.setup();
    render(
      <AgentProvider
        initialState={runningComposerState()}
        transport={new FakeAgentTransport()}
      >
        <AgentChat />
      </AgentProvider>,
    );

    const message = screen.getByRole("textbox", { name: "Message" });
    await user.type(message, "first follow-up");
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(message).toHaveValue("first follow-up");
    expect(screen.queryByLabelText("Queued follow-ups")).not.toBeInTheDocument();

    await user.clear(message);
    await user.type(message, "remove follow-up");
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.queryByLabelText("Queued follow-ups")).not.toBeInTheDocument();
  });

  it("keeps older compact queued follow-ups actionable", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "turn/steer") return { turnId: "turn-running" };
        return {};
      },
    });
    render(
      <AgentProvider initialState={runningComposerState()} transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    const message = screen.getByRole("textbox", { name: "Message" });
    for (let index = 1; index <= 6; index += 1) {
      await user.type(message, `queued ${index}`);
      await user.keyboard("{Enter}");
    }

    await user.click(screen.getByRole("button", { name: "Send now queued 1" }));
    await waitFor(() =>
      expect(transport.requests.at(-1)).toMatchObject({
        method: "turn/steer",
        params: {
          expectedTurnId: "turn-running",
          input: [{ text: "queued 1", type: "text" }],
          threadId: "thread-running",
        },
      }),
    );
    await user.click(screen.getByRole("button", { name: "Edit queued 2" }));
    expect(message).toHaveValue("queued 2");
    await user.clear(message);
    await user.click(screen.getByRole("button", { name: "Remove queued 3" }));
    expect(screen.getByLabelText("Queued follow-ups")).not.toHaveTextContent("queued 3");
  });

  it("keeps queued follow-up and attachment rejection nouns locale-owned", async () => {
    const user = userEvent.setup();
    render(
      <AgentProvider
        initialState={runningComposerState()}
        transport={new FakeAgentTransport()}
      >
        <AgentChat
          locale="ja"
          resolveLocalAttachment={() => null}
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    const message = screen.getByRole("textbox", { name: "メッセージ" });
    for (let index = 1; index <= 4; index += 1) {
      await user.type(message, `キュー ${index}`);
      await user.keyboard("{Enter}");
    }
    const queue = screen.getByLabelText("キュー済みフォローアップ");
    expect(queue).toHaveTextContent("以前のフォローアップ 1 件を保持しています");
    expect(queue).not.toHaveTextContent(/follow-up|follow-ups|attachment|attachments/i);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(["text"], "reject.txt", { type: "text/plain" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "この Codex スレッドに 1 件のファイルを添付できませんでした。",
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent(/\bfile\b|\bfiles\b/i);
  });

  it("restores queued image attachments on Edit and sends them with Cmd+Enter", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "turn/steer") return { turnId: "turn-running" };
        return {};
      },
    });
    render(
      <AgentProvider initialState={runningComposerState()} transport={transport}>
        <AgentChat
          resolveLocalAttachment={(file, kind) =>
            kind === "image"
              ? resolvedImageAttachment(`/uploads/${file.name}`, file.name)
              : resolvedTextAttachment(`/uploads/${file.name}`, file.name)
          }
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(
      fileInput,
      new File(["png"], "queued-shot.png", { type: "image/png" }),
    );
    await user.type(screen.getByLabelText("Message"), "review queued image");
    await user.keyboard("{Enter}");

    expect(screen.getByLabelText("Queued follow-ups")).toHaveTextContent(
      "review queued image",
    );
    expect(screen.getByLabelText("Queued attachments")).toHaveTextContent(
      "queued-shot.png",
    );
    expect(screen.queryByLabelText("Pending attachments")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Message")).toHaveValue("review queued image");
    expect(screen.getByLabelText("Pending attachments")).toHaveTextContent(
      "queued-shot.png",
    );
    await user.click(screen.getByLabelText("Message"));
    await user.keyboard("{Meta>}{Enter}{/Meta}");

    await waitFor(() =>
      expect(transport.requests.at(-1)).toMatchObject({
        method: "turn/steer",
        params: {
          expectedTurnId: "turn-running",
          input: [
            { text: "review queued image", type: "text" },
            { path: "/uploads/queued-shot.png", type: "localImage" },
          ],
          threadId: "thread-running",
        },
      }),
    );
    expect(screen.queryByText("queued-shot.png")).not.toBeInTheDocument();
  });

  it("keeps arbitrary file attachment payloads for queued Send now", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "turn/steer") return { turnId: "turn-running" };
        return {};
      },
    });
    render(
      <AgentProvider initialState={runningComposerState()} transport={transport}>
        <AgentChat
          resolveLocalAttachment={(file, kind) =>
            kind === "image"
              ? resolvedImageAttachment(`/uploads/${file.name}`, file.name)
              : resolvedTextAttachment(`/uploads/${file.name}`, file.name)
          }
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    const textarea = screen.getByLabelText("Message");
    fireEvent.paste(textarea, {
      clipboardData: {
        files: [new File(["model"], "queued-part.3mf", { type: "" })],
      },
    });
    await screen.findByText("queued-part.3mf");
    await user.type(textarea, "review queued file");
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("Queued attachments")).toHaveTextContent(
      "queued-part.3mf",
    );

    await user.click(screen.getByRole("button", { name: "Send now" }));
    await waitFor(() =>
      expect(transport.requests.at(-1)).toMatchObject({
        method: "turn/steer",
        params: {
          expectedTurnId: "turn-running",
          input: [
            { text: "review queued file", type: "text" },
            { text: "Attached file: /uploads/queued-part.3mf", type: "text" },
          ],
          threadId: "thread-running",
        },
      }),
    );
  });

  it("revokes queued image previews on Remove without clearing unrelated attachments", async () => {
    const user = userEvent.setup();
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    render(
      <AgentProvider
        initialState={runningComposerState()}
        transport={new FakeAgentTransport()}
      >
        <AgentChat
          resolveLocalAttachment={(file) =>
            resolvedImageAttachment(`/uploads/${file.name}`, file.name)
          }
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(
      fileInput,
      new File(["png"], "remove-queued.png", { type: "image/png" }),
    );
    await user.type(screen.getByLabelText("Message"), "remove queued image");
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(screen.queryByLabelText("Queued follow-ups")).not.toBeInTheDocument();
    expect(revoke).toHaveBeenCalled();
  });

  it("keeps queued preview ownership across thread view unmount and revokes on provider cleanup", async () => {
    const user = userEvent.setup();
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    const { unmount } = render(
      <AgentProvider
        initialState={twoRunningThreadsState()}
        transport={new FakeAgentTransport()}
      >
        <ActiveThreadHarness
          resolveLocalAttachment={(file) =>
            resolvedImageAttachment(`/uploads/${file.name}`, file.name)
          }
        />
      </AgentProvider>,
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(
      fileInput,
      new File(["png"], "persist-preview.png", { type: "image/png" }),
    );
    await user.type(screen.getByLabelText("Message"), "preview survives view unmount");
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: "Show no thread" }));

    expect(revoke).not.toHaveBeenCalled();
    unmount();
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  it("does not double revoke queued previews after Remove", async () => {
    const user = userEvent.setup();
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    const { unmount } = render(
      <AgentProvider
        initialState={runningComposerState()}
        transport={new FakeAgentTransport()}
      >
        <AgentChat
          resolveLocalAttachment={(file) =>
            resolvedImageAttachment(`/uploads/${file.name}`, file.name)
          }
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(
      fileInput,
      new File(["png"], "remove-once.png", { type: "image/png" }),
    );
    await user.type(screen.getByLabelText("Message"), "remove once");
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(revoke).toHaveBeenCalledTimes(1);
    unmount();
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  it("transfers queued preview ownership to the composer on Edit", async () => {
    const user = userEvent.setup();
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    const { unmount } = render(
      <AgentProvider
        initialState={runningComposerState()}
        transport={new FakeAgentTransport()}
      >
        <AgentChat
          resolveLocalAttachment={(file) =>
            resolvedImageAttachment(`/uploads/${file.name}`, file.name)
          }
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(
      fileInput,
      new File(["png"], "edit-preview.png", { type: "image/png" }),
    );
    await user.type(screen.getByLabelText("Message"), "edit preview");
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(revoke).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Pending attachments")).toHaveTextContent(
      "edit-preview.png",
    );
    unmount();
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  it("clears queued previews when a server status notification archives the thread", async () => {
    const user = userEvent.setup();
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    function ArchiveNotification() {
      const { dispatch } = useInternalAgentContext();
      return (
        <button
          type="button"
          onClick={() =>
            dispatch({
              status: "archived",
              threadId: "thread-running",
              type: "thread/status/changed",
            })
          }
        >
          Server archives thread
        </button>
      );
    }
    const { unmount } = render(
      <AgentProvider
        initialState={runningComposerState()}
        transport={new FakeAgentTransport()}
      >
        <ArchiveNotification />
        <AgentChat
          resolveLocalAttachment={(file) =>
            resolvedImageAttachment(`/uploads/${file.name}`, file.name)
          }
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(
      fileInput,
      new File(["png"], "server-archived.png", { type: "image/png" }),
    );
    await user.type(screen.getByLabelText("Message"), "server archived queue");
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("Queued attachments")).toHaveTextContent(
      "server-archived.png",
    );

    await user.click(screen.getByRole("button", { name: "Server archives thread" }));
    await waitFor(() =>
      expect(screen.queryByLabelText("Queued follow-ups")).not.toBeInTheDocument(),
    );
    expect(revoke).toHaveBeenCalledTimes(1);
    unmount();
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  it("clears queued previews when a server status notification closes the thread", async () => {
    const user = userEvent.setup();
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    function CloseNotification() {
      const { dispatch } = useInternalAgentContext();
      return (
        <button
          type="button"
          onClick={() =>
            dispatch({
              status: "closed",
              threadId: "thread-running",
              type: "thread/status/changed",
            })
          }
        >
          Server closes thread
        </button>
      );
    }
    const { unmount } = render(
      <AgentProvider
        initialState={runningComposerState()}
        transport={new FakeAgentTransport()}
      >
        <CloseNotification />
        <AgentChat
          resolveLocalAttachment={(file) =>
            resolvedImageAttachment(`/uploads/${file.name}`, file.name)
          }
          sidebar={false}
          usage={false}
        />
      </AgentProvider>,
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(
      fileInput,
      new File(["png"], "server-closed.png", { type: "image/png" }),
    );
    await user.type(screen.getByLabelText("Message"), "server closed queue");
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("Queued attachments")).toHaveTextContent(
      "server-closed.png",
    );

    await user.click(screen.getByRole("button", { name: "Server closes thread" }));
    await waitFor(() =>
      expect(screen.queryByLabelText("Queued follow-ups")).not.toBeInTheDocument(),
    );
    expect(revoke).toHaveBeenCalledTimes(1);
    unmount();
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  it("keeps queued follow-ups after Stop", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "turn/interrupt") return {};
        return {};
      },
    });
    render(
      <AgentProvider initialState={runningComposerState()} transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    const message = screen.getByRole("textbox", { name: "Message" });
    await user.type(message, "keep after stop");
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: "Stop current turn" }));

    await waitFor(() =>
      expect(
        transport.requests.some((request) => request.method === "turn/interrupt"),
      ).toBe(true),
    );
    expect(screen.getByLabelText("Queued follow-ups")).toHaveTextContent(
      "keep after stop",
    );
  });

  it("does not submit while IME composition is active", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    render(
      <AgentProvider initialState={runningComposerState()} transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    const message = screen.getByRole("textbox", { name: "Message" });
    await user.type(message, "composition text");
    fireEvent.compositionStart(message);
    fireEvent.keyDown(message, { key: "Enter" });

    expect(screen.queryByLabelText("Queued follow-ups")).not.toBeInTheDocument();
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "turn/steer",
    );
  });

  it("does not leave messages marked in progress after the thread completes", () => {
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-real";
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
    initialState.threadLifecycle.activeThreadId = "thread-history";
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

  it("keeps large historical command output inline in transcript order", async () => {
    const user = userEvent.setup();
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-history";
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
                metadata: { command: `echo ${index}` },
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

    expect(screen.queryByText(/older work steps collapsed/)).not.toBeInTheDocument();
    expect(document.querySelector("[class*=work][class*=trace]")).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("Command output")).toHaveLength(48);
    expect(screen.getByText("32 earlier items hidden")).toBeInTheDocument();
    expect(screen.queryByText("echo 0")).not.toBeInTheDocument();
    expect(screen.getByText("echo 79")).toBeInTheDocument();
    expect(screen.queryByText("output 79")).toBeInTheDocument();
    expect(screen.queryByText(/output 79\n/)).not.toBeInTheDocument();
    await user.click(screen.getByText("Show earlier items"));
    expect(screen.getAllByLabelText("Command output")).toHaveLength(80);
    expect(screen.getByText("echo 0")).toBeInTheDocument();
    expect(document.querySelector(".aui-worklog")).not.toBeInTheDocument();
  });

  it("renders the fixture UI and resolves file-change approvals", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              {
                id: "thread-docs",
                name: "Protocol docs update",
                status: { type: "notLoaded" },
              },
            ],
          };
        }
        return {};
      },
    });
    const { container } = render(
      <AgentProvider
        initialState={runEventFixture(demoFixture as FixtureStep[])}
        transport={transport}
      >
        <AgentChat usage />
      </AgentProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Implement approval UI" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Threads" })).toBeInTheDocument();
    expect(await screen.findByText("Protocol docs update")).toBeInTheDocument();
    expect(document.querySelector("[class*=work][class*=trace]")).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("Command output").querySelector("summary")!);
    expect(screen.getByLabelText("Command output")).toHaveTextContent("7 tests passed");
    await user.click(screen.getByLabelText("Diff preview").querySelector("summary")!);
    expect(screen.getByLabelText("Diff preview")).toHaveTextContent("AgentDiffViewer");
    expect(
      screen
        .getByLabelText("Command output")
        .compareDocumentPosition(screen.getByLabelText("Diff preview")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getAllByLabelText("CodeMirror patch viewer").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Run policy:/ })).toBeInTheDocument();
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

    expect(transport.responses.get("string:approval-file")).toEqual({
      decision: "accept",
    });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders structured file-change approval payloads before decision actions", async () => {
    const initialState = createInitialAgentState();
    initialState.serverRequestQueue = {
      byId: {
        "string:approval-file-structured": {
          id: "approval-file-structured",
          kind: "fileChangeApproval",
          payload: {
            fileChanges: {
              "packages/react/src/components/approvals.tsx": {
                type: "update",
                unified_diff:
                  "@@ -1 +1,2 @@\n-old approval\n+new approval\n+visible diff\n",
              },
            },
            reason: "Review structured file changes before applying them.",
          },
          threadId: "thread-approval",
        },
      },
      order: ["string:approval-file-structured"],
    };

    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentApprovalQueue threadId="thread-approval" />
      </AgentProvider>,
    );

    expect(screen.getByText("1 file")).toBeInTheDocument();
    expect(screen.getByLabelText("Changed files")).toHaveTextContent(
      "packages/react/src/components/approvals.tsx",
    );
    expect(screen.getByLabelText("CodeMirror patch viewer")).toHaveTextContent(
      "visible diff",
    );
    expect(
      screen.getByRole("button", {
        name: "Approve file-change request approval-file-structured",
      }),
    ).toBeInTheDocument();
  });

  it("summarizes structured App Server patch payloads", async () => {
    render(
      <AgentDiffViewer
        patch={{
          changes: [
            {
              diff: "@@ -1 +1,2 @@\n-old\n+new\n+next\n",
              kind: "update",
              path: "packages/react/src/components/composer.tsx",
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
      "packages/react/src/components/composer.tsx",
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
        <AgentChat usage />
      </AgentProvider>,
    );

    await user.click(
      await screen.findByRole("button", {
        name: "Decline command request approval-command",
      }),
    );

    expect(transport.responses.get("string:approval-command")).toEqual({
      decision: "decline",
    });
    expect(
      screen.getByRole("button", {
        name: "Decline command request approval-command",
      }),
    ).toBeInTheDocument();
  });

  it("renders non-approval server requests as passive context without decision actions", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    render(
      <AgentProvider transport={transport}>
        <AgentApprovalQueue
          approvals={[
            approvalView({
              id: "request-input",
              kind: "userInput",
              itemId: "item-input",
              prompt: "Choose a deployment target",
              threadId: "thread-approval",
            }),
            approvalView({
              id: "request-permissions",
              kind: "permissionsApproval",
              reason: "Need workspace read access",
              threadId: "thread-approval",
            }),
            approvalView({
              id: "request-mcp",
              kind: "mcpElicitation",
              prompt: "MCP needs a value",
              threadId: "thread-approval",
            }),
            approvalView({
              argumentsText: '{\n  "url": "http://127.0.0.1:5174"\n}',
              id: "request-dynamic",
              kind: "dynamicTool",
              namespace: "mcp__browser",
              threadId: "thread-approval",
              tool: "get_app_state",
            }),
            approvalView({
              id: "request-auth",
              kind: "authRefresh",
              threadId: "thread-approval",
            }),
            approvalView({
              id: "request-attestation",
              kind: "attestation",
              threadId: "thread-approval",
            }),
          ]}
        />
      </AgentProvider>,
    );

    expect(screen.getByText("User input requested")).toBeInTheDocument();
    expect(screen.getByText("Choose a deployment target")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Approve / })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Decline / })).toBeNull();

    for (const reviewButton of screen.getAllByRole("button", { name: /^Review / })) {
      await user.click(reviewButton);
      expect(screen.queryByRole("button", { name: /^Approve / })).toBeNull();
      expect(screen.queryByRole("button", { name: /^Decline / })).toBeNull();
    }
    expect(transport.responses.size).toBe(0);
  });

  it("renders non-approval server requests through custom host rendering only", () => {
    render(
      <AgentProvider transport={new FakeAgentTransport()}>
        <AgentApprovalQueue
          approvals={[
            approvalView({
              id: "request-mcp",
              kind: "mcpElicitation",
              prompt: "MCP needs a value",
              threadId: "thread-approval",
            }),
          ]}
          renderApproval={(request) => (
            <div data-testid="host-request">{`Host handles ${request.kind}`}</div>
          )}
        />
      </AgentProvider>,
    );

    expect(screen.getByTestId("host-request")).toHaveTextContent(
      "Host handles mcpElicitation",
    );
    expect(screen.queryByText("MCP input requested")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Approve / })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Decline / })).toBeNull();
  });

  it("approves command and file-change requests for the session", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    render(
      <AgentProvider
        initialState={runEventFixture(demoFixture as FixtureStep[])}
        transport={transport}
      >
        <AgentChat usage />
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

    expect(transport.responses.get("string:approval-command")).toEqual({
      decision: "acceptForSession",
    });
    expect(transport.responses.get("string:approval-file")).toEqual({
      decision: "acceptForSession",
    });
  });

  it("responds to legacy approval payloads with legacy decisions", async () => {
    const user = userEvent.setup();
    const initialState = createInitialAgentState();
    initialState.serverRequestQueue = {
      byId: {
        "string:legacy-command": {
          id: "legacy-command",
          kind: "commandApproval",
          payload: {
            command: ["sh", "-lc", "bun test"],
            commandLine: "sh -lc 'bun test'",
            upstreamMethod: "execCommandApproval",
          },
          threadId: "thread-legacy",
        },
      },
      order: ["string:legacy-command"],
    };
    const transport = new FakeAgentTransport();
    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentApprovalQueue threadId="thread-legacy" />
      </AgentProvider>,
    );

    expect(screen.getByText("$ sh -lc 'bun test'")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: "Approve command request legacy-command for session",
      }),
    );
    expect(transport.responses.get("string:legacy-command")).toEqual({
      decision: "approved_for_session",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Decline command request legacy-command",
      }),
    );
    expect(transport.responses.get("string:legacy-command")).toEqual({
      decision: "denied",
    });
  });

  it("responds to controlled approval view props with public decisions", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    render(
      <AgentProvider transport={transport}>
        <AgentApprovalQueue
          approvals={[
            approvalView({
              command: "sh -lc 'bun test'",
              id: "legacy-controlled-command",
              kind: "commandApproval",
              risk: "medium",
              threadId: "thread-legacy",
            }),
          ]}
        />
      </AgentProvider>,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Approve command request legacy-controlled-command",
      }),
    );
    expect(transport.responses.get("string:legacy-controlled-command")).toEqual({
      decision: "accept",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Approve command request legacy-controlled-command for session",
      }),
    );
    expect(transport.responses.get("string:legacy-controlled-command")).toEqual({
      decision: "acceptForSession",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Decline command request legacy-controlled-command",
      }),
    );
    expect(transport.responses.get("string:legacy-controlled-command")).toEqual({
      decision: "decline",
    });
  });

  it("sends composer input as stable Codex user input items", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    const initialState = runEventFixture(demoFixture as FixtureStep[]);
    if (initialState.threadLifecycle.activeThreadId) {
      const activeThread =
        initialState.threads[initialState.threadLifecycle.activeThreadId]!;
      activeThread.activity = "idle";
      activeThread.runtime = { status: { type: "idle" } };
      activeThread.status = "complete";
      for (const turn of Object.values(activeThread.turns)) {
        turn.turn = { ...turn.turn, status: "completed" };
      }
    }
    initialState.serverRequestQueue = { byId: {}, order: [] };
    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    const message = await screen.findByLabelText("Message");
    await user.type(message, "hello codex");
    await user.keyboard("{Enter}");

    await waitFor(() =>
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
      }),
    );
  });

  it("shows compact context usage near the composer only for nonzero usage", async () => {
    const user = userEvent.setup();
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-usage";
    initialState.threads["thread-usage"] = {
      orderedTurnIds: [],
      status: "complete",
      thread: { id: "thread-usage", name: "Usage thread" },
      tokenUsage: {
        cachedInputTokens: 100,
        inputTokens: 700,
        last: { inputTokens: 300, outputTokens: 100, totalTokens: 400 },
        modelContextWindow: 1000,
        outputTokens: 90,
        reasoningOutputTokens: 10,
        totalTokens: 800,
      },
      turns: {},
    };
    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat />
      </AgentProvider>,
    );

    expect(screen.queryByLabelText("Token usage")).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("Context usage"));
    expect(screen.getByLabelText("Context usage details")).toHaveTextContent("80%");
    expect(screen.getByLabelText("Context usage details")).toHaveTextContent(
      "800 / 1,000",
    );
    expect(screen.getByLabelText("Context usage details")).toHaveTextContent(
      "Cached input",
    );

    const zeroState = createInitialAgentState();
    zeroState.threadLifecycle.activeThreadId = "thread-zero";
    zeroState.threads["thread-zero"] = {
      orderedTurnIds: [],
      status: "complete",
      thread: { id: "thread-zero", name: "Zero usage thread" },
      tokenUsage: { modelContextWindow: 1000, totalTokens: 0 },
      turns: {},
    };
    render(
      <AgentProvider initialState={zeroState} transport={new FakeAgentTransport()}>
        <AgentChat />
      </AgentProvider>,
    );
    expect(screen.getAllByLabelText("Context usage")).toHaveLength(1);
  });

  it("sends composer attachments as structured turn input items", async () => {
    const user = userEvent.setup();
    const prompt = vi.spyOn(globalThis, "prompt");
    const transport = new FakeAgentTransport();
    const initialState = runEventFixture(demoFixture as FixtureStep[]);
    if (initialState.threadLifecycle.activeThreadId) {
      const activeThread =
        initialState.threads[initialState.threadLifecycle.activeThreadId]!;
      activeThread.activity = "idle";
      activeThread.runtime = { status: { type: "idle" } };
      activeThread.status = "complete";
      for (const turn of Object.values(activeThread.turns)) {
        turn.turn = { ...turn.turn, status: "completed" };
      }
    }
    initialState.serverRequestQueue = { byId: {}, order: [] };
    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentChat
          composerIntegrations={[
            {
              id: "browser",
              label: "Browser",
              resolve: () => ({
                input: { name: "Browser", path: "agent://integration/browser", type: "mention" },
                label: "Browser",
              }),
            },
            {
              id: "workspace-search",
              label: "Workspace search",
              resolve: () => ({
                input: textInput("Use the workspace search integration."),
                label: "Workspace search",
              }),
            },
          ]}
        />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Browser" }));
    await user.click(screen.getByRole("button", { name: "Workspace search" }));
    await user.type(screen.getByLabelText("Message"), "verify with attachments");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(prompt).not.toHaveBeenCalled();
    expect(
      transport.requests.findLast((request) => request.method === "turn/start")?.params,
    ).toMatchObject({
      input: [
        { text: "verify with attachments", text_elements: [], type: "text" },
        { name: "Browser", path: "agent://integration/browser", type: "mention" },
        {
          text: "Use the workspace search integration.",
          text_elements: [],
          type: "text",
        },
      ],
    });
  });

  it("preserves explicit text elements in composer integration input", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    const initialState = runEventFixture(demoFixture as FixtureStep[]);
    if (initialState.threadLifecycle.activeThreadId) {
      const activeThread =
        initialState.threads[initialState.threadLifecycle.activeThreadId]!;
      activeThread.activity = "idle";
      activeThread.runtime = { status: { type: "idle" } };
      activeThread.status = "complete";
      for (const turn of Object.values(activeThread.turns)) {
        turn.turn = { ...turn.turn, status: "completed" };
      }
    }
    initialState.serverRequestQueue = { byId: {}, order: [] };
    const textElements = [{ kind: "mention", uri: "agent://integration/search" }];
    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentChat
          composerIntegrations={[
            {
              id: "search-context",
              label: "Search context",
              resolve: () => ({
                input: {
                  text: "Use selected search context.",
                  text_elements: textElements,
                  type: "text",
                },
                label: "Search context",
              }),
            },
          ]}
        />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Search context" }));
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(
      transport.requests.findLast((request) => request.method === "turn/start")?.params,
    ).toMatchObject({
      input: [
        {
          text: "Use selected search context.",
          text_elements: textElements,
          type: "text",
        },
      ],
    });
  });

  it("applies composer run-settings menus to turn/start params", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    const initialState = runEventFixture(demoFixture as FixtureStep[]);
    if (initialState.threadLifecycle.activeThreadId) {
      const activeThread =
        initialState.threads[initialState.threadLifecycle.activeThreadId]!;
      activeThread.activity = "idle";
      activeThread.runtime = { status: { type: "idle" } };
      activeThread.status = "complete";
      for (const turn of Object.values(activeThread.turns)) {
        turn.turn = { ...turn.turn, status: "completed" };
      }
    }
    initialState.serverRequestQueue = { byId: {}, order: [] };
    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    // Run policy is a compact menu in the composer toolbar.
    await user.click(await screen.findByRole("button", { name: /Run policy:/ }));
    await user.click(screen.getByRole("menuitemradio", { name: /Read-only/ }));

    // Model and effort share a second compact menu; selecting the model first
    // is what unlocks its effort options.
    await user.click(screen.getByRole("button", { name: /Model and effort:/ }));
    await user.click(
      screen.getByRole("menuitemradio", { name: /fixture-demo-coding-model/ }),
    );
    await user.click(screen.getByRole("button", { name: /Model and effort:/ }));
    await user.click(screen.getByRole("menuitemradio", { name: "High" }));

    await user.type(screen.getByLabelText("Message"), "inspect only");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(
      transport.requests.findLast((request) => request.method === "turn/start")?.params,
    ).toMatchObject({
      approvalPolicy: "untrusted",
      effort: "high",
      model: "fixture-demo-coding-model",
      sandboxPolicy: { networkAccess: false, type: "readOnly" },
      threadId: "thread-demo",
    });
  });

  it("uses only host-supplied run policies in composer turn/start params", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    const initialState = runEventFixture(demoFixture as FixtureStep[]);
    if (initialState.threadLifecycle.activeThreadId) {
      const activeThread =
        initialState.threads[initialState.threadLifecycle.activeThreadId]!;
      activeThread.activity = "idle";
      activeThread.runtime = { status: { type: "idle" } };
      activeThread.status = "complete";
      for (const turn of Object.values(activeThread.turns)) {
        turn.turn = { ...turn.turn, status: "completed" };
      }
    }
    initialState.serverRequestQueue = { byId: {}, order: [] };
    render(
      <AgentProvider
        initialState={initialState}
        runPolicies={[
          {
            description: "Host permits read-only turns.",
            id: "host-safe",
            label: "Host safe",
            turnOptions: {
              approvalPolicy: "untrusted",
              sandboxPolicy: { networkAccess: false, type: "readOnly" },
            },
          },
        ]}
        transport={transport}
      >
        <AgentChat />
      </AgentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: /Run policy:/ }));
    expect(screen.getByRole("menuitemradio", { name: /Host safe/ })).toBeVisible();
    expect(
      screen.queryByRole("menuitemradio", { name: /Full access/ }),
    ).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.type(screen.getByLabelText("Message"), "use host policy");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(
      transport.requests.findLast((request) => request.method === "turn/start")?.params,
    ).toMatchObject({
      approvalPolicy: "untrusted",
      sandboxPolicy: { networkAccess: false, type: "readOnly" },
      threadId: "thread-demo",
    });
  });

  it("normalizes empty and stale run policy state to safe defaults", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    const initialState = runEventFixture(demoFixture as FixtureStep[]);
    initialState.runSettings.policyId = "full-access";
    if (initialState.threadLifecycle.activeThreadId) {
      const activeThread =
        initialState.threads[initialState.threadLifecycle.activeThreadId]!;
      activeThread.activity = "idle";
      activeThread.runtime = { status: { type: "idle" } };
      activeThread.status = "complete";
      for (const turn of Object.values(activeThread.turns)) {
        turn.turn = { ...turn.turn, status: "completed" };
      }
    }
    initialState.serverRequestQueue = { byId: {}, order: [] };
    render(
      <AgentProvider initialState={initialState} runPolicies={[]} transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: /Run policy:/ }));
    expect(screen.getByRole("menuitemradio", { name: /Review/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(
      screen.queryByRole("menuitemradio", { name: /Full access/ }),
    ).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.type(screen.getByLabelText("Message"), "use default policy");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(
      transport.requests.findLast((request) => request.method === "turn/start")?.params,
    ).toMatchObject({
      approvalPolicy: "on-request",
      sandboxPolicy: {
        excludeSlashTmp: false,
        excludeTmpdirEnvVar: false,
        networkAccess: false,
        type: "workspaceWrite",
        writableRoots: [],
      },
      threadId: "thread-demo",
    });
  });

  it("does not expose working-directory editing on an existing thread", async () => {
    const transport = new FakeAgentTransport();
    const initialState = runEventFixture(demoFixture as FixtureStep[]);
    if (initialState.threadLifecycle.activeThreadId) {
      initialState.threads[initialState.threadLifecycle.activeThreadId]!.status =
        "complete";
    }
    initialState.serverRequestQueue = { byId: {}, order: [] };
    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    expect(await screen.findByLabelText("Message")).toBeInTheDocument();
    expect(screen.queryByLabelText("Working directory")).not.toBeInTheDocument();
  });

  it("renders conversation messages as safe markdown", () => {
    renderMessageListWithThread({
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
                  text: "## Result\n\n- `bun test` passed\n- [Docs](https://example.com)\n\n```sh\nbun test\n```\n\n| File | State |\n| --- | --- |\n| README.md | updated |\n\n<script>alert('x')</script>",
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
    });

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
    renderMessageListWithThread(
      {
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
      },
      {
        renderItem: (entry) => {
          if (entry.itemId === "item-hidden") return null;
          return undefined;
        },
      },
    );

    expect(screen.queryByText("Internal prompt")).not.toBeInTheDocument();
    expect(screen.getByText("Visible answer")).toBeInTheDocument();
  });

  it("lets components map replace transcript blocks with Default fallback", () => {
    renderMessageListWithThread(
      {
        orderedTurnIds: ["turn-block-components"],
        status: "complete",
        thread: { id: "thread-block-components", name: "Blocks" },
        turns: {
          "turn-block-components": {
            blocksByItemId: {
              "cmd-block": {
                command: "bun test",
                id: "cmd-block",
                kind: "commandExecution",
              },
            },
            commandOutputByItemId: {},
            filePatchByItemId: {},
            itemOrder: ["cmd-block"],
            items: {
              "cmd-block": {
                id: "cmd-block",
                kind: "commandExecution",
                status: "completed",
                text: "bun test",
                threadId: "thread-block-components",
                turnId: "turn-block-components",
              },
            },
            streamingTextByItemId: {},
            turn: {
              id: "turn-block-components",
              status: "completed",
              threadId: "thread-block-components",
            },
          },
        },
      },
      {
        components: {
          blocks: {
            commandExecution: ({ block, Default }) => (
              <section>
                Custom block {block.kind}
                <Default block={block} />
              </section>
            ),
          },
        },
      },
    );

    expect(screen.getByText("Custom block commandExecution")).toBeInTheDocument();
    expect(screen.getByText("bun test")).toBeInTheDocument();
    expect(
      screen.getByText("Custom block commandExecution").closest(".aui-message"),
    ).toHaveAttribute("data-kind", "commandExecution");
  });

  it("starts a thread with first input through the public composer controller", async () => {
    const user = userEvent.setup();
    let resolveThreadStart:
      | ((result: {
          thread: { id: string; name: string; status: { type: string } };
        }) => void)
      | undefined;
    const threadStartResult = new Promise<{
      thread: { id: string; name: string; status: { type: string } };
    }>((resolve) => {
      resolveThreadStart = resolve;
    });
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/start") {
          return threadStartResult;
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <PublicFirstMessageStartProbe />
        <ActiveThreadStateProbe />
      </AgentProvider>,
    );

    await user.type(
      screen.getByRole("textbox", { name: "Public first message" }),
      "public start",
    );
    await user.click(screen.getByRole("button", { name: "Public start with input" }));

    await waitFor(() =>
      expect(screen.getByLabelText("active thread id")).toHaveTextContent(
        /^pending-thread-/,
      ),
    );
    const pendingUserMessageId =
      screen.getByLabelText("active item id").textContent ?? "";
    expect(screen.getByLabelText("active item text")).toHaveTextContent("public start");
    expect(screen.getByLabelText("active item status")).toHaveTextContent("inProgress");
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "turn/start",
    );

    resolveThreadStart?.({
      thread: {
        id: "thread-public-start",
        name: "Public thread",
        status: { type: "idle" },
      },
    });

    await waitFor(() =>
      expect(
        transport.requests.find((request) => request.method === "turn/start")?.params,
      ).toMatchObject({
        clientUserMessageId: pendingUserMessageId,
        threadId: "thread-public-start",
      }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("public start result")).toHaveTextContent(
        "thread-public-start",
      ),
    );
    expect(screen.getByLabelText("active thread id")).toHaveTextContent(
      "thread-public-start",
    );
    expect(screen.getByLabelText("public start error")).toHaveTextContent("none");
  });

  it("passes first-turn thread and turn options, local images, and stable metadata through the public composer controller", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/start") {
          return {
            thread: {
              id: "thread-options-canonical",
              name: "Options thread",
              status: { type: "idle" },
            },
          };
        }
        if (request.method === "turn/start") {
          return {
            turn: {
              id: "turn-options-canonical",
              status: "inProgress",
              threadId: "thread-options-canonical",
            },
          };
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <PublicFirstMessageStartWithOptionsProbe />
        <ActiveThreadStateProbe />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Set review policy" }));
    await user.click(screen.getByRole("button", { name: "Public start with options" }));

    await waitFor(() =>
      expect(screen.getByLabelText("public start options result")).toHaveTextContent(
        "thread-options-canonical",
      ),
    );
    const threadStartParams = transport.requests.find(
      (request) => request.method === "thread/start",
    )?.params;
    expect(threadStartParams).toMatchObject({
      approvalPolicy: "on-request",
      cwd: "/host/project",
      model: "thread-model",
      sandbox: "workspace-write",
      threadSource: "user",
    });
    const turnStartParams = transport.requests.find(
      (request) => request.method === "turn/start",
    )?.params;
    expect(turnStartParams).toMatchObject({
      approvalPolicy: "never",
      clientUserMessageId: expect.stringMatching(/^pending-user-message-/),
      cwd: "/host/project/turn",
      effort: "high",
      input: [
        { text: "inspect image", text_elements: [], type: "text" },
        { path: "/tmp/agent-ui-first-turn.png", type: "localImage" },
      ],
      model: "turn-model",
      sandboxPolicy: {
        type: "workspaceWrite",
      },
      serviceTier: "flex",
      threadId: "thread-options-canonical",
    });
    const result = JSON.parse(
      screen.getByLabelText("public start options result").textContent ?? "{}",
    ) as Record<string, string>;
    expect(result).toMatchObject({
      operationId: expect.stringMatching(/^first-message-/),
      optimisticTurnId: expect.stringMatching(/^pending-turn-/),
      threadId: "thread-options-canonical",
      turnId: "turn-options-canonical",
      userMessageId: turnStartParams?.clientUserMessageId,
    });
    expect(screen.getByLabelText("active turn id")).toHaveTextContent(
      result.optimisticTurnId,
    );
    expect(screen.getByLabelText("active thread id")).toHaveTextContent(
      "thread-options-canonical",
    );
    expect(screen.getByLabelText("public start options error")).toHaveTextContent("none");
  });

  it("retries first messages with the original turn options", async () => {
    const user = userEvent.setup();
    let turnStartCalls = 0;
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/start") {
          return {
            thread: {
              id: "thread-options-retry",
              name: "Options retry thread",
              status: { type: "idle" },
            },
          };
        }
        if (request.method === "turn/start") {
          turnStartCalls += 1;
          if (turnStartCalls === 1) throw new Error("turn failed once");
          return {};
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <PublicFirstMessageStartWithOptionsProbe />
        <PublicComposerControllerProbe />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Set review policy" }));
    await user.click(screen.getByRole("button", { name: "Public start with options" }));

    await waitFor(() =>
      expect(screen.getByLabelText("public failed pending count")).toHaveTextContent("1"),
    );
    await user.click(
      screen.getByRole("button", { name: "Retry failed pending message" }),
    );

    await waitFor(() =>
      expect(screen.getByLabelText("public failed pending count")).toHaveTextContent("0"),
    );
    const turnStartRequests = transport.requests.filter(
      (request) => request.method === "turn/start",
    );
    expect(turnStartRequests).toHaveLength(2);
    expect(turnStartRequests[1]?.params).toMatchObject({
      approvalPolicy: "never",
      cwd: "/host/project/turn",
      effort: "high",
      model: "turn-model",
      sandboxPolicy: {
        type: "workspaceWrite",
      },
      serviceTier: "flex",
      threadId: "thread-options-retry",
    });
  });

  it("does not start blank first-message threads through the public composer controller", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    render(
      <AgentProvider transport={transport}>
        <PublicFirstMessageStartProbe />
        <ActiveThreadStateProbe />
      </AgentProvider>,
    );

    await user.type(screen.getByRole("textbox", { name: "Public first message" }), "   ");
    await user.click(screen.getByRole("button", { name: "Public start with input" }));

    await waitFor(() =>
      expect(screen.getByLabelText("public start error")).toHaveTextContent(
        "Cannot start a thread without input.",
      ),
    );
    expect(screen.getByLabelText("active thread id")).toHaveTextContent("none");
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "thread/start",
    );
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "turn/start",
    );

    await user.click(
      screen.getByRole("button", { name: "Public start with blank array input" }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("public start error")).toHaveTextContent(
        "Cannot start a thread without input.",
      ),
    );
    expect(screen.getByLabelText("active thread id")).toHaveTextContent("none");
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "thread/start",
    );
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "turn/start",
    );
  });

  it("shares draft state between AgentChat composer and external chat controller", async () => {
    const user = userEvent.setup();
    render(
      <AgentProvider initialState={idleComposerState()} transport={new FakeAgentTransport()}>
        <AgentChat />
        <PublicChatControllerProbe />
      </AgentProvider>,
    );

    const textarea = await screen.findByRole("textbox", { name: "Message" });
    await user.type(textarea, "shared draft");
    expect(screen.getByLabelText("public chat value")).toHaveTextContent(
      "shared draft",
    );
    await user.click(screen.getByRole("button", { name: "Set external draft" }));
    expect(textarea).toHaveValue("external draft");
  });

  it("sends an external first message through the public chat controller lifecycle", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/start") {
          return {
            thread: {
              id: "thread-external-first",
              name: "External first thread",
              status: { type: "idle" },
            },
          };
        }
        if (request.method === "turn/start") {
          return {
            turn: {
              id: "turn-external-first",
              status: "inProgress",
              threadId: "thread-external-first",
            },
          };
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat />
        <PublicChatControllerProbe />
        <ActiveThreadStateProbe />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Send external first" }));

    await waitFor(() =>
      expect(screen.getByLabelText("active thread id")).toHaveTextContent(
        "thread-external-first",
      ),
    );
    expect(screen.getByLabelText("active item text")).toHaveTextContent(
      "external first",
    );
    expect(screen.getByLabelText("public chat result")).toHaveTextContent(
      "started:thread-external-first",
    );
    expect(
      transport.requests.find((request) => request.method === "turn/start")?.params,
    ).toMatchObject({
      input: [{ text: "external first", text_elements: [], type: "text" }],
      threadId: "thread-external-first",
    });
  });

  it("sends an external follow-up on the active idle thread without raw transport calls", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "turn/start") return {};
        return {};
      },
    });
    render(
      <AgentProvider initialState={idleComposerState()} transport={transport}>
        <AgentChat />
        <PublicChatControllerProbe />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Send external follow up" }));

    await waitFor(() =>
      expect(
        transport.requests.find((request) => request.method === "turn/start")?.params,
      ).toMatchObject({
        input: [{ text: "external follow up", text_elements: [], type: "text" }],
        threadId: "thread-idle",
      }),
    );
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "thread/start",
    );
    expect(screen.getByLabelText("public chat result")).toHaveTextContent("sent");

    await user.click(
      screen.getByRole("button", { name: "Send external follow up with options" }),
    );
    await waitFor(() =>
      expect(
        transport.requests.filter((request) => request.method === "turn/start")[1]
          ?.params,
      ).toMatchObject({
        effort: "high",
        input: [
          {
            text: "external follow up with options",
            text_elements: [],
            type: "text",
          },
        ],
        model: "external-model",
        serviceTier: "flex",
        threadId: "thread-idle",
      }),
    );
    expect(screen.getByLabelText("public chat result")).toHaveTextContent(
      "sent:thread-idle",
    );
  });

  it("queues an external follow-up when the active thread is running", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    render(
      <AgentProvider initialState={runningComposerState()} transport={transport}>
        <AgentChat />
        <PublicChatControllerProbe />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Send external follow up" }));

    expect(await screen.findByLabelText("Queued follow-ups")).toHaveTextContent(
      "external follow up",
    );
    expect(screen.getByLabelText("public chat result")).toHaveTextContent(
      "queued:thread-running",
    );
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "turn/start",
    );
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "turn/steer",
    );
  });

  it("starts new threads with selected model and working directory", async () => {
    const user = userEvent.setup();
    let resolveThreadStart:
      | ((result: {
          thread: { id: string; name: string; status: { type: string } };
        }) => void)
      | undefined;
    const threadStartResult = new Promise<{
      thread: { id: string; name: string; status: { type: string } };
    }>((resolve) => {
      resolveThreadStart = resolve;
    });
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
          return threadStartResult;
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat onRequestWorkingDirectory={() => "/tmp/agent-ui"} />
        <ActiveThreadStateProbe />
      </AgentProvider>,
    );

    await waitFor(() =>
      expect(transport.requests.some((request) => request.method === "model/list")).toBe(
        true,
      ),
    );
    await user.click(screen.getByRole("button", { name: /Model and effort:/ }));
    await user.click(await screen.findByRole("menuitemradio", { name: /Real Model/ }));
    await user.click(screen.getByRole("button", { name: "Open folder" }));
    expect(
      await screen.findByRole("button", { name: "Working directory" }),
    ).toHaveTextContent("agent-ui");
    await user.type(screen.getByRole("textbox", { name: "Message" }), "start here");
    await user.click(screen.getByRole("button", { name: "Start thread" }));

    await waitFor(() =>
      expect(screen.getByLabelText("active thread id")).toHaveTextContent(
        /^pending-thread-/,
      ),
    );
    const pendingThreadId = screen.getByLabelText("active thread id").textContent ?? "";
    expect(screen.getByLabelText("active turn id")).toHaveTextContent(/^pending-turn-/);
    expect(screen.getByLabelText("active item id")).toHaveTextContent(
      /^pending-user-message-/,
    );
    const pendingUserMessageId =
      screen.getByLabelText("active item id").textContent ?? "";
    expect(screen.getByLabelText("active item text")).toHaveTextContent("start here");
    expect(screen.getByLabelText("active item status")).toHaveTextContent("inProgress");
    expect(screen.getByLabelText("active item thread id")).toHaveTextContent(
      pendingThreadId,
    );
    expect(screen.getByLabelText("pending operation count")).toHaveTextContent("1");
    expect(screen.getByLabelText("pending operation status")).toHaveTextContent(
      "pending",
    );
    expect(
      transport.requests.find((request) => request.method === "thread/start")?.params,
    ).toEqual({
      cwd: "/tmp/agent-ui",
      model: "real-model",
    });
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "turn/start",
    );

    resolveThreadStart?.({
      thread: {
        id: "thread-new",
        name: "New real thread",
        status: { type: "idle" },
      },
    });
    await waitFor(() =>
      expect(
        transport.requests.find((request) => request.method === "turn/start")?.params,
      ).toMatchObject({
        clientUserMessageId: pendingUserMessageId,
        input: [{ text: "start here", text_elements: [], type: "text" }],
        model: "real-model",
        threadId: "thread-new",
      }),
    );
    expect(
      transport.requests.find((request) => request.method === "turn/start")?.params,
    ).not.toHaveProperty("cwd");
    await waitFor(() =>
      expect(screen.getByLabelText("active thread id")).toHaveTextContent("thread-new"),
    );
    expect(screen.getByLabelText("active item thread id")).toHaveTextContent(
      "thread-new",
    );
    expect(screen.getByLabelText("pending operation count")).toHaveTextContent("0");
    expect(screen.getByLabelText("pending operation status")).toHaveTextContent("none");
    await waitFor(() => expect(screen.getAllByText("Ready").length).toBeGreaterThan(0));
    expect(screen.queryByRole("button", { name: "Resume" })).not.toBeInTheDocument();
  });

  it("rolls back pending first-run state when thread start fails", async () => {
    const user = userEvent.setup();
    let rejectThreadStart: ((error: Error) => void) | undefined;
    const threadStartResult = new Promise<never>((_resolve, reject) => {
      rejectThreadStart = reject;
    });
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return { account: { email: "real@example.com", planType: "pro" } };
        }
        if (request.method === "thread/start") {
          return threadStartResult;
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat />
        <ActiveThreadStateProbe />
        <ComposerOperationProbe />
        <PublicComposerControllerProbe />
      </AgentProvider>,
    );

    await user.type(await screen.findByRole("textbox", { name: "Message" }), "fail now");
    await user.click(screen.getByRole("button", { name: "Start thread" }));
    await waitFor(() =>
      expect(screen.getByLabelText("active thread id")).toHaveTextContent(
        /^pending-thread-/,
      ),
    );
    expect(screen.getByLabelText("pending operation count")).toHaveTextContent("1");

    rejectThreadStart?.(new Error("start failed"));

    await waitFor(() =>
      expect(screen.getByLabelText("active thread id")).toHaveTextContent("none"),
    );
    expect(screen.getByLabelText("active item id")).toHaveTextContent("none");
    expect(screen.getByLabelText("pending operation count")).toHaveTextContent("0");
    expect(screen.getByRole("textbox", { name: "Message" })).toBeInTheDocument();
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "turn/start",
    );
  });

  it("does not duplicate rollback or retry work after unmount", async () => {
    const user = userEvent.setup();
    let rejectThreadStart: ((error: Error) => void) | undefined;
    const threadStartResult = new Promise<never>((_resolve, reject) => {
      rejectThreadStart = reject;
    });
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return { account: { email: "real@example.com", planType: "pro" } };
        }
        if (request.method === "thread/start") {
          return threadStartResult;
        }
        return {};
      },
    });
    const rendered = render(
      <AgentProvider transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    await user.type(await screen.findByRole("textbox", { name: "Message" }), "unmount");
    await user.click(screen.getByRole("button", { name: "Start thread" }));
    await waitFor(() =>
      expect(
        transport.requests.filter((request) => request.method === "thread/start"),
      ).toHaveLength(1),
    );

    rendered.unmount();
    rejectThreadStart?.(new Error("start failed after unmount"));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      transport.requests.filter((request) => request.method === "thread/start"),
    ).toHaveLength(1);
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "turn/start",
    );
  });

  it("keeps the real thread and marks the first message failed when turn start fails", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return { account: { email: "real@example.com", planType: "pro" } };
        }
        if (request.method === "thread/start") {
          return {
            thread: {
              id: "thread-real",
              name: "Real thread",
              status: { type: "idle" },
            },
          };
        }
        if (request.method === "turn/start") {
          throw new Error("turn failed");
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat />
        <ActiveThreadStateProbe />
        <ComposerOperationProbe />
        <PublicComposerControllerProbe />
      </AgentProvider>,
    );

    await user.type(await screen.findByRole("textbox", { name: "Message" }), "fail turn");
    await user.click(screen.getByRole("button", { name: "Start thread" }));

    await waitFor(() =>
      expect(screen.getByLabelText("active thread id")).toHaveTextContent("thread-real"),
    );
    expect(screen.getByLabelText("active item id")).toHaveTextContent(
      /^pending-user-message-/,
    );
    expect(screen.getByLabelText("active item text")).toHaveTextContent("fail turn");
    expect(screen.getByLabelText("active item status")).toHaveTextContent("failed");
    expect(screen.getByLabelText("active item thread id")).toHaveTextContent(
      "thread-real",
    );
    expect(screen.getByLabelText("pending operation count")).toHaveTextContent("0");
    expect(screen.getByLabelText("composer operation status")).toHaveTextContent(
      "failed",
    );
    expect(screen.getByLabelText("public failed pending count")).toHaveTextContent("1");
    expect(screen.getByLabelText("public failed pending error")).toHaveTextContent(
      "turn failed",
    );
    expect(screen.getByRole("heading", { name: "Message was not sent" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Retry message" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Dismiss failed message" }),
    ).toBeEnabled();
    expect(screen.getByLabelText("public composer submit mode")).toHaveTextContent(
      "send",
    );
    expect(screen.getByLabelText("public composer can submit")).toHaveTextContent(
      "false",
    );
    expect(screen.getByLabelText("public composer disabled reason")).toHaveTextContent(
      "empty",
    );
    expect(
      transport.requests.find((request) => request.method === "turn/start")?.params,
    ).toMatchObject({
      threadId: "thread-real",
    });
    await user.click(screen.getByRole("button", { name: "Cancel operation" }));
    expect(screen.getByLabelText("composer operation status")).toHaveTextContent(
      "cancelled",
    );
    expect(screen.getByLabelText("public failed pending count")).toHaveTextContent("0");
  });

  it("retries failed first messages on the real thread by operation id", async () => {
    const user = userEvent.setup();
    let turnStartCalls = 0;
    let resolveRetryTurnStart: (() => void) | undefined;
    const retryTurnStartResult = new Promise<void>((resolve) => {
      resolveRetryTurnStart = resolve;
    });
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return { account: { email: "real@example.com", planType: "pro" } };
        }
        if (request.method === "thread/start") {
          return {
            thread: {
              id: "thread-retry",
              name: "Retry thread",
              status: { type: "idle" },
            },
          };
        }
        if (request.method === "turn/start") {
          turnStartCalls += 1;
          if (turnStartCalls === 1) throw new Error("turn failed once");
          return retryTurnStartResult;
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat />
        <ActiveThreadStateProbe />
        <ComposerOperationProbe />
        <PublicComposerControllerProbe />
      </AgentProvider>,
    );

    await user.type(await screen.findByRole("textbox", { name: "Message" }), "retry me");
    await user.click(screen.getByRole("button", { name: "Start thread" }));

    await waitFor(() =>
      expect(screen.getByLabelText("composer operation status")).toHaveTextContent(
        "failed",
      ),
    );
    expect(screen.getByLabelText("public failed pending count")).toHaveTextContent("1");
    const firstTurnStartParams = transport.requests.find(
      (request) => request.method === "turn/start",
    )?.params as Record<string, unknown>;
    const retryMessageArticle = screen
      .getAllByText("retry me")
      .map((node) => node.closest("article"))
      .find((article) => article?.classList.contains("aui-message"));
    expect(retryMessageArticle).toHaveAttribute("data-status", "failed");
    await user.click(screen.getByRole("button", { name: "Retry message" }));
    await waitFor(() =>
      expect(screen.getByLabelText("composer operation status")).toHaveTextContent(
        "pending",
      ),
    );
    expect(screen.getByLabelText("public failed pending count")).toHaveTextContent("0");
    expect(
      transport.requests.filter((request) => request.method === "turn/start"),
    ).toHaveLength(2);
    expect(retryMessageArticle).toHaveTextContent("retry me");
    expect(retryMessageArticle).toHaveAttribute("data-status", "inProgress");
    resolveRetryTurnStart?.();

    await waitFor(() =>
      expect(screen.getByLabelText("composer operation status")).toHaveTextContent(
        "succeeded",
      ),
    );
    const threadStartRequests = transport.requests.filter(
      (request) => request.method === "thread/start",
    );
    const turnStartRequests = transport.requests.filter(
      (request) => request.method === "turn/start",
    );
    expect(threadStartRequests).toHaveLength(1);
    expect(turnStartRequests).toHaveLength(2);
    expect(turnStartRequests[1]?.params).toMatchObject({
      clientUserMessageId: firstTurnStartParams.clientUserMessageId,
      threadId: "thread-retry",
    });
  });

  it("keeps a retried first message failed when the retry is dismissed while pending", async () => {
    const user = userEvent.setup();
    let turnStartCalls = 0;
    let resolveRetryTurnStart: (() => void) | undefined;
    const retryTurnStartResult = new Promise<void>((resolve) => {
      resolveRetryTurnStart = resolve;
    });
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return { account: { email: "real@example.com", planType: "pro" } };
        }
        if (request.method === "thread/start") {
          return {
            thread: {
              id: "thread-retry-cancel",
              name: "Retry cancel thread",
              status: { type: "idle" },
            },
          };
        }
        if (request.method === "turn/start") {
          turnStartCalls += 1;
          if (turnStartCalls === 1) throw new Error("turn failed once");
          return retryTurnStartResult;
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat />
        <ActiveThreadStateProbe />
        <ComposerOperationProbe />
      </AgentProvider>,
    );

    await user.type(await screen.findByRole("textbox", { name: "Message" }), "cancel retry");
    await user.click(screen.getByRole("button", { name: "Start thread" }));
    await waitFor(() =>
      expect(screen.getByLabelText("composer operation status")).toHaveTextContent(
        "failed",
      ),
    );
    const retryMessageArticle = screen
      .getAllByText("cancel retry")
      .map((node) => node.closest("article"))
      .find((article) => article?.classList.contains("aui-message"));
    expect(retryMessageArticle).toHaveAttribute("data-status", "failed");

    await user.click(screen.getByRole("button", { name: "Retry message" }));
    await waitFor(() =>
      expect(screen.getByLabelText("composer operation status")).toHaveTextContent(
        "pending",
      ),
    );
    expect(retryMessageArticle).toHaveAttribute("data-status", "inProgress");

    await user.click(screen.getByRole("button", { name: "Cancel operation" }));
    expect(screen.getByLabelText("composer operation status")).toHaveTextContent(
      "cancelled",
    );
    expect(retryMessageArticle).toHaveAttribute("data-status", "failed");
    resolveRetryTurnStart?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByLabelText("composer operation status")).toHaveTextContent(
      "cancelled",
    );
    expect(retryMessageArticle).toHaveAttribute("data-status", "failed");
  });

  it("does not expose failed pending messages when no thread is active", () => {
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = undefined;
    initialState.threadLifecycle.operations["operation-hidden"] = {
      error: { message: "hidden turn failed" },
      id: "operation-hidden",
      kind: "firstMessage",
      status: "failed",
      threadId: "thread-hidden",
    };
    render(
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <PublicComposerControllerProbe />
      </AgentProvider>,
    );

    expect(screen.getByLabelText("public failed pending count")).toHaveTextContent("0");
    expect(screen.getByLabelText("public failed pending error")).toHaveTextContent(
      "none",
    );
    expect(screen.getByLabelText("public failed pending id")).toHaveTextContent("none");
    expect(
      screen.getByRole("button", { name: "Retry failed pending message" }),
    ).toBeDisabled();
  });

  it("keeps cancelled retry operations cancelled when the retry resolves", async () => {
    const user = userEvent.setup();
    let turnStartCalls = 0;
    let resolveRetryTurnStart: (() => void) | undefined;
    const retryTurnStartResult = new Promise<void>((resolve) => {
      resolveRetryTurnStart = resolve;
    });
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return { account: { email: "real@example.com", planType: "pro" } };
        }
        if (request.method === "thread/start") {
          return {
            thread: {
              id: "thread-cancel-retry",
              name: "Cancel retry thread",
              status: { type: "idle" },
            },
          };
        }
        if (request.method === "turn/start") {
          turnStartCalls += 1;
          if (turnStartCalls === 1) throw new Error("turn failed once");
          return retryTurnStartResult;
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat />
        <ComposerOperationProbe />
      </AgentProvider>,
    );

    await user.type(
      await screen.findByRole("textbox", { name: "Message" }),
      "cancel retry",
    );
    await user.click(screen.getByRole("button", { name: "Start thread" }));
    await waitFor(() =>
      expect(screen.getByLabelText("composer operation status")).toHaveTextContent(
        "failed",
      ),
    );

    await user.click(screen.getByRole("button", { name: "Retry operation" }));
    await waitFor(() =>
      expect(screen.getByLabelText("composer operation status")).toHaveTextContent(
        "pending",
      ),
    );
    await user.click(screen.getByRole("button", { name: "Cancel operation" }));
    expect(screen.getByLabelText("composer operation status")).toHaveTextContent(
      "cancelled",
    );
    resolveRetryTurnStart?.();
    await waitFor(() =>
      expect(screen.getByLabelText("composer operation status")).toHaveTextContent(
        "cancelled",
      ),
    );
    expect(
      transport.requests.filter((request) => request.method === "turn/start"),
    ).toHaveLength(2);
  });

  it("leaves the selected working directory unchanged when folder selection is canceled", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return { account: { email: "real@example.com", planType: "pro" } };
        }
        if (request.method === "thread/list") {
          return {
            threads: [
              {
                cwd: "/Users/example/project",
                id: "thread-cwd-option",
                name: "Thread with cwd",
                status: { type: "idle" },
              },
            ],
          };
        }
        return {};
      },
    });
    const onRequestWorkingDirectory = vi.fn(async () => null);
    render(
      <AgentProvider transport={transport}>
        <AgentChat onRequestWorkingDirectory={onRequestWorkingDirectory} />
      </AgentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "Working directory" }));
    await user.click(await screen.findByRole("menuitemradio", { name: "project" }));
    expect(screen.getByRole("button", { name: "Working directory" })).toHaveTextContent(
      "project",
    );

    await user.click(screen.getByRole("button", { name: "Open folder" }));

    expect(onRequestWorkingDirectory).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Working directory" })).toHaveTextContent(
      "project",
    );
  });

  it("shows recent working directories by folder name before starting a thread", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/read") {
          return { account: { email: "real@example.com", planType: "pro" } };
        }
        if (request.method === "thread/list") {
          return {
            data: [
              {
                cwd: "/Users/sakasegawa",
                id: "thread-home",
                name: "Home",
                path: "/Users/sakasegawa/.codex/sessions/home.jsonl",
                status: { type: "notLoaded" },
              },
              {
                cwd: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
                id: "thread-repo",
                name: "Agent UI",
                path: "/Users/sakasegawa/.codex/sessions/agent-ui.jsonl",
                status: { type: "notLoaded" },
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

    await user.click(await screen.findByRole("button", { name: "Working directory" }));
    expect(screen.getByText("Recent")).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: "sakasegawa" })).toBeInTheDocument();
    await user.click(screen.getByRole("menuitemradio", { name: "agent-ui" }));
    expect(screen.getByRole("button", { name: "Working directory" })).toHaveTextContent(
      "agent-ui",
    );
    await user.type(screen.getByRole("textbox", { name: "Message" }), "start in repo");
    await user.click(screen.getByRole("button", { name: "Start thread" }));

    expect(
      transport.requests.find((request) => request.method === "thread/start")?.params,
    ).toMatchObject({
      cwd: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
    });
  });

  it("restores cwd from started and stored thread preview responses", async () => {
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
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    // Starting from the start screen creates the thread with the first turn.
    await user.type(
      await screen.findByRole("textbox", { name: "Message" }),
      "start with cwd",
    );
    await user.click(screen.getByRole("button", { name: "Start thread" }));
    // cwd is a thread-start setting: it is restored into the started thread
    // and shown read-only in the thread header, not as a composer input.
    expect(await screen.findByText("/Users/example/project")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: /Old project/ }));
    expect((await screen.findAllByText("Preview")).length).toBeGreaterThan(0);
    expect(await screen.findByText("/Users/example/old-project")).toBeInTheDocument();
    expect(screen.queryByText(/\.codex\/sessions/)).not.toBeInTheDocument();
    expect(transport.requests.some((request) => request.method === "thread/resume")).toBe(
      false,
    );
  });

  it("keeps resumed App Server status, canonical id, and initial turns page", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/resume") {
          return {
            initialTurnsPage: {
              data: [
                {
                  id: "turn-page",
                  items: [
                    {
                      id: "item-page",
                      text: "initial resume page item",
                      type: "agentMessage",
                    },
                  ],
                  itemsView: "summary",
                  status: "completed",
                },
              ],
              nextCursor: null,
            },
            thread: {
              id: "thread-canonical",
              name: "Canonical resumed thread",
              status: { type: "active" },
            },
          };
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <ResumeThreadHarness requestedId="requested-thread-path" />
      </AgentProvider>,
    );

    await user.click(
      await screen.findByRole("button", { name: "Resume requested thread" }),
    );

    await waitFor(() =>
      expect(screen.getByLabelText("active thread")).toHaveTextContent(
        "thread-canonical",
      ),
    );
    expect(screen.getByLabelText("thread status")).toHaveTextContent("running");
    expect(screen.getByLabelText("thread title")).toHaveTextContent(
      "Canonical resumed thread",
    );
    expect(screen.getByLabelText("initial page item")).toHaveTextContent(
      "initial resume page item",
    );
    expect(screen.getByLabelText("resume result")).toHaveTextContent(
      "thread-canonical:requested-thread-path",
    );
    expect(
      transport.requests.find((request) => request.method === "thread/resume")?.params,
    ).toEqual({ threadId: "requested-thread-path" });
  });

  it("emits raw-free diagnostics when resume returns a canonical id alias", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/resume") {
          return {
            thread: {
              id: "thread-canonical-diagnostic",
              name: "Canonical diagnostic thread",
              status: { type: "idle" },
            },
          };
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <ResumeThreadHarness requestedId="thread-requested-diagnostic" />
        <ResumeDiagnosticsProbe />
      </AgentProvider>,
    );

    await user.click(
      await screen.findByRole("button", { name: "Resume requested thread" }),
    );

    await waitFor(() =>
      expect(screen.getByLabelText("developer resume diagnostics")).toHaveTextContent(
        "canonical_thread_id_mismatch",
      ),
    );
    const developerDiagnostics = screen.getByLabelText("developer resume diagnostics");
    expect(developerDiagnostics).toHaveTextContent("thread-requested-diagnostic");
    expect(developerDiagnostics).toHaveTextContent("thread-canonical-diagnostic");
    expect(developerDiagnostics).not.toHaveTextContent("raw");
    expect(developerDiagnostics).not.toHaveTextContent("Canonical diagnostic thread");
    expect(screen.getByLabelText("audit resume diagnostics")).toHaveTextContent(
      "canonical_thread_id_mismatch",
    );
    expect(screen.getByLabelText("user resume diagnostics")).toHaveTextContent("none");
  });

  it("emits raw-free diagnostics when resume normalization fails", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/resume") {
          return {
            thread: {
              name: "Raw thread name should not leak",
              status: { type: "idle" },
            },
          };
        }
        return {};
      },
    });
    render(
      <AgentProvider transport={transport}>
        <ResumeThreadHarness requestedId="thread-missing-id" />
        <ResumeDiagnosticsProbe />
      </AgentProvider>,
    );

    await user.click(
      await screen.findByRole("button", { name: "Resume requested thread" }),
    );

    await waitFor(() =>
      expect(screen.getByLabelText("developer resume diagnostics")).toHaveTextContent(
        "resume_response_missing_thread_id",
      ),
    );
    const developerDiagnostics = screen.getByLabelText("developer resume diagnostics");
    expect(developerDiagnostics).toHaveTextContent("thread-missing-id");
    expect(developerDiagnostics).not.toHaveTextContent("Raw thread name should not leak");
    expect(developerDiagnostics).not.toHaveTextContent('"raw":');
    expect(screen.getByLabelText("audit resume diagnostics")).toHaveTextContent(
      "resume_response_missing_thread_id",
    );
    expect(screen.getByLabelText("user resume diagnostics")).toHaveTextContent("none");
  });

  it("reads thread previews without replacing the active thread", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/read") {
          return {
            thread: {
              id: "thread-preview",
              name: "Preview thread",
              status: { type: "idle" },
              turns: [
                {
                  id: "turn-preview",
                  items: [
                    {
                      id: "item-preview",
                      text: "preview state updated",
                      type: "agentMessage",
                    },
                  ],
                  status: "completed",
                },
              ],
            },
          };
        }
        return {};
      },
    });
    render(
      <AgentProvider initialState={runningComposerState()} transport={transport}>
        <ReadThreadHarness threadId="thread-preview" />
      </AgentProvider>,
    );

    expect(screen.getByLabelText("active thread")).toHaveTextContent("thread-running");

    await user.click(await screen.findByRole("button", { name: "Read preview thread" }));

    await waitFor(() =>
      expect(screen.getByLabelText("preview thread item")).toHaveTextContent(
        "preview state updated",
      ),
    );
    expect(screen.getByLabelText("preview thread status")).toHaveTextContent("loaded");
    expect(screen.getByLabelText("active thread")).toHaveTextContent("thread-running");
    expect(
      transport.requests.find((request) => request.method === "thread/read")?.params,
    ).toEqual({ threadId: "thread-preview", includeTurns: true });
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

  it("closes the mobile history drawer with Escape and returns focus", async () => {
    mockCompactLayout();
    const user = userEvent.setup();
    const { container } = render(
      <AgentProvider transport={new FakeAgentTransport()}>
        <AgentChat />
      </AgentProvider>,
    );

    const trigger = await screen.findByRole("button", { name: "Open thread history" });
    await user.click(trigger);
    expect(container.querySelector(".aui-sidebar")).toBeInTheDocument();
    expect(container.querySelector(".aui-chat")).toHaveAttribute("inert");
    expect(container.querySelector(".aui-chat")).toHaveAttribute("aria-hidden", "true");
    await waitFor(() => {
      expect(screen.getByLabelText("Search history")).toHaveFocus();
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(container.querySelector(".aui-sidebar")).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
    expect(container.querySelector(".aui-chat")).not.toHaveAttribute("inert");
  });

  it("returns mobile drawer focus to the matching chat trigger", async () => {
    mockCompactLayout();
    const user = userEvent.setup();
    render(
      <>
        <AgentProvider transport={new FakeAgentTransport()}>
          <AgentChat />
        </AgentProvider>
        <AgentProvider transport={new FakeAgentTransport()}>
          <AgentChat />
        </AgentProvider>
      </>,
    );

    const triggers = await screen.findAllByRole("button", {
      name: "Open thread history",
    });
    await user.click(triggers[1]!);
    await waitFor(() => {
      expect(screen.getByLabelText("Search history")).toHaveFocus();
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(triggers[1]).toHaveFocus();
    });
  });

  it("moves mobile drawer focus when a custom shell renders the sidebar slot", async () => {
    mockCompactLayout();
    const user = userEvent.setup();
    render(
      <AgentProvider transport={new FakeAgentTransport()}>
        <AgentChat
          components={{
            Shell: ({ children, sidebar }) => (
              <section data-testid="host-shell">
                {sidebar}
                {children}
              </section>
            ),
          }}
        />
      </AgentProvider>,
    );

    const trigger = await screen.findByRole("button", { name: "Open thread history" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByLabelText("Search history")).toHaveFocus();
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it("closes the mobile history drawer from the backdrop and returns focus", async () => {
    mockCompactLayout();
    const user = userEvent.setup();
    const { container } = render(
      <AgentProvider transport={new FakeAgentTransport()}>
        <AgentChat />
      </AgentProvider>,
    );

    const trigger = await screen.findByRole("button", { name: "Open thread history" });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Dismiss thread history" }));

    await waitFor(() => {
      expect(container.querySelector(".aui-sidebar")).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it("closes the mobile history drawer after thread selection", async () => {
    mockCompactLayout();
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              {
                id: "thread-mobile-select",
                name: "Mobile selected thread",
                status: { type: "notLoaded" },
                turns: [],
              },
            ],
          };
        }
        if (request.method === "thread/read") {
          return {
            thread: {
              id: "thread-mobile-select",
              name: "Mobile selected thread",
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

    await user.click(await screen.findByRole("button", { name: "Open thread history" }));
    expect(screen.getByLabelText("Search history")).toBeInTheDocument();
    await user.click(
      await screen.findByRole("button", { name: /Mobile selected thread/ }),
    );

    await waitFor(() => {
      expect(screen.queryByLabelText("Search history")).not.toBeInTheDocument();
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
        <AgentChat usage />
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

    // The starter model/effort menu exposes the model, but reports no
    // selectable effort when the metadata declares no supported efforts
    // instead of fabricating options like "xhigh".
    await user.click(await screen.findByRole("button", { name: /Model and effort:/ }));
    await user.click(
      await screen.findByRole("menuitemradio", { name: /Metadata-light model/ }),
    );
    await user.click(screen.getByRole("button", { name: /Model and effort:/ }));
    expect(
      await screen.findByText("This model exposes no selectable effort."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitemradio", { name: "xhigh" }),
    ).not.toBeInTheDocument();
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

  it("loads persisted session history as a readable preview", async () => {
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
              status: { type: "notLoaded" },
              turns: [
                {
                  id: "turn-history",
                  items: [
                    {
                      id: "item-history",
                      text: "Stored transcript stays readable.",
                      type: "agentMessage",
                    },
                  ],
                  status: "completed",
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

    await user.click(await screen.findByRole("button", { name: /Historical fix/ }));

    expect(
      await screen.findByRole("heading", { name: "Historical fix" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Stored transcript stays readable."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/rollout-demo\.jsonl/)).not.toBeInTheDocument();
    expect((await screen.findAllByText("Preview")).length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Message")).toBeEnabled();
    expect(screen.queryByText("notLoaded")).not.toBeInTheDocument();
    expect(transport.requests.map((request) => request.method)).toEqual(
      expect.arrayContaining(["thread/list", "thread/read"]),
    );
    expect(
      transport.requests.find((request) => request.method === "thread/read")?.params,
    ).toEqual({ threadId: "thread-history", includeTurns: true });
    expect(transport.requests.some((request) => request.method === "thread/resume")).toBe(
      false,
    );
  });

  it("renders stored history transcript activity as readable transcript blocks", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              {
                id: "thread-rich-history",
                name: "Rich stored session",
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
              id: "thread-rich-history",
              name: "Rich stored session",
              status: { type: "idle" },
              turns: [
                {
                  id: "turn-rich-history",
                  items: [
                    {
                      content: [
                        {
                          text: "Please validate stored transcript rendering.",
                          type: "text",
                        },
                      ],
                      id: "item-user-history",
                      type: "userMessage",
                    },
                    {
                      id: "item-command-history",
                      aggregatedOutput: "first passing line\nsecond passing line\n",
                      command: "bun test --watch=false",
                      status: "completed",
                      type: "commandExecution",
                    },
                    {
                      changes: [
                        {
                          diff: "diff --git a/src/history.ts b/src/history.ts\n@@\n-export const value = 1;\n+export const value = 2;\n",
                          kind: "update",
                          path: "src/history.ts",
                        },
                      ],
                      id: "item-file-history",
                      status: "completed",
                      type: "fileChange",
                    },
                    {
                      id: "item-agent-history",
                      text: "Stored transcript stays readable after loading.",
                      type: "agentMessage",
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
            cwd: "/Users/example/resumed",
            model: "gpt-resumed",
            reasoningEffort: "high",
            thread: {
              id: "thread-rich-history",
              name: "Rich stored session",
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

    await user.click(await screen.findByRole("button", { name: /Rich stored session/ }));

    expect(
      await screen.findByText("Please validate stored transcript rendering."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Stored transcript stays readable after loading."),
    ).toBeInTheDocument();
    expect(document.querySelector("[class*=work][class*=trace]")).not.toBeInTheDocument();

    const command = screen.getByLabelText("Command output");
    expect(command).toHaveTextContent("bun test --watch=false");
    expect(command).toHaveTextContent("completed · 2 lines");
    expect(command).toHaveTextContent("first passing line");
    expect(screen.queryByText("second passing line")).not.toBeInTheDocument();
    await user.click(within(command).getByText("bun test --watch=false"));
    expect(screen.getByText(/second passing line/)).toBeInTheDocument();

    const diff = screen.getByLabelText("Diff preview");
    expect(diff).toHaveTextContent("1 file changed");
    expect(screen.queryByText("src/history.ts")).not.toBeInTheDocument();
    expect(screen.queryByText(/export const value = 2/)).not.toBeInTheDocument();
    await user.click(within(diff).getByText("1 file changed"));
    expect(screen.getAllByText("src/history.ts").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/export const value = 2/).length).toBeGreaterThan(0);

    expect(screen.getAllByText("Preview").length).toBeGreaterThan(0);
    const message = screen.getByLabelText("Message");
    expect(message).toBeEnabled();
    await user.type(message, "continue this session");
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(
        transport.requests.findLast((request) => request.method === "turn/start"),
      ).toMatchObject({
        method: "turn/start",
        params: {
          effort: "high",
          input: [{ text: "continue this session", text_elements: [], type: "text" }],
          model: "gpt-resumed",
          threadId: "thread-rich-history",
        },
      }),
    );
    expect(
      transport.requests.findLast((request) => request.method === "turn/start")?.params,
    ).not.toHaveProperty("cwd");
    expect(
      transport.requests
        .filter((request) =>
          ["thread/read", "thread/resume", "turn/start"].includes(request.method),
        )
        .map((request) => request.method),
    ).toEqual(["thread/read", "thread/resume", "turn/start"]);
    expect(
      transport.requests.find((request) => request.method === "thread/resume")?.params,
    ).toEqual({ threadId: "thread-rich-history" });
  });

  it("queues a submit when stored thread resume rejoins a running turn", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              {
                id: "thread-running-history",
                name: "Running stored session",
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
              id: "thread-running-history",
              name: "Running stored session",
              status: { type: "notLoaded" },
              turns: [
                {
                  id: "turn-running-history",
                  items: [
                    {
                      id: "item-running-history",
                      text: "Running transcript remains readable.",
                      type: "agentMessage",
                    },
                  ],
                  status: "running",
                },
              ],
            },
          };
        }
        if (request.method === "thread/resume") {
          return {
            thread: {
              id: "thread-running-history",
              name: "Running stored session",
              status: { activeFlags: [], type: "active" },
              turns: [
                {
                  id: "turn-running-history",
                  items: [],
                  status: "inProgress",
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

    await user.click(await screen.findByRole("button", { name: /Running stored session/ }));
    expect(await screen.findByText("Running transcript remains readable.")).toBeInTheDocument();

    const message = screen.getByRole("textbox", { name: "Message" });
    await user.type(message, "resume while running");
    await user.keyboard("{Enter}");

    expect(screen.getByLabelText("Queued follow-ups")).toHaveTextContent(
      "resume while running",
    );
    expect(message).toHaveValue("");
    expect(
      transport.requests
        .filter((request) =>
          ["thread/read", "thread/resume", "turn/start"].includes(request.method),
        )
        .map((request) => request.method),
    ).toEqual(["thread/read", "thread/resume"]);

    await user.click(
      await screen.findByRole("button", { name: "Send now" }),
    );

    await waitFor(() =>
      expect(transport.requests.findLast((request) => request.method === "turn/steer"))
        .toMatchObject({
          method: "turn/steer",
          params: {
            expectedTurnId: "turn-running-history",
            input: [{ text: "resume while running", text_elements: [], type: "text" }],
            threadId: "thread-running-history",
          },
        }),
    );
  });

  it("keeps attachments when stored thread resume waits on approval", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              {
                id: "thread-approval-history",
                name: "Approval stored session",
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
              id: "thread-approval-history",
              name: "Approval stored session",
              status: { type: "notLoaded" },
              turns: [],
            },
          };
        }
        if (request.method === "thread/resume") {
          return {
            thread: {
              id: "thread-approval-history",
              name: "Approval stored session",
              status: { activeFlags: ["waitingOnApproval"], type: "active" },
              turns: [],
            },
          };
        }
        return {};
      },
    });

    render(
      <AgentProvider transport={transport}>
        <AgentChat
          resolveLocalAttachment={(file) =>
            resolvedTextAttachment(`/uploads/${file.name}`, file.name)
          }
        />
      </AgentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: /Approval stored session/ }));
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, new File(["notes"], "approval-notes.txt", { type: "" }));
    await screen.findByText("approval-notes.txt");
    const message = screen.getByRole("textbox", { name: "Message" });
    await user.type(message, "send after approval");
    await user.keyboard("{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Resolve the pending approval before sending another message.",
    );
    expect(message).toHaveValue("send after approval");
    expect(screen.getByLabelText("Pending attachments")).toHaveTextContent(
      "approval-notes.txt",
    );
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "turn/start",
    );
  });

  it("does not carry the current effort into an idle resumed thread with null effort", async () => {
    const user = userEvent.setup();
    const initialState = createInitialAgentState();
    initialState.runSettings.effort = "high";
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              {
                id: "thread-null-effort",
                name: "Null effort stored session",
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
              id: "thread-null-effort",
              name: "Null effort stored session",
              status: { type: "notLoaded" },
              turns: [],
            },
          };
        }
        if (request.method === "thread/resume") {
          return {
            cwd: "/Users/example/null-effort",
            model: "gpt-resumed",
            reasoningEffort: null,
            thread: {
              id: "thread-null-effort",
              name: "Null effort stored session",
              status: { type: "idle" },
              turns: [],
            },
          };
        }
        return {};
      },
    });

    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: /Null effort stored session/ }));
    await user.type(screen.getByRole("textbox", { name: "Message" }), "continue");
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(
        transport.requests.findLast((request) => request.method === "turn/start")
          ?.params,
      ).toMatchObject({
        effort: undefined,
        model: "gpt-resumed",
        threadId: "thread-null-effort",
      }),
    );
    expect(
      transport.requests.findLast((request) => request.method === "turn/start")?.params,
    ).not.toHaveProperty("cwd");
  });

  it("does not expose a manual resume button for stored threads", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              {
                id: "thread-fail-resume",
                name: "Needs resume",
                status: { type: "notLoaded" },
              },
            ],
          };
        }
        if (request.method === "thread/read") {
          throw new Error("read unavailable");
        }
        return {};
      },
    });

    render(
      <AgentProvider transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: /Needs resume/ }));
    expect(screen.queryByRole("button", { name: "Resume" })).not.toBeInTheDocument();
    expect(
      transport.requests.find((request) => request.method === "thread/read")?.params,
    ).toEqual({ threadId: "thread-fail-resume", includeTurns: true });
    expect(transport.requests.some((request) => request.method === "thread/resume")).toBe(
      false,
    );
  });

  it("syncs active thread selection to explicit thread URLs", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/");
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              { id: "thread-one", name: "Thread one", status: { type: "notLoaded" } },
              { id: "thread-two", name: "Thread two", status: { type: "notLoaded" } },
            ],
          };
        }
        if (request.method === "thread/read") {
          const id = String((request.params as { threadId?: string }).threadId);
          return {
            thread: {
              id,
              name: id === "thread-two" ? "Thread two" : "Thread one",
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
        <AgentChat threadUrlRouting />
      </AgentProvider>,
    );

    expect(await screen.findByRole("button", { name: /Thread one/ })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
    expect(
      screen.queryByRole("heading", { name: /Thread (one|two)/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Connect Codex")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: /Thread two/ }));
    await waitFor(() => expect(window.location.pathname).toBe("/threads/thread-two"));
    expect(
      await screen.findByRole("heading", { name: "Thread two" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start a Codex thread" }));
    await waitFor(() => expect(window.location.pathname).toBe("/"));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: /Thread (one|two)/ }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Connect Codex")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: /Thread two/ }));
    await waitFor(() => expect(window.location.pathname).toBe("/threads/thread-two"));
    expect(
      await screen.findByRole("heading", { name: "Thread two" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New thread" }));
    await waitFor(() => expect(window.location.pathname).toBe("/"));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: /Thread (one|two)/ }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Connect Codex")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: /Thread two/ }));
    await waitFor(() => expect(window.location.pathname).toBe("/threads/thread-two"));
    expect(
      await screen.findByRole("heading", { name: "Thread two" }),
    ).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: /Thread one/ }));
    await waitFor(() => expect(window.location.pathname).toBe("/threads/thread-one"));
    expect(
      await screen.findByRole("heading", { name: "Thread one" }),
    ).toBeInTheDocument();

    window.history.back();
    await waitFor(() => expect(window.location.pathname).toBe("/threads/thread-two"));
    expect(
      await screen.findByRole("heading", { name: "Thread two" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        transport.requests.some(
          (request) =>
            request.method === "thread/read" &&
            (request.params as { threadId?: string }).threadId === "thread-two",
        ),
      ).toBe(true),
    );

    window.history.pushState(null, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: /Thread (one|two)/ }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Connect Codex")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: /Thread two/ }));
    await waitFor(() => expect(window.location.pathname).toBe("/threads/thread-two"));
    expect(
      await screen.findByRole("heading", { name: "Thread two" }),
    ).toBeInTheDocument();

    window.history.back();
    await waitFor(() => expect(window.location.pathname).toBe("/"));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: /Thread (one|two)/ }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Connect Codex")).toBeInTheDocument();

    window.history.forward();
    await waitFor(() => expect(window.location.pathname).toBe("/threads/thread-two"));
    expect(
      await screen.findByRole("heading", { name: "Thread two" }),
    ).toBeInTheDocument();

    window.history.pushState(null, "", "/threads/thread-one");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(
      await screen.findByRole("heading", { name: "Thread one" }),
    ).toBeInTheDocument();
  });

  it("does not auto-select the first history thread from the root route", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/");
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              { id: "thread-one", name: "Thread one", status: { type: "notLoaded" } },
              { id: "thread-two", name: "Thread two", status: { type: "notLoaded" } },
            ],
          };
        }
        if (request.method === "thread/read") {
          const id = String((request.params as { threadId?: string }).threadId);
          return {
            thread: {
              id,
              name: id === "thread-two" ? "Thread two" : "Thread one",
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
        <AgentChat threadUrlRouting />
      </AgentProvider>,
    );

    expect(await screen.findByRole("button", { name: /Thread one/ })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
    expect(
      screen.queryByRole("heading", { name: /Thread (one|two)/ }),
    ).not.toBeInTheDocument();
    expect(transport.requests.map((request) => request.method)).not.toContain(
      "thread/read",
    );

    await user.click(await screen.findByRole("button", { name: /Thread two/ }));
    await waitFor(() => expect(window.location.pathname).toBe("/threads/thread-two"));
    expect(
      await screen.findByRole("heading", { name: "Thread two" }),
    ).toBeInTheDocument();
    expect(
      transport.requests.filter((request) => request.method === "thread/read"),
    ).toHaveLength(1);
    expect(
      transport.requests.find((request) => request.method === "thread/read")?.params,
    ).toEqual({ threadId: "thread-two", includeTurns: true });
    expect(transport.requests.some((request) => request.method === "thread/resume")).toBe(
      false,
    );
  });

  it("uses the configured home path when navigating back to the start screen", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/agent");
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              {
                id: "thread-custom",
                name: "Thread custom",
                status: { type: "notLoaded" },
              },
            ],
          };
        }
        if (request.method === "thread/read") {
          return {
            thread: {
              id: "thread-custom",
              name: "Thread custom",
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
        <AgentChat
          threadUrlRouting={{ basePath: "/agent/threads", homePath: "/agent" }}
        />
      </AgentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: /Thread custom/ }));
    await waitFor(() =>
      expect(window.location.pathname).toBe("/agent/threads/thread-custom"),
    );
    expect(
      await screen.findByRole("heading", { name: "Thread custom" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start a Codex thread" }));
    await waitFor(() => expect(window.location.pathname).toBe("/agent"));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Thread custom" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Connect Codex")).toBeInTheDocument();
  });

  it("keeps direct URL thread when sidebar history load resolves first", async () => {
    window.history.replaceState(null, "", "/threads/thread-target");
    let resolveThreadTarget: (response: unknown) => void = () => undefined;
    const threadTargetRead = new Promise((resolve) => {
      resolveThreadTarget = resolve;
    });
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              { id: "thread-other", name: "Thread other", status: { type: "notLoaded" } },
              {
                id: "thread-target",
                name: "Thread target",
                status: { type: "notLoaded" },
              },
            ],
          };
        }
        if (request.method === "thread/read") {
          const id = String((request.params as { threadId?: string }).threadId);
          if (id === "thread-target") return threadTargetRead;
          return {
            thread: {
              id,
              name: "Thread other",
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
        <AgentChat threadUrlRouting />
      </AgentProvider>,
    );

    await waitFor(() =>
      expect(transport.requests.some((request) => request.method === "thread/list")).toBe(
        true,
      ),
    );
    expect(
      await screen.findByRole("button", { name: /Thread other/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Thread other" }),
    ).not.toBeInTheDocument();
    expect(window.location.pathname).toBe("/threads/thread-target");
    expect(
      transport.requests.some(
        (request) =>
          request.method === "thread/read" &&
          (request.params as { threadId?: string }).threadId === "thread-other",
      ),
    ).toBe(false);
    expect(
      transport.requests.some(
        (request) =>
          request.method === "thread/resume" &&
          (request.params as { threadId?: string }).threadId === "thread-other",
      ),
    ).toBe(false);

    await act(async () => {
      resolveThreadTarget({
        thread: {
          id: "thread-target",
          name: "Thread target",
          status: { type: "idle" },
          turns: [],
        },
      });
      await threadTargetRead;
    });

    expect(
      await screen.findByRole("heading", { name: "Thread target" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        transport.requests.some(
          (request) =>
            request.method === "thread/resume" &&
            (request.params as { threadId?: string }).threadId === "thread-target",
        ),
      ).toBe(true),
    );
    expect(screen.getByLabelText("Message")).toBeEnabled();
    expect(
      screen.queryByRole("heading", { name: "Thread other" }),
    ).not.toBeInTheDocument();
    expect(window.location.pathname).toBe("/threads/thread-target");
  });

  it("uses the canonical id when direct URL resume returns a different thread id", async () => {
    window.history.replaceState(null, "", "/threads/thread-requested-url");
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              {
                id: "thread-requested-url",
                name: "Requested URL thread",
                status: { type: "notLoaded" },
              },
            ],
          };
        }
        if (request.method === "thread/read") {
          return {
            thread: {
              id: "thread-requested-url",
              name: "Requested URL thread",
              status: { type: "idle" },
              turns: [],
            },
          };
        }
        if (request.method === "thread/resume") {
          return {
            thread: {
              id: "thread-canonical-url",
              name: "Canonical URL thread",
              status: { type: "active" },
              turns: [],
            },
          };
        }
        return {};
      },
    });

    render(
      <AgentProvider transport={transport}>
        <AgentChat threadUrlRouting />
      </AgentProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Canonical URL thread" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(window.location.pathname).toBe("/threads/thread-canonical-url"),
    );
    expect(screen.getByLabelText("Message")).toBeEnabled();
    expect(
      transport.requests.find((request) => request.method === "thread/resume")?.params,
    ).toEqual({ threadId: "thread-requested-url" });
    expect(
      screen.queryByRole("heading", { name: "Requested URL thread" }),
    ).not.toBeInTheDocument();
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

    // No standalone Load button: pressing Enter submits the search; typing
    // also auto-runs it after a debounce.
    await user.clear(await screen.findByLabelText("Search history"));
    await user.type(screen.getByLabelText("Search history"), "missing session{Enter}");

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

  it("keeps explicit thread list scopes independent across search and pagination", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method !== "thread/list") return {};
        const params = request.params as
          | { cursor?: string | null; searchTerm?: string }
          | undefined;
        if (params?.searchTerm === "alpha" && params.cursor === "alpha-page-2") {
          return {
            data: [
              {
                id: "thread-alpha-2",
                name: "Alpha second page",
                status: { type: "notLoaded" },
              },
            ],
            nextCursor: null,
          };
        }
        if (params?.searchTerm === "alpha") {
          return {
            data: [
              {
                id: "thread-alpha-1",
                name: "Alpha first page",
                status: { type: "notLoaded" },
              },
            ],
            nextCursor: "alpha-page-2",
          };
        }
        if (params?.searchTerm === "beta") {
          return {
            data: [
              {
                id: "thread-beta-1",
                name: "Beta first page",
                status: { type: "notLoaded" },
              },
            ],
            nextCursor: null,
          };
        }
        return { data: [], nextCursor: null };
      },
    });

    render(
      <AgentProvider transport={transport}>
        <ThreadListControllerProbe
          label="left"
          scope={{ key: "history:left", kind: "history" }}
        />
        <ThreadListControllerProbe
          label="right"
          scope={{ key: "history:right", kind: "history" }}
        />
      </AgentProvider>,
    );

    await user.type(screen.getByLabelText("left search"), "alpha");
    await user.click(screen.getByRole("button", { name: "left refresh" }));
    expect(await screen.findByLabelText("left threads")).toHaveTextContent(
      "Alpha first page",
    );
    expect(screen.getByLabelText("left cursor")).toHaveTextContent("alpha-page-2");

    await user.type(screen.getByLabelText("right search"), "beta");
    await user.click(screen.getByRole("button", { name: "right refresh" }));
    expect(await screen.findByLabelText("right threads")).toHaveTextContent(
      "Beta first page",
    );

    await user.click(screen.getByRole("button", { name: "left load more" }));
    await waitFor(() =>
      expect(screen.getByLabelText("left threads")).toHaveTextContent(
        "Alpha first page,Alpha second page",
      ),
    );
    expect(screen.getByLabelText("right threads")).toHaveTextContent("Beta first page");
    expect(
      transport.requests.find(
        (request) =>
          request.method === "thread/list" &&
          (request.params as { cursor?: string | null; searchTerm?: string }).cursor ===
            "alpha-page-2",
      )?.params,
    ).toMatchObject({
      cursor: "alpha-page-2",
      searchTerm: "alpha",
    });
  });

  it("emits normalized history sync metadata after thread list refresh and pagination", async () => {
    const user = userEvent.setup();
    const onHistorySynced = vi.fn();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method !== "thread/list") return {};
        const params = request.params as
          | { cursor?: string | null; searchTerm?: string }
          | undefined;
        if (params?.cursor === "sync-page-2") {
          return {
            data: [
              {
                id: "thread-sync-2",
                name: "Sync page two",
                rawSecret: "not forwarded",
                status: { type: "notLoaded" },
              },
            ],
            nextCursor: null,
          };
        }
        return {
          data: [
            {
              id: "thread-sync-1",
              name: "Sync page one",
              rawSecret: "not forwarded",
              status: { type: "notLoaded" },
            },
          ],
          nextCursor: "sync-page-2",
        };
      },
    });

    render(
      <AgentProvider transport={transport}>
        <ThreadListControllerProbe
          label="sync"
          onHistorySynced={onHistorySynced}
          scope={{ key: "history:sync", kind: "history" }}
        />
      </AgentProvider>,
    );

    await user.type(screen.getByLabelText("sync search"), "sync");
    await user.click(screen.getByRole("button", { name: "sync refresh" }));
    await waitFor(() => expect(onHistorySynced).toHaveBeenCalledTimes(1));
    expect(onHistorySynced.mock.calls[0]?.[0]).toMatchObject({
      append: false,
      nextCursor: "sync-page-2",
      scope: { key: "history:sync", kind: "history", searchTerm: "sync" },
      searchTerm: "sync",
      threadIds: ["thread-sync-1"],
    });
    expect(onHistorySynced.mock.calls[0]?.[0]).not.toHaveProperty("rawSecret");

    await user.click(screen.getByRole("button", { name: "sync load more" }));
    await waitFor(() => expect(onHistorySynced).toHaveBeenCalledTimes(2));
    expect(onHistorySynced.mock.calls[1]?.[0]).toMatchObject({
      append: true,
      nextCursor: null,
      scope: { key: "history:sync", kind: "history", searchTerm: "sync" },
      searchTerm: "sync",
      threadIds: ["thread-sync-2"],
    });
    expect(onHistorySynced.mock.calls[1]?.[0].syncedAt).toEqual(expect.any(Number));
  });

  it("ignores stale search responses for the same explicit thread list scope key", async () => {
    const user = userEvent.setup();
    let resolveAlpha: (response: unknown) => void = () => undefined;
    const alphaResponse = new Promise((resolve) => {
      resolveAlpha = resolve;
    });
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method !== "thread/list") return {};
        const searchTerm = (request.params as { searchTerm?: string } | undefined)
          ?.searchTerm;
        if (searchTerm === "alpha") return alphaResponse;
        if (searchTerm === "beta") {
          return {
            data: [
              {
                id: "thread-shared-race",
                name: "Beta race result",
                status: { type: "notLoaded" },
              },
            ],
            nextCursor: null,
          };
        }
        return { data: [], nextCursor: null };
      },
    });

    render(
      <AgentProvider transport={transport}>
        <ThreadListControllerProbe
          label="race"
          scope={{ key: "history:race", kind: "history" }}
        />
      </AgentProvider>,
    );

    await user.type(screen.getByLabelText("race search"), "alpha");
    await user.click(screen.getByRole("button", { name: "race refresh" }));
    await waitFor(() =>
      expect(
        transport.requests.some(
          (request) =>
            request.method === "thread/list" &&
            (request.params as { searchTerm?: string }).searchTerm === "alpha",
        ),
      ).toBe(true),
    );

    await user.clear(screen.getByLabelText("race search"));
    await user.type(screen.getByLabelText("race search"), "beta");
    await user.click(screen.getByRole("button", { name: "race refresh" }));
    expect(await screen.findByLabelText("race threads")).toHaveTextContent(
      "Beta race result",
    );
    expect(screen.getByLabelText("race scope search")).toHaveTextContent("beta");

    await act(async () => {
      resolveAlpha({
        data: [
          {
            id: "thread-shared-race",
            name: "Alpha stale result",
            status: { type: "notLoaded" },
          },
        ],
        nextCursor: null,
      });
      await alphaResponse;
    });

    expect(screen.getByLabelText("race threads")).toHaveTextContent("Beta race result");
    expect(screen.getByLabelText("race threads")).not.toHaveTextContent(
      "Alpha stale result",
    );
    expect(screen.getByLabelText("race scope search")).toHaveTextContent("beta");
  });

  it("keeps scoped thread list state consistent when resume returns a canonical id", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              {
                id: "thread-requested",
                name: "Requested stored thread",
                status: { type: "notLoaded" },
              },
            ],
            nextCursor: null,
          };
        }
        if (request.method === "thread/resume") {
          return {
            thread: {
              id: "thread-canonical-resume",
              name: "Canonical resumed thread",
              status: { type: "active" },
            },
          };
        }
        return {};
      },
    });

    render(
      <AgentProvider transport={transport}>
        <ThreadListControllerProbe
          label="resume"
          scope={{ key: "history:resume", kind: "history" }}
        />
      </AgentProvider>,
    );

    await user.click(screen.getByRole("button", { name: "resume refresh" }));
    expect(await screen.findByLabelText("resume threads")).toHaveTextContent(
      "Requested stored thread",
    );

    await user.click(
      screen.getByRole("button", { name: "resume resume first with result" }),
    );

    await waitFor(() =>
      expect(screen.getByLabelText("resume active thread")).toHaveTextContent(
        "thread-canonical-resume",
      ),
    );
    expect(screen.getByLabelText("resume threads")).toHaveTextContent(
      "Canonical resumed thread",
    );
    expect(screen.getByLabelText("resume threads")).not.toHaveTextContent(
      "Requested stored thread",
    );
    expect(screen.getByLabelText("resume resume result")).toHaveTextContent(
      "thread-canonical-resume:thread-requested",
    );
    await user.click(screen.getByRole("button", { name: "resume resume first" }));
    await waitFor(() =>
      expect(screen.getByLabelText("resume resume thread id")).toHaveTextContent(
        "thread-canonical-resume",
      ),
    );
    expect(
      transport.requests.find((request) => request.method === "thread/resume")?.params,
    ).toEqual({ threadId: "thread-requested" });
  });

  it("hydrates thread list previews without changing active run settings", async () => {
    const user = userEvent.setup();
    const initialState = createInitialAgentState();
    initialState.runSettings.cwd = "/Users/example/active";
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              {
                cwd: "/Users/example/background",
                id: "thread-background-preview",
                name: "Background preview",
                status: { type: "notLoaded" },
              },
            ],
            nextCursor: null,
          };
        }
        if (request.method === "thread/read") {
          return {
            thread: {
              cwd: "/Users/example/background",
              id: "thread-background-preview",
              name: "Background preview",
              status: { type: "notLoaded" },
              turns: [],
            },
          };
        }
        return {};
      },
    });

    render(
      <AgentProvider initialState={initialState} transport={transport}>
        <ThreadListControllerProbe
          label="history"
          scope={{ key: "history:preview", kind: "history" }}
        />
        <RunSettingsProbe />
      </AgentProvider>,
    );

    expect(screen.getByLabelText("current cwd")).toHaveTextContent(
      "/Users/example/active",
    );
    await user.click(screen.getByRole("button", { name: "history refresh" }));
    expect(await screen.findByLabelText("history threads")).toHaveTextContent(
      "Background preview",
    );
    await user.click(screen.getByRole("button", { name: "history preview first" }));

    await waitFor(() =>
      expect(
        transport.requests.find((request) => request.method === "thread/read")?.params,
      ).toEqual({
        includeTurns: true,
        threadId: "thread-background-preview",
      }),
    );
    expect(screen.getByLabelText("current cwd")).toHaveTextContent(
      "/Users/example/active",
    );
  });

  it("ignores stored thread rows without stable ids", async () => {
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

    // History auto-loads on connect; no Load button click is required.
    expect(await screen.findAllByText("Valid row")).not.toHaveLength(0);
    expect(screen.queryByText("Broken row")).not.toBeInTheDocument();
  });

  it("keeps the start screen and does not auto-open the latest stored thread", async () => {
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

    // The root route stays on the start screen: the latest stored thread is
    // listed in history but is not auto-read or auto-opened in the main pane.
    expect(
      await screen.findByRole("button", { name: /Latest stored session/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Latest stored session" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("This stored session opens in the main pane."),
    ).not.toBeInTheDocument();
    expect(transport.requests.some((request) => request.method === "thread/read")).toBe(
      false,
    );
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
    render(
      <AgentProvider transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    expect(await screen.findAllByText("First page thread")).not.toHaveLength(0);
    expect((await screen.findAllByText(/first-project/)).length).toBeGreaterThan(0);
    expect(screen.queryByText(/thread loaded/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("Second page thread")).toBeInTheDocument();
    expect((await screen.findAllByText(/second-project/)).length).toBeGreaterThan(0);
    expect(screen.queryByText(/threads loaded/)).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument(),
    );
    expect(
      transport.requests.find(
        (request) =>
          request.method === "thread/list" &&
          (request.params as { cursor?: string | null }).cursor === "page-2",
      ),
    ).toBeTruthy();
  });

  it("renders sidebar history in thread/list response order without promoting selection", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/list") {
          return {
            data: [
              {
                cwd: "/Users/example/newest",
                id: "thread-server-newest",
                name: "Server newest",
                status: { type: "notLoaded" },
                updatedAt: 10,
              },
              {
                cwd: "/Users/example/middle",
                id: "thread-server-middle",
                name: "Server middle",
                status: { type: "notLoaded" },
                updatedAt: 30,
              },
              {
                cwd: "/Users/example/oldest",
                id: "thread-server-oldest",
                name: "Server oldest",
                status: { type: "notLoaded" },
                updatedAt: 20,
              },
            ],
            nextCursor: null,
          };
        }
        if (request.method === "thread/read") {
          return {
            thread: {
              cwd: "/Users/example/middle",
              id: "thread-server-middle",
              name: "Server middle",
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
        <AgentChat threadUrlRouting />
      </AgentProvider>,
    );

    const sidebarOrder = () =>
      screen
        .getAllByRole("button")
        .map((button) => button.textContent?.replace(/\s+/g, " ").trim() ?? "")
        .filter((label) => label.startsWith("Server "))
        .map((label) => label.replace(/(Preview|Ready).*$/, ""));

    await waitFor(() =>
      expect(sidebarOrder()).toEqual([
        "Server newest",
        "Server middle",
        "Server oldest",
      ]),
    );

    await user.click(screen.getByRole("button", { name: /Server middle/ }));
    expect(await screen.findByRole("heading", { name: "Server middle" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/threads/thread-server-middle");
    await waitFor(() =>
      expect(sidebarOrder()).toEqual([
        "Server newest",
        "Server middle",
        "Server oldest",
      ]),
    );
  });

  it("does not expose bulk pagination in the default thread sidebar", async () => {
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
                name: "Page two",
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
                name: "Page three",
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
              name: "Page one",
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

    expect(await screen.findAllByText("Page one")).not.toHaveLength(0);
    expect(screen.queryByRole("button", { name: /Load\s+all/ })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Load more" }));
    await user.click(await screen.findByRole("button", { name: "Load more" }));

    expect(await screen.findByText("Page three")).toBeInTheDocument();
    expect(screen.queryByText(/threads loaded/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Load\s+all/ })).not.toBeInTheDocument();
    expect(
      transport.requests.filter((request) => request.method === "thread/list").length,
    ).toBeGreaterThanOrEqual(3);
  });

  function existingThreadState() {
    const initialState = createInitialAgentState();
    initialState.threadLifecycle.activeThreadId = "thread-attachments";
    initialState.threadLifecycle.collections[
      initialState.threadLifecycle.defaultCollectionKey
    ]!.ids = ["thread-attachments"];
    initialState.threads["thread-attachments"] = {
      activity: "idle",
      availability: "available",
      id: "thread-attachments",
      metadata: {},
      operations: {},
      orderedTurnIds: [],
      runtime: { status: { type: "idle" } },
      status: "loaded",
      storage: "unknown",
      thread: { id: "thread-attachments", name: "Attachment thread" },
      turns: {},
    };
    initialState.serverRequestQueue = { byId: {}, order: [] };
    return initialState;
  }

  function runningApprovalState() {
    return runEventFixture([
      {
        event: {
          status: "running",
          thread: { id: "thread-approval-running", name: "Approval running" },
          type: "thread/started",
        },
      },
      {
        event: {
          threadId: "thread-approval-running",
          turn: {
            id: "turn-approval-running",
            status: "running",
            threadId: "thread-approval-running",
          },
          type: "turn/started",
        },
      },
      {
        event: {
          request: {
            id: "approval-running",
            kind: "commandApproval",
            payload: { command: "bun test" },
            threadId: "thread-approval-running",
            turnId: "turn-approval-running",
          },
          type: "serverRequest/created",
        },
      },
    ]);
  }

  it("blocks the composer from runtime activity while legacy status remains running", async () => {
    render(
      <AgentProvider
        initialState={runningApprovalState()}
        transport={new FakeAgentTransport()}
      >
        <AgentChat />
        <PublicComposerControllerProbe />
      </AgentProvider>,
    );

    const textarea = await screen.findByLabelText("Message");
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveAttribute("placeholder", "Needs approval");
    expect(screen.getAllByText("Needs approval").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByLabelText("public composer can submit")).toHaveTextContent("false");
    expect(screen.getByLabelText("public composer disabled reason")).toHaveTextContent(
      "approval",
    );
    expect(screen.getByLabelText("public composer submit mode")).toHaveTextContent("send");
  });

  it("shows approval-blocked state in the standalone composer primitive", async () => {
    render(
      <AgentProvider
        initialState={runningApprovalState()}
        transport={new FakeAgentTransport()}
      >
        <AgentComposer threadId="thread-approval-running" />
      </AgentProvider>,
    );

    expect(await screen.findByLabelText("Message")).toBeDisabled();
    expect(
      screen.getByText("Resolve the pending approval before sending another message."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("accepts pasted images as composer attachments", async () => {
    render(
      <AgentProvider
        initialState={existingThreadState()}
        transport={new FakeAgentTransport()}
      >
        <AgentChat
          resolveLocalAttachment={(file) =>
            resolvedImageAttachment(`/tmp/${file.name}`, file.name)
          }
        />
      </AgentProvider>,
    );
    const textarea = await screen.findByLabelText("Message");
    fireEvent.paste(textarea, {
      clipboardData: {
        files: [new File(["png-bytes"], "screenshot.png", { type: "image/png" })],
      },
    });
    expect(await screen.findByText("screenshot.png")).toBeInTheDocument();
  });

  it("accepts dropped files as composer attachments", async () => {
    const { container } = render(
      <AgentProvider
        initialState={existingThreadState()}
        transport={new FakeAgentTransport()}
      >
        <AgentChat
          resolveLocalAttachment={(file, kind) =>
            kind === "image"
              ? resolvedImageAttachment(`/tmp/${file.name}`, file.name)
              : resolvedTextAttachment(`/tmp/${file.name}`, file.name)
          }
        />
      </AgentProvider>,
    );
    await screen.findByLabelText("Message");
    const composer = container.querySelector("form.aui-composer")!;
    fireEvent.drop(composer, {
      dataTransfer: {
        files: [new File(["data"], "notes.txt", { type: "text/plain" })],
      },
    });
    expect(await screen.findByText("notes.txt")).toBeInTheDocument();
  });

  it("removes a pending composer attachment", async () => {
    const user = userEvent.setup();
    render(
      <AgentProvider
        initialState={existingThreadState()}
        transport={new FakeAgentTransport()}
      >
        <AgentChat
          resolveLocalAttachment={(file) =>
            resolvedImageAttachment(`/tmp/${file.name}`, file.name)
          }
        />
      </AgentProvider>,
    );
    const textarea = await screen.findByLabelText("Message");
    fireEvent.paste(textarea, {
      clipboardData: {
        files: [new File(["x"], "shot.png", { type: "image/png" })],
      },
    });
    await screen.findByText("shot.png");
    await user.click(screen.getByRole("button", { name: "Remove shot.png" }));
    expect(screen.queryByText("shot.png")).not.toBeInTheDocument();
  });

  it("sends image attachments as Codex localImage turn input", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    render(
      <AgentProvider initialState={existingThreadState()} transport={transport}>
        <AgentChat
          resolveLocalAttachment={(file, kind) =>
            kind === "image"
              ? resolvedImageAttachment(`/uploads/${file.name}`, file.name)
              : resolvedTextAttachment(`/uploads/${file.name}`, file.name)
          }
        />
      </AgentProvider>,
    );
    const textarea = await screen.findByLabelText("Message");
    fireEvent.paste(textarea, {
      clipboardData: {
        files: [new File(["x"], "diagram.png", { type: "image/png" })],
      },
    });
    await screen.findByText("diagram.png");
    await user.type(textarea, "review this");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(transport.requests.at(-1)?.params).toMatchObject({
      input: [
        { text: "review this", text_elements: [], type: "text" },
        { path: "/uploads/diagram.png", type: "localImage" },
      ],
    });
  });

  it("uses structured attachment preview URLs while preserving explicit Codex input", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    render(
      <AgentProvider initialState={existingThreadState()} transport={transport}>
        <AgentChat
          resolveLocalAttachment={(file) => ({
            displayName: "Diagram preview",
            id: "asset-diagram",
            input: localImageInput(`/uploads/${file.name}`),
            path: `/uploads/${file.name}`,
            previewUrl: "/agent-ui/assets/asset-diagram",
            redactedPath: "[agent-ui-local-media]/diagram.png",
          })}
        />
      </AgentProvider>,
    );
    const textarea = await screen.findByLabelText("Message");
    fireEvent.paste(textarea, {
      clipboardData: {
        files: [new File(["x"], "diagram.png", { type: "image/png" })],
      },
    });
    const chip = await screen.findByRole("listitem", { name: /Diagram preview/ });
    expect(chip.querySelector("img")?.getAttribute("src")).toBe(
      "/agent-ui/assets/asset-diagram",
    );
    expect(screen.getByText("Diagram preview")).toBeInTheDocument();
    await user.type(textarea, "review preview");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(transport.requests.at(-1)?.params).toMatchObject({
      input: [
        { text: "review preview", text_elements: [], type: "text" },
        { path: "/uploads/diagram.png", type: "localImage" },
      ],
    });
    expect(revoke).not.toHaveBeenCalledWith("/agent-ui/assets/asset-diagram");
  });

  it("falls back when a structured attachment preview URL fails to load", async () => {
    render(
      <AgentProvider
        initialState={existingThreadState()}
        transport={new FakeAgentTransport()}
      >
        <AgentChat
          resolveLocalAttachment={(file) => ({
            displayName: "Broken preview",
            input: localImageInput(`/uploads/${file.name}`),
            path: `/uploads/${file.name}`,
            previewUrl: "/agent-ui/assets/missing-preview",
          })}
        />
      </AgentProvider>,
    );
    const textarea = await screen.findByLabelText("Message");
    fireEvent.paste(textarea, {
      clipboardData: {
        files: [new File(["x"], "broken.png", { type: "image/png" })],
      },
    });
    const chip = await screen.findByRole("listitem", { name: /Broken preview/ });
    const image = chip.querySelector("img");
    expect(image?.getAttribute("src")).toBe("/agent-ui/assets/missing-preview");
    fireEvent.error(image!);
    expect(chip).toHaveAttribute("data-preview-status", "failed");
    expect(chip.querySelector("img")).toBeNull();
    expect(chip.querySelector(".aui-composer-chip-icon")).not.toBeNull();
  });

  it("sends arbitrary file attachments as explicit local path text inputs", async () => {
    const user = userEvent.setup();
    const transport = new FakeAgentTransport();
    render(
      <AgentProvider initialState={existingThreadState()} transport={transport}>
        <AgentChat
          resolveLocalAttachment={(file, kind) =>
            kind === "image"
              ? resolvedImageAttachment(`/uploads/${file.name}`, file.name)
              : resolvedTextAttachment(`/uploads/${file.name}`, file.name)
          }
        />
      </AgentProvider>,
    );
    const fileInput = await screen.findByLabelText("Message");
    fireEvent.paste(fileInput, {
      clipboardData: {
        files: [new File(["model"], "part.3mf", { type: "" })],
      },
    });
    await screen.findByText("part.3mf");
    expect(screen.getByText(".3mf · 5 B")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(transport.requests.at(-1)?.params).toMatchObject({
      input: [{ text: "Attached file: /uploads/part.3mf", type: "text" }],
    });
  });

  it("does not render structured non-image attachment URLs as image previews", async () => {
    render(
      <AgentProvider
        initialState={existingThreadState()}
        transport={new FakeAgentTransport()}
      >
        <AgentChat
          resolveLocalAttachment={(file) => ({
            displayName: file.name,
            input: textInput(`Attached file: /uploads/${file.name}`),
            path: `/uploads/${file.name}`,
            previewUrl: "/agent-ui/assets/file-asset",
            url: "/agent-ui/assets/file-asset",
          })}
        />
      </AgentProvider>,
    );
    const textarea = await screen.findByLabelText("Message");
    fireEvent.paste(textarea, {
      clipboardData: {
        files: [new File(["model"], "part.3mf", { type: "" })],
      },
    });
    const chip = await screen.findByRole("listitem", { name: /part\.3mf/ });
    expect(chip).toHaveAttribute("data-kind", "file");
    expect(chip.querySelector("img")).toBeNull();
    expect(screen.getByText(".3mf · 5 B")).toBeInTheDocument();
  });

  it("hides composer attachment controls without a host resolver", async () => {
    render(
      <AgentProvider
        initialState={existingThreadState()}
        transport={new FakeAgentTransport()}
      >
        <AgentChat />
      </AgentProvider>,
    );
    await screen.findByLabelText("Message");
    expect(screen.queryByRole("button", { name: /^Attach/ })).not.toBeInTheDocument();
  });

  it("expands additional pending approvals from the compact picker", async () => {
    const user = userEvent.setup();
    const state = createInitialAgentState();
    state.threadLifecycle.activeThreadId = "thread-approvals";
    state.threadLifecycle.collections[state.threadLifecycle.defaultCollectionKey]!.ids = [
      "thread-approvals",
    ];
    state.threads["thread-approvals"] = {
      orderedTurnIds: [],
      status: "waitingForInput",
      thread: { id: "thread-approvals", name: "Approvals" },
      turns: {},
    };
    state.serverRequestQueue = {
      byId: {
        "string:2": {
          id: "2",
          kind: "fileChangeApproval",
          payload: { path: "src/x.ts" },
          threadId: "thread-approvals",
        },
        "string:10": {
          id: "10",
          kind: "commandApproval",
          payload: { command: "bun test" },
          threadId: "thread-approvals",
        },
      },
      order: ["string:10", "string:2"],
    };
    render(
      <AgentProvider initialState={state} transport={new FakeAgentTransport()}>
        <AgentApprovalQueue threadId="thread-approvals" />
      </AgentProvider>,
    );

    expect(screen.getByText("2 decisions need your review")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Approve command request 10" }),
    ).toBeInTheDocument();
    const reviewRow = screen.getByRole("button", {
      name: "Review file-change request 2",
    });
    expect(
      screen.queryByRole("button", { name: "Approve file-change request 2" }),
    ).not.toBeInTheDocument();

    await user.click(reviewRow);
    expect(
      screen.getByRole("button", { name: "Approve file-change request 2" }),
    ).toBeInTheDocument();
  });

  it("auto-loads history and debounce-filters it from the search box", async () => {
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method !== "thread/list") return {};
        const term = (request.params as { searchTerm?: string } | undefined)?.searchTerm;
        if (term === "audit") {
          return {
            data: [
              { id: "thread-audit", name: "Audit thread", status: { type: "notLoaded" } },
            ],
          };
        }
        return {
          data: [
            {
              id: "thread-initial",
              name: "Initial thread",
              status: { type: "notLoaded" },
            },
          ],
        };
      },
    });
    render(
      <AgentProvider transport={transport}>
        <AgentChat />
      </AgentProvider>,
    );

    expect(
      await screen.findByRole("button", { name: /Initial thread/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load" })).not.toBeInTheDocument();

    const searchInput = screen.getByLabelText("Search history");
    vi.useFakeTimers();
    try {
      fireEvent.change(searchInput, {
        target: { value: "audit" },
      });
      await act(async () => {
        vi.advanceTimersByTime(320);
        await Promise.resolve();
      });
    } finally {
      vi.useRealTimers();
    }
    expect(
      await screen.findByRole("button", { name: /Audit thread/ }),
    ).toBeInTheDocument();
    const auditRequestCount = () =>
      transport.requests.filter(
        (request) =>
          request.method === "thread/list" &&
          (request.params as { searchTerm?: string }).searchTerm === "audit",
      ).length;
    expect(auditRequestCount()).toBe(1);
    vi.useFakeTimers();
    try {
      await act(async () => {
        vi.advanceTimersByTime(2000);
        await Promise.resolve();
      });
    } finally {
      vi.useRealTimers();
    }
    expect(auditRequestCount()).toBe(1);
  });
});
