export type FixtureScenario =
  | "default"
  | "empty"
  | "unauth"
  | "bridge-error"
  | "host-workflow"
  | "rich-transcript";

export type FixtureGroup = "core" | "states" | "primitives";

export interface FixtureState {
  description: string;
  group: FixtureGroup;
  href: string;
  meta: string;
  title: string;
}

export const visualQaStates: FixtureState[] = [
  {
    description:
      "Fixture-backed streaming, approvals, diff, usage, and automatic stored thread resume through AgentChat.",
    group: "core",
    href: "/",
    meta: "preset · default fixture",
    title: "Default conversation",
  },
  {
    description:
      "Dense approvals, status banners, rich renderer blocks, plan, tool call, image, web search, and system events.",
    group: "core",
    href: "/rich-transcript",
    meta: "preset · rich transcript fixture",
    title: "Rich transcript fixture",
  },
  {
    description:
      "Host workflow surface composed from independent thread, status, usage, approval, and composer primitives.",
    group: "primitives",
    href: "/host-workflow-recipe",
    meta: "primitives · host slot",
    title: "Host workflow recipe",
  },
  {
    description:
      "Inquiry desk demo with ticket triage, customer context, reply review, audit policy, and an embedded support assistant.",
    group: "primitives",
    href: "/support-console",
    meta: "primitives · support SaaS",
    title: "Support console",
  },
  {
    description:
      "Failed first-message retry through the public composer controller without host-owned rollback logic.",
    group: "primitives",
    href: "/composer-retry",
    meta: "primitive · composer retry",
    title: "Composer retry",
  },
  {
    description:
      "Transcript primitive with compact defaults, verbose command/file blocks, and critical-only chat text.",
    group: "primitives",
    href: "/transcript-density",
    meta: "primitive · transcript density",
    title: "Transcript density",
  },
  {
    description:
      "Transcript local media rendered from structured browser-safe resource metadata rather than raw paths.",
    group: "primitives",
    href: "/resource-resolution",
    meta: "primitive · resource resolution",
    title: "Resource resolution",
  },
  {
    description:
      "AgentUsagePanel rendered with no chat, composer, sidebar, or status chrome.",
    group: "primitives",
    href: "/usage-only",
    meta: "primitive · usage only",
    title: "Usage-only panel",
  },
  {
    description:
      "AgentThreadView locked to a specific threadId, ignoring active sidebar selection.",
    group: "primitives",
    href: "/scoped-thread-pane",
    meta: "primitive · fixed thread",
    title: "Scoped thread pane",
  },
  {
    description:
      "Codex Apps/connectors metadata from app/list, paginated, with enabled and accessibility state.",
    group: "primitives",
    href: "/app-connectors",
    meta: "primitive · app metadata",
    title: "App connectors",
  },
  {
    description:
      "Authenticated Codex account with no stored threads — first-run after login.",
    group: "states",
    href: "/?state=empty",
    meta: "preset · empty",
    title: "Empty authenticated workspace",
  },
  {
    description: "First-run device-code login flow without stale account or usage state.",
    group: "states",
    href: "/?state=unauth",
    meta: "preset · unauthenticated",
    title: "Unauthenticated first run",
  },
  {
    description:
      "Failed local Codex bridge — diagnostics surface the cause and no misleading start action.",
    group: "states",
    href: "/?state=bridge-error",
    meta: "preset · bridge error",
    title: "Bridge error",
  },
];

export const fixtureGroupLabels: Record<FixtureGroup, string> = {
  core: "Preset surfaces",
  primitives: "Primitive compositions",
  states: "Lifecycle states",
};

export function groupFixtures(states: FixtureState[]) {
  return Object.entries(
    states.reduce<Record<FixtureGroup, FixtureState[]>>(
      (groups, state) => {
        groups[state.group].push(state);
        return groups;
      },
      { core: [], primitives: [], states: [] },
    ),
  ).map(([group, fixtures]) => ({
    group: group as FixtureGroup,
    states: fixtures,
  }));
}
