export interface ModelState {
  models: AgentModel[];
  selectedModelId?: string;
}

export interface AgentModel {
  id: string;
  name?: string;
  defaultEffort?: ReasoningEffort;
  supportedEfforts?: ReasoningEffort[];
  raw?: unknown;
}

export type ReasoningEffort =
  | "none"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | string;
