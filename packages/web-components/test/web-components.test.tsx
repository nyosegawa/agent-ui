// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  createInitialAgentState,
  FakeAgentTransport,
} from "@nyosegawa/agent-ui-core";
import type { AgentComponents } from "@nyosegawa/agent-ui-react";
import { act, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { AgentChatElement, defineAgentChatElement, type AgentChatWebComponentElement } from "../src";

const tagName = "agent-chat-test";
let tagSuffix = 0;

describe("AgentChatElement", () => {
  afterEach(() => {
    if (typeof document !== "undefined") document.body.innerHTML = "";
  });

  it("defines a custom element and renders once transport is assigned", async () => {
    if (typeof document === "undefined") return;
    const elementConstructor = defineAgentChatElement(tagName);
    expect(elementConstructor).toBe(customElements.get(tagName));
    expect(defineAgentChatElement(tagName)).toBe(elementConstructor);
    const element = document.createElement(tagName) as AgentChatWebComponentElement;
    await act(async () => {
      document.body.append(element);
    });

    expect(element).toBeInstanceOf(AgentChatElement);
    await expectText("Agent UI transport is not configured.");

    await act(async () => {
      element.transport = new FakeAgentTransport({
        onRequest(request) {
          if (request.method === "account/read") return authenticatedAccount();
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
        className: "agent-options-chat",
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
            if (request.method === "account/read") return authenticatedAccount();
            return {};
          },
        }),
      };
    });
    await expectText("Agent options empty component");
    expect(document.querySelector(".agent-options-chat")).toBeInTheDocument();
  });

  it("passes transcript display options through agentOptions", async () => {
    if (typeof document === "undefined") return;
    const scopedTagName = nextTagName("agent-chat-transcript-display");
    defineAgentChatElement(scopedTagName);
    const element = document.createElement(scopedTagName) as AgentChatWebComponentElement;
    await act(async () => {
      document.body.append(element);
      element.agentOptions = {
        initialState: transcriptDisplayState(),
        transcriptMode: "answer-focused",
        transport: authenticatedTransport(),
      };
    });

    await waitFor(() => {
      expect(document.querySelector('[data-category="command"]')).toHaveAttribute(
        "data-visibility",
        "collapsed",
      );
    });
    expect(document.querySelector('[data-category="reasoning"]')).toBeNull();
  });

  it("rejects foreign custom-element tag collisions", () => {
    const collidingTagName = nextTagName("agent-chat-collision");
    customElements.define(collidingTagName, class extends HTMLElement {});

    expect(() => defineAgentChatElement(collidingTagName)).toThrow(
      `Cannot define AgentChatElement as <${collidingTagName}> because that tag is already registered.`,
    );
  });

  it("observes chat-class and resets combined agentOptions as a full replacement", async () => {
    const scopedTagName = nextTagName("agent-chat-options");
    defineAgentChatElement(scopedTagName);
    const element = document.createElement(scopedTagName) as AgentChatWebComponentElement;
    const replacementComponents = {
      EmptyState: () => <section>Replacement empty component</section>,
    } satisfies AgentComponents;
    await act(async () => {
      document.body.append(element);
      element.transport = new FakeAgentTransport();
      element.components = {
        EmptyState: () => <section>Resettable empty component</section>,
      };
    });
    await expectText("Resettable empty component");

    await act(async () => {
      element.setAttribute("chat-class", "attribute-chat");
    });
    expect(document.querySelector(".attribute-chat")).toBeInTheDocument();

    await act(async () => {
      element.agentOptions = { components: replacementComponents };
    });
    await expectText("Agent UI transport is not configured.");
    expect(element.agentOptions).toEqual({
      className: undefined,
      components: replacementComponents,
      initialState: undefined,
      transport: undefined,
    });
    expect(element.hasAttribute("chat-class")).toBe(false);
    expect(document.body).not.toHaveTextContent("Resettable empty component");

    await act(async () => {
      element.agentOptions = {
        className: "attribute-chat",
        components: replacementComponents,
        transport: new FakeAgentTransport(),
      };
    });
    await expectText("Replacement empty component");
    expect(document.querySelector(".attribute-chat")).toBeInTheDocument();

    await act(async () => {
      element.agentOptions = undefined;
    });
    await expectText("Agent UI transport is not configured.");
    expect(element.agentOptions).toEqual({
      className: undefined,
      components: undefined,
      initialState: undefined,
      transport: undefined,
    });
    expect(element.hasAttribute("chat-class")).toBe(false);
    expect(document.body).not.toHaveTextContent("Resettable empty component");
  });

  it("remounts provider state when transport or initialState changes", async () => {
    const scopedTagName = nextTagName("agent-chat-remount");
    defineAgentChatElement(scopedTagName);
    let mounts = 0;
    const firstState = createInitialAgentState();
    const secondState = createInitialAgentState();
    const element = document.createElement(scopedTagName) as AgentChatWebComponentElement;
    const components = {
      Shell: ({ Default, ...props }) => {
        const [mountNumber] = useState(() => {
          mounts += 1;
          return mounts;
        });
        return (
          <>
            <output>Provider mount {mountNumber}</output>
            <Default {...props} />
          </>
        );
      },
    } satisfies AgentComponents;

    await act(async () => {
      document.body.append(element);
      element.agentOptions = {
        components,
        initialState: firstState,
        transport: authenticatedTransport(),
      };
    });
    await expectText("Provider mount 1");

    await act(async () => {
      element.initialState = secondState;
    });
    await expectText("Provider mount 2");

    await act(async () => {
      element.transport = authenticatedTransport("enterprise");
    });
    await expectText("Provider mount 3");
    await expectText("enterprise");
  });
});

