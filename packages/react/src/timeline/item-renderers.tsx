import type { AgentItemBlock, AgentItemState } from "@nyosegawa/agent-ui-core";
import { useState } from "react";
import { AgentDiffViewer } from "../diff-viewer";
import { useAgentI18n, type AgentI18nKey } from "../i18n";
import { MarkdownMessage } from "../markdown";
import {
  agentResourceDisplayName,
  agentResourceUrl,
  type AgentResourceResolution,
} from "../resources";
import {
  commandTextForItem,
  displayText,
  formatDuration,
  formatJson,
  isRecord,
  isVideoPath,
  itemLabel,
  kindLabel,
  lineCount,
  shortId,
  stringValue,
} from "./formatters";
import { commandPreview, toolPreview } from "./previews";

export type AgentLocalMediaUrlResolver = (
  path: string,
  item: AgentItemState | undefined,
) => AgentResourceResolution;

export function AgentContentBlockView({
  block,
  item,
  output,
  patch,
  resolveLocalMediaUrl,
}: {
  block: AgentItemBlock;
  item?: AgentItemState;
  output?: string;
  patch?: unknown;
  resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
}) {
  switch (block.kind) {
    case "thinking":
      return <AgentReasoningItem block={block} />;
    case "plan":
      return <PlanBlock block={block} />;
    case "commandExecution":
      return <AgentCommandItem block={block} output={output ?? block.output} />;
    case "fileChange":
      return <AgentFileChangeItem block={block} patch={patch} />;
    case "toolCall":
    case "mcpToolCall":
      return <AgentToolCallItem block={block} />;
    case "collabToolCall":
      return <CollabToolCallBlock block={block} />;
    case "webSearch":
      return <WebSearchBlock block={block} />;
    case "image":
      return (
        <ImageBlock
          block={block}
          item={item}
          resolveLocalMediaUrl={resolveLocalMediaUrl}
        />
      );
    case "systemInfo":
      return <SystemInfoBlock block={block} />;
    case "text":
      return block.text ? <AgentMessageItem text={block.text} /> : null;
    case "unknown":
    default:
      return <SystemInfoBlock block={{ ...block, kind: "systemInfo" }} />;
  }
}

export function AgentCommandItem({
  block,
  item,
  itemId,
  output,
}: {
  block?: AgentItemBlock;
  item?: AgentItemState;
  itemId?: string;
  output?: string;
}) {
  const { t } = useAgentI18n();
  const [isOpen, setOpen] = useState(false);
  const normalizedOutput = output?.trimEnd() ?? "";
  const title =
    block?.command ?? commandTextForItem(item) ?? displayText(item?.text) ?? itemId ?? t("timeline.command");
  const status = block?.status ?? item?.status ?? "completed";
  return (
    <details
      aria-label={t("aria.commandOutput")}
      className="aui-transcript-card aui-command-card"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span className="aui-terminal-label">{t("timeline.terminal")}</span>
        <span className="aui-command-title">{title}</span>
        <span className="aui-command-meta">
          {status}
          {block?.exitCode !== undefined
            ? ` · ${t("timeline.exitCode", { code: block.exitCode })}`
            : ""}
          {block?.durationMs !== undefined ? ` · ${formatDuration(block.durationMs)}` : ""}
          {" · "}
          {lineCount(normalizedOutput)} {t("timeline.lines")}
        </span>
        {normalizedOutput ? (
          <span className="aui-command-preview">{commandPreview(normalizedOutput)}</span>
        ) : null}
      </summary>
      {isOpen && normalizedOutput ? (
        <pre className="aui-command-output">{normalizedOutput}</pre>
      ) : isOpen ? (
        <div className="aui-transcript-empty">{t("timeline.noTerminalOutput")}</div>
      ) : null}
    </details>
  );
}

export function AgentFileChangeItem({
  block,
  item,
  patch,
}: {
  block?: AgentItemBlock;
  item?: AgentItemState;
  patch?: unknown;
}) {
  const { t } = useAgentI18n();
  const [isOpen, setOpen] = useState(false);
  const changes = block?.changes ?? [];
  return (
    <details
      aria-label={t("aria.diffPreview")}
      className="aui-transcript-card aui-file-change-card"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span className="aui-terminal-label">{t("timeline.diff")}</span>
        <span className="aui-command-title">
          {displayText(item?.text) ??
            (changes.length > 0
              ? t("timeline.filesChanged", {
                  count: changes.length,
                  label: changes.length === 1 ? t("timeline.file") : t("timeline.files"),
                })
              : t("timeline.fileChanges"))}
        </span>
        <span className="aui-command-meta">{block?.status ?? item?.status ?? "completed"}</span>
      </summary>
      {isOpen && changes.length > 0 ? <ChangedFileList changes={changes} /> : null}
      {isOpen && patch ? (
        <AgentDiffViewer patch={patch} />
      ) : isOpen ? (
        <div className="aui-transcript-empty">{t("timeline.noPatch")}</div>
      ) : null}
    </details>
  );
}

