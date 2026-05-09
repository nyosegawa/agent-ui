import { describe, expect, it } from "vitest";
import { redactSecrets } from "../src/redaction";

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
