import { describe, expect, it } from "vitest";
import {
  accountReadParams,
  cancelLoginParams,
  deviceCodeLoginParams,
  modelListParams,
  threadListParams,
  threadReadParams,
  threadResumeParams,
  threadStartParams,
  turnStartParams,
} from "../src/codex-request-params";
import type {
  CancelLoginAccountParams,
  GetAccountParams,
  LoginAccountParams,
  ModelListParams,
  ThreadListParams,
  ThreadReadParams,
  ThreadResumeParams,
  ThreadStartParams,
  TurnStartParams,
} from "../../codex/src/generated/stable/v2";

describe("Codex request params", () => {
  it("matches generated stable account and login params", () => {
    expect(accountReadParams()).toEqual({ refreshToken: false } satisfies GetAccountParams);
    expect(deviceCodeLoginParams()).toEqual({ type: "chatgptDeviceCode" } satisfies LoginAccountParams);
    expect(cancelLoginParams("login-1")).toEqual(
      { loginId: "login-1" } satisfies CancelLoginAccountParams,
    );
  });

  it("matches generated stable model, thread, and turn params", () => {
    expect(modelListParams()).toEqual({} satisfies ModelListParams);
    expect(threadListParams({ searchTerm: "fix" })).toEqual({
      cursor: null,
      limit: 25,
      searchTerm: "fix",
      sortDirection: "desc",
      sortKey: "updated_at",
    } satisfies ThreadListParams);
    expect(threadReadParams("thread-1")).toEqual({
      includeTurns: true,
      threadId: "thread-1",
    } satisfies ThreadReadParams);
    expect(threadResumeParams("thread-1", { excludeTurns: true })).toEqual({
      excludeTurns: true,
      threadId: "thread-1",
    } satisfies ThreadResumeParams);
    expect(threadStartParams({ cwd: "/tmp/project", model: "gpt-5.5" })).toEqual({
      cwd: "/tmp/project",
      model: "gpt-5.5",
    } satisfies ThreadStartParams);
    expect(
      turnStartParams({
        approvalPolicy: "on-request",
        input: "hello",
        threadId: "thread-1",
      }),
    ).toEqual({
      approvalPolicy: "on-request",
      input: [{ text: "hello", text_elements: [], type: "text" }],
      threadId: "thread-1",
    } satisfies TurnStartParams);

    expect(
      turnStartParams({
        input: [
          { text: "inspect this", text_elements: [], type: "text" },
          { path: "/tmp/screen.png", type: "localImage" },
          { name: "computer-use", path: "/tmp/skills/computer-use/SKILL.md", type: "skill" },
        ],
        threadId: "thread-1",
      }),
    ).toEqual({
      input: [
        { text: "inspect this", text_elements: [], type: "text" },
        { path: "/tmp/screen.png", type: "localImage" },
        { name: "computer-use", path: "/tmp/skills/computer-use/SKILL.md", type: "skill" },
      ],
      threadId: "thread-1",
    } satisfies TurnStartParams);
  });
});
