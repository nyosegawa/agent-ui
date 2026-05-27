export type AgentUserInput =
  | AgentTextInput
  | AgentImageInput
  | AgentLocalImageInput
  | AgentSkillInput
  | AgentMentionInput
  | AgentUnknownUserInput;

export interface AgentTextInput {
  text: string;
  text_elements?: unknown[];
  type: "text";
}

export interface AgentImageInput {
  image_url: string;
  type: "image";
}

export interface AgentLocalImageInput {
  path: string;
  type: "localImage";
}

export interface AgentSkillInput {
  name: string;
  path: string;
  type: "skill";
}

export interface AgentMentionInput {
  name: string;
  path: string;
  type: "mention";
}

export interface AgentUnknownUserInput {
  type: string;
  [key: string]: unknown;
}
