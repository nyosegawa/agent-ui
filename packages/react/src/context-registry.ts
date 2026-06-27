import { createContext, type Context } from "react";

export function sharedReactContext<T>(key: string, defaultValue: T): Context<T> {
  const symbol = Symbol.for(key);
  const registry = globalThis as typeof globalThis & Record<symbol, unknown>;
  const existing = registry[symbol];
  if (existing) return existing as Context<T>;
  const context = createContext<T>(defaultValue);
  registry[symbol] = context;
  return context;
}
