import type { AgentApp, AgentEvent } from "@nyosegawa/agent-ui-core";
import { booleanValue, asRecord, optionalStringValue, stringValue } from "./shared";

export function normalizeAppsNotification(
  method: string,
  params: Record<string, unknown>,
): AgentEvent[] | undefined {
  switch (method) {
    case "app/list/updated":
      return [
        {
          type: "apps/updated",
          apps: normalizeApps(params.data ?? params.apps ?? []),
          nextCursor: optionalStringValue(params.nextCursor ?? params.next_cursor) ?? null,
          threadId: optionalStringValue(params.threadId ?? params.thread_id),
        },
      ];
    default:
      return undefined;
  }
}

export function normalizeApps(raw: unknown): AgentApp[] {
  const apps = Array.isArray(raw) ? raw : [];
  return apps.flatMap((app) => {
    const record = asRecord(app);
    if (!record) return [];
    const logoUrl = stringValue(record.logoUrl ?? record.logo_url);
    const logoUrlDark = stringValue(record.logoUrlDark ?? record.logo_url_dark);
    const appMetadata = record.appMetadata ?? record.app_metadata;
    return [
      {
        accessible: booleanValue(record.accessible ?? record.isAccessible),
        branding: record.branding,
        description: stringValue(record.description),
        distributionChannel: stringValue(
          record.distributionChannel ?? record.distribution_channel,
        ),
        enabled: booleanValue(record.enabled ?? record.isEnabled),
        id: String(record.id ?? record.uri ?? record.name),
        installUrl: stringValue(record.installUrl ?? record.install_url),
        appMetadata,
        labels: record.labels,
        logoUrl,
        logoUrlDark,
        logos: record.logos ?? normalizedLogos(logoUrl, logoUrlDark),
        metadata: appMetadata ?? record.metadata,
        name: stringValue(record.name),
        pluginDisplayNames: record.pluginDisplayNames ?? record.plugin_display_names,
        raw: app,
        uri: stringValue(record.uri) ?? stringValue(record.installUrl ?? record.install_url),
      },
    ];
  });
}

function normalizedLogos(
  light: string | undefined,
  dark: string | undefined,
): { dark?: string; light?: string } | undefined {
  if (!light && !dark) return undefined;
  return {
    ...(light ? { light } : {}),
    ...(dark ? { dark } : {}),
  };
}

export function normalizeAppsListResponse(response: unknown): {
  apps: AgentApp[];
  nextCursor: string | null;
} {
  const record = asRecord(response);
  return {
    apps: normalizeApps(record?.data ?? record?.apps ?? response),
    nextCursor: optionalStringValue(record?.nextCursor ?? record?.next_cursor) ?? null,
  };
}
