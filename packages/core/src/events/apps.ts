import type { AgentApp, ThreadId } from "../state";

export type AppsEvent = { type: "apps/updated"; apps: AgentApp[]; nextCursor?: string | null; threadId?: ThreadId };
