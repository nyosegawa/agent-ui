import { describe, expect, it } from "vitest";
import {
  createMcpDynamicToolHandler,
  type DynamicToolHandlerContext,
  type DynamicToolRequest,
} from "../src";

describe("createMcpDynamicToolHandler", () => {
  it("routes only explicit namespace and tool mappings", async () => {
    const calls: Array<{ method: string; params: unknown }> = [];
    const handler = createMcpDynamicToolHandler({
      tools: [
        { namespace: "mcp__rmcp", server: "rmcp", tools: ["ping"] },
        {
          namespace: "mcp__codex_apps__calendar",
          server: "codex_apps_calendar",
          tools: "all",
        },
      ],
    });
    const context = createContext({
      onRequest(method, params) {
        calls.push({ method, params });
        return { content: [{ text: "ok", type: "text" }], isError: false };
      },
    });

    await expect(
      handler(createRequest({ namespace: "mcp__rmcp", tool: "ping" }), context),
    ).resolves.toEqual({
      contentItems: [{ text: "ok", type: "inputText" }],
      success: true,
    });
    expect(calls[0]).toEqual({
      method: "mcpServer/tool/call",
      params: {
        arguments: {},
        server: "rmcp",
        threadId: "helper-thread",
        tool: "ping",
      },
    });

    await handler(
      createRequest({
        namespace: "mcp__codex_apps__calendar",
        tool: "list_events",
      }),
      context,
    );
    expect(calls[1]).toMatchObject({
      params: {
        server: "codex_apps_calendar",
        tool: "list_events",
      },
    });
  });

  it("fails unknown namespaces before creating helper threads or calling MCP", async () => {
    let helperThreadCreated = false;
    let mcpCalled = false;
    const handler = createMcpDynamicToolHandler({
      tools: [{ namespace: "mcp__rmcp", server: "rmcp", tools: ["ping"] }],
    });
    const response = await handler(
      createRequest({ namespace: "mcp__unknown", tool: "ping" }),
      createContext({
        async getMcpThreadId() {
          helperThreadCreated = true;
          return "helper-thread";
        },
        onRequest() {
          mcpCalled = true;
          return {};
        },
      }),
    );

    expect(response.success).toBe(false);
    expect(response.contentItems[0]?.type).toBe("inputText");
    expect(helperThreadCreated).toBe(false);
    expect(mcpCalled).toBe(false);
  });

  it("fails unknown tools before calling mcpServer/tool/call", async () => {
    let mcpCalled = false;
    const handler = createMcpDynamicToolHandler({
      tools: [{ namespace: "mcp__rmcp", server: "rmcp", tools: ["ping"] }],
    });
    const response = await handler(
      createRequest({ namespace: "mcp__rmcp", tool: "delete_everything" }),
      createContext({
        onRequest() {
          mcpCalled = true;
          return {};
        },
      }),
    );

    expect(response.success).toBe(false);
    expect(mcpCalled).toBe(false);
  });
});

function createRequest(
  overrides: Partial<DynamicToolRequest> = {},
): DynamicToolRequest {
  return {
    arguments: {},
    callId: "call-1",
    namespace: "mcp__rmcp",
    threadId: "thread-1",
    tool: "ping",
    turnId: "turn-1",
    ...overrides,
  };
}

function createContext({
  getMcpThreadId = async () => "helper-thread",
  onRequest = () => ({}),
}: {
  getMcpThreadId?: () => Promise<string>;
  onRequest?: (method: string, params: unknown) => unknown;
}): DynamicToolHandlerContext {
  return {
    getMcpThreadId,
    transport: {
      request: async (method: string, params: unknown) => onRequest(method, params),
    },
  } as DynamicToolHandlerContext;
}
