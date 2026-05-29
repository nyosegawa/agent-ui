import { AgentTransport } from '@nyosegawa/agent-ui-core';
import { CodexAccountClient, CodexAppsClient, CodexHooksClient, CodexModelsClient, CodexClients, CodexSkillsClient, CodexThreadsClient, CodexTurnsClient, CodexClientsOptions } from './clients.js';
export { CodexThreadForkOptions, CodexThreadMetadataUpdateOptions, CodexThreadResumeOptions, CodexTurnStartOptions, CodexTurnSteerOptions } from './clients.js';
import './request-builders.js';
import './method-params-D8LveQNY.js';
import './InitializeParams-CDX1c2T9.js';
import './protocol-iDYFX3vA.js';

interface CodexSessionOptions extends CodexClientsOptions {
}

interface CodexSession {
    account: CodexAccountClient;
    apps: CodexAppsClient;
    hooks: CodexHooksClient;
    models: CodexModelsClient;
    requestExperimental: CodexClients["requestExperimental"];
    skills: CodexSkillsClient;
    thread: CodexThreadsClient;
    turn: CodexTurnsClient;
}
declare function createCodexSession(transport: AgentTransport, options?: CodexSessionOptions): CodexSession;

export { type CodexSession, type CodexSessionOptions, createCodexSession };
