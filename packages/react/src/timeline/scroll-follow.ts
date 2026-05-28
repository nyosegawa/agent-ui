import { useCallback, useEffect, useRef, useState } from "react";

export function useTranscriptFollowScroll({
  scrollKey,
  threadId,
  turnCount,
}: {
  scrollKey?: string | number;
  threadId: string;
  turnCount: number;
}) {
  const listRef = useRef<HTMLOListElement | null>(null);
  const followModeRef = useRef(true);
  const rafRef = useRef<number | undefined>(undefined);
  const [showJumpLatest, setShowJumpLatest] = useState(false);

  const scrollToLatest = useCallback((behavior: ScrollBehavior = "auto") => {
    const list = listRef.current;
    if (!list) return false;
    if (typeof list.scrollTo === "function") {
      list.scrollTo({ behavior, top: list.scrollHeight });
    } else {
      list.scrollTop = list.scrollHeight;
    }
    // Metadata-free approvals live at the transcript tail. When one is taller
    // than the viewport, scrolling to the very bottom would clip the primary
    // decision footer above the fold; pull back just enough so the actions
    // stay visible without a manual scroll.
    const actions = list.querySelector<HTMLElement>(
      ".aui-transcript-tail .aui-approval-actions",
    );
    if (actions) {
      const clippedAbove =
        list.getBoundingClientRect().top - actions.getBoundingClientRect().top;
      if (clippedAbove > 0) list.scrollTop -= clippedAbove + 12;
    }
    return true;
  }, []);

  const scheduleFollowScroll = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (!followModeRef.current) {
      setShowJumpLatest(true);
      return;
    }
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = undefined;
      scrollToLatest(behavior);
      setShowJumpLatest(false);
    });
  }, [scrollToLatest]);

  useEffect(() => {
    scheduleFollowScroll("auto");
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleFollowScroll, threadId, turnCount, scrollKey]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new MutationObserver(() => scheduleFollowScroll("smooth"));
    observer.observe(list, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [scheduleFollowScroll, threadId]);

  const handleScroll = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const distanceFromBottom = list.scrollHeight - list.scrollTop - list.clientHeight;
    const shouldFollow = distanceFromBottom <= 80;
    followModeRef.current = shouldFollow;
    if (shouldFollow) setShowJumpLatest(false);
  }, []);

  const jumpToLatest = useCallback(() => {
    followModeRef.current = true;
    setShowJumpLatest(false);
    scrollToLatest("smooth");
  }, [scrollToLatest]);

  return {
    handleScroll,
    jumpToLatest,
    listRef,
    showJumpLatest,
  };
}
