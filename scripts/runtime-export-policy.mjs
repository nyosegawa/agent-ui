export const representativeNamedExportsBySpecifier = {
  "@nyosegawa/agent-ui-codex": [
    "createCodexSession",
    "createCodexStdioTransport",
    "createCodexWebSocketTransport",
    "normalizeCodexServerMessage",
  ],
  "@nyosegawa/agent-ui-codex/clients": ["createCodexClients"],
  "@nyosegawa/agent-ui-codex/normalizer": [
    "normalizeCodexServerMessage",
    "normalizeThreadReadResponse",
    "normalizeThreadResumeResponse",
  ],
  "@nyosegawa/agent-ui-codex/request-builders": [
    "threadStartParams",
    "turnStartParams",
    "textInput",
  ],
  "@nyosegawa/agent-ui-codex/session": ["createCodexSession"],
  "@nyosegawa/agent-ui-codex/websocket": ["createCodexWebSocketTransport"],
  "@nyosegawa/agent-ui-core": [
    "agentReducer",
    "FakeAgentTransport",
    "createInitialAgentState",
    "selectServerRequestQueue",
  ],
  "@nyosegawa/agent-ui-react": [
    "AgentChat",
    "AgentComposer",
    "AgentProvider",
    "AgentThreadTimeline",
    "useAgentApprovals",
    "useAgentContext",
  ],
  "@nyosegawa/agent-ui-server": [
    "attachAgentUiWebSocketBridge",
    "createCodexAppServerBridge",
    "createAgentUiLocalUploadHandler",
    "resolveServerRequestPolicy",
  ],
  "@nyosegawa/agent-ui-web-components": [
    "AgentChatElement",
    "defineAgentChatElement",
  ],
};

export function assertRepresentativeNamedExports(specifier, format, moduleNamespace) {
  const expected = representativeNamedExportsBySpecifier[specifier] ?? [];
  for (const exportName of expected) {
    if (!(exportName in moduleNamespace)) {
      throw new Error(`${specifier} ${format} export missing ${exportName}`);
    }
  }
}
