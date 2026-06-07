import type { AgentUserInput } from "../agent-input";
import type {
  QueuedFollowUp,
  QueuedFollowUpAttachment,
} from "../composer-queue";
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
  value: string;
}

export type AgentComposerDisabledReason =
  | "empty"
  | "interrupting"
  | "submitting";

export interface AgentComposerFailedPendingMessage {
  error?: string;
  operationId: string;
  threadId: string;
}

export type AgentComposerSubmitMode = "queue" | "send" | "stop";

export type { AgentThreadStartWithInputOptions };
