import type { CodexStableMethodParams } from "./method-params";

export type * as CodexStable from "./generated/stable";
export type * from "./generated/stable";
export type { CodexStableMethod, CodexStableMethodParams } from "./method-params";
export type { UserInput } from "./generated/stable/v2/UserInput";

export type AppsListParams = CodexStableMethodParams<"app/list">;
export type HooksListParams = CodexStableMethodParams<"hooks/list">;
export type SkillsConfigWriteParams =
  CodexStableMethodParams<"skills/config/write">;
export type SkillsListParams = CodexStableMethodParams<"skills/list">;
export type ThreadForkParams = CodexStableMethodParams<"thread/fork">;
export type TurnStartParams = CodexStableMethodParams<"turn/start">;
