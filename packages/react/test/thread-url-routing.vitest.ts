import { describe, expect, it } from "vitest";
import {
  threadIdFromPath,
  threadPath,
  threadUrlRoutingBasePath,
  threadUrlRoutingHomePath,
} from "../src/components/thread-url-routing";

describe("thread URL routing helpers", () => {
  it("builds and parses default thread paths", () => {
    expect(threadUrlRoutingBasePath(true)).toBe("/threads");
    expect(threadUrlRoutingHomePath(true)).toBe("/");
    expect(threadPath("thread one", "/threads")).toBe("/threads/thread%20one");
    expect(threadIdFromPath("/threads/thread%20one", "/threads")).toBe("thread one");
  });

  it("supports custom base and home paths", () => {
    const options = { basePath: "/agent/threads", homePath: "/agent" };
    expect(threadUrlRoutingBasePath(options)).toBe("/agent/threads");
    expect(threadUrlRoutingHomePath(options)).toBe("/agent");
    expect(threadPath("thread-custom", options.basePath)).toBe(
      "/agent/threads/thread-custom",
    );
    expect(threadIdFromPath("/agent/threads/thread-custom", options.basePath)).toBe(
      "thread-custom",
    );
  });

  it("ignores paths outside the configured base", () => {
    expect(threadIdFromPath("/other/thread", "/threads")).toBeUndefined();
    expect(threadIdFromPath("/threads", "/threads")).toBeUndefined();
  });
});
