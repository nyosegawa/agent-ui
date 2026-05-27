import { AgentTransport } from '@nyosegawa/agent-ui-core';
import { C as CodexInitializeOptions } from './protocol-MyZV-kII.js';
import './InitializeParams-CDX1c2T9.js';

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
declare function createCodexWebSocketTransport(options: CodexWebSocketTransportOptions): AgentTransport;

export { type CodexWebSocketReconnectOptions, type CodexWebSocketTransportOptions, createCodexWebSocketTransport };
