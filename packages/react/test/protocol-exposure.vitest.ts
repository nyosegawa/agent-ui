import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import * as ts from "typescript";
import { stableProductizedMethods } from "@nyosegawa/agent-ui-codex";
import { reactProtocolExposure } from "../src/protocol-exposure";

const repoRoot = join(import.meta.dirname, "../../..");
const evidenceCalleeCache = new Map<string, string[][]>();

describe("React protocol exposure registry", () => {
  it("classifies every productized stable method by React exposure", () => {
    expect(Object.keys(reactProtocolExposure).sort()).toEqual(
      [...stableProductizedMethods].sort(),
    );
  });

  it("keeps React source evidence aligned with exposure decisions", () => {
    for (const [method, entry] of Object.entries(reactProtocolExposure)) {
      for (const evidence of entry.evidence ?? []) {
        const callees = readEvidenceCallees(evidence.file);
        const hasEvidence = hasCallee(callees, evidence.callee);
        const callee = evidence.callee.join(".");
        if (evidence.kind === "required") {
          expect.soft(hasEvidence, `${method} must keep call evidence ${callee}`).toBe(true);
        } else {
          expect.soft(hasEvidence, `${method} must not gain call evidence ${callee}`).toBe(false);
        }
      }
    }
  });

  it("records an explicit client-only decision for account usage history", () => {
    expect(reactProtocolExposure["account/usage/read"]).toEqual({
      evidence: [
        {
          file: "packages/react/src",
          callee: ["codex", "account", "usageRead"],
          kind: "forbidden",
        },
      ],
      exposure: "client-only",
      rationale:
        "Hosts can build usage-history panels, but default React UI does not render token usage history yet.",
    });
  });

  it("matches call expressions instead of raw source text", () => {
    const callees = readSourceCallees(
      "evidence-fixture.ts",
      `
        const notEvidence = "codex.account.usageRead(";
        // codex.account.usageRead();
        codex.account.read(false);
        forkThread();
      `,
    );

    expect(hasCallee(callees, ["codex", "account", "usageRead"])).toBe(false);
    expect(hasCallee(callees, ["codex", "account", "read"])).toBe(true);
    expect(hasCallee(callees, ["forkThread"])).toBe(true);
  });
});

function readEvidenceCallees(relativePath: string): string[][] {
  const cached = evidenceCalleeCache.get(relativePath);
  if (cached) return cached;

  const absolutePath = join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) throw new Error(`Missing evidence path: ${relativePath}`);
  const stats = statSync(absolutePath);
  const callees = stats.isDirectory()
    ? readDirectoryCallees(absolutePath)
    : readFileCallees(absolutePath);
  evidenceCalleeCache.set(relativePath, callees);
  return callees;
}

function readDirectoryCallees(directory: string): string[][] {
  return readdirSync(directory, { withFileTypes: true })
    .toSorted((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return readDirectoryCallees(path);
      if (!/\.(ts|tsx)$/.test(entry.name)) return [];
      if (entry.name === "protocol-exposure.ts") return [];
      return readFileCallees(path);
    });
}

function readFileCallees(path: string): string[][] {
  const source = readFileSync(path, "utf8");
  return readSourceCallees(path, source);
}

function readSourceCallees(path: string, source: string): string[][] {
  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const callees: string[][] = [];

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const callee = calleePath(node.expression);
      if (callee) callees.push(callee);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return callees;
}

function calleePath(expression: ts.Expression): string[] | undefined {
  if (ts.isIdentifier(expression)) return [expression.text];
  if (!ts.isPropertyAccessExpression(expression)) return undefined;

  const parent = calleePath(expression.expression);
  return parent ? [...parent, expression.name.text] : undefined;
}

function hasCallee(callees: readonly string[][], expected: readonly string[]): boolean {
  return callees.some(
    (callee) =>
      callee.length === expected.length &&
      callee.every((part, index) => part === expected[index]),
  );
}
