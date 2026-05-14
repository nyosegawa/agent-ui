#!/usr/bin/env node
/* global clearTimeout, console, process, setTimeout */
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCodexStdioTransport } from "../packages/codex/dist/index.js";

const args = new Set(process.argv.slice(2));
const runApproval = args.has("--approval");
const fileOnly = args.has("--file-only");
const approvalDecision = process.argv.includes("--accept-for-session")
  ? "acceptForSession"
  : process.argv.includes("--accept")
    ? "accept"
    : "decline";
const timeoutMs = Number(process.env.AGENT_UI_REAL_CODEX_TIMEOUT_MS ?? 180_000);
const initializeTimeoutMs = Number(
  process.env.AGENT_UI_REAL_CODEX_INIT_TIMEOUT_MS ?? 30_000,
);

const child = spawn("codex", ["app-server", "--listen", "stdio://"], {
  stdio: ["pipe", "pipe", "pipe"],
});
const transport = createCodexStdioTransport({
  initialize: {
    clientInfo: {
      name: "agent_ui_real_codex_smoke",
      title: "Agent UI Real Codex Smoke",
      version: "0.0.0",
    },
  },
  stderr: child.stderr,
  stdin: child.stdin,
  stdout: child.stdout,
});

const result = {
  approval: {
    command: false,
    decision: approvalDecision,
    fileChange: false,
  },
  bootstrap: {},
  events: {
    assistantText: "",
    completedTurns: 0,
  },
};

let tmpRoot;
let closed = false;

const eventReader = (async () => {
  for await (const event of transport.events) {
    if (event.type === "request" && event.request?.kind === "commandApproval") {
      result.approval.command = true;
      await transport.respond(event.request.id, { decision: approvalDecision });
    }
    if (event.type === "request" && event.request?.kind === "fileChangeApproval") {
      result.approval.fileChange = true;
      await transport.respond(event.request.id, { decision: approvalDecision });
    }
    if (event.event?.type === "item/agentMessage/delta") {
      result.events.assistantText += event.event.delta;
    }
    if (event.event?.type === "turn/completed") {
      result.events.completedTurns += 1;
    }
  }
})().catch(() => undefined);

try {
  tmpRoot = await mkdtemp(join(tmpdir(), "agent-ui-real-codex-"));
  await withTimeout(transport.connect(), initializeTimeoutMs, "initialize");

  const account = await withTimeout(
    transport.request("account/read", { refreshToken: false }),
    15_000,
    "account/read",
  );
  const models = await withTimeout(transport.request("model/list", {}), 15_000, "model/list");
  const usage = await withTimeout(
    transport.request("account/rateLimits/read"),
    15_000,
    "account/rateLimits/read",
  );
  const threadList = await withTimeout(
    transport.request("thread/list", {
      limit: 5,
      searchTerm: null,
      sortDirection: "desc",
      sortKey: "updated_at",
    }),
    30_000,
    "thread/list",
  );

  const storedThread = threadList?.data?.[0] ?? threadList?.threads?.[0];
  if (storedThread?.id) {
    await withTimeout(
      transport.request("thread/read", { includeTurns: true, threadId: storedThread.id }),
      30_000,
      "thread/read",
    );
    await withTimeout(
      transport.request("thread/resume", { excludeTurns: true, threadId: storedThread.id }),
      30_000,
      "thread/resume",
    );
  }

  result.bootstrap = {
    accountStatus: account?.account ? "authenticated" : "unauthenticated",
    hasUsage: Boolean(usage),
    listedThreads: threadList?.data?.length ?? threadList?.threads?.length ?? 0,
    modelCount: models?.data?.length ?? models?.models?.length ?? 0,
  };

  const started = await withTimeout(
    transport.request("thread/start", {
      approvalPolicy: runApproval ? "untrusted" : "on-request",
      approvalsReviewer: "user",
      cwd: tmpRoot,
      ephemeral: true,
      sandbox: runApproval ? "read-only" : "workspace-write",
    }),
    30_000,
    "thread/start",
  );
  const threadId = started?.thread?.id ?? started?.id ?? started?.threadId;

  await withTimeout(
    transport.request("turn/start", {
      approvalPolicy: runApproval ? "untrusted" : "on-request",
      approvalsReviewer: "user",
      input: [
        {
          text: runApproval
            ? fileOnly
              ? "For an Agent UI file approval smoke test, create a file named agent-ui-file-approval-smoke.txt containing exactly the text ok. Do not run shell commands. Do not ask follow-up questions."
              : "For an Agent UI approval smoke test, run the shell command `printf agent-ui-command-approval-smoke` and create a file named agent-ui-file-approval-smoke.txt containing the text ok. Do not ask follow-up questions."
            : "Reply exactly: Agent UI real smoke ok.",
          text_elements: [],
          type: "text",
        },
      ],
      sandboxPolicy: runApproval
        ? { networkAccess: false, type: "readOnly" }
        : {
            excludeSlashTmp: false,
            excludeTmpdirEnvVar: false,
            networkAccess: false,
            type: "workspaceWrite",
            writableRoots: [],
          },
      threadId,
    }),
    30_000,
    "turn/start",
  );

  if (runApproval) {
    await waitFor(
      () => result.approval.command || result.approval.fileChange,
      timeoutMs,
      "approval request",
    );
  } else {
    await waitFor(() => result.events.completedTurns > 0, timeoutMs, "turn/completed");
  }

  await close();
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  await close();
  console.error(error instanceof Error ? error.message : String(error));
  console.error(JSON.stringify(result, null, 2));
  process.exitCode = 1;
}

async function close() {
  if (closed) return;
  closed = true;
  await transport.close().catch(() => undefined);
  child.kill("SIGTERM");
  await Promise.race([eventReader, delay(500)]);
  if (tmpRoot) await rm(tmpRoot, { force: true, recursive: true }).catch(() => undefined);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout(promise, ms, label) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function waitFor(predicate, ms, label) {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > ms) throw new Error(`${label} timed out after ${ms}ms`);
    await delay(250);
  }
}
