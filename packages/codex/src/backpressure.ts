export function isBackpressureRetrySafeMethod(method: string): boolean {
  return BACKPRESSURE_RETRY_SAFE_METHODS.has(method);
}

export function isBackpressureError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === -32001
  );
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const BACKPRESSURE_RETRY_SAFE_METHODS = new Set([
  "account/read",
  "account/rateLimits/read",
  "app/list",
  "hooks/list",
  "model/list",
  "skills/list",
  "thread/list",
  "thread/loaded/list",
  "thread/read",
  "thread/turns/list",
]);
