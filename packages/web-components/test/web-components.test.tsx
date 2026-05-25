// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { FakeAgentTransport } from "@nyosegawa/agent-ui-core";
import { act, waitFor } from "@testing-library/react";
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
    await expectText("Agent UI transport is not configured.");

    await act(async () => {
      element.transport = new FakeAgentTransport({
        onRequest(request) {
          if (request.method === "account/read") {
            return {
              account: { email: "user@example.com", planType: "pro", type: "chatgpt" },
            };
          }
          return {};
        },
      });
    });
    // The starter composer's send control is an icon-only round button, so
    // assert its accessible label rather than visible text.
    await waitFor(() => {
      expect(
        document.querySelector('button[aria-label="Start thread"]'),
      ).toBeInTheDocument();
    });
  });
});

async function expectText(text: string) {
  await waitFor(() => {
    expect(document.body).toHaveTextContent(text);
  });
}
