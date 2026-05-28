import type { ThreadState } from "@nyosegawa/agent-ui-core";
import { useCallback, useMemo, useState } from "react";
import {
  DEFAULT_TRANSCRIPT_ITEM_LIMIT,
  TRANSCRIPT_ITEM_INCREMENT,
  visibleTranscriptWindow,
} from "../transcript-window";

export function useTranscriptWindowing(thread: ThreadState) {
  const [visibleItemState, setVisibleItemState] = useState({
    limit: DEFAULT_TRANSCRIPT_ITEM_LIMIT,
    threadId: thread.thread.id,
  });
  const visibleItemLimit =
    visibleItemState.threadId === thread.thread.id
      ? visibleItemState.limit
      : DEFAULT_TRANSCRIPT_ITEM_LIMIT;
  const visibleTurnItems = useMemo(
    () => visibleTranscriptWindow(thread, visibleItemLimit),
    [thread, visibleItemLimit],
  );
  const hiddenItemCount = Math.max(
    0,
    visibleTurnItems.totalItemCount - visibleTurnItems.visibleItemCount,
  );
  const showEarlierItems = useCallback(() => {
    setVisibleItemState({
      limit: visibleItemLimit + TRANSCRIPT_ITEM_INCREMENT,
      threadId: thread.thread.id,
    });
  }, [thread.thread.id, visibleItemLimit]);

  return {
    hiddenItemCount,
    showEarlierItems,
    visibleTurnItems,
  };
}
