import { AgentTransport } from '@nyosegawa/agent-ui-core';
import { C as CodexInitializeOptions } from './protocol-<chunk>.js';
import './InitializeParams-<chunk>.js';

interface CodexWebSocketTransportOptions {
    initialize?: CodexInitializeOptions;
    protocols?: string | string[];
    reconnect?: false | CodexWebSocketReconnectOptions;
    url: string | URL;
    webSocketImpl?: typeof WebSocket;
}
interface CodexWebSocketReconnectOptions {
    initialDelayMs?: number;
    maxAttempts?: number;
    maxDelayMs?: number;
    multiplier?: number;
}
declare const AGENT_UI_BEARER_SUBPROTOCOL_PREFIX = "agent-ui-bearer.";
declare function createAgentUiBearerSubprotocol(token: string): string;
declare function createCodexWebSocketTransport(options: CodexWebSocketTransportOptions): AgentTransport;

export { AGENT_UI_BEARER_SUBPROTOCOL_PREFIX, type CodexWebSocketReconnectOptions, type CodexWebSocketTransportOptions, createAgentUiBearerSubprotocol, createCodexWebSocketTransport };
