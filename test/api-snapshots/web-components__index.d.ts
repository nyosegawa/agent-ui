import { AgentSessionState, AgentTransport } from '@nyosegawa/agent-ui-core';
import { AgentComponents, AgentTranscriptDisplay } from '@nyosegawa/agent-ui-react';

interface AgentChatElementOptions {
    className?: string;
    components?: AgentComponents;
    initialState?: AgentSessionState;
    transport?: AgentTransport;
    transcriptDisplay?: AgentTranscriptDisplay;
    transcriptMode?: Extract<AgentTranscriptDisplay, string>;
}
interface AgentChatWebComponentElement extends HTMLElement {
    agentOptions?: AgentChatElementOptions;
    components?: AgentComponents;
    initialState?: AgentSessionState;
    transport?: AgentTransport;
    transcriptDisplay?: AgentTranscriptDisplay;
    transcriptMode?: Extract<AgentTranscriptDisplay, string>;
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
    get transcriptDisplay(): AgentTranscriptDisplay | undefined;
    set transcriptDisplay(value: AgentTranscriptDisplay | undefined);
    get transcriptMode(): Extract<AgentTranscriptDisplay, string> | undefined;
    set transcriptMode(value: Extract<AgentTranscriptDisplay, string> | undefined);
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(): void;
}

export { AgentChatElement, type AgentChatElementOptions, type AgentChatWebComponentElement, defineAgentChatElement };
