// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { FakeAgentTransport } from "@nyosegawa/agent-ui-core";
import { afterEach, describe, expect, it } from "vitest";
import { AgentChatElement, defineAgentChatElement, type AgentChatWebComponentElement } from "../src";

describe("AgentChatElement", () => {
  afterEach(() => {
    if (typeof document !== "undefined") document.body.innerHTML = "";
  });

  it("defines a custom element and renders once transport is assigned", async () => {
    if (typeof document === "undefined") return;
    const tagName = "agent-chat-test";
    defineAgentChatElement(tagName);
    const element = document.createElement(tagName) as AgentChatWebComponentElement;
    document.body.append(element);

    expect(element).toBeInstanceOf(AgentChatElement);
    expect(await findText("Agent UI transport is not configured.")).toBeTruthy();

    element.transport = new FakeAgentTransport();
    expect(await findText("Start thread")).toBeTruthy();
  });
});

async function findText(text: string) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (document.body.textContent?.includes(text)) return true;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return false;
}
