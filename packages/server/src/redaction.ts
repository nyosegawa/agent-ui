export function redactSecrets(input: string): string {
  return input
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(/(token|secret|password|api[_-]?key)=([^&\s]+)/gi, "$1=[REDACTED]");
}
