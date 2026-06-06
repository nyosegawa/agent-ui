export type ReactProtocolExposure =
  | "default-ui"
  | "hook"
  | "client-only"
  | "no-default-ui";

export interface ReactProtocolExposureEntry {
  exposure: ReactProtocolExposure;
  rationale: string;
}

export const reactProtocolExposure = {
  initialize: {
    exposure: "no-default-ui",
    rationale:
      "Connection initialization is transport-owned; React consumes connected state but does not call initialize.",
  },
  "account/read": {
    exposure: "hook",
    rationale: "useAgentBootstrap and useAgentAccount read normalized account state.",
  },
  "account/login/start": {
    exposure: "default-ui",
    rationale: "Agent account surfaces start device-code login through useAgentAccount.",
  },
  "account/login/cancel": {
    exposure: "default-ui",
    rationale: "Agent account surfaces cancel pending device-code login.",
  },
  "account/logout": {
    exposure: "default-ui",
    rationale: "Agent account surfaces expose logout through useAgentAccount.",
  },
  "account/rateLimits/read": {
    exposure: "default-ui",
    rationale: "useAgentUsage and AgentUsagePanel expose current rate-limit usage.",
  },
  "account/usage/read": {
    exposure: "client-only",
    rationale:
      "Hosts can build usage-history panels, but default React UI does not render token usage history yet.",
  },
  "model/list": {
    exposure: "default-ui",
    rationale: "useAgentModels feeds default run settings and model selectors.",
  },
  "thread/start": {
    exposure: "default-ui",
    rationale: "Default composer and thread controller create new Codex threads.",
  },
  "thread/resume": {
    exposure: "default-ui",
    rationale: "Thread URL routing and thread controller can resume stored sessions.",
  },
  "thread/fork": {
    exposure: "hook",
    rationale: "Thread controller exposes fork actions for host-composed UI.",
  },
  "thread/list": {
    exposure: "default-ui",
    rationale: "Default thread history sidebar lists stored threads.",
  },
  "thread/loaded/list": {
    exposure: "hook",
    rationale: "Loaded-thread listing is available through thread collection hooks.",
  },
  "thread/read": {
    exposure: "default-ui",
    rationale: "Default history and URL routing hydrate stored transcripts with thread/read.",
  },
  "thread/archive": {
    exposure: "hook",
    rationale: "Thread controller exposes archive actions for host-composed history UI.",
  },
  "thread/unarchive": {
    exposure: "hook",
    rationale: "Thread controller exposes unarchive actions for host-composed history UI.",
  },
  "thread/name/set": {
    exposure: "hook",
    rationale: "Thread controller exposes rename actions without a default rename UI.",
  },
  "thread/metadata/update": {
    exposure: "hook",
    rationale: "Thread controller exposes metadata update actions for host-composed UI.",
  },
  "thread/compact/start": {
    exposure: "hook",
    rationale: "Thread controller exposes compaction for host-composed controls.",
  },
  "thread/rollback": {
    exposure: "hook",
    rationale: "Thread controller exposes rollback for host-composed controls.",
  },
  "thread/inject_items": {
    exposure: "client-only",
    rationale:
      "The Codex client supports item injection, but default React UI does not provide an injection workflow.",
  },
  "thread/unsubscribe": {
    exposure: "client-only",
    rationale:
      "The Codex client supports unsubscribe, but default React UI does not expose a subscription workflow.",
  },
  "turn/start": {
    exposure: "default-ui",
    rationale: "Default composer starts turns on idle threads.",
  },
  "turn/steer": {
    exposure: "default-ui",
    rationale: "Default composer sends same-turn continuations and queued follow-ups.",
  },
  "turn/interrupt": {
    exposure: "default-ui",
    rationale: "Default composer and turn controls expose stop/interruption.",
  },
  "skills/list": {
    exposure: "default-ui",
    rationale: "useAgentSkills and AgentSkillsPanel expose skill state.",
  },
  "skills/config/write": {
    exposure: "default-ui",
    rationale: "AgentSkillsPanel toggles skill enablement through useAgentSkills.",
  },
  "hooks/list": {
    exposure: "default-ui",
    rationale: "useAgentHooks and AgentHooksPanel expose hook metadata.",
  },
  "app/list": {
    exposure: "default-ui",
    rationale: "useAgentApps and AgentAppsPanel expose Codex Apps/connectors.",
  },
} as const satisfies Record<string, ReactProtocolExposureEntry>;
