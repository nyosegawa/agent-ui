import { describe, expect, it } from "vitest";
import {
  composerSubmitModeForEnter,
  shouldSubmitOnComposerEnter,
} from "../src/components/composer-submit-semantics";

describe("composer submit semantics", () => {
  it("submits Enter unless Shift or IME composition is active", () => {
    expect(
      shouldSubmitOnComposerEnter({
        isComposing: false,
        key: "Enter",
        shiftKey: false,
      }),
    ).toBe(true);
    expect(
      shouldSubmitOnComposerEnter({
        isComposing: false,
        key: "Enter",
        shiftKey: true,
      }),
    ).toBe(false);
    expect(
      shouldSubmitOnComposerEnter({
        isComposing: true,
        key: "Enter",
        shiftKey: false,
      }),
    ).toBe(false);
  });

  it("uses steer only for running Cmd/Ctrl Enter", () => {
    expect(
      composerSubmitModeForEnter({
        ctrlKey: false,
        isRunning: false,
        metaKey: true,
      }),
    ).toBe("normal");
    expect(
      composerSubmitModeForEnter({
        ctrlKey: true,
        isRunning: true,
        metaKey: false,
      }),
    ).toBe("steer");
  });
});
