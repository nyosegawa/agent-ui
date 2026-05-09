import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import type {
  CancelLoginAccountParams,
  LoginAccountParams,
  LoginAccountResponse,
} from "./generated/stable/v2";

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
  const raw = await transport.request<LoginAccountParams, LoginAccountResponse>(
    "account/login/start",
    params,
  );
  const record = asRecord(raw);
  return {
    expiresIn: numberValue(record?.expiresIn) ?? numberValue(record?.expires_in),
    loginId:
      raw.type === "chatgptDeviceCode" ? raw.loginId : stringValue(record?.login_id),
    raw,
    userCode:
      raw.type === "chatgptDeviceCode" ? raw.userCode : stringValue(record?.user_code),
    verificationUrl:
      raw.type === "chatgptDeviceCode"
        ? raw.verificationUrl
        : stringValue(record?.verification_url),
  };
}

export async function cancelDeviceCodeLogin(
  transport: AgentTransport,
  loginId: string,
): Promise<void> {
  const params = { loginId } satisfies CancelLoginAccountParams;
  await transport.request("account/login/cancel", params);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}
