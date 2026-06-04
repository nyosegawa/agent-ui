// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { FakeAgentTransport } from "@nyosegawa/agent-ui-core";
import { act, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AgentChatElement, defineAgentChatElement, type AgentChatWebComponentElement } from "../src";

const tagName = "agent-chat-test";

describe("AgentChatElement", () => {
  afterEach(() => {
    if (typeof document !== "undefined") document.body.innerHTML = "";
  });

  it("defines a custom element and renders once transport is assigned", async () => {
    if (typeof document === "undefined") return;
    defineAgentChatElement(tagName);
    const element = document.createElement(tagName) as AgentChatWebComponentElement;
    await act(async () => {
      document.body.append(element);
    });

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

  it("passes components through element properties and agentOptions", async () => {
    if (typeof document === "undefined") return;
    defineAgentChatElement(tagName);
    const element = document.createElement(tagName) as AgentChatWebComponentElement;
    document.body.append(element);

    await act(async () => {
      element.components = {
        EmptyState: () => <section>Custom empty component</section>,
      };
      element.transport = new FakeAgentTransport();
    });
    await expectText("Custom empty component");

    await act(async () => {
      element.agentOptions = {
        components: {
          EmptyState: ({ Default, ...props }) => (
            <section>
              Agent options empty component
              <Default {...props} />
            </section>
          ),
        },
        transport: new FakeAgentTransport({
          onRequest(request) {
            if (request.method === "account/read") {
              return {
                account: { email: "user@example.com", planType: "pro", type: "chatgpt" },
              };
            }
            return {};
          },
        }),
      };
    });
    await expectText("Agent options empty component");
    await expectText("Connect Codex");
  });
});

async function expectText(text: string) {
  await waitFor(() => {
    expect(document.body).toHaveTextContent(text);
  });
}
