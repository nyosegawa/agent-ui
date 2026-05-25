import type { ThreadTokenUsage } from "@nyosegawa/agent-ui-core";
import { useEffect, useRef, useState } from "react";
import { IconGauge } from "../components-internal";
import { AgentRateLimitBar } from "./status";

export function AgentContextUsageIndicator({
  tokenUsage,
}: {
  tokenUsage?: ThreadTokenUsage;
}) {
  const totalTokens = tokenUsage?.totalTokens ?? 0;
  const contextWindow = tokenUsage?.modelContextWindow ?? 0;
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (details && !details.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);
  if (totalTokens <= 0 || contextWindow <= 0) return null;
  const percent = Math.min(100, Math.max(0, (totalTokens / contextWindow) * 100));
  return (
    <details
      className="aui-context-usage"
      onToggle={(event) => setOpen(event.currentTarget.open)}
      open={open}
      ref={detailsRef}
    >
      <summary aria-label="Context usage" title="Context usage">
        <IconGauge size={14} />
        <span>{Math.round(percent)}%</span>
      </summary>
      <div className="aui-context-usage-popover" role="dialog" aria-label="Context usage details">
        <div className="aui-context-usage-header">
          <strong>Context usage</strong>
          <span>{Math.round(percent)}%</span>
        </div>
        <AgentRateLimitBar label="Context window" percent={percent} />
        <dl>
          <div>
            <dt>Used</dt>
            <dd>
              {totalTokens.toLocaleString()} / {contextWindow.toLocaleString()}
            </dd>
          </div>
          <TokenUsageRow label="Input" value={tokenUsage?.inputTokens} />
          <TokenUsageRow label="Cached input" value={tokenUsage?.cachedInputTokens} />
          <TokenUsageRow label="Output" value={tokenUsage?.outputTokens} />
          <TokenUsageRow label="Reasoning" value={tokenUsage?.reasoningOutputTokens} />
          {tokenUsage?.last ? (
            <TokenUsageRow label="Last turn" value={tokenUsage.last.totalTokens} />
          ) : null}
        </dl>
        <p>Codex may automatically compact context as a thread approaches its window.</p>
      </div>
    </details>
  );
}

function TokenUsageRow({ label, value }: { label: string; value?: number }) {
  if (value == null) return null;
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value.toLocaleString()}</dd>
    </div>
  );
}
