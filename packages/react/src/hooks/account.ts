import { selectAccountRateLimits } from "@nyosegawa/agent-ui-core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAgentContext } from "../provider";
import { useCodexSession } from "./codex-session";
import { useAgentModels } from "./connectors";

export function useAgentAccount() {
  const { dispatch, state } = useAgentContext();
  const codex = useCodexSession();
  const readAccount = useCallback(async () => {
    const response = await codex.account.read(false);
    const responseRecord = asRecord(response);
    const account =
      responseRecord && Object.prototype.hasOwnProperty.call(responseRecord, "account")
        ? responseRecord.account
        : responseRecord && Object.keys(responseRecord).length > 0
          ? response
          : null;
    dispatch({
      account,
      status: account == null ? "unauthenticated" : "authenticated",
      type: "account/updated",
    });
    return response;
  }, [codex, dispatch]);
  const login = useCallback(async () => {
    const raw = await codex.account.loginDeviceCode();
    const record = asRecord(raw) ?? {};
    const loginState = {
      loginId: stringValue(record.loginId) ?? stringValue(record.login_id),
      userCode: stringValue(record.userCode) ?? stringValue(record.user_code),
      verificationUrl:
        stringValue(record.verificationUrl) ?? stringValue(record.verification_url),
    };
    dispatch({
      loginId: loginState.loginId,
      type: "account/login/deviceCodeStarted",
      userCode: loginState.userCode,
      verificationUrl: loginState.verificationUrl,
    });
    return loginState;
  }, [codex, dispatch]);
  const cancelLogin = useCallback(async () => {
    const loginId = state.account.login?.loginId;
    if (!loginId) return;
    await codex.account.cancelLogin(loginId);
    dispatch({ account: null, status: "unauthenticated", type: "account/updated" });
  }, [codex, dispatch, state.account.login?.loginId]);
  const logout = useCallback(async () => {
    const response = await codex.account.logout();
    dispatch({ account: null, status: "unauthenticated", type: "account/updated" });
    return response;
  }, [codex, dispatch]);
  return { account: state.account, cancelLogin, login, logout, readAccount };
}

export interface AgentBootstrapState {
  errors: Error[];
  isBootstrapping: boolean;
  status: "idle" | "loading" | "ready" | "error";
}

export function useAgentBootstrap(): AgentBootstrapState {
  const { state } = useAgentContext();
  const { readAccount } = useAgentAccount();
  const { refreshUsage } = useAgentUsage();
  const { refreshModels } = useAgentModels();
  const accountRateLimits = selectAccountRateLimits(state);
  const didBootstrap = useRef(false);
  const didAuthenticatedSync = useRef(false);
  const [bootstrap, setBootstrap] = useState<AgentBootstrapState>({
    errors: [],
    isBootstrapping: false,
    status: "idle",
  });

  useEffect(() => {
    if (state.connection.status !== "connected" || didBootstrap.current) return;
    didBootstrap.current = true;
    setBootstrap({ errors: [], isBootstrapping: true, status: "loading" });
    void (async () => {
      const errors: Error[] = [];
      let accountResponse: unknown;
      if (state.account.status === "unknown") {
        try {
          accountResponse = await readAccount();
        } catch (caught) {
          errors.push(caught instanceof Error ? caught : new Error(String(caught)));
        }
      }
      const isAuthenticated =
        state.account.status === "authenticated" ||
        accountResponseHasAccount(accountResponse);
      const tasks = [
        state.models.models.length === 0 ? refreshModels() : Promise.resolve(),
        isAuthenticated && accountRateLimits == null
          ? refreshUsage()
          : Promise.resolve(),
      ];
      const results = await Promise.allSettled(tasks);
      errors.push(
        ...results
          .filter(
            (result): result is PromiseRejectedResult => result.status === "rejected",
          )
          .map((result) =>
            result.reason instanceof Error
              ? result.reason
              : new Error(String(result.reason)),
          ),
      );
      setBootstrap({
        errors,
        isBootstrapping: false,
        status: errors.length > 0 ? "error" : "ready",
      });
      if (isAuthenticated && errors.length === 0) didAuthenticatedSync.current = true;
    })();
  }, [
    readAccount,
    refreshModels,
    refreshUsage,
    accountRateLimits,
    state.account.status,
    state.connection.status,
    state.models.models.length,
  ]);

  useEffect(() => {
    if (
      state.connection.status !== "connected" ||
      state.account.status !== "authenticated" ||
      didAuthenticatedSync.current
    ) {
      return;
    }
    didAuthenticatedSync.current = true;
    setBootstrap({ errors: [], isBootstrapping: true, status: "loading" });
    void (async () => {
      const errors: Error[] = [];
      const tasks = [
        state.account.account == null ? readAccount() : Promise.resolve(),
        state.models.models.length === 0 ? refreshModels() : Promise.resolve(),
        accountRateLimits == null ? refreshUsage() : Promise.resolve(),
      ];
      const results = await Promise.allSettled(tasks);
      errors.push(
        ...results
          .filter(
            (result): result is PromiseRejectedResult => result.status === "rejected",
          )
          .map((result) =>
            result.reason instanceof Error
              ? result.reason
              : new Error(String(result.reason)),
          ),
      );
      setBootstrap({
        errors,
        isBootstrapping: false,
        status: errors.length > 0 ? "error" : "ready",
      });
    })();
  }, [
    readAccount,
    refreshModels,
    refreshUsage,
    state.account.account,
    accountRateLimits,
    state.account.status,
    state.connection.status,
    state.models.models.length,
  ]);

  return bootstrap;
}

export function useAgentUsage() {
  const { dispatch, state } = useAgentContext();
  const codex = useCodexSession();
  const rateLimits = selectAccountRateLimits(state);
  const refreshUsage = useCallback(async () => {
    const response = await codex.account.rateLimitsRead();
    dispatch({ rateLimits: response, type: "account/rateLimits/updated" });
    return response;
  }, [codex, dispatch]);
  return { rateLimits, refreshUsage };
}

function accountResponseHasAccount(response: unknown): boolean {
  const record = asRecord(response);
  if (!record) return false;
  if (Object.prototype.hasOwnProperty.call(record, "account")) {
    return record.account != null;
  }
  return Object.keys(record).length > 0;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
