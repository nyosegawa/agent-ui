import type { AgentTransport } from "@nyosegawa/agent-ui-core";

export interface DeviceCodeLoginStart {
  userCode?: string;
  verificationUrl?: string;
  expiresIn?: number;
  raw: unknown;
}

export async function startDeviceCodeLogin(
  transport: AgentTransport,
): Promise<DeviceCodeLoginStart> {
  const raw = await transport.request("account/login/start", {
    method: "chatgptDeviceCode",
  });
  const value = raw as any;
  return {
    expiresIn: value.expiresIn ?? value.expires_in,
    raw,
    userCode: value.userCode ?? value.user_code,
    verificationUrl: value.verificationUrl ?? value.verification_url,
  };
}

export async function cancelDeviceCodeLogin(transport: AgentTransport): Promise<void> {
  await transport.request("account/login/cancel");
}
