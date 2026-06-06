export type ReactProtocolExposure =
  | "default-ui"
  | "hook"
  | "client-only"
  | "no-default-ui";

export interface ReactProtocolExposureEntry {
  evidence?: readonly ReactProtocolExposureEvidence[];
  exposure: ReactProtocolExposure;
  rationale: string;
}

export interface ReactProtocolExposureEvidence {
  callee: readonly string[];
  file: string;
  kind: "required" | "forbidden";
}

export const reactProtocolExposure = {
  initialize: {
    evidence: [
      {
        file: "packages/react/src",
        callee: ["codex", "connection", "initialize"],
        kind: "forbidden",
      },
    ],
    exposure: "no-default-ui",
    rationale:
      "Connection initialization is transport-owned; React consumes connected state but does not call initialize.",
  },
  "account/read": {
    evidence: [
      {
        file: "packages/react/src/hooks/account.ts",
        callee: ["codex", "account", "read"],
        kind: "required",
      },
    ],
    exposure: "hook",
    rationale: "useAgentBootstrap and useAgentAccount read normalized account state.",
  },
  "account/login/start": {
    evidence: [
      {
        file: "packages/react/src/hooks/account.ts",
        callee: ["codex", "account", "loginDeviceCode"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "Agent account surfaces start device-code login through useAgentAccount.",
  },
  "account/login/cancel": {
    evidence: [
      {
        file: "packages/react/src/hooks/account.ts",
        callee: ["codex", "account", "cancelLogin"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "Agent account surfaces cancel pending device-code login.",
  },
  "account/logout": {
    evidence: [
      {
        file: "packages/react/src/hooks/account.ts",
        callee: ["codex", "account", "logout"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "Agent account surfaces expose logout through useAgentAccount.",
  },
  "account/rateLimits/read": {
    evidence: [
      {
        file: "packages/react/src/hooks/usage.ts",
        callee: ["codex", "account", "rateLimitsRead"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "useAgentUsage and AgentUsagePanel expose current rate-limit usage.",
  },
  "account/usage/read": {
    evidence: [
      {
        file: "packages/react/src",
        callee: ["codex", "account", "usageRead"],
        kind: "forbidden",
      },
    ],
    exposure: "client-only",
    rationale:
      "Hosts can build usage-history panels, but default React UI does not render token usage history yet.",
  },
  "model/list": {
    evidence: [
      {
        file: "packages/react/src/hooks/models.ts",
        callee: ["codex", "models", "list"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "useAgentModels feeds default run settings and model selectors.",
  },
  "thread/start": {
    evidence: [
      {
        file: "packages/react/src/hooks/thread.ts",
        callee: ["codex", "thread", "start"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "Default composer and thread controller create new Codex threads.",
  },
  "thread/resume": {
    evidence: [
      {
        file: "packages/react/src/hooks/thread.ts",
        callee: ["codex", "thread", "resume"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "Thread URL routing and thread controller can resume stored sessions.",
  },
  "thread/fork": {
    evidence: [
      {
        file: "packages/react/src/hooks/thread.ts",
        callee: ["codex", "thread", "fork"],
        kind: "required",
      },
      {
        file: "packages/react/src/components/thread.tsx",
        callee: ["forkThread"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "Thread header actions expose fork through useAgentThreadActions.",
  },
  "thread/list": {
    evidence: [
      {
        file: "packages/react/src/hooks/thread-list.ts",
        callee: ["codex", "thread", "list"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "Default thread history sidebar lists stored threads.",
  },
  "thread/loaded/list": {
    evidence: [
      {
        file: "packages/react/src",
        callee: ["codex", "thread", "loadedList"],
        kind: "forbidden",
      },
    ],
    exposure: "client-only",
    rationale:
      "The Codex client supports loaded-thread listing, but React currently uses thread/list and normalized collection state.",
  },
  "thread/read": {
    evidence: [
      {
        file: "packages/react/src/hooks/thread.ts",
        callee: ["codex", "thread", "read"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "Default history and URL routing hydrate stored transcripts with thread/read.",
  },
  "thread/archive": {
    evidence: [
      {
        file: "packages/react/src/hooks/thread.ts",
        callee: ["codex", "thread", "archive"],
        kind: "required",
      },
      {
        file: "packages/react/src/components/thread.tsx",
        callee: ["archiveThread"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "Thread header actions expose archive through useAgentThreadActions.",
  },
  "thread/unarchive": {
    evidence: [
      {
        file: "packages/react/src/hooks/thread.ts",
        callee: ["codex", "thread", "unarchive"],
        kind: "required",
      },
      {
        file: "packages/react/src/components/thread.tsx",
        callee: ["unarchiveThread"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "Thread header actions expose unarchive through useAgentThreadActions.",
  },
  "thread/name/set": {
    evidence: [
      {
        file: "packages/react/src/hooks/thread.ts",
        callee: ["codex", "thread", "setName"],
        kind: "required",
      },
      {
        file: "packages/react/src/components/thread.tsx",
        callee: ["renameThread"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "Thread header actions expose rename through useAgentThreadActions.",
  },
  "thread/metadata/update": {
    evidence: [
      {
        file: "packages/react/src",
        callee: ["codex", "thread", "metadataUpdate"],
        kind: "forbidden",
      },
    ],
    exposure: "client-only",
    rationale:
      "The Codex client supports metadata updates, but React does not expose a default metadata-edit workflow.",
  },
  "thread/compact/start": {
    evidence: [
      {
        file: "packages/react/src/hooks/thread.ts",
        callee: ["codex", "thread", "compactStart"],
        kind: "required",
      },
      {
        file: "packages/react/src/components/thread.tsx",
        callee: ["compactThread"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "Thread header actions expose compaction through useAgentThreadActions.",
  },
  "thread/rollback": {
    evidence: [
      {
        file: "packages/react/src/hooks/thread.ts",
        callee: ["codex", "thread", "rollback"],
        kind: "required",
      },
      {
        file: "packages/react/src/components/thread.tsx",
        callee: ["rollbackThread"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "Thread header actions expose rollback through useAgentThreadActions.",
  },
  "thread/inject_items": {
    evidence: [
      {
        file: "packages/react/src",
        callee: ["codex", "thread", "injectItems"],
        kind: "forbidden",
      },
    ],
    exposure: "client-only",
    rationale:
      "The Codex client supports item injection, but default React UI does not provide an injection workflow.",
  },
  "thread/unsubscribe": {
    evidence: [
      {
        file: "packages/react/src",
        callee: ["codex", "thread", "unsubscribe"],
        kind: "forbidden",
      },
    ],
    exposure: "client-only",
    rationale:
      "The Codex client supports unsubscribe, but default React UI does not expose a subscription workflow.",
  },
  "turn/start": {
    evidence: [
      {
        file: "packages/react/src/hooks/turn.ts",
        callee: ["codex", "turn", "start"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "Default composer starts turns on idle threads.",
  },
  "turn/steer": {
    evidence: [
      {
        file: "packages/react/src/hooks/turn.ts",
        callee: ["codex", "turn", "steer"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "Default composer sends same-turn continuations and queued follow-ups.",
  },
  "turn/interrupt": {
    evidence: [
      {
        file: "packages/react/src/hooks/turn.ts",
        callee: ["codex", "turn", "interrupt"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "Default composer and turn controls expose stop/interruption.",
  },
  "skills/list": {
    evidence: [
      {
        file: "packages/react/src/hooks/connectors.ts",
        callee: ["codex", "skills", "list"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "useAgentSkills and AgentSkillsPanel expose skill state.",
  },
  "skills/config/write": {
    evidence: [
      {
        file: "packages/react/src/hooks/connectors.ts",
        callee: ["codex", "skills", "configWrite"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "AgentSkillsPanel toggles skill enablement through useAgentSkills.",
  },
  "hooks/list": {
    evidence: [
      {
        file: "packages/react/src/hooks/connectors.ts",
        callee: ["codex", "hooks", "list"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "useAgentHooks and AgentHooksPanel expose hook metadata.",
  },
  "app/list": {
    evidence: [
      {
        file: "packages/react/src/hooks/apps.ts",
        callee: ["codex", "apps", "list"],
        kind: "required",
      },
    ],
    exposure: "default-ui",
    rationale: "useAgentApps and AgentAppsPanel expose Codex Apps/connectors.",
  },
} as const satisfies Record<string, ReactProtocolExposureEntry>;
