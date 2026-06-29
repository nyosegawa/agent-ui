import type { AgentUserInput } from "../agent-input";
import type { QueuedFollowUp, QueuedFollowUpAttachment } from "../composer-queue";
import type { Dispatch, SetStateAction } from "react";
import type {
  AgentThreadStartWithInputOptions,
  AgentThreadStartWithInputResult,
} from "./thread-lifecycle-types";

export interface AgentComposerController {
  activeTurnId?: string;
  canSubmit: boolean;
  cancelFailedPendingMessage: (operationId: string) => void;
  disabledReason?: AgentComposerDisabledReason;
  editQueuedFollowUp: (id: string) => QueuedFollowUp | undefined;
  error?: string;
  failedPendingMessages: AgentComposerFailedPendingMessage[];
  followUpErrors: Record<string, string>;
  isInterrupting: boolean;
  isRunning: boolean;
  isSubmitting: boolean;
  queuedFollowUps: QueuedFollowUp[];
  removeQueuedFollowUp: (id: string) => void;
  retryFailedPendingMessage: (operationId: string) => Promise<void>;
  sendMessage: (
    input: string | AgentUserInput[],
    options?: AgentComposerSendMessageOptions,
  ) => Promise<AgentComposerSendMessageResult>;
  sendQueuedFollowUp: (id: string) => Promise<void>;
  sendingFollowUpIds: string[];
  setError: Dispatch<SetStateAction<string | undefined>>;
  setValue: Dispatch<SetStateAction<string>>;
  startThreadWithInput: (
    input: string | AgentUserInput[],
    options?: AgentThreadStartWithInputOptions,
  ) => Promise<AgentThreadStartWithInputResult>;
  steerNow: (items?: AgentUserInput[]) => Promise<void>;
  stop: () => Promise<void>;
  submit: (
    items?: AgentUserInput[],
    options?: { attachments?: QueuedFollowUpAttachment[] },
  ) => Promise<string | undefined>;
  submitMode: AgentComposerSubmitMode;
  threadId?: string;
  value: string;
}

export interface AgentChatController extends AgentComposerController {}

export type AgentComposerDisabledReason =
  | "approval"
  | "empty"
  | "interrupting"
  | "submitting";

export interface AgentComposerFailedPendingMessage {
  error?: string;
  operationId: string;
  retryable: boolean;
  threadId: string;
}

export type AgentComposerSubmitMode = "send" | "stop";

export interface AgentComposerSendMessageOptions extends AgentThreadStartWithInputOptions {
  queuedAttachments?: QueuedFollowUpAttachment[];
}

export type AgentComposerSendMessageResult =
  | ({ type: "started" } & AgentThreadStartWithInputResult)
  | { threadId: string; type: "sent" }
  | { queuedFollowUpId: string; threadId: string; type: "queued" }
  | {
      reason: Extract<AgentComposerDisabledReason, "approval">;
      threadId?: string;
      type: "blocked";
    };

export type { AgentThreadStartWithInputOptions };
