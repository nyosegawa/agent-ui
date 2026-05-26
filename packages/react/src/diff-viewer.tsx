import { EditorState, RangeSetBuilder } from "@codemirror/state";
import { Decoration, EditorView, type DecorationSet } from "@codemirror/view";
import { useEffect, useRef, useState } from "react";
import { useAgentI18n } from "./i18n";

export function AgentDiffViewer({ patch }: { patch: unknown }) {
  const { t } = useAgentI18n();
  const normalized = normalizePatch(patch);
  return (
    <div className="aui-diff">
      <div className="aui-diff-header">
        <strong>
          {formatCount(normalized.files.length, t("common.file"), t("common.files"))}
        </strong>
        <span className="aui-diff-stat aui-diff-stat-add">
          +{normalized.stats.additions}
        </span>
        <span className="aui-diff-stat aui-diff-stat-remove">
          -{normalized.stats.removals}
        </span>
      </div>
      {normalized.files.length > 0 ? (
        <ul className="aui-diff-files" aria-label={t("aria.changedFiles")}>
          {normalized.files.map((file) => (
            <li key={`${file.path}:${file.kind}`}>
              <span>{file.path}</span>
              <em>{file.kind}</em>
            </li>
          ))}
        </ul>
      ) : null}
      <CodeMirrorDiff
        patchContentLabel={t("aria.patchContent")}
        viewerLabel={t("aria.codeMirrorPatchViewer")}
        text={normalized.text}
      />
    </div>
  );
}

function CodeMirrorDiff({
  patchContentLabel,
  text,
  viewerLabel,
}: {
  patchContentLabel: string;
  text: string;
  viewerLabel: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isEnhanced, setIsEnhanced] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const view = new EditorView({
      doc: text,
      extensions: [
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
        EditorView.lineWrapping,
        EditorView.decorations.compute(["doc"], diffLineDecorations),
        EditorView.contentAttributes.of({ "aria-label": patchContentLabel }),
        diffTheme,
      ],
      parent: ref.current,
    });
    setIsEnhanced(true);
    return () => {
      view.destroy();
      setIsEnhanced(false);
    };
  }, [patchContentLabel, text]);

  return (
    <>
      <div
        aria-label={viewerLabel}
        className="aui-codemirror-diff"
        ref={ref}
      />
      <pre
        aria-hidden={isEnhanced ? "true" : undefined}
        className={isEnhanced ? "aui-diff-source aui-visually-hidden" : "aui-diff-source"}
      >
        {text}
      </pre>
    </>
  );
}

function diffLineDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber += 1) {
    const line = state.doc.line(lineNumber);
    const marker = line.text[0];
    const className =
      marker === "+"
        ? "aui-cm-line-add"
        : marker === "-"
          ? "aui-cm-line-remove"
          : marker === "@"
            ? "aui-cm-line-hunk"
            : marker === "d" && line.text.startsWith("diff ")
              ? "aui-cm-line-file"
              : undefined;
    if (className)
      builder.add(line.from, line.from, Decoration.line({ class: className }));
  }
  return builder.finish();
}

const diffTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "transparent",
      color: "var(--aui-code-fg)",
      fontSize: "12px",
    },
    ".cm-content": {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      minHeight: "100%",
      padding: "10px 0",
    },
    ".cm-gutters": {
      backgroundColor: "transparent",
      borderRight: "1px solid var(--aui-code-gutter-rule)",
      color: "var(--aui-code-gutter-fg)",
    },
    ".cm-line": {
      padding: "0 10px",
    },
    ".cm-scroller": {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      lineHeight: "1.5",
    },
    ".aui-cm-line-add": {
      backgroundColor: "var(--aui-code-add-bg)",
    },
    ".aui-cm-line-file": {
      color: "var(--aui-code-file-fg)",
      fontWeight: "700",
    },
    ".aui-cm-line-hunk": {
      backgroundColor: "var(--aui-code-hunk-bg)",
      color: "var(--aui-code-hunk-fg)",
    },
    ".aui-cm-line-remove": {
      backgroundColor: "var(--aui-code-remove-bg)",
    },
    ".cm-activeLine": {
      backgroundColor: "transparent",
    },
    "&.cm-focused": {
      outline: "2px solid var(--aui-primary)",
      outlineOffset: "-2px",
    },
  },
  { dark: true },
);

