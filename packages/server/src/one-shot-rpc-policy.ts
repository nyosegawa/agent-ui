export type OneShotRpcAllowedMethods = readonly string[] | "all";

export interface OneShotRpcMethodPolicyOptions {
  allowedMethods?: OneShotRpcAllowedMethods;
}

const DEFAULT_ONE_SHOT_METHOD_LIST = [
  "account/read",
  "account/rateLimits/read",
  "model/list",
  "thread/list",
  "thread/loaded/list",
  "thread/read",
  "skills/list",
  "hooks/list",
  "app/list",
] as const;

const DEFAULT_ONE_SHOT_METHOD_SET = new Set<string>(DEFAULT_ONE_SHOT_METHOD_LIST);

export const DEFAULT_ONE_SHOT_METHODS: readonly string[] = Object.freeze([
  ...DEFAULT_ONE_SHOT_METHOD_LIST,
]);

export function isOneShotRpcMethodAllowed(
  method: string,
  options: OneShotRpcMethodPolicyOptions = {},
): boolean {
  if (options.allowedMethods === "all") return true;
  const allowedMethods =
    options.allowedMethods === undefined
      ? DEFAULT_ONE_SHOT_METHOD_SET
      : new Set(options.allowedMethods);
  return allowedMethods.has(method);
}

export function oneShotRpcInvalidRequestError(message: string, data?: unknown) {
  return {
    code: -32600,
    ...(data === undefined ? {} : { data }),
    message,
  };
}

export function oneShotRpcMethodNotAllowedError(method: string) {
  return {
    code: -32601,
    data: { method },
    message: `Codex method is not allowed: ${method}`,
  };
}
