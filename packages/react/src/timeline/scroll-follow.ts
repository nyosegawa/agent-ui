import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_PENDING_APPROVAL_SELECTOR = ".aui-transcript-approval-anchor";

export interface AgentTranscriptScrollControllerOptions {
  hiddenItemCount?: number;
  onShowEarlierItems?: () => void;
  pendingApprovalSelector?: string;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  scrollKey?: string | number;
  threadId: string;
  turnCount: number;
}

export interface AgentTranscriptScrollController {
  canShowEarlierItems: boolean;
  handleScroll(): void;
  jumpToLatest(): void;
  jumpToPendingApproval(): void;
  scrollContainerRef: React.RefObject<HTMLElement | null>;
  showEarlierItems(): void;
  showJumpLatest: boolean;
  showJumpApproval: boolean;
}

export function useAgentTranscriptScrollController({
  hiddenItemCount = 0,
  onShowEarlierItems,
  pendingApprovalSelector = DEFAULT_PENDING_APPROVAL_SELECTOR,
  scrollContainerRef,
  scrollKey,
  threadId,
  turnCount,
}: AgentTranscriptScrollControllerOptions): AgentTranscriptScrollController {
  const ownedScrollContainerRef = useRef<HTMLElement | null>(null);
  const activeScrollContainerRef = scrollContainerRef ?? ownedScrollContainerRef;
  const activeScrollContainerRefRef =
    useRef<React.RefObject<HTMLElement | null>>(activeScrollContainerRef);
  const followModeRef = useRef(true);
  const previousThreadIdRef = useRef(threadId);
  const rafRef = useRef<number | undefined>(undefined);
  const [showJumpLatest, setShowJumpLatest] = useState(false);
  const [showJumpApproval, setShowJumpApproval] = useState(false);

  useEffect(() => {
    activeScrollContainerRefRef.current = activeScrollContainerRef;
  }, [activeScrollContainerRef]);

  const scrollToLatest = useCallback((behavior: ScrollBehavior = "auto") => {
    const list = activeScrollContainerRefRef.current.current;
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

  const updateJumpApproval = useCallback(() => {
    const list = activeScrollContainerRefRef.current.current;
    const anchor = list?.querySelector<HTMLElement>(pendingApprovalSelector);
    if (!list || !anchor) {
      setShowJumpApproval(false);
      return;
    }
    setShowJumpApproval(!isElementFullyVisibleInScrollContainer(list, anchor));
  }, [pendingApprovalSelector]);

  useEffect(() => {
    if (previousThreadIdRef.current === threadId) return;
    previousThreadIdRef.current = threadId;
    followModeRef.current = true;
    setShowJumpLatest(false);
    setShowJumpApproval(false);
  }, [threadId]);

  useEffect(() => {
    scheduleFollowScroll("auto");
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleFollowScroll, scrollKey, threadId, turnCount]);

  useEffect(() => {
    const list = activeScrollContainerRefRef.current.current;
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

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      updateJumpApproval();
    }, 0);
    return () => globalThis.clearTimeout(timer);
  }, [hiddenItemCount, pendingApprovalSelector, threadId, turnCount, updateJumpApproval]);

  const handleScroll = useCallback(() => {
    const list = activeScrollContainerRefRef.current.current;
    if (!list) return;
    const distanceFromBottom = list.scrollHeight - list.scrollTop - list.clientHeight;
    const shouldFollow = distanceFromBottom <= 80;
    followModeRef.current = shouldFollow;
    if (shouldFollow) setShowJumpLatest(false);
    updateJumpApproval();
  }, [updateJumpApproval]);

  const jumpToLatest = useCallback(() => {
    followModeRef.current = true;
    setShowJumpLatest(false);
    scrollToLatest("smooth");
  }, [scrollToLatest]);

  const jumpToPendingApproval = useCallback(() => {
    const anchor =
      activeScrollContainerRefRef.current.current?.querySelector<HTMLElement>(
        pendingApprovalSelector,
      );
    anchor?.scrollIntoView({ block: "center", behavior: "smooth" });
    setShowJumpApproval(false);
  }, [pendingApprovalSelector]);

  const showEarlierItems = useCallback(() => {
    onShowEarlierItems?.();
  }, [onShowEarlierItems]);

  return {
    canShowEarlierItems: hiddenItemCount > 0,
    handleScroll,
    jumpToLatest,
    jumpToPendingApproval,
    scrollContainerRef: activeScrollContainerRef,
    showEarlierItems,
    showJumpLatest,
    showJumpApproval,
  };
}

function isElementFullyVisibleInScrollContainer(
  container: HTMLElement,
  element: HTMLElement,
): boolean {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  return elementRect.top >= containerRect.top && elementRect.bottom <= containerRect.bottom;
}

export function useTranscriptFollowScroll({
  scrollKey,
  threadId,
  turnCount,
}: {
  scrollKey?: string | number;
  threadId: string;
  turnCount: number;
}) {
  const controller = useAgentTranscriptScrollController({
    scrollKey,
    threadId,
    turnCount,
  });
  return {
    handleScroll: controller.handleScroll,
    jumpToLatest: controller.jumpToLatest,
    listRef: controller.scrollContainerRef,
    showJumpLatest: controller.showJumpLatest,
  };
}