async function expectText(text: string) {
  await waitFor(() => {
    expect(document.body).toHaveTextContent(text);
  });
}

function nextTagName(prefix: string) {
  tagSuffix += 1;
  return `${prefix}-${tagSuffix}`;
}

function authenticatedTransport(planType = "pro") {
  return new FakeAgentTransport({
    onRequest(request) {
      if (request.method === "account/read") return authenticatedAccount(planType);
      return {};
    },
  });
}

function authenticatedAccount(planType = "pro") {
  return {
    account: { email: "user@example.com", planType, type: "chatgpt" },
  } as const;
}

function transcriptDisplayState() {
  const state = createInitialAgentState() as {
    threadLifecycle: { activeThreadId?: string };
    threads: Record<string, unknown>;
  };
  state.threadLifecycle.activeThreadId = "thread-display";
  state.threads["thread-display"] = {
    orderedTurnIds: ["turn-display"],
    status: "loaded",
    thread: { id: "thread-display", name: "Transcript display" },
    turns: {
      "turn-display": {
        blocksByItemId: {
          "command-1": {
            command: "bun test",
            id: "command-1",
            kind: "commandExecution",
          },
          "reasoning-1": {
            id: "reasoning-1",
            kind: "thinking",
            text: "Planning",
          },
        },
        commandOutputByItemId: {},
        filePatchByItemId: {},
        itemOrder: ["user-1", "reasoning-1", "command-1", "assistant-1"],
        items: {
          "assistant-1": {
            id: "assistant-1",
            kind: "agentMessage",
            status: "completed",
            text: "Done.",
            threadId: "thread-display",
            turnId: "turn-display",
          },
          "command-1": {
            id: "command-1",
            kind: "commandExecution",
            status: "completed",
            threadId: "thread-display",
            turnId: "turn-display",
          },
          "reasoning-1": {
            id: "reasoning-1",
            kind: "reasoning",
            status: "completed",
            threadId: "thread-display",
            turnId: "turn-display",
          },
          "user-1": {
            id: "user-1",
            kind: "userMessage",
            status: "completed",
            text: "Run checks.",
            threadId: "thread-display",
            turnId: "turn-display",
          },
        },
        streamingTextByItemId: {},
        turn: { id: "turn-display", threadId: "thread-display" },
      },
    },
  };
  return state;
}
