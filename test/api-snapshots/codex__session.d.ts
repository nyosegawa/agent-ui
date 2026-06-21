import { AgentTransport } from '@nyosegawa/agent-ui-core';
import { CodexAccountClient, CodexAppsClient, CodexHooksClient, CodexModelsClient, CodexClients, CodexSkillsClient, CodexThreadsClient, CodexTurnsClient, CodexClientsOptions } from './clients.js';
export { CodexThreadForkOptions, CodexThreadMetadataUpdateOptions, CodexThreadResumeOptions, CodexTurnStartOptions, CodexTurnSteerOptions } from './clients.js';
import './request-<chunk>.js';
import './UserInput-<chunk>.js';
import './method-params-<chunk>.js';
import './InitializeParams-<chunk>.js';
import './protocol-<chunk>.js';

interface CodexSessionOptions extends CodexClientsOptions {
}

interface CodexSession {
    account: CodexAccountClient;
    apps: CodexAppsClient;
    hooks: CodexHooksClient;
    models: CodexModelsClient;
    requestExperimental: CodexClients["requestExperimental"];
    requestRaw: CodexClients["requestRaw"];
    skills: CodexSkillsClient;
    thread: CodexThreadsClient;
    turn: CodexTurnsClient;
}
declare function createCodexSession(transport: AgentTransport, options?: CodexSessionOptions): CodexSession;

export { type CodexSession, type CodexSessionOptions, createCodexSession };
