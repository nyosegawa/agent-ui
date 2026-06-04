import { describe, expect, it } from "vitest";
import {
  agentResourceDisplayName,
  agentResourceUrl,
  type AgentResolvedResource,
} from "../src/resources";

describe("resource resolution primitives", () => {
  it("prefers preview URLs for browser rendering", () => {
    expect(
      agentResourceUrl({
        previewUrl: "/agent-ui/assets/preview",
        url: "/agent-ui/assets/raw",
      }),
    ).toBe("/agent-ui/assets/preview");
    expect(agentResourceUrl({ url: "/agent-ui/assets/raw" })).toBe(
      "/agent-ui/assets/raw",
    );
    expect(agentResourceUrl("/agent-ui/assets/string")).toBe(
      "/agent-ui/assets/string",
    );
    expect(agentResourceUrl(null)).toBeUndefined();
  });

  it("keeps display names separate from raw local paths", () => {
    const resource: AgentResolvedResource = {
      displayName: "diagram.png",
      name: "/tmp/agent-ui/diagram.png",
      path: "/tmp/agent-ui/diagram.png",
      redactedPath: "[agent-ui-local-media]/diagram.png",
    };

    expect(agentResourceDisplayName(resource, "fallback.png")).toBe("diagram.png");
    expect(agentResourceDisplayName({ name: "raw-name.png" }, "fallback.png")).toBe(
      "raw-name.png",
    );
    expect(agentResourceDisplayName(undefined, "fallback.png")).toBe("fallback.png");
  });
});
