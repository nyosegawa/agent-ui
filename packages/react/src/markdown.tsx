import type React from "react";
import { useAgentI18n } from "./i18n";

interface MarkdownMessageProps {
  className?: string;
  text: string;
}

type MarkdownBlock =
  | { type: "blockquote"; lines: string[] }
  | { type: "code"; code: string; language?: string }
  | { type: "heading"; depth: number; text: string }
  | { type: "hr" }
  | { type: "list"; items: string[]; ordered: boolean; task?: boolean }
  | { type: "paragraph"; lines: string[] }
  | { type: "table"; rows: string[][] };

export function MarkdownMessage({ className, text }: MarkdownMessageProps) {
  const { t } = useAgentI18n();
  const blocks = parseMarkdownBlocks(text);
  return (
    <div className={["aui-markdown", className].filter(Boolean).join(" ")}>
      {blocks.map((block, index) => (
        <MarkdownBlockView block={block} key={index} taskLabel={t} />
      ))}
    </div>
  );
}

function MarkdownBlockView({
  block,
  taskLabel,
}: {
  block: MarkdownBlock;
  taskLabel: ReturnType<typeof useAgentI18n>["t"];
}) {
  switch (block.type) {
    case "blockquote":
      return (
        <blockquote>
          {block.lines.map((line, index) => (
            <p key={index}>{renderInline(line, `quote-${index}`)}</p>
          ))}
        </blockquote>
      );
    case "code":
      return (
        <pre>
          <code data-language={block.language}>{block.code}</code>
        </pre>
      );
    case "heading": {
      const Tag = `h${block.depth}` as keyof React.JSX.IntrinsicElements;
      return <Tag>{renderInline(block.text, "heading")}</Tag>;
    }
    case "hr":
      return <hr />;
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag>
          {block.items.map((item, index) => (
            <li key={index}>{renderTaskListItem(item, block.task, index, taskLabel)}</li>
          ))}
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p>
          {block.lines.flatMap((line, index) => [
            index > 0 ? <br key={`br-${index}`} /> : null,
            ...renderInline(line, `p-${index}`),
          ])}
        </p>
      );
    case "table":
      return (
        <div className="aui-markdown-table-wrap">
          <table>
            <thead>
              <tr>
                {block.rows[0]?.map((cell, index) => (
                  <th key={index}>{renderInline(cell, `th-${index}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>
                      {renderInline(cell, `td-${rowIndex}-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

function parseMarkdownBlocks(text: string): MarkdownBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^```([A-Za-z0-9_-]+)?\s*$/);
    if (fence) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index] ?? "")) {
        code.push(lines[index] ?? "");
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push({ code: code.join("\n"), language: fence[1], type: "code" });
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      blocks.push({
        depth: heading[1]?.length ?? 1,
        text: heading[2]?.trim() ?? "",
        type: "heading",
      });
      index += 1;
      continue;
    }

    if (/^[-*_]\s*[-*_]\s*[-*_][\s-*_]*$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      const rows: string[][] = [];
      rows.push(splitTableRow(lines[index] ?? ""));
      index += 2;
      while (index < lines.length && isTableRow(lines[index] ?? "")) {
        rows.push(splitTableRow(lines[index] ?? ""));
        index += 1;
      }
      blocks.push({ rows, type: "table" });
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index] ?? "")) {
        quoteLines.push((lines[index] ?? "").replace(/^\s*>\s?/, ""));
        index += 1;
      }
      blocks.push({ lines: quoteLines, type: "blockquote" });
      continue;
    }

    const listMatch = line.match(/^(\s*)([-*+])\s+(.+)$/);
    const orderedMatch = line.match(/^(\s*)\d+[.)]\s+(.+)$/);
    if (listMatch || orderedMatch) {
      const ordered = Boolean(orderedMatch);
      const items: string[] = [];
      while (index < lines.length) {
        const next = lines[index] ?? "";
        const match = ordered
          ? next.match(/^\s*\d+[.)]\s+(.+)$/)
          : next.match(/^\s*[-*+]\s+(.+)$/);
        if (!match) break;
        items.push(match[1] ?? "");
        index += 1;
      }
      blocks.push({
        items,
        ordered,
        task: items.some((item) => /^\[[ xX]\]\s+/.test(item)),
        type: "list",
      });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length && lines[index]?.trim()) {
      if (paragraphTerminates(lines, index, paragraphLines.length > 0)) break;
      paragraphLines.push(lines[index] ?? "");
      index += 1;
    }
    blocks.push({ lines: paragraphLines, type: "paragraph" });
  }

  return blocks;
}

function paragraphTerminates(
  lines: string[],
  index: number,
  alreadyStarted: boolean,
): boolean {
  if (!alreadyStarted) return false;
  const line = lines[index] ?? "";
  return (
    /^```/.test(line) ||
    /^(#{1,6})\s+/.test(line) ||
    /^\s*>\s?/.test(line) ||
    /^\s*[-*+]\s+/.test(line) ||
    /^\s*\d+[.)]\s+/.test(line) ||
    isTableStart(lines, index)
  );
}

function isTableStart(lines: string[], index: number): boolean {
  const header = lines[index] ?? "";
  const separator = lines[index + 1] ?? "";
  return isTableRow(header) && /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(separator);
}

function isTableRow(line: string): boolean {
  return line.includes("|") && !/^```/.test(line.trim());
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderTaskListItem(
  item: string,
  task: boolean | undefined,
  index: number,
  t: ReturnType<typeof useAgentI18n>["t"],
) {
  if (!task) return renderInline(item, `li-${index}`);
  const match = item.match(/^\[([ xX])\]\s+(.+)$/);
  if (!match) return renderInline(item, `li-${index}`);
  return (
    <>
      <input
        aria-label={match[1]?.toLowerCase() === "x" ? t("markdown.completedTask") : t("markdown.openTask")}
        checked={match[1]?.toLowerCase() === "x"}
        disabled
        readOnly
        type="checkbox"
      />{" "}
      {renderInline(match[2] ?? "", `task-${index}`)}
    </>
  );
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  while (cursor < text.length) {
    const match = nextInlineMatch(text, cursor);
    if (!match) {
      nodes.push(text.slice(cursor));
      break;
    }
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const matchKey = `${keyPrefix}-${key++}`;
    if (match.type === "code") {
      nodes.push(<code key={matchKey}>{match.content}</code>);
    } else if (match.type === "link") {
      const href = safeHref(match.href);
      nodes.push(
        href ? (
          <a href={href} key={matchKey} rel="noreferrer" target="_blank">
            {renderInline(match.content, `${matchKey}-link`)}
          </a>
        ) : (
          match.raw
        ),
      );
    } else if (match.type === "strong") {
      nodes.push(<strong key={matchKey}>{renderInline(match.content, matchKey)}</strong>);
    } else {
      nodes.push(<em key={matchKey}>{renderInline(match.content, matchKey)}</em>);
    }
    cursor = match.index + match.raw.length;
  }

  return nodes;
}

type InlineMatch =
  | { content: string; index: number; raw: string; type: "code" | "em" | "strong" }
  | { content: string; href: string; index: number; raw: string; type: "link" };

function nextInlineMatch(text: string, start: number): InlineMatch | undefined {
  const candidates: InlineMatch[] = [];
  const sliced = text.slice(start);
  const code = /`([^`]+)`/.exec(sliced);
  if (code?.[0]) {
    candidates.push({
      content: code[1] ?? "",
      index: start + code.index,
      raw: code[0],
      type: "code",
    });
  }
  const link = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(sliced);
  if (link?.[0]) {
    candidates.push({
      content: link[1] ?? "",
      href: link[2] ?? "",
      index: start + link.index,
      raw: link[0],
      type: "link",
    });
  }
  const strong = /\*\*([^*]+)\*\*/.exec(sliced);
  if (strong?.[0]) {
    candidates.push({
      content: strong[1] ?? "",
      index: start + strong.index,
      raw: strong[0],
      type: "strong",
    });
  }
  const em = /(^|[^*])\*([^*]+)\*/.exec(sliced);
  if (em?.[0]) {
    const raw = em[0].startsWith("*") ? em[0] : em[0].slice(1);
    const offset = em[0].startsWith("*") ? 0 : 1;
    candidates.push({
      content: em[2] ?? "",
      index: start + em.index + offset,
      raw,
      type: "em",
    });
  }
  return candidates.sort((a, b) => a.index - b.index || a.raw.length - b.raw.length)[0];
}

function safeHref(href: string): string | undefined {
  try {
    const parsed = new URL(href, "https://agent-ui.local");
    if (["http:", "https:", "mailto:"].includes(parsed.protocol)) return href;
  } catch {
    return undefined;
  }
  return undefined;
}
