export interface ExampleHostResolution {
  host: string;
  unsafeNonLoopback: boolean;
  warning?: string;
}

export function resolveExampleHost(
  host: string,
  allowNonLoopback = false,
): ExampleHostResolution {
  if (isLoopbackHost(host)) {
    return { host, unsafeNonLoopback: false };
  }
  if (allowNonLoopback) {
    return {
      host,
      unsafeNonLoopback: true,
      warning:
        `AGENT_UI_ALLOW_NON_LOOPBACK=1 exposes unauthenticated local example routes on ${host}.`,
    };
  }
  throw new Error(
    `Refusing to bind Agent UI example server to non-loopback host ${host}. ` +
      "Set AGENT_UI_ALLOW_NON_LOOPBACK=1 only for trusted, host-owned networks.",
  );
}

function isLoopbackHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "::1" ||
    normalized === "[::1]" ||
    normalized.startsWith("127.")
  );
}
