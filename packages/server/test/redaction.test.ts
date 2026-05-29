import { describe, expect, it } from "vitest";
import { redactSecrets, redactStructuredValue, redactTransportEvent } from "../src";

describe("redactSecrets", () => {
  it("redacts bearer tokens, keys, passwords, secrets, and labeled device codes", () => {
    const cases = [
      ["Authorization: Bearer abc.def", "Authorization: Bearer [REDACTED]", "abc.def"],
      ["Bearer raw.token", "Bearer [REDACTED]", "raw.token"],
      ["token=secret", "token=[REDACTED]", "secret"],
      ["api_key=sk-test", "api_key=[REDACTED]", "sk-test"],
      ["OPENAI_API_KEY=sk-env", "OPENAI_API_KEY=[REDACTED]", "sk-env"],
      ["password=hunter2", "password=[REDACTED]", "hunter2"],
      ["secret=value", "secret=[REDACTED]", "value"],
      ["device_code=ABCD-EFGH", "device_code=[REDACTED]", "ABCD-EFGH"],
      ["OPENAI_API_KEY: sk-colon", "OPENAI_API_KEY: [REDACTED]", "sk-colon"],
      ["api_key: sk-key", "api_key: [REDACTED]", "sk-key"],
      ["api-key: sk-hyphen", "api-key: [REDACTED]", "sk-hyphen"],
      ["x-api-key: sk-header", "x-api-key: [REDACTED]", "sk-header"],
      ["token: colon-token", "token: [REDACTED]", "colon-token"],
      ["password: colon-password", "password: [REDACTED]", "colon-password"],
      ["secret: colon-secret", "secret: [REDACTED]", "colon-secret"],
      ["device_code: COLON-DEVICE", "device_code: [REDACTED]", "COLON-DEVICE"],
      ["user_code: COLON-USER", "user_code: [REDACTED]", "COLON-USER"],
      ["userCode: camel-user", "userCode: [REDACTED]", "camel-user"],
      [
        "{\"userCode\":\"WXYZ-1234\",\"accessToken\":\"jwt\"}",
        "{\"userCode\":\"[REDACTED]\",\"accessToken\":\"[REDACTED]\"}",
        "WXYZ-1234",
      ],
    ] as const;

    for (const [input, expected, secret] of cases) {
      const redacted = redactSecrets(input);
      expect(redacted).toBe(expected);
      expect(redacted).not.toContain(secret);
    }
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
