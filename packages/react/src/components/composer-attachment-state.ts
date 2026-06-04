import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentI18nKey } from "../i18n";
import {
  agentResourceDisplayName,
  agentResourceUrl,
} from "../resources";
import {
  fileExtension,
  formatFileSize,
  isImageFile,
  type AgentLocalAttachmentKind,
  type AgentLocalAttachmentResolver,
  type AgentResolvedLocalAttachment,
  type ComposerAttachment,
} from "./composer-attachments";

type ComposerTranslator = (
  key: AgentI18nKey,
  vars?: Record<string, string | number>,
) => string;

export interface ComposerAttachmentState {
  addAttachment(attachment: ComposerAttachment): void;
  addLocalFiles(files: FileList | File[]): Promise<void>;
  attachmentError?: string;
  attachments: ComposerAttachment[];
  clearSubmittedAttachments(
    pendingAttachments: readonly ComposerAttachment[],
    options?: { revokePreview?: boolean },
  ): void;
  markAttachmentPreviewFailed(id: string): void;
  removeAttachment(id: string): void;
}

export function useComposerAttachmentState({
  onRegisterAttachmentRestore,
  resolveLocalAttachment,
  t,
}: {
  onRegisterAttachmentRestore?: (
    restore: (attachments: ComposerAttachment[]) => void,
  ) => void;
  resolveLocalAttachment?: AgentLocalAttachmentResolver;
  t: ComposerTranslator;
}): ComposerAttachmentState {
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | undefined>();
  const attachmentsRef = useRef<ComposerAttachment[]>([]);

  const revokePreview = useCallback((attachment: ComposerAttachment) => {
    if (attachment.previewUrl && attachment.previewUrlRevoke) {
      URL.revokeObjectURL(attachment.previewUrl);
    }
  }, []);

  const addAttachment = useCallback((attachment: ComposerAttachment) => {
    setAttachments((current) => [...current, attachment]);
  }, []);

  const removeAttachment = useCallback(
    (id: string) => {
      setAttachments((current) => {
        const removed = current.find((attachment) => attachment.id === id);
        if (removed) revokePreview(removed);
        return current.filter((attachment) => attachment.id !== id);
      });
    },
    [revokePreview],
  );

  const restoreAttachments = useCallback(
    (restoredAttachments: ComposerAttachment[]) => {
      setAttachments((current) => {
        for (const attachment of current) revokePreview(attachment);
        return restoredAttachments;
      });
    },
    [revokePreview],
  );

  const clearSubmittedAttachments = useCallback(
    (
      pendingAttachments: readonly ComposerAttachment[],
      { revokePreview: shouldRevokePreview = false } = {},
    ) => {
      if (shouldRevokePreview) {
        for (const attachment of pendingAttachments) revokePreview(attachment);
      }
      setAttachments((current) =>
        current.filter((attachment) => !pendingAttachments.includes(attachment)),
      );
    },
    [revokePreview],
  );

  const markAttachmentPreviewFailed = useCallback((id: string) => {
    setAttachments((current) =>
      current.map((attachment) =>
        attachment.id === id ? { ...attachment, previewFailed: true } : attachment,
      ),
    );
  }, []);

  const addLocalFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!resolveLocalAttachment) return;
      const list = Array.from(files);
      if (list.length === 0) return;
      let rejected = 0;
      for (const file of list) {
        const kind: AgentLocalAttachmentKind = isImageFile(file) ? "image" : "file";
        let resolved: AgentResolvedLocalAttachment | null | undefined;
        try {
          resolved = await resolveLocalAttachment(file, kind);
        } catch (error) {
          console.warn("AgentComposer attachment resolver failed", error);
          setAttachmentError(error instanceof Error ? error.message : String(error));
          resolved = null;
        }
        if (!resolved) {
          rejected += 1;
          continue;
        }
        const label = agentResourceDisplayName(resolved, file.name || kind) ?? kind;
        const previewUrl =
          kind === "image"
            ? agentResourceUrl(resolved) || URL.createObjectURL(file)
            : undefined;
        addAttachment({
          displayName: resolved.displayName,
          extension: fileExtension(label),
          id:
            resolved.id ??
            `${kind}:${file.name}:${file.size}:${Date.now()}:${Math.random()
              .toString(36)
              .slice(2, 7)}`,
          input: resolved.input,
          kind,
          label,
          previewUrl,
          previewUrlRevoke:
            kind === "image" && Boolean(previewUrl) && !resolved.previewUrl && !resolved.url,
          redactedPath: resolved.redactedPath,
          sizeLabel: formatFileSize(resolved.sizeBytes ?? file.size),
          value: resolved.path || resolved.url || file.name,
        });
      }
      setAttachmentError(
        rejected > 0
          ? t(
              rejected === 1
                ? "composer.attachmentRejectedOne"
                : "composer.attachmentRejectedMany",
              { count: rejected },
            )
          : undefined,
      );
    },
    [addAttachment, resolveLocalAttachment, t],
  );

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    onRegisterAttachmentRestore?.(restoreAttachments);
  }, [onRegisterAttachmentRestore, restoreAttachments]);

  useEffect(
    () => () => {
      for (const attachment of attachmentsRef.current) revokePreview(attachment);
    },
    [revokePreview],
  );

  return {
    addAttachment,
    addLocalFiles,
    attachmentError,
    attachments,
    clearSubmittedAttachments,
    markAttachmentPreviewFailed,
    removeAttachment,
  };
}
