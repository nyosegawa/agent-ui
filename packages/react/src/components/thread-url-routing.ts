import { useEffect, useRef } from "react";
import {
  useAgentDirectThreadController,
  useAgentThreads,
} from "../hooks";
import { useAgentContext } from "../provider";

export interface AgentThreadUrlRoutingOptions {
  basePath?: string;
  homePath?: string;
}

export type AgentThreadUrlRoutingConfig = boolean | AgentThreadUrlRoutingOptions | undefined;

export function useThreadUrlRouting(
  options: AgentThreadUrlRoutingConfig,
  activeThreadId?: string,
): void {
  const { state } = useAgentContext();
  const { openThread, previewThread } = useAgentDirectThreadController();
  const { setActiveThread, threads } = useAgentThreads();
  const lastPathRef = useRef<string | undefined>(undefined);
  const initialUrlThreadReadRef = useRef<string | undefined>(undefined);
  const suppressNextActivePushRef = useRef(false);
  const enabled = Boolean(options);
  const basePath = threadUrlRoutingBasePath(options);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (state.connection.status !== "connected") return;
    const initialThreadId = threadIdFromPath(window.location.pathname, basePath);
    if (!initialThreadId || initialUrlThreadReadRef.current === initialThreadId) return;
    initialUrlThreadReadRef.current = initialThreadId;
    const openInitialThread = async () => {
      await openThread(initialThreadId);
    };
    void openInitialThread().catch(() => {
      if (initialUrlThreadReadRef.current === initialThreadId) {
        initialUrlThreadReadRef.current = undefined;
      }
    });
  }, [basePath, enabled, openThread, state.connection.status]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !activeThreadId) return;
    if (suppressNextActivePushRef.current) {
      suppressNextActivePushRef.current = false;
      return;
    }
    if (state.threads[activeThreadId]?.thread.metadata?.optimistic === true) return;
    const path = threadPath(activeThreadId, basePath);
    if (window.location.pathname === path || lastPathRef.current === path) return;
    lastPathRef.current = path;
    window.history.pushState({ agentUiThreadId: activeThreadId }, "", path);
  }, [activeThreadId, basePath, enabled, state.threads]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const onPopState = () => {
      suppressNextActivePushRef.current = true;
      const threadId = threadIdFromPath(window.location.pathname, basePath);
      lastPathRef.current = threadId
        ? threadPath(threadId, basePath)
        : window.location.pathname;
      if (!threadId) {
        setActiveThread(undefined);
        return;
      }
      const existingThread = threads.find((thread) => thread.thread.id === threadId);
      if (existingThread && !isPreviewUrlThread(existingThread.status)) {
        setActiveThread(threadId);
        return;
      }
      const preview = previewThread(threadId);
      void preview.catch(() => {
        if (existingThread) setActiveThread(threadId);
        else setActiveThread(undefined);
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [basePath, enabled, previewThread, setActiveThread, threads]);
}

export function threadPath(threadId: string, basePath: string): string {
  const prefix = trimTrailingSlash(basePath);
  return `${prefix}/${encodeURIComponent(threadId)}`;
}

export function threadUrlRoutingBasePath(options: AgentThreadUrlRoutingConfig): string {
  return typeof options === "object" && options.basePath ? options.basePath : "/threads";
}

export function threadUrlRoutingHomePath(options: AgentThreadUrlRoutingConfig): string {
  return typeof options === "object" && options.homePath ? options.homePath : "/";
}

export function threadIdFromPath(
  pathname: string,
  basePath: string,
): string | undefined {
  const prefix = trimTrailingSlash(basePath);
  if (!pathname.startsWith(`${prefix}/`)) return undefined;
  const encoded = pathname.slice(prefix.length + 1).split("/")[0];
  return encoded ? decodeURIComponent(encoded) : undefined;
}

function trimTrailingSlash(path: string): string {
  return path.endsWith("/") ? path.slice(0, -1) : path;
}

function isPreviewUrlThread(status?: string): boolean {
  return status === "notLoaded" || status === "loaded";
}
