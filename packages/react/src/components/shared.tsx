import { useEffect, useRef, useState } from "react";

export function compactPath(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length <= 2) return path;
  return `.../${parts.slice(-2).join("/")}`;
}


export function useCompactLayout(): boolean {
  return useMediaQuery("(max-width: 640px)");
}


export function useElementCompactLayout<T extends HTMLElement>(
  threshold = 520,
  fallback = false,
) {
  const ref = useRef<T | null>(null);
  const [compact, setCompact] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") {
      setCompact(fallback);
      return;
    }
    const update = (width: number) => setCompact(width <= threshold);
    update(element.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      update(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [fallback, threshold]);

  return [ref, compact] as const;
}


export function useContextSheetLayout(): boolean {
  return useMediaQuery("(max-width: 980px)");
}


function useMediaQuery(queryText: string): boolean {
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia(queryText).matches;
  });
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const query = window.matchMedia(queryText);
    const update = () => setIsCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [queryText]);
  return isCompact;
}


export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}


export function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}


export function deferAction(action: () => void | Promise<unknown>) {
  setTimeout(() => {
    void action();
  }, 0);
}
