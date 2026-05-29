import { describe, expect, it } from "vitest";
import { redactSecrets, redactStructuredValue, redactTransportEvent } from "../src";

describe("redactSecrets", () => {
  it("redacts bearer tokens, keys, passwords, secrets, and labeled device codes", () => {
    const input = [
      "Authorization: Bearer abc.def",
      "token=secret",
      "api_key=sk-test",
      "OPENAI_API_KEY=sk-env",
      "password=hunter2",
      "secret=value",
      "device_code=ABCD-EFGH",
      "{\"userCode\":\"WXYZ-1234\",\"accessToken\":\"jwt\"}",
    ].join(" ");

    expect(redactSecrets(input)).toBe(
      [
        "Authorization: Bearer [REDACTED]",
        "token=[REDACTED]",
        "api_key=[REDACTED]",
        "OPENAI_API_KEY=[REDACTED]",
        "password=[REDACTED]",
        "secret=[REDACTED]",
        "device_code=[REDACTED]",
        "{\"userCode\":\"[REDACTED]\",\"accessToken\":\"[REDACTED]\"}",
      ].join(" "),
    );
  });
});

describe("structured redaction", () => {
  it("exposes structured redaction through the public server entrypoint", () => {
    const redacted = redactStructuredValue({
      apiKey: "sk-raw",
      nested: { message: "Bearer raw.token" },
    });

    expect(JSON.stringify(redacted)).not.toContain("sk-raw");
    expect(JSON.stringify(redacted)).not.toContain("raw.token");
    expect(JSON.stringify(redacted)).toContain("[REDACTED]");
  });

  it("redacts host/browser event payloads recursively", () => {
    const redacted = redactTransportEvent({
      event: {
        error: {
          data: {
            Authorization: "Bearer raw.token",
            nested: { apiKey: "sk-raw", refreshToken: "refresh-raw" },
          },
          message: "failed with Bearer raw.token",
        },
        type: "error/added",
      },
      type: "event",
    } as any);

    expect(JSON.stringify(redacted)).not.toContain("raw.token");
    expect(JSON.stringify(redacted)).not.toContain("sk-raw");
    expect(JSON.stringify(redacted)).not.toContain("refresh-raw");
    expect(JSON.stringify(redacted)).toContain("[REDACTED]");
  });
});
