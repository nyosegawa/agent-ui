import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { watch, type FSWatcher } from "node:fs";

export interface SkillDataStoreOptions {
  root: string;
}

export class SkillDataStore {
  readonly root: string;
  #transaction = Promise.resolve();

  constructor(options: SkillDataStoreOptions) {
    this.root = resolve(options.root);
  }

  async readJson<T = unknown>(path: string): Promise<T> {
    return JSON.parse(await readFile(this.resolvePath(path), "utf8")) as T;
  }

  async writeJson(path: string, value: unknown): Promise<void> {
    const target = this.resolvePath(path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  }

  async readBlob(path: string): Promise<Buffer> {
    return readFile(this.resolvePath(path));
  }

  async writeBlob(path: string, value: Uint8Array): Promise<void> {
    const target = this.resolvePath(path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, value);
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    const run = this.#transaction.then(callback, callback);
    this.#transaction = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  watch(path: string, callback: (event: { eventType: string; filename?: string }) => void) {
    const watcher = watch(this.resolvePath(path), { persistent: false }, (eventType, filename) => {
      callback({
        eventType,
        filename: typeof filename === "string" ? filename : undefined,
      });
    });
    return {
      close: () => watcher.close(),
      watcher,
    } satisfies { close: () => void; watcher: FSWatcher };
  }

  resolvePath(path: string): string {
    const target = resolve(join(this.root, path));
    const rel = relative(this.root, target);
    if (rel === "" || (!rel.startsWith("..") && !rel.includes(`..${sep}`))) return target;
    throw new Error(`Path escapes SkillDataStore root: ${path}`);
  }
}
