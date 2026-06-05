export interface ModelState {
  models: AgentModel[];
  selectedModelId?: string;
}

export interface AgentModel {
  id: string;
  name?: string;
  defaultEffort?: ReasoningEffort;
  isDefault?: boolean;
  supportedEfforts?: ReasoningEffort[];
}

export type ReasoningEffort =
  | "none"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | string;
