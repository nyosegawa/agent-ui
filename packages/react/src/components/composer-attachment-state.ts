import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentI18nKey } from "../i18n";
import type { AgentUserInput } from "../agent-input";
import {
  fileExtension,
  formatFileSize,
  isImageFile,
  type AgentLocalAttachmentKind,
  type AgentLocalAttachmentResolver,
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
    if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
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

  const addLocalFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!resolveLocalAttachment) return;
      const list = Array.from(files);
      if (list.length === 0) return;
      let rejected = 0;
      for (const file of list) {
        const kind: AgentLocalAttachmentKind = isImageFile(file) ? "image" : "file";
        let input: AgentUserInput | AgentUserInput[] | null | undefined;
        try {
          input = await resolveLocalAttachment(file, kind);
        } catch (error) {
          console.warn("AgentComposer attachment resolver failed", error);
          setAttachmentError(error instanceof Error ? error.message : String(error));
          input = null;
        }
        if (!input) {
          rejected += 1;
          continue;
        }
        const previewUrl = kind === "image" ? URL.createObjectURL(file) : undefined;
        addAttachment({
          extension: fileExtension(file.name),
          id: `${kind}:${file.name}:${file.size}:${Date.now()}:${Math.random()
            .toString(36)
            .slice(2, 7)}`,
          input,
          kind,
          label: file.name || kind,
          previewUrl,
          sizeLabel: formatFileSize(file.size),
          value: file.name,
        });
      }
      setAttachmentError(
        rejected > 0
          ? t("composer.attachmentRejected", {
              count: rejected,
              file: rejected === 1 ? "file" : "files",
            })
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
    removeAttachment,
  };
}
