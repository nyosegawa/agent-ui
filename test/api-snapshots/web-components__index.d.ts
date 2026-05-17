import { AgentSessionState, AgentTransport } from '@nyosegawa/agent-ui-core';
import { AgentChatSlots } from '@nyosegawa/agent-ui-react';

interface AgentChatElementOptions {
    className?: string;
    initialState?: AgentSessionState;
    slots?: AgentChatSlots;
    transport?: AgentTransport;
}
interface AgentChatWebComponentElement extends HTMLElement {
    agentOptions?: AgentChatElementOptions;
    initialState?: AgentSessionState;
    slots?: AgentChatSlots;
    transport?: AgentTransport;
}
declare function defineAgentChatElement(tagName?: string): CustomElementConstructor | undefined;
declare const HTMLElementBase: {
    new (): HTMLElement;
    prototype: HTMLElement;
};
declare class AgentChatElement extends HTMLElementBase implements AgentChatWebComponentElement {
    #private;
    get agentOptions(): AgentChatElementOptions;
    set agentOptions(options: AgentChatElementOptions | undefined);
    get initialState(): AgentSessionState | undefined;
    set initialState(value: AgentSessionState | undefined);
    get slots(): AgentChatSlots | undefined;
    set slots(value: AgentChatSlots | undefined);
    get transport(): AgentTransport | undefined;
    set transport(value: AgentTransport | undefined);
    connectedCallback(): void;
    disconnectedCallback(): void;
}

export { AgentChatElement, type AgentChatElementOptions, type AgentChatWebComponentElement, defineAgentChatElement };
