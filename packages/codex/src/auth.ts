import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import type { CancelLoginAccountParams, LoginAccountParams } from "./generated/stable/v2";

export interface DeviceCodeLoginStart {
  loginId?: string;
  userCode?: string;
  verificationUrl?: string;
  expiresIn?: number;
  raw: unknown;
}

export async function startDeviceCodeLogin(
  transport: AgentTransport,
): Promise<DeviceCodeLoginStart> {
  const params = { type: "chatgptDeviceCode" } satisfies LoginAccountParams;
  const raw = await transport.request("account/login/start", params);
  const value = raw as any;
  return {
    expiresIn: value.expiresIn ?? value.expires_in,
    loginId: value.loginId ?? value.login_id,
    raw,
    userCode: value.userCode ?? value.user_code,
    verificationUrl: value.verificationUrl ?? value.verification_url,
  };
}

export async function cancelDeviceCodeLogin(
  transport: AgentTransport,
  loginId: string,
): Promise<void> {
  const params = { loginId } satisfies CancelLoginAccountParams;
  await transport.request("account/login/cancel", params);
}
