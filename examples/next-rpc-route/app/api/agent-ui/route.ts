import { createAgentUiNextRpcRoute } from "@nyosegawa/agent-ui-server";

export const runtime = "nodejs";

export const POST = createAgentUiNextRpcRoute({
  initialize: {
    clientInfo: {
      name: "agent_ui_next_example",
      title: "Agent UI Next RPC Route Example",
      version: "0.0.0",
    },
  },
});
