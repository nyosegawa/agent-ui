import { AgentSessionState, AgentTransport } from '@nyosegawa/agent-ui-core';
import { AgentComponents } from '@nyosegawa/agent-ui-react';

interface AgentChatElementOptions {
    className?: string;
    components?: AgentComponents;
    initialState?: AgentSessionState;
    transport?: AgentTransport;
}
interface AgentChatWebComponentElement extends HTMLElement {
    agentOptions?: AgentChatElementOptions;
    components?: AgentComponents;
    initialState?: AgentSessionState;
    transport?: AgentTransport;
}
declare function defineAgentChatElement(tagName?: string): CustomElementConstructor | undefined;
declare const HTMLElementBase: {
    new (): HTMLElement;
    prototype: HTMLElement;
};
declare class AgentChatElement extends HTMLElementBase implements AgentChatWebComponentElement {
    #private;
    static get observedAttributes(): string[];
    get agentOptions(): AgentChatElementOptions;
    set agentOptions(options: AgentChatElementOptions | undefined);
    get components(): AgentComponents | undefined;
    set components(value: AgentComponents | undefined);
    get initialState(): AgentSessionState | undefined;
    set initialState(value: AgentSessionState | undefined);
    get transport(): AgentTransport | undefined;
    set transport(value: AgentTransport | undefined);
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(): void;
}

export { AgentChatElement, type AgentChatElementOptions, type AgentChatWebComponentElement, defineAgentChatElement };
