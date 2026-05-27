import type { AgentModel } from "../state";

export type ModelsEvent = { type: "models/updated"; models: AgentModel[]; selectedModelId?: string };
