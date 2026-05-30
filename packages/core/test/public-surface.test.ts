import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("core public surface", () => {
  it("keeps the root barrel limited to stable primitives", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../src/index.ts", import.meta.url)),
      "utf8",
    )
      .trim()
      .split(/\r?\n/);

    expect(source).toEqual([
      'export * from "./events";',
      'export * from "./fake-transport";',
      'export * from "./fixtures";',
      'export * from "./reducer";',
      'export * from "./request-id-key";',
      'export { AGENT_RETENTION_POLICY } from "./retention";',
      'export * from "./selectors";',
      'export * from "./state";',
      'export * from "./transport";',
    ]);
  });
});
