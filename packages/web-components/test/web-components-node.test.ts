// @vitest-environment node
import { describe, expect, it } from "vitest";
import { AgentChatElement, defineAgentChatElement } from "../src";

describe("AgentChatElement without a DOM", () => {
  it("imports safely and leaves registration to browser hosts", () => {
    expect(typeof HTMLElement).toBe("undefined");
    expect(AgentChatElement).toBeTypeOf("function");
    expect(defineAgentChatElement()).toBeUndefined();
  });
});
