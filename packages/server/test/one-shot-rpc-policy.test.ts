import { describe, expect, it } from "vitest";
import {
  DEFAULT_ONE_SHOT_METHODS,
  isOneShotRpcMethodAllowed,
} from "../src/one-shot-rpc-policy";

describe("one-shot RPC method policy", () => {
  it("allows only read/list/status-shaped methods by default", () => {
    expect([...DEFAULT_ONE_SHOT_METHODS].sort()).toEqual([
      "account/rateLimits/read",
      "account/read",
      "account/usage/read",
      "app/list",
      "hooks/list",
      "model/list",
      "skills/list",
      "thread/list",
      "thread/loaded/list",
      "thread/read",
    ]);
    for (const method of DEFAULT_ONE_SHOT_METHODS) {
      expect(isOneShotRpcMethodAllowed(method)).toBe(true);
    }
  });

  it("denies auth, thread mutation, turn control, config, and skill writes by default", () => {
    for (const method of [
      "initialize",
      "account/login/start",
      "account/logout",
      "thread/start",
      "thread/resume",
      "thread/name/set",
      "turn/start",
      "turn/steer",
      "turn/interrupt",
      "skills/config/write",
      "config/value/write",
    ]) {
      expect(isOneShotRpcMethodAllowed(method)).toBe(false);
    }
  });

  it("allows explicit allowlists and unsafe all-method opt-in", () => {
    expect(
      isOneShotRpcMethodAllowed("turn/start", { allowedMethods: ["turn/start"] }),
    ).toBe(true);
    expect(isOneShotRpcMethodAllowed("turn/start", { allowedMethods: "all" })).toBe(
      true,
    );
  });

  it("does not let public default-method mutation widen omitted policy", () => {
    expect(() => {
      (DEFAULT_ONE_SHOT_METHODS as string[]).push("fs/readFile");
    }).toThrow(TypeError);
    expect(isOneShotRpcMethodAllowed("fs/readFile")).toBe(false);
  });
});
