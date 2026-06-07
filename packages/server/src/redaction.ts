import type { AgentTransportEvent } from "@nyosegawa/agent-ui-core";

export function redactSecrets(input: string): string {
  return input
    .replace(/(^|[\r\n])(Authorization\s*:\s*)[^\r\n]*/gi, "$1$2[REDACTED]")
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1[REDACTED]")
    .replace(/\bagent-ui-bearer\.[A-Za-z0-9_-]+/g, "agent-ui-bearer.[REDACTED]")
    .replace(
      new RegExp(`"(${CREDENTIAL_KEY_SOURCE})"\\s*:\\s*"[^"]+"`, "gi"),
      "\"$1\":\"[REDACTED]\"",
    )
    .replace(/([?&;])([^=&#;\s]+)=([^&#;\s]*)/g, redactQueryParam)
    .replace(
      new RegExp(`\\b(OPENAI_API_KEY|${CREDENTIAL_TEXT_KEY_SOURCE})(\\s*[:=]\\s*)([^&;\\s]+)`, "gi"),
      "$1$2[REDACTED]",
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
  return CREDENTIAL_KEYS.has(normalizeCredentialKey(key));
}

const CREDENTIAL_KEY_SOURCE =
  "authorization|api[_-]?key|x-api-key|token|access[_-]?token|refresh[_-]?token|id[_-]?token|client[_-]?secret|code[_-]?verifier|password|secret|device[_-]?code|user[_-]?code|userCode";

const CREDENTIAL_TEXT_KEY_SOURCE =
  "api[_-]?key|x-api-key|token|access[_-]?token|refresh[_-]?token|id[_-]?token|client[_-]?secret|code[_-]?verifier|password|secret|device[_-]?code|user[_-]?code|userCode";

const CREDENTIAL_KEYS = new Set([
  "authorization",
  "apikey",
  "xapikey",
  "token",
  "accesstoken",
  "refreshtoken",
  "idtoken",
  "clientsecret",
  "codeverifier",
  "password",
  "secret",
  "devicecode",
  "usercode",
]);

function normalizeCredentialKey(key: string): string {
  return key.replace(/[_-]/g, "").toLowerCase();
}

function redactQueryParam(match: string, delimiter: string, key: string): string {
  return isCredentialKey(safeDecodeQueryKey(key)) ? `${delimiter}${key}=[REDACTED]` : match;
}

function safeDecodeQueryKey(key: string): string {
  try {
    return decodeURIComponent(key.replace(/\+/g, " "));
  } catch {
    return key;
  }
}
