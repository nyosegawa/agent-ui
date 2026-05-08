import { describe, expect, it } from "vitest";
import { redactSecrets } from "../src/redaction";

describe("redactSecrets", () => {
  it("redacts bearer tokens and token-like query fragments", () => {
    expect(redactSecrets("Authorization: Bearer abc.def token=secret")).toBe(
      "Authorization: Bearer [REDACTED] token=[REDACTED]",
    );
  });
});
