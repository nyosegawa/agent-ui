import { describe, expect, it } from "vitest";
import { isDirectoryPickerCancelError } from "./directory-picker";

describe("isDirectoryPickerCancelError", () => {
  it("treats English AppleScript user cancellation as a no-op", () => {
    expect(
      isDirectoryPickerCancelError(
        new Error(
          'Command failed: osascript -e POSIX path of (choose folder with prompt "Choose working directory")\nexecution error: User canceled. (-128)',
        ),
      ),
    ).toBe(true);
  });

  it("treats localized AppleScript cancellation as a no-op", () => {
    expect(
      isDirectoryPickerCancelError(
        new Error(
          'Command failed: osascript -e POSIX path of (choose folder with prompt "Choose working directory")\n15:67: execution error: ユーザによってキャンセルされました。 (-128)',
        ),
      ),
    ).toBe(true);
  });

  it("uses stderr when osascript cancellation details are attached there", () => {
    const error = Object.assign(new Error("Command failed: osascript"), {
      stderr: "execution error: User canceled. (-128)",
    });

    expect(isDirectoryPickerCancelError(error)).toBe(true);
  });

  it("does not suppress real directory picker failures", () => {
    expect(isDirectoryPickerCancelError(new Error("osascript: command not found"))).toBe(false);
  });
});
