import { describe, expect, it } from "vitest";
import { createIdempotentUploadCleanup } from "./upload-cleanup";

describe("createIdempotentUploadCleanup", () => {
  it("runs upload cleanup once across repeated shutdown paths", async () => {
    let calls = 0;
    const cleanup = createIdempotentUploadCleanup({
      async cleanup() {
        calls += 1;
      },
    });

    await Promise.all([cleanup(), cleanup(), cleanup()]);

    expect(calls).toBe(1);
  });

  it("swallows cleanup errors after reporting them", async () => {
    const reported: unknown[] = [];
    const cleanup = createIdempotentUploadCleanup(
      {
        async cleanup() {
          throw new Error("cleanup failed");
        },
      },
      (error) => reported.push(error),
    );

    await expect(cleanup()).resolves.toBeUndefined();
    await expect(cleanup()).resolves.toBeUndefined();
    expect(reported).toHaveLength(1);
  });
});
