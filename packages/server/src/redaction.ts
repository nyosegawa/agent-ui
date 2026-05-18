import type { AgentTransportEvent } from "@nyosegawa/agent-ui-core";

export function redactSecrets(input: string): string {
  return input
    .replace(/(Authorization:\s*Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1[REDACTED]")
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1[REDACTED]")
    .replace(
      /\b(OPENAI_API_KEY|api[_-]?key|token|password|secret|device[_-]?code|user[_-]?code|userCode)=([^&\s]+)/gi,
      "$1=[REDACTED]",
    )
    .replace(
      /"((?:access|refresh)?token|secret|password|api[_-]?key|device[_-]?code|user[_-]?code|userCode)"\s*:\s*"[^"]+"/gi,
      "\"$1\":\"[REDACTED]\"",
    );
}

export function redactStructuredValue<T>(value: T): T {
  return redactValue(value) as T;
}

export function redactTransportEvent(event: AgentTransportEvent): AgentTransportEvent {
  return redactStructuredValue(event);
}

function redactValue(value: unknown): unknown {
  if (typeof value === "string") return redactSecrets(value);
  if (Array.isArray(value)) return value.map((item) => redactValue(item));
  if (!value || typeof value !== "object") return value;
  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    output[key] = isCredentialKey(key) ? "[REDACTED]" : redactValue(child);
  }
  return output;
}

function isCredentialKey(key: string): boolean {
  return /^(authorization|api[_-]?key|token|accessToken|refreshToken|password|secret|device[_-]?code|user[_-]?code|userCode)$/i.test(
    key,
  );
}
