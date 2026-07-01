import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";

export function AnswerFocusedTranscriptExample({
  transport,
}: {
  transport: AgentTransport;
}) {
  return (
    <AgentProvider transport={transport}>
      <AgentChat transcriptMode="answer-focused" />
    </AgentProvider>
  );
}

export function CategoryTranscriptDisplayExample({
  transport,
}: {
  transport: AgentTransport;
}) {
  return (
    <AgentProvider transport={transport}>
      <AgentChat
        transcriptDisplay={{
          byCategory: {
            command: { density: "expanded", visibility: "collapsed" },
            fileChange: { density: "expanded", visibility: "collapsed" },
            reasoning: { visibility: "hidden" },
            toolActivity: { visibility: "collapsed" },
          },
          byRole: {
            assistant: { visibility: "visible" },
            user: { visibility: "visible" },
          },
          default: { density: "comfortable", visibility: "visible" },
        }}
      />
    </AgentProvider>
  );
}
