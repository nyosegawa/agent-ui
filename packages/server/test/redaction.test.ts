import { describe, expect, it } from "vitest";
import { redactSecrets, redactStructuredValue, redactTransportEvent } from "../src";

describe("redactSecrets", () => {
  it("redacts bearer tokens, keys, passwords, secrets, and labeled device codes", () => {
    const cases = [
      ["Authorization: Bearer abc.def", "Authorization: [REDACTED]", "abc.def"],
      ["Authorization: Basic dXNlcjpwYXNz", "Authorization: [REDACTED]", "dXNlcjpwYXNz"],
      ["authorization: Digest abc123", "authorization: [REDACTED]", "abc123"],
      ["AUTHORIZATION: Token opaque", "AUTHORIZATION: [REDACTED]", "opaque"],
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
      ["access_token=oauth-access", "access_token=[REDACTED]", "oauth-access"],
      ["refresh_token=oauth-refresh", "refresh_token=[REDACTED]", "oauth-refresh"],
      ["id_token=oauth-id", "id_token=[REDACTED]", "oauth-id"],
      ["client_secret=oauth-client", "client_secret=[REDACTED]", "oauth-client"],
      [
        "{\"userCode\":\"WXYZ-1234\",\"accessToken\":\"jwt\",\"refresh_token\":\"refresh\",\"id_token\":\"id\",\"client_secret\":\"client\"}",
        "{\"userCode\":\"[REDACTED]\",\"accessToken\":\"[REDACTED]\",\"refresh_token\":\"[REDACTED]\",\"id_token\":\"[REDACTED]\",\"client_secret\":\"[REDACTED]\"}",
        "WXYZ-1234",
      ],
    ] as const;

    for (const [input, expected, secret] of cases) {
      const redacted = redactSecrets(input);
      expect(redacted).toBe(expected);
      expect(redacted).not.toContain(secret);
    }
  });

  it("redacts URL query secrets while preserving delimiters and safe pagination fields", () => {
    const redacted = redactSecrets(
      "https://example.test/callback?access_token=a&nextToken=page&refresh_token=b;id_token=c&status_code=200&code=debug&cursor=abc&client_secret=d",
    );

    expect(redacted).toContain("?access_token=[REDACTED]&nextToken=page");
    expect(redacted).toContain("&refresh_token=[REDACTED];id_token=[REDACTED]");
    expect(redacted).toContain("&status_code=200&code=debug&cursor=abc");
    expect(redacted).toContain("&client_secret=[REDACTED]");
    expect(redacted).not.toContain("access_token=a");
    expect(redacted).not.toContain("refresh_token=b");
    expect(redacted).not.toContain("id_token=c");
    expect(redacted).not.toContain("client_secret=d");
  });

  it("redacts Authorization headers line-by-line without consuming later diagnostics", () => {
    const redacted = redactSecrets(
      "before\nAuthorization: Basic dXNlcjpwYXNz\nnext line\rauthorization: Digest abc123\rfinal",
    );

    expect(redacted).toBe(
      "before\nAuthorization: [REDACTED]\nnext line\rauthorization: [REDACTED]\rfinal",
    );
    expect(redacted).not.toContain("dXNlcjpwYXNz");
    expect(redacted).not.toContain("abc123");
  });

  it("redacts percent-encoded credential query keys safely", () => {
    const redacted = redactSecrets(
      "https://example.test/callback?access%5Ftoken=a&api%2Dkey=b&bad%ZZkey=c&nextToken=page",
    );

    expect(redacted).toContain("?access%5Ftoken=[REDACTED]&api%2Dkey=[REDACTED]");
    expect(redacted).toContain("&bad%ZZkey=c&nextToken=page");
    expect(redacted).not.toContain("access%5Ftoken=a");
    expect(redacted).not.toContain("api%2Dkey=b");
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

  it("does not redact non-secret debug and pagination fields", () => {
    const value = {
      code: "E_BUSY",
      continuationToken: "continue",
      cursor: "cursor",
      exit_code: 1,
      id: "request-1",
      nextToken: "next",
      pageToken: "page",
      status_code: 500,
    };

    expect(redactStructuredValue(value)).toEqual(value);
  });
});
