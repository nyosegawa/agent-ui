import type { AccountEvent } from "../events";
import type { AgentSessionState } from "../state";
import { usageStore } from "../stores/usage";
import { recordOrUndefined } from "./shared";

export function reduceAccountEvent(
  state: AgentSessionState,
  event: AccountEvent,
): AgentSessionState {
  switch (event.type) {
    case "account/updated":
      return {
        ...state,
        account: {
          ...state.account,
          account: recordOrUndefined(event.account),
          status:
            event.status ?? (event.account == null ? "unauthenticated" : "authenticated"),
        },
      };
    case "account/login/deviceCodeStarted":
      return {
        ...state,
        account: {
          ...state.account,
          login: {
            expiresAt: event.expiresAt,
            loginId: event.loginId,
            requestId: event.requestId,
            userCode: event.userCode,
            verificationUrl: event.verificationUrl,
          },
          status: "authenticating",
        },
      };
    case "account/login/completed":
      return {
        ...state,
        account: {
          account: recordOrUndefined(event.account) ?? state.account.account,
          status: event.success === false ? "unauthenticated" : "authenticated",
        },
      };
    case "account/rateLimits/updated":
      return {
        ...state,
        account: {
          ...state.account,
          rateLimits: event.rateLimits,
        },
        usage: usageStore.setAccountRateLimits(state.usage, event.rateLimits),
      };
    default:
      return assertNever(event);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled account event: ${JSON.stringify(value)}`);
}
