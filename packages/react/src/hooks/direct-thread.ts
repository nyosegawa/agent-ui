import { useCallback } from "react";
import type { ThreadId } from "@nyosegawa/agent-ui-core";
import { useAgentThread, useAgentThreadReader } from "./thread";
import type { AgentThreadResumeResult } from "./thread-lifecycle-types";

export interface AgentDirectThreadOpenResult {
  readThreadId: ThreadId;
  resume: AgentThreadResumeResult;
  threadId: ThreadId;
}

export interface AgentDirectThreadController {
  openThread: (threadId: ThreadId) => Promise<AgentDirectThreadOpenResult>;
  previewThread: (threadId: ThreadId) => Promise<ThreadId>;
}

export function useAgentDirectThreadController(): AgentDirectThreadController {
  const { resumeThread } = useAgentThread();
  const { readThread } = useAgentThreadReader();

  const previewThread = useCallback(
    async (threadId: ThreadId) => {
      const result = await readThread(threadId, {
        activate: true,
        includeTurns: true,
      });
      return result.threadId;
    },
    [readThread],
  );

  const openThread = useCallback(
    async (threadId: ThreadId) => {
      const read = await readThread(threadId, {
        activate: true,
        includeTurns: true,
      });
      const resume = await resumeThread(threadId);
      return {
        readThreadId: read.threadId,
        resume,
        threadId: resume.threadId,
      };
    },
    [readThread, resumeThread],
  );

  return { openThread, previewThread };
}
