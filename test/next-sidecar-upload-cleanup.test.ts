import { describe, expect, it } from "vitest";
import { createIdempotentUploadCleanup } from "../examples/next-with-bridge-sidecar/upload-cleanup";

describe("Next bridge sidecar upload cleanup", () => {
  it("runs cleanup at most once across close and signal paths", async () => {
    let calls = 0;
    const cleanup = createIdempotentUploadCleanup(async () => {
      calls += 1;
    });

    await Promise.all([cleanup(), cleanup(), cleanup()]);

    expect(calls).toBe(1);
  });

  it("swallows cleanup rejection, reports it, and retries later", async () => {
    const errors: unknown[] = [];
    let calls = 0;
    const cleanup = createIdempotentUploadCleanup(
      async () => {
        calls += 1;
        if (calls === 1) throw new Error("temporary cleanup failure");
      },
      { onError: (error) => errors.push(error) },
    );

    await expect(Promise.all([cleanup(), cleanup()])).resolves.toEqual([
      undefined,
      undefined,
    ]);
    expect(calls).toBe(1);
    expect(String(errors[0])).toContain("temporary cleanup failure");

    await expect(cleanup()).resolves.toBeUndefined();
    expect(calls).toBe(2);
  });
});
