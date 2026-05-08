import { createAgentUiNextRoute } from "@nyosegawa/agent-ui-server";

export const runtime = "nodejs";

export const POST = createAgentUiNextRoute({
  initialize: {
    clientInfo: {
      name: "agent_ui_next_example",
      title: "Agent UI Next Example",
      version: "0.0.0",
    },
  },
});
