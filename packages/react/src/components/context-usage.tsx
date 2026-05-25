import type { ThreadTokenUsage } from "@nyosegawa/agent-ui-core";
import { useEffect, useRef, useState } from "react";
import { IconGauge } from "../components-internal";
import { useAgentI18n } from "../i18n";
import { AgentRateLimitBar } from "./status";

export function AgentContextUsageIndicator({
  tokenUsage,
}: {
  tokenUsage?: ThreadTokenUsage;
}) {
  const { t } = useAgentI18n();
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
      <summary aria-label={t("aria.contextUsage")} title={t("context.title")}>
        <IconGauge size={14} />
        <span>{Math.round(percent)}%</span>
      </summary>
      <div className="aui-context-usage-popover" role="dialog" aria-label={t("aria.contextUsageDetails")}>
        <div className="aui-context-usage-header">
          <strong>{t("context.title")}</strong>
          <span>{Math.round(percent)}%</span>
        </div>
        <AgentRateLimitBar label={t("context.contextWindow")} percent={percent} />
        <dl>
          <div>
            <dt>{t("context.used")}</dt>
            <dd>
              {totalTokens.toLocaleString()} / {contextWindow.toLocaleString()}
            </dd>
          </div>
          <TokenUsageRow label={t("context.input")} value={tokenUsage?.inputTokens} />
          <TokenUsageRow label={t("context.cachedInput")} value={tokenUsage?.cachedInputTokens} />
          <TokenUsageRow label={t("context.output")} value={tokenUsage?.outputTokens} />
          <TokenUsageRow label={t("context.reasoning")} value={tokenUsage?.reasoningOutputTokens} />
          {tokenUsage?.last ? (
            <TokenUsageRow label={t("context.lastTurn")} value={tokenUsage.last.totalTokens} />
          ) : null}
        </dl>
        <p>{t("context.compactionNotice")}</p>
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
