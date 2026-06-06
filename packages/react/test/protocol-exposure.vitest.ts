import { describe, expect, it } from "vitest";
import { stableProductizedMethods } from "@nyosegawa/agent-ui-codex";
import { reactProtocolExposure } from "../src/protocol-exposure";

describe("React protocol exposure registry", () => {
  it("classifies every productized stable method by React exposure", () => {
    expect(Object.keys(reactProtocolExposure).sort()).toEqual(
      [...stableProductizedMethods].sort(),
    );
  });

  it("records an explicit client-only decision for account usage history", () => {
    expect(reactProtocolExposure["account/usage/read"]).toEqual({
      exposure: "client-only",
      rationale:
        "Hosts can build usage-history panels, but default React UI does not render token usage history yet.",
    });
  });
});
