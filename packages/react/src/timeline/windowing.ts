import type { ThreadState } from "@nyosegawa/agent-ui-core/internal";
import { useCallback, useMemo, useState } from "react";
import {
  DEFAULT_TRANSCRIPT_ITEM_LIMIT,
  TRANSCRIPT_ITEM_INCREMENT,
  visibleTranscriptWindow,
} from "../transcript-window";

export function useTranscriptWindowing(
  thread: ThreadState | undefined,
  pinnedItemIdsByTurnId?: Map<string, string[]>,
) {
  const threadId = thread?.thread.id ?? "";
  const [visibleItemState, setVisibleItemState] = useState({
    limit: DEFAULT_TRANSCRIPT_ITEM_LIMIT,
    threadId,
  });
  const visibleItemLimit =
    visibleItemState.threadId === threadId
      ? visibleItemState.limit
      : DEFAULT_TRANSCRIPT_ITEM_LIMIT;
  const visibleTurnItems = useMemo(
    () =>
      thread
        ? visibleTranscriptWindow(thread, visibleItemLimit, { pinnedItemIdsByTurnId })
        : {
            itemIdsByTurnId: new Map<string, string[]>(),
            totalItemCount: 0,
            visibleItemCount: 0,
          },
    [pinnedItemIdsByTurnId, thread, visibleItemLimit],
  );
  const hiddenItemCount = Math.max(
    0,
    visibleTurnItems.totalItemCount - visibleTurnItems.visibleItemCount,
  );
  const showEarlierItems = useCallback(() => {
    setVisibleItemState({
      limit: visibleItemLimit + TRANSCRIPT_ITEM_INCREMENT,
      threadId,
    });
  }, [threadId, visibleItemLimit]);

  return {
    hiddenItemCount,
    showEarlierItems,
    visibleTurnItems,
  };
}
