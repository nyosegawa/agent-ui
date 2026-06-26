export const representativeNamedExportsBySpecifier = {
  "@nyosegawa/agent-ui-codex": [
    "createCodexSession",
    "createCodexStdioTransport",
    "createCodexWebSocketTransport",
  ],
  "@nyosegawa/agent-ui-codex/clients": ["createCodexClients"],
  "@nyosegawa/agent-ui-codex/normalizer": [
    "normalizeCodexServerMessage",
    "normalizeThreadLoadedListResponse",
    "normalizeThreadListResponse",
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
    "AgentProvider",
    "defaultAgentComponents",
  ],
  "@nyosegawa/agent-ui-react/headless": [
    "useAgentApprovals",
    "useAgentContext",
    "useAgentComposerController",
    "useAgentThread",
  ],
  "@nyosegawa/agent-ui-react/primitives": [
    "AgentComposer",
    "AgentMessageList",
    "AgentShell",
    "AgentThreadTimeline",
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
