import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { detectAgentBrowser, SkillDataStore } from "../src";

let tmp: string | undefined;

afterEach(async () => {
  vi.restoreAllMocks();
  if (tmp) await rm(tmp, { force: true, recursive: true });
  tmp = undefined;
});

describe("SkillDataStore", () => {
  it("reads and writes JSON and blobs inside the guarded root", async () => {
    tmp = await mkdtemp(join(tmpdir(), "agent-ui-skill-store-"));
    const store = new SkillDataStore({ root: tmp });

    await store.writeJson("state/panel.json", { open: true });
    await store.writeBlob("blobs/screenshot.bin", new Uint8Array([1, 2, 3]));

    expect(await store.readJson("state/panel.json")).toEqual({ open: true });
    expect(Array.from(await store.readBlob("blobs/screenshot.bin"))).toEqual([1, 2, 3]);
    expect(() => store.resolvePath("../escape.json")).toThrow(/escapes/);
  });

  it("serializes transactions", async () => {
    tmp = await mkdtemp(join(tmpdir(), "agent-ui-skill-store-"));
    const store = new SkillDataStore({ root: tmp });
    const order: string[] = [];

    await Promise.all([
      store.transaction(async () => {
        order.push("first-start");
        await new Promise((resolve) => setTimeout(resolve, 10));
        order.push("first-end");
      }),
      store.transaction(async () => {
        order.push("second");
      }),
    ]);

    expect(order).toEqual(["first-start", "first-end", "second"]);
  });
});

describe("detectAgentBrowser", () => {
  it("detects repo skill path, CLI version, and core skill availability", async () => {
    tmp = await mkdtemp(join(tmpdir(), "agent-ui-agent-browser-"));
    const skillPath = join(tmp, ".agents/skills/agent-browser/SKILL.md");
    await mkdir(join(tmp, ".agents/skills/agent-browser"), { recursive: true });
    await writeFile(skillPath, "# agent-browser\n");

    const calls: string[] = [];
    const result = await detectAgentBrowser({
      cwd: tmp,
      runner: async (_command, args) => {
        calls.push(args.join(" "));
        return { stdout: args[0] === "--version" ? "agent-browser 0.27.0\n" : "" };
      },
    });

    expect(result).toEqual({
      cliAvailable: true,
      coreSkillAvailable: true,
      diagnostics: [],
      repoSkillPath: skillPath,
      skillInput: { name: "agent-browser", path: skillPath, type: "skill" },
      version: "agent-browser 0.27.0",
    });
    expect(calls).toEqual(["--version", "skills get core"]);
  });
});
