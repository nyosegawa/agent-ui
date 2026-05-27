import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const coreSrc = join(__dirname, "..", "src");

const stateDomainFiles = [
  "account",
  "apps",
  "common",
  "connection",
  "diagnostics",
  "hooks",
  "item",
  "models",
  "run-settings",
  "server-requests",
  "skills",
  "thread",
  "turn",
  "usage",
];

describe("Core package source structure", () => {
  it("keeps normalized state types split by product domain", () => {
    const barrel = readFileSync(join(coreSrc, "state.ts"), "utf8");

    for (const domain of stateDomainFiles) {
      expect(existsSync(join(coreSrc, "state", `${domain}.ts`))).toBe(true);
      expect(barrel).toContain(`export type * from "./state/${domain}";`);
    }
  });
});
