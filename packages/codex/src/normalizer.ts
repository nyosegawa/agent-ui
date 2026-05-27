import type { AgentEvent } from "@nyosegawa/agent-ui-core";
import { normalizeAccountNotification } from "./normalizers/account";
import { normalizeAppsNotification } from "./normalizers/apps";
import { normalizeItemNotification } from "./normalizers/items";
import {
  isServerRequestMethod,
  normalizeServerRequestCreated,
  normalizeServerRequestNotification,
} from "./normalizers/server-requests";
import type { MethodMessage } from "./normalizers/shared";
import { asRecord, stringValue } from "./normalizers/shared";
import { normalizeStatusNotification } from "./normalizers/status";
import { normalizeThreadNotification } from "./normalizers/threads";
import { normalizeTurnNotification } from "./normalizers/turns";
import { stableNotificationMethods } from "./protocol";

export { normalizeApps, normalizeAppsListResponse } from "./normalizers/apps";
export { normalizeModelListResponse } from "./normalizers/models";
export { normalizeThreadReadResponse } from "./normalizers/threads";

const notificationNormalizers = [
  normalizeAccountNotification,
  normalizeThreadNotification,
  normalizeTurnNotification,
  normalizeItemNotification,
  normalizeServerRequestNotification,
  normalizeAppsNotification,
  normalizeStatusNotification,
];

export function normalizeCodexServerMessage(message: MethodMessage): AgentEvent[] {
  if ("id" in message && message.id != null && isServerRequestMethod(message.method)) {
    return [normalizeServerRequestCreated(message)];
  }

  const params = asRecord(message.params) ?? {};
  for (const normalize of notificationNormalizers) {
    const events = normalize(message.method, params);
    if (events) return events;
  }

  if (isStableNotificationMethod(message.method)) {
    return [
      {
        type: "notification/received",
        notification: {
          id: `codex-notification:${message.method}:${stringValue(params.threadId ?? params.thread_id) ?? ""}:${stringValue(params.turnId ?? params.turn_id) ?? ""}:${stringValue(params.itemId ?? params.item_id) ?? ""}`,
          method: message.method,
          params: message.params,
        },
      },
    ];
  }

  return [
    {
      type: "warning/added",
      warning: {
        id: `unsupported-codex-notification:${message.method}`,
        message: `Unsupported Codex notification: ${message.method}`,
      },
    },
  ];
}

function isStableNotificationMethod(
  method: string,
): method is (typeof stableNotificationMethods)[number] {
  return (stableNotificationMethods as readonly string[]).includes(method);
}
