import type { RequestId } from "../state";

export type AccountEvent =
  | { type: "account/updated"; status?: "unauthenticated" | "authenticated"; account?: unknown }
  | { type: "account/rateLimits/updated"; rateLimits: unknown }
  | {
      type: "account/login/deviceCodeStarted";
      loginId?: string;
      requestId?: RequestId;
      userCode?: string;
      verificationUrl?: string;
      expiresAt?: string;
    }
  | {
      type: "account/login/completed";
      account?: unknown;
      error?: string | null;
      loginId?: string | null;
      success?: boolean;
    };