type NormalizedPatch = {
  files: Array<{ kind: string; path: string }>;
  stats: { additions: number; removals: number };
  text: string;
};

function normalizePatch(patch: unknown): NormalizedPatch {
  if (typeof patch === "string")
    return buildNormalizedPatch(patch, parseUnifiedDiffFiles(patch));
  if (Array.isArray(patch)) {
    const changes = normalizeChangeArray(patch);
    if (changes.length > 0) return buildNormalizedPatch(changesToText(changes), changes);
  }
  if (isRecord(patch)) {
    const changes = normalizeChangeArray(patch.changes);
    if (changes.length > 0) return buildNormalizedPatch(changesToText(changes), changes);
    const fileChanges = normalizeFileChanges(patch.fileChanges);
    if (fileChanges.length > 0)
      return buildNormalizedPatch(changesToText(fileChanges), fileChanges);
    if (typeof patch.diff === "string") {
      return buildNormalizedPatch(patch.diff, parseUnifiedDiffFiles(patch.diff));
    }
    if (typeof patch.patch === "string") {
      return buildNormalizedPatch(patch.patch, parseUnifiedDiffFiles(patch.patch));
    }
  }
  const text = JSON.stringify(patch, null, 2);
  return buildNormalizedPatch(text, []);
}

function buildNormalizedPatch(
  text: string,
  files: Array<{ kind: string; path: string }>,
): NormalizedPatch {
  return {
    files: dedupeFiles(files),
    stats: diffStats(text),
    text,
  };
}

function normalizeChangeArray(
  value: unknown,
): Array<{ diff: string; kind: string; path: string }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((change) => {
    if (!isRecord(change) || typeof change.path !== "string") return [];
    const diff = typeof change.diff === "string" ? change.diff : "";
    const kind = typeof change.kind === "string" ? change.kind : "update";
    return [{ diff, kind, path: change.path }];
  });
}

function normalizeFileChanges(
  value: unknown,
): Array<{ diff: string; kind: string; path: string }> {
  if (!isRecord(value)) return [];
  return Object.entries(value).flatMap(([path, change]) => {
    if (!isRecord(change) || typeof change.type !== "string") return [];
    if (change.type === "update") {
      const movePath =
        typeof change.move_path === "string" ? ` -> ${change.move_path}` : "";
      return [
        {
          diff: typeof change.unified_diff === "string" ? change.unified_diff : "",
          kind: movePath ? `move${movePath}` : "update",
          path,
        },
      ];
    }
    const content = typeof change.content === "string" ? change.content : "";
    const prefix = change.type === "delete" ? "-" : "+";
    return [{ diff: contentToDiff(content, prefix), kind: change.type, path }];
  });
}

function changesToText(changes: Array<{ diff: string; kind: string; path: string }>) {
  return changes
    .map((change) => {
      const header = `diff --git a/${change.path} b/${change.path}\n# ${change.kind}`;
      return `${header}\n${change.diff}`.trimEnd();
    })
    .join("\n\n");
}

function contentToDiff(content: string, prefix: "+" | "-") {
  return content
    .split("\n")
    .map((line) => (line.length > 0 ? `${prefix}${line}` : prefix))
    .join("\n");
}

function parseUnifiedDiffFiles(text: string): Array<{ kind: string; path: string }> {
  return text.split("\n").flatMap((line) => {
    const match = /^diff --git a\/(.+) b\/(.+)$/.exec(line);
    if (!match) return [];
    return [{ kind: "update", path: match[2] ?? match[1] ?? "unknown" }];
  });
}

function dedupeFiles(files: Array<{ kind: string; path: string }>) {
  const seen = new Set<string>();
  return files.filter((file) => {
    const key = `${file.path}:${file.kind}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function diffStats(text: string) {
  return text.split("\n").reduce(
    (stats, line) => {
      if (line.startsWith("+") && !line.startsWith("+++")) stats.additions += 1;
      if (line.startsWith("-") && !line.startsWith("---")) stats.removals += 1;
      return stats;
    },
    { additions: 0, removals: 0 },
  );
}

function formatCount(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
