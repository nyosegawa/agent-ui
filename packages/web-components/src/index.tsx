import type { AgentSessionState, AgentTransport } from "@nyosegawa/agent-ui-core";
import { AgentChat, AgentProvider, type AgentComponents } from "@nyosegawa/agent-ui-react";
import { createRoot, type Root } from "react-dom/client";

export interface AgentChatElementOptions {
  className?: string;
  components?: AgentComponents;
  initialState?: AgentSessionState;
  transport?: AgentTransport;
}

export interface AgentChatWebComponentElement extends HTMLElement {
  agentOptions?: AgentChatElementOptions;
  components?: AgentComponents;
  initialState?: AgentSessionState;
  transport?: AgentTransport;
}

export function defineAgentChatElement(tagName = "agent-chat") {
  if (typeof customElements === "undefined") return undefined;
  const existing = customElements.get(tagName);
  if (existing) return existing;
  customElements.define(tagName, AgentChatElement);
  return AgentChatElement;
}

const HTMLElementBase =
  typeof HTMLElement === "undefined" ? (class {} as typeof HTMLElement) : HTMLElement;

export class AgentChatElement extends HTMLElementBase implements AgentChatWebComponentElement {
  #components?: AgentComponents;
  #initialState?: AgentSessionState;
  #root?: Root;
  #transport?: AgentTransport;

  get agentOptions(): AgentChatElementOptions {
    return {
      className: this.getAttribute("chat-class") ?? undefined,
      components: this.#components,
      initialState: this.#initialState,
      transport: this.#transport,
    };
  }

  set agentOptions(options: AgentChatElementOptions | undefined) {
    this.#components = options?.components;
    this.#initialState = options?.initialState;
    this.#transport = options?.transport;
    if (options?.className) this.setAttribute("chat-class", options.className);
    this.#render();
  }

  get components() {
    return this.#components;
  }

  set components(value: AgentComponents | undefined) {
    this.#components = value;
    this.#render();
  }

  get initialState() {
    return this.#initialState;
  }

  set initialState(value: AgentSessionState | undefined) {
    this.#initialState = value;
    this.#render();
  }

  get transport() {
    return this.#transport;
  }

  set transport(value: AgentTransport | undefined) {
    this.#transport = value;
    this.#render();
  }

  connectedCallback() {
    this.#render();
  }

  disconnectedCallback() {
    this.#root?.unmount();
    this.#root = undefined;
  }

  #render() {
    if (!this.isConnected) return;
    if (!this.#root) this.#root = createRoot(this);
    const className = this.getAttribute("chat-class") ?? undefined;
    if (!this.#transport) {
      this.#root.render(<p role="status">Agent UI transport is not configured.</p>);
      return;
    }
    this.#root.render(
      <AgentProvider initialState={this.#initialState} transport={this.#transport}>
        <AgentChat className={className} components={this.#components} />
      </AgentProvider>,
    );
  }
}
