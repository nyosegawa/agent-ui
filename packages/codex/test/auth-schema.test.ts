import { describe, expect, it } from "vitest";
import { FakeAgentTransport } from "@nyosegawa/agent-ui-core";
import {
  cancelDeviceCodeLogin,
  startDeviceCodeLogin,
} from "../src/auth";
import type {
  CancelLoginAccountParams,
  LoginAccountParams,
  LoginAccountResponse,
} from "../src/generated/stable/v2";

describe("device-code auth helpers", () => {
  it("starts login with stable schema params and preserves loginId", async () => {
    const response = {
      loginId: "login-123",
      type: "chatgptDeviceCode",
      userCode: "ABCD-EFGH",
      verificationUrl: "https://chatgpt.com/device",
    } satisfies LoginAccountResponse;
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "account/login/start") return response;
        return {};
      },
    });
    await transport.connect();

    await expect(startDeviceCodeLogin(transport)).resolves.toMatchObject({
      loginId: "login-123",
      userCode: "ABCD-EFGH",
      verificationUrl: "https://chatgpt.com/device",
    });

    expect(transport.requests[0]).toMatchObject({
      method: "account/login/start",
      params: { type: "chatgptDeviceCode" } satisfies LoginAccountParams,
    });
  });

  it("cancels login with stable schema params", async () => {
    const transport = new FakeAgentTransport();
    await transport.connect();

    await cancelDeviceCodeLogin(transport, "login-123");

    expect(transport.requests[0]).toMatchObject({
      method: "account/login/cancel",
      params: { loginId: "login-123" } satisfies CancelLoginAccountParams,
    });
  });
});