export function AgentReasoningItem({ block }: { block: AgentItemBlock }) {
  const { t } = useAgentI18n();
  const summary = block.summary ?? block.text ?? t("timeline.thinking");
  const content = block.content ?? block.text;
  return (
    <details className="aui-content-block aui-thinking-block">
      <summary>
        <span>{t("timeline.thinking")}</span>
        <small>{summary}</small>
      </summary>
      {content ? <pre>{content}</pre> : null}
    </details>
  );
}

function PlanBlock({ block }: { block: AgentItemBlock }) {
  const { t } = useAgentI18n();
  return (
    <section className="aui-content-block aui-plan-block" aria-label={t("timeline.plan")}>
      <strong>{t("timeline.plan")}</strong>
      <MessageBody text={block.text ?? block.content ?? ""} />
    </section>
  );
}

export function AgentToolCallItem({ block }: { block: AgentItemBlock }) {
  const { t } = useAgentI18n();
  const [isOpen, setOpen] = useState(false);
  const label = block.toolType === "mcp" ? t("timeline.mcpTool") : t("timeline.toolCall");
  const preview = toolPreview(block, t);
  const title = block.server ? `${block.server} / ${block.tool ?? t("timeline.unknownTool")}` : block.tool ?? t("timeline.unknownTool");
  return (
    <details
      aria-label={label}
      className="aui-content-block aui-tool-block"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span>{label}</span>
        <strong>{title}</strong>
        {block.status ? <small>{block.status}</small> : null}
        {block.durationMs !== undefined ? <small>{formatDuration(block.durationMs)}</small> : null}
        {preview ? <em className="aui-tool-preview">{preview}</em> : null}
      </summary>
      {isOpen ? (
        <>
          <JsonSection label={t("timeline.arguments")} value={block.arguments} />
          <JsonSection label={t("timeline.result")} value={block.result} />
          <JsonSection label={t("timeline.error")} value={block.error} tone="danger" />
        </>
      ) : null}
    </details>
  );
}

function CollabToolCallBlock({ block }: { block: AgentItemBlock }) {
  const { t } = useAgentI18n();
  const metadata = isRecord(block.metadata) ? block.metadata : {};
  const senderThreadId = stringValue(metadata.senderThreadId ?? metadata.sender_thread_id);
  const receiverThreadId = stringValue(metadata.receiverThreadId ?? metadata.receiver_thread_id);
  const newThreadId = stringValue(metadata.newThreadId ?? metadata.new_thread_id);
  return (
    <section className="aui-content-block aui-collab-tool-block" aria-label={t("timeline.collabTool")}>
      <div className="aui-content-block-heading">
        <span>{t("timeline.collabTool")}</span>
        <strong>{block.tool ?? t("timeline.agentTool")}</strong>
        {block.status ? <small>{block.status}</small> : null}
      </div>
      {block.text ? <p>{block.text}</p> : null}
      <dl className="aui-block-metadata">
        {senderThreadId ? (
          <>
            <dt>{t("timeline.from")}</dt>
            <dd>{shortId(senderThreadId)}</dd>
          </>
        ) : null}
        {receiverThreadId ? (
          <>
            <dt>{t("timeline.to")}</dt>
            <dd>{shortId(receiverThreadId)}</dd>
          </>
        ) : null}
        {newThreadId ? (
          <>
            <dt>{t("timeline.thread")}</dt>
            <dd>{shortId(newThreadId)}</dd>
          </>
        ) : null}
      </dl>
    </section>
  );
}

function WebSearchBlock({ block }: { block: AgentItemBlock }) {
  const { t } = useAgentI18n();
  return (
    <section className="aui-content-block aui-web-search-block" aria-label={t("timeline.webSearch")}>
      <span>{t("timeline.search")}</span>
      <strong>{block.query ?? block.text ?? t("timeline.webSearch")}</strong>
    </section>
  );
}

