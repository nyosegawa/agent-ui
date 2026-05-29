import type { ClientRequest } from "./generated/stable";
import type { ClientRequest as ExperimentalClientRequest } from "./generated/experimental";

export type CodexStableMethod = ClientRequest["method"];
export type CodexExperimentalMethod = ExperimentalClientRequest["method"];

export type CodexStableMethodParams<TMethod extends CodexStableMethod> = Extract<
  ClientRequest,
  { method: TMethod }
>["params"];

export type CodexExperimentalMethodParams<TMethod extends CodexExperimentalMethod> =
  Extract<ExperimentalClientRequest, { method: TMethod }>["params"];
