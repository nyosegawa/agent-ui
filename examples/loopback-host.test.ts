import { describe, expect, it } from "vitest";
import { resolveExampleHost } from "./loopback-host";

describe("resolveExampleHost", () => {
  it("permits loopback hosts", () => {
    expect(resolveExampleHost("127.0.0.1")).toMatchObject({ unsafeNonLoopback: false });
    expect(resolveExampleHost("localhost")).toMatchObject({ unsafeNonLoopback: false });
    expect(resolveExampleHost("::1")).toMatchObject({ unsafeNonLoopback: false });
  });

  it("rejects non-loopback hosts by default", () => {
    expect(() => resolveExampleHost("0.0.0.0")).toThrow("Refusing to bind");
    expect(() => resolveExampleHost("192.168.1.10")).toThrow("Refusing to bind");
  });

  it("permits non-loopback hosts only with explicit unsafe opt-in", () => {
    expect(resolveExampleHost("0.0.0.0", true)).toMatchObject({
      host: "0.0.0.0",
      unsafeNonLoopback: true,
    });
    expect(resolveExampleHost("192.168.1.10", true).warning).toContain(
      "AGENT_UI_ALLOW_NON_LOOPBACK=1",
    );
  });
});
