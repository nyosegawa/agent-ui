import type { ClientRequest } from "./generated/stable";

export type CodexStableMethod = ClientRequest["method"];

export type CodexStableMethodParams<TMethod extends CodexStableMethod> = Extract<
  ClientRequest,
  { method: TMethod }
>["params"];
