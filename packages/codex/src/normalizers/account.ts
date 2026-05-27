import type { AgentEvent } from "@nyosegawa/agent-ui-core";
import { asRecord, booleanValue, stringValue } from "./shared";

export function normalizeAccountNotification(
  method: string,
  params: Record<string, unknown>,
): AgentEvent[] | undefined {
  switch (method) {
    case "account/updated":
      return [
        {
          type: "account/updated",
          account: params.account ?? params,
          status: accountStatus(params.account ?? params),
        },
      ];
    case "account/login/completed":
      return [
        {
          type: "account/login/completed",
          account: params.account,
          error: stringValue(params.error) ?? null,
          loginId: stringValue(params.loginId) ?? stringValue(params.login_id),
          success: booleanValue(params.success),
        },
      ];
    case "account/rateLimits/updated":
      return [
        { type: "account/rateLimits/updated", rateLimits: params.rateLimits ?? params },
      ];
    default:
      return undefined;
  }
}

function accountStatus(account: unknown): "unauthenticated" | "authenticated" {
  if (account == null) return "unauthenticated";
  const record = asRecord(account);
  if (record && "authMethod" in record && record.authMethod == null) {
    return "unauthenticated";
  }
  return "authenticated";
}
