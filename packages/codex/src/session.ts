import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import {
  createCodexClients,
  type CodexAppsClient,
  type CodexClients,
  type CodexClientsOptions,
  type CodexHooksClient,
  type CodexModelsClient,
  type CodexAccountClient,
  type CodexSkillsClient,
  type CodexThreadForkOptions,
  type CodexThreadMetadataUpdateOptions,
  type CodexThreadResumeOptions,
  type CodexThreadsClient,
  type CodexTurnStartOptions,
  type CodexTurnSteerOptions,
  type CodexTurnsClient,
} from "./clients";

export interface CodexSessionOptions extends CodexClientsOptions {}

export type {
  CodexThreadForkOptions,
  CodexThreadMetadataUpdateOptions,
  CodexThreadResumeOptions,
  CodexTurnStartOptions,
  CodexTurnSteerOptions,
};

export interface CodexSession {
  account: CodexAccountClient;
  apps: CodexAppsClient;
  hooks: CodexHooksClient;
  models: CodexModelsClient;
  requestExperimental: CodexClients["requestExperimental"];
  skills: CodexSkillsClient;
  thread: CodexThreadsClient;
  turn: CodexTurnsClient;
}

export function createCodexSession(
  transport: AgentTransport,
  options: CodexSessionOptions = {},
): CodexSession {
  const clients = createCodexClients(transport, options);
  return {
    account: clients.account,
    apps: clients.apps,
    hooks: clients.hooks,
    models: clients.models,
    requestExperimental: clients.requestExperimental,
    skills: clients.skills,
    thread: clients.threads,
    turn: clients.turns,
  };
}
