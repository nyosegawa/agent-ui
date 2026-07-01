import type { AgentSessionState, AgentTransport } from "@nyosegawa/agent-ui-core";
import {
  AgentChat,
  AgentProvider,
  type AgentComponents,
  type AgentTranscriptDisplay,
} from "@nyosegawa/agent-ui-react";
import { createRoot, type Root } from "react-dom/client";

export interface AgentChatElementOptions {
  className?: string;
  components?: AgentComponents;
  initialState?: AgentSessionState;
  transport?: AgentTransport;
  transcriptDisplay?: AgentTranscriptDisplay;
  transcriptMode?: Extract<AgentTranscriptDisplay, string>;
}

export interface AgentChatWebComponentElement extends HTMLElement {
  agentOptions?: AgentChatElementOptions;
  components?: AgentComponents;
  initialState?: AgentSessionState;
  transport?: AgentTransport;
  transcriptDisplay?: AgentTranscriptDisplay;
  transcriptMode?: Extract<AgentTranscriptDisplay, string>;
}

const definedAgentChatElements = new Map<string, CustomElementConstructor>();

export function defineAgentChatElement(tagName = "agent-chat"): CustomElementConstructor | undefined {
  if (typeof customElements === "undefined") return undefined;
  const existing = customElements.get(tagName);
  const defined = definedAgentChatElements.get(tagName);
  if (existing && defined && existing === defined) return existing;
  if (existing) {
    throw new Error(
      `Cannot define AgentChatElement as <${tagName}> because that tag is already registered.`,
    );
  }
  const Element = class extends AgentChatElement {};
  customElements.define(tagName, Element);
  definedAgentChatElements.set(tagName, Element);
  return Element;
}

const HTMLElementBase =
  typeof HTMLElement === "undefined" ? (class {} as typeof HTMLElement) : HTMLElement;

export class AgentChatElement extends HTMLElementBase implements AgentChatWebComponentElement {
  #components?: AgentComponents;
  #initialState?: AgentSessionState;
  #providerKey = 0;
  #root?: Root;
  #transport?: AgentTransport;
  #transcriptDisplay?: AgentTranscriptDisplay;
  #transcriptMode?: Extract<AgentTranscriptDisplay, string>;

  static get observedAttributes() {
    return ["chat-class"];
  }

  get agentOptions(): AgentChatElementOptions {
    return {
      className: this.getAttribute("chat-class") ?? undefined,
      components: this.#components,
      initialState: this.#initialState,
      transport: this.#transport,
      transcriptDisplay: this.#transcriptDisplay,
      transcriptMode: this.#transcriptMode,
    };
  }

  set agentOptions(options: AgentChatElementOptions | undefined) {
    this.#components = options?.components;
    this.#transcriptDisplay = options?.transcriptDisplay;
    this.#transcriptMode = options?.transcriptMode;
    this.#replaceSessionOptions(options?.transport, options?.initialState);
    this.#setChatClass(options?.className);
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
    this.#replaceSessionOptions(this.#transport, value);
    this.#render();
  }

  get transport() {
    return this.#transport;
  }

  set transport(value: AgentTransport | undefined) {
    this.#replaceSessionOptions(value, this.#initialState);
    this.#render();
  }

  get transcriptDisplay() {
    return this.#transcriptDisplay;
  }

  set transcriptDisplay(value: AgentTranscriptDisplay | undefined) {
    this.#transcriptDisplay = value;
    this.#render();
  }

  get transcriptMode() {
    return this.#transcriptMode;
  }

  set transcriptMode(value: Extract<AgentTranscriptDisplay, string> | undefined) {
    this.#transcriptMode = value;
    this.#render();
  }

  connectedCallback() {
    this.#render();
  }

  disconnectedCallback() {
    this.#root?.unmount();
    this.#root = undefined;
  }

  attributeChangedCallback() {
    this.#render();
  }

  #replaceSessionOptions(
    transport: AgentTransport | undefined,
    initialState: AgentSessionState | undefined,
  ) {
    if (this.#transport !== transport || this.#initialState !== initialState) {
      this.#providerKey += 1;
    }
    this.#transport = transport;
    this.#initialState = initialState;
  }

  #setChatClass(className: string | undefined) {
    if (className === undefined) {
      this.removeAttribute("chat-class");
      return;
    }
    this.setAttribute("chat-class", className);
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
      <AgentProvider
        key={this.#providerKey}
        initialState={this.#initialState}
        transport={this.#transport}
      >
        <AgentChat
          className={className}
          components={this.#components}
          transcriptDisplay={this.#transcriptDisplay}
          transcriptMode={this.#transcriptMode}
        />
      </AgentProvider>,
    );
  }
}
