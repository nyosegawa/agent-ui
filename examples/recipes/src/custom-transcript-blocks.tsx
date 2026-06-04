import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import {
  AgentChat,
  AgentProvider,
  type AgentComponents,
} from "@nyosegawa/agent-ui-react";

const components = {
  blocks: {
    commandExecution({ block, Default }) {
      return (
        <section className="host-command-block">
          <strong>Host command renderer</strong>
          <Default block={block} />
        </section>
      );
    },
    fileChange({ block, Default }) {
      return (
        <section className="host-file-change-block">
          <strong>Host file change renderer</strong>
          <Default block={block} />
        </section>
      );
    },
  },
} satisfies AgentComponents;

export function CustomTranscriptBlocksExample({
  transport,
}: {
  transport: AgentTransport;
}) {
  return (
    <AgentProvider transport={transport}>
      <AgentChat components={components} />
    </AgentProvider>
  );
}
