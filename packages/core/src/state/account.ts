import type { RequestId } from "./common";

export interface AccountState {
  status: "unknown" | "unauthenticated" | "authenticating" | "authenticated";
  account?: Record<string, unknown>;
  login?: DeviceCodeLoginState;
  rateLimits?: unknown;
}

export interface DeviceCodeLoginState {
  loginId?: string;
  requestId?: RequestId;
  userCode?: string;
  verificationUrl?: string;
  expiresAt?: string;
}