function ImageBlock({
  block,
  item,
  resolveLocalMediaUrl,
}: {
  block: AgentItemBlock;
  item?: AgentItemState;
  resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
}) {
  const { t } = useAgentI18n();
  const [failedMediaKey, setFailedMediaKey] = useState<string | undefined>();
  const blockResource = block.resource;
  const path = blockResource?.path ?? block.path;
  const resolvedResource = path ? resolveLocalMediaUrl?.(path, item) : undefined;
  const displayResource =
    resolvedResource ?? (blockResource?.url || blockResource?.previewUrl ? blockResource : undefined);
  const resolvedUrl = agentResourceUrl(displayResource);
  const resolvedResourceObject =
    displayResource ?? undefined;
  const mediaSourceKey = path ?? blockResource?.url ?? blockResource?.previewUrl;
  const mediaKey =
    mediaSourceKey && resolvedUrl ? `${mediaSourceKey}\u0000${resolvedUrl}` : undefined;
  const failed = Boolean(mediaKey && failedMediaKey === mediaKey);
  if (!path && !resolvedUrl) {
    return (
      <section className="aui-content-block aui-image-block" aria-label={t("timeline.image")}>
        {t("timeline.imageGenerated")}
      </section>
    );
  }
  const fallbackDisplayName =
    block.text ?? (path ? localMediaDisplayName(path) : undefined) ?? t("timeline.image");
  const fileName =
    agentResourceDisplayName(displayResource, fallbackDisplayName) ??
    fallbackDisplayName;
  const isVideoResource =
    resolvedResourceObject?.mimeType?.startsWith("video/") ||
    Boolean(path && isVideoPath(path));
  if (!resolvedUrl || failed) {
    return (
      <figure
        className="aui-content-block aui-image-block"
        data-status={failed ? "failed" : "unavailable"}
      >
        <div className="aui-image-block-fallback" role="status">
          {t("timeline.localMediaUnavailable")}
        </div>
        <figcaption>{fileName}</figcaption>
      </figure>
    );
  }
  return (
    <figure className="aui-content-block aui-image-block">
      {isVideoResource ? (
        <video
          controls
          onError={() => setFailedMediaKey(mediaKey)}
          src={resolvedUrl}
        />
      ) : (
        <img
          alt={fileName}
          onError={() => setFailedMediaKey(mediaKey)}
          src={resolvedUrl}
        />
      )}
      <figcaption>{fileName}</figcaption>
    </figure>
  );
}

function localMediaDisplayName(path: string): string {
  const segments = path.split(/[\\/]+/).filter(Boolean);
  return segments.at(-1) ?? path;
}

function SystemInfoBlock({ block }: { block: AgentItemBlock }) {
  return (
    <section
      className="aui-content-block aui-system-info-block"
      data-subtype={block.subtype ?? "status"}
    >
      {block.text ?? block.content ?? block.kind}
    </section>
  );
}

function ChangedFileList({ changes }: { changes: unknown[] }) {
  const { t } = useAgentI18n();
  return (
    <ul className="aui-changed-file-list" aria-label={t("aria.changedFiles")}>
      {changes.map((change, index) => {
        const record = isRecord(change) ? change : {};
        const path = stringValue(record.path) ?? "unknown";
        const kind = stringValue(record.kind) ?? "update";
        return (
          <li key={`${path}:${index}`}>
            <span>{kindLabel(kind)}</span>
            <code>{path}</code>
          </li>
        );
      })}
    </ul>
  );
}

function JsonSection({
  label,
  tone,
  value,
}: {
  label: string;
  tone?: "danger";
  value: unknown;
}) {
  if (value === undefined || value === null) return null;
  return (
    <div className="aui-json-section" data-tone={tone}>
      <span>{label}</span>
      <pre>{formatJson(value)}</pre>
    </div>
  );
}

export function AgentMessageItem({ text }: { text: string }) {
  const trimmed = text.trim();
  return <MarkdownMessage className="aui-message-body" text={trimmed} />;
}

export const AgentCommandOutputItem = AgentCommandItem;
export const AgentDiffItem = AgentFileChangeItem;

function MessageBody({ text }: { text: string }) {
  return <AgentMessageItem text={text} />;
}

export function localizedItemLabel(
  kind: string,
  t: (key: AgentI18nKey) => string,
): string {
  switch (kind) {
    case "userMessage":
      return t("timeline.you");
    case "agentMessage":
      return t("timeline.assistant");
    case "reasoning":
      return t("timeline.reasoning");
    case "plan":
      return t("timeline.plan");
    case "commandExecution":
      return t("timeline.command");
    case "fileChange":
      return t("timeline.fileChange");
    case "toolCall":
    case "mcpToolCall":
      return t("timeline.tool");
    case "collabToolCall":
      return t("timeline.collab");
    case "webSearch":
      return t("timeline.webSearch");
    case "image":
    case "imageView":
      return t("timeline.image");
    case "systemInfo":
      return t("timeline.system");
    case "contextCompaction":
      return t("timeline.compaction");
    case "thinking":
      return t("timeline.thinking");
    default:
      return itemLabel(kind);
  }
}
