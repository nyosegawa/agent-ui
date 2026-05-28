import type React from "react";
import { useRef, useState } from "react";

export function useComposerDropZone({
  addLocalFiles,
  disabled,
  enabled,
}: {
  addLocalFiles(files: FileList | File[]): Promise<void>;
  disabled: boolean;
  enabled: boolean;
}) {
  const [isDragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);
  const canAcceptDrop = enabled && !disabled;

  const onDragEnter: React.DragEventHandler<HTMLFormElement> = (event) => {
    if (!canAcceptDrop) return;
    event.preventDefault();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setDragOver(true);
  };

  const onDragLeave: React.DragEventHandler<HTMLFormElement> = (event) => {
    if (!canAcceptDrop) return;
    event.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragOver(false);
    }
  };

  const onDragOver: React.DragEventHandler<HTMLFormElement> = (event) => {
    if (!canAcceptDrop) return;
    event.preventDefault();
  };

  const onDrop: React.DragEventHandler<HTMLFormElement> = (event) => {
    if (!canAcceptDrop) return;
    event.preventDefault();
    dragCounter.current = 0;
    setDragOver(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) void addLocalFiles(files);
  };

  return { isDragOver, onDragEnter, onDragLeave, onDragOver, onDrop };
}
