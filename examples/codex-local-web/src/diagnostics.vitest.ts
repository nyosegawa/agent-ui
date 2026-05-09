import { describe, expect, it } from "vitest";
import { isSuppressedCodexDiagnostic } from "./diagnostics";

describe("isSuppressedCodexDiagnostic", () => {
  it("suppresses known low-value Codex plugin and skill manifest warnings", () => {
    expect(
      isSuppressedCodexDiagnostic(
        JSON.stringify({
          fields: {
            message: "ignoring interface.defaultPrompt: maximum of 3 prompts is supported",
          },
          target: "codex_core_plugins::manifest",
        }),
      ),
    ).toBe(true);
    expect(
      isSuppressedCodexDiagnostic(
        JSON.stringify({
          fields: { message: "ignoring interface.icon_small: icon path must not contain '..'" },
          target: "codex_core_skills::loader",
        }),
      ),
    ).toBe(true);
    expect(
      isSuppressedCodexDiagnostic(
        JSON.stringify({
          fields: { message: "after_agent hook failed; continuing" },
          target: "codex_core::session::turn",
        }),
      ),
    ).toBe(false);
  });
});
