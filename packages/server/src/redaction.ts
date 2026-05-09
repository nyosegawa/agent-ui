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
