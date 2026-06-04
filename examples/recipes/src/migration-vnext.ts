export interface MigrationVNextStep {
  detail: string;
  owner: "agent-ui" | "host";
  title: string;
}

export const migrationVNextSteps: MigrationVNextStep[] = [
  {
    detail:
      "Use Codex App Server productized methods for browser transports; keep experimental and unsupported methods behind host-owned policy.",
    owner: "host",
    title: "Classify protocol usage",
  },
  {
    detail:
      "Replace ad hoc first-message UI state with the public composer controller so rollback and retry stay predictable.",
    owner: "agent-ui",
    title: "Move first messages to the composer controller",
  },
  {
    detail:
      "Resolve browser files through a host-owned upload/static route and pass structured attachment metadata to Agent UI.",
    owner: "host",
    title: "Route local media through the host",
  },
  {
    detail:
      "Use explicit bridge admission, browser method policy, and host event sinks instead of relying on deployment defaults.",
    owner: "host",
    title: "Make bridge policy explicit",
  },
  {
    detail:
      "Treat auth, persistence, tenant isolation, billing, process lifecycle, and deployment policy as host responsibilities.",
    owner: "host",
    title: "Keep hosted-service policy out of core",
  },
];
