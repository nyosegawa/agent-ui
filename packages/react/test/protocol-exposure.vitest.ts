import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { stableProductizedMethods } from "@nyosegawa/agent-ui-codex";
import { reactProtocolExposure } from "../src/protocol-exposure";

const repoRoot = join(import.meta.dirname, "../../..");

describe("React protocol exposure registry", () => {
  it("classifies every productized stable method by React exposure", () => {
    expect(Object.keys(reactProtocolExposure).sort()).toEqual(
      [...stableProductizedMethods].sort(),
    );
  });

  it("keeps React source evidence aligned with exposure decisions", () => {
    for (const [method, entry] of Object.entries(reactProtocolExposure)) {
      for (const evidence of entry.evidence ?? []) {
        const source = readEvidenceSource(evidence.file);
        const hasEvidence = source.includes(evidence.includes);
        if (evidence.kind === "required") {
          expect.soft(hasEvidence, `${method} must keep evidence ${evidence.includes}`).toBe(
            true,
          );
        } else {
          expect
            .soft(hasEvidence, `${method} must not gain evidence ${evidence.includes}`)
            .toBe(false);
        }
      }
    }
  });

  it("records an explicit client-only decision for account usage history", () => {
    expect(reactProtocolExposure["account/usage/read"]).toEqual({
      evidence: [
        {
          file: "packages/react/src",
          includes: "usageRead(",
          kind: "forbidden",
        },
      ],
      exposure: "client-only",
      rationale:
        "Hosts can build usage-history panels, but default React UI does not render token usage history yet.",
    });
  });
});

function readEvidenceSource(relativePath: string): string {
  const absolutePath = join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) throw new Error(`Missing evidence path: ${relativePath}`);
  const stats = statSync(absolutePath);
  if (stats.isDirectory()) return readDirectorySource(absolutePath);
  return readFileSync(absolutePath, "utf8");
}

function readDirectorySource(directory: string): string {
  return readdirSync(directory, { withFileTypes: true })
    .toSorted((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return [readDirectorySource(path)];
      if (!/\.(ts|tsx)$/.test(entry.name)) return [];
      if (entry.name === "protocol-exposure.ts") return [];
      return [readFileSync(path, "utf8")];
    })
    .join("\n");
}
