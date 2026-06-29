# Host Integration

This guide is for host applications that embed Agent UI packages. Agent UI
provides reusable Codex App Server UI components and integration helpers, but it
does not move hosted runtime policy into core.

## Who Should Read This

Use this guide if your host imports Agent UI packages and does any of the
following:

- imports source modules or package `dist/*` files instead of package exports
- renders custom transcript items through raw core item or turn state
- constructs Codex params in React instead of using Codex request builders or
  public controllers
- relies on browser files, blob URLs, or filenames becoming App Server paths
- exposes a bridge endpoint beyond private loopback
- handles server requests as generic approvals

## Package Boundaries

- `@nyosegawa/agent-ui-core`: treat normalized state as reducer state unless a
  selector or documented view model is named public. Do not build host workflow
  policy from reducer reconciliation or optimistic operation maps.
- `@nyosegawa/agent-ui-codex`: use productized stable methods by default. Put
  generated params, request builders, stable types, normalizers, clients, and
  WebSocket transport on their documented subpaths.
- `@nyosegawa/agent-ui-react`: use the root package for `AgentProvider`,
  `AgentChat`, the preset component map, and i18n helpers. Import visual
  building blocks from `@nyosegawa/agent-ui-react/primitives` and controllers,
  hooks, run-policy helpers, and input/resource types from
  `@nyosegawa/agent-ui-react/headless`.
- `@nyosegawa/agent-ui-server`: keep bridge admission, browser method policy,
  one-shot RPC method policy, dynamic-tool policy, local media serving,
  redaction, and host event sinks explicit. Hosts still own auth, persistence,
  process supervision, tenant/workspace isolation, audit storage, billing, and
  deployment policy.
- `@nyosegawa/agent-ui-web-components`: pass the React `components` map through
  element options or properties; the element does not create transports,
  styles, auth, persistence, or Codex processes.

## Import Examples

```ts
import { threadStartParams } from "@nyosegawa/agent-ui-codex/request-builders";
import { AgentChat } from "@nyosegawa/agent-ui-react";
import { AgentThreadView } from "@nyosegawa/agent-ui-react/primitives";
import { useAgentComposerController } from "@nyosegawa/agent-ui-react/headless";
import "@nyosegawa/agent-ui-react/styles.css";
```

## React Examples

```tsx
<AgentChat
  components={{
    Approval: ({ approval, Default }) => (
      <CustomApproval approval={approval} Default={Default} />
    ),
    blocks: {
      commandExecution: ({ block, Default }) => <Default block={block} />,
    },
  }}
/>
```

Use `AgentChat` when the default chat flow should stay intact. Prefer public
preset composition before dropping to primitives:

- add status/header UI with `statusBarEnd`, `threadHeaderEnd`, or the
  `StatusBar` / `ThreadHeader` component replacements
- fix first-thread policy with `startOptions.threadOptions` and first-turn
  policy with `startOptions.turnOptions`
- coordinate host drawers or sheets with `controls.sidebarCollapsed` and
  `controls.contextSheetOpen`
- send from external host UI with `useAgentChatController().sendMessage()`
- resolve local attachments and transcript media with
  `resolveLocalAttachment` and `resolveLocalMediaUrl`

Do not sequence `thread/start` and `turn/start` from host chrome just because
the send button lives outside the composer. The public chat controller routes
that action through the same optimistic state, canonical thread reconciliation,
idle-thread `clientUserMessageId` reconciliation, queueing, blocked-approval
handling, and error handling as `AgentChat`.

Use `useAgentComposerController()`,
`useAgentTranscriptController()`, and
`useAgentTranscriptScrollController()` when the host owns the layout instead
of widening the preset replacement map. Import those controllers from
`@nyosegawa/agent-ui-react/headless`, and import the visual surfaces they drive
from `@nyosegawa/agent-ui-react/primitives`.

Thread lifecycle results are Agent UI view models. The `threadId` returned from
start, first-message start, or resume is the canonical id the host should
persist. `requestedThreadId` may appear on resume results for diagnostics when
the host supplied an alias or stale id. Do not persist reducer alias maps, raw
App Server responses, generated protocol payloads, or optimistic operation ids.

## Server Bridge Examples

Before:

```ts
attachAgentUiWebSocketBridge({ server, path: "/agent-ui/ws" });
```

After:

```ts
attachAgentUiWebSocketBridge({
  server,
  path: "/agent-ui/ws",
  bridgePolicy: {
    admission: {
      mode: "host-callback",
      admit: (request) => isAuthenticatedHostSession(request),
    },
  },
  browserMethodPolicy: { capabilities: ["connection", "account", "models", "turns"] },
});
```

Do not use `createAgentUiNextRpcRoute()` for chat. It is a one-shot HTTP RPC
helper for one allowlisted method per request.

For local desktop or sidecar hosts, resolve per-connection bridge options on
the server before Codex App Server is spawned:

```ts
attachAgentUiWebSocketBridge({
  server,
  path: "/agent-ui/ws",
  resolveBridgeOptions: async ({ request }) => {
    const session = await requireHostSession(request);
    const workspace = await resolveAllowedWorkspace(session);

    return {
      cwd: workspace.cwd,
      env: codexBridgeEnv(session),
      bridgePolicy: { admission: desktopAdmission(session) },
      browserMethodPolicy: {
        capabilities: ["connection", "models", "threadLifecycle", "turns"],
      },
      dynamicToolPolicy: { mode: "disabled" },
      serverRequestPolicy: hostServerRequestPolicy(session),
    };
  },
});
```

Keep workspace/session decisions server-owned, and pass Agent UI only validated
bridge options. Static bridge options on the route remain defaults; resolver
output overrides them for the connection.

Bind local desktop bridges to loopback by default. Treat `Origin` as a signal,
not authentication. Use a sidecar/session token or host callback when needed,
decide explicitly how no-Origin requests are handled, and validate workspaces
server-side before assigning `cwd`. Do not recommend
`browserMethodPolicy: "all"` or `unsafe-no-admission` as convenience defaults.

## Local Media Helper

Before:

```tsx
resolveLocalAttachment={async (file) => ({
  input: { type: "localImage", path: file.name },
})}
```

After:

```tsx
const localMediaUrlsByPath = new Map<string, string>();

resolveLocalAttachment={async (file, kind) => {
  const asset = await uploadToHostLocalMedia(file);
  const previewUrl = asset.previewUrl ?? asset.url;
  if (typeof asset.path === "string" && typeof previewUrl === "string") {
    localMediaUrlsByPath.set(asset.path, previewUrl);
  }
  return {
    ...asset,
    input:
      kind === "image"
        ? localImageInput(asset.path)
        : textInput(`Attached file: ${asset.path}`),
  };
}}
resolveLocalMediaUrl={(path) => {
  const previewUrl = localMediaUrlsByPath.get(path);
  return previewUrl ? { kind: "url", previewUrl } : null;
}}
```

The host owns upload authorization, static serving, persistence, cleanup, and
tenant/workspace scoping. Agent UI owns browser metadata and explicit Codex
input plumbing.

## First Message Optimistic State

Do not call source-level first-message helpers from host code. Start empty
threads through `useAgentThreadController().startThread()` or submit the first
message through `useAgentComposerController()`. The public composer controller
owns provider-scoped pending first-message retry/cancel state without exposing
operation maps. Failed pending messages include a `retryable` flag so remounted
state can remain dismissible without offering a broken Retry action.
When using headless hooks, call
`useAgentComposerController().startThreadWithInput(input, { threadOptions,
turnOptions })` for the first user message so it appears immediately,
`thread/start` can receive host-owned thread options, and `turn/start` uses the
canonical thread id after `thread/start` reconciliation. Agent UI merges
`turnOptions` after execution-mode defaults and returns raw-free
`{ threadId, operationId, turnId, optimisticTurnId, userMessageId }` metadata.
Use `turnId` for host records that need the App Server turn id; the
`optimisticTurnId` is only the transient UI turn id used before live turn
notifications reconcile the first user message.

## Drawer And Overlay Layers

`AgentChat` owns its mobile thread-history drawer behavior: backdrop click,
Escape, and thread selection close the drawer; focus returns to the `Threads`
trigger; background chat controls are inert or equivalently non-interactive
while the drawer is open; drawer search and selection stay reachable. Hosts
can mirror preset drawer and context-sheet state through `AgentChat.controls`
when their own overlay manager needs a single open surface. Agent UI suppresses
simultaneous preset drawer/sheet rendering so the context sheet is never focused
inside an inert drawer-hidden subtree. Hosts should place their own sheets and
modals relative to the public layer tokens
`--aui-z-backdrop`, `--aui-z-drawer`, `--aui-z-popover`, `--aui-z-sheet`,
`--aui-z-dialog`, and `--aui-z-toast` instead of styling private `.aui-*`
selectors. The preset keeps scroll containment inside the drawer and does not
impose host document/body scroll-lock policy.

## Migration Notes

- Replace removed `AgentChatSlots` usage with `AgentChat.components`.
- Replace raw `components.Item` transcript customization with `renderItem` or
  `components.blocks`.
- Replace host-side `transport.request("thread/start")` followed by
  `transport.request("turn/start")` with `useAgentChatController().sendMessage()`
  for preset-hosted chat, or
  `useAgentComposerController().startThreadWithInput()` for headless layouts.
- Replace private `.aui-*` selector dependencies for status/header additions
  with `statusBarEnd`, `threadHeaderEnd`, `StatusBar`, and `ThreadHeader`.
- Replace direct local file paths in media `src` with structured
  `resolveLocalAttachment` and `resolveLocalMediaUrl` resolvers.

## Host-Gated Workflows

Compose product workflow gates around Agent UI controllers and primitives.
The host owns routing, persistence, auth, workspace selection, and workflow
state machines. Agent UI owns reusable transcript, composer, thread lifecycle,
server-request, history, and overlay behavior. Add recipes or examples for
workflow composition instead of adding workflow-specific core APIs.

Use `examples/recipes/src/host-gated-workflow.tsx` as the typed starting point
for plan/update-driven gates. It composes `AgentThreadTimeline`, a host-owned
approval bar, and a delayed composer, then submits the first approved turn with
`startThreadWithInput(input, { threadOptions, turnOptions })`. Keep the gate
state, plan persistence, routing, and audit trail in the host.

## Validation Checklist

- Run docs validation for host integration docs:
  `bunx vitest run test/docs-staleness.test.ts`.
- For package/export changes, run `bun run validate:packages`,
  `bun run test:api-snapshots`, and `bun run test:package-resolution`.
- For protocol normalizer or lifecycle changes, run `bun run test:protocol`.
- For React controller or component changes, run focused React tests and the
  relevant Playwright fixture or real-local spec.
- For browser-visible example changes, run the example typecheck/build gate and
  the relevant Playwright route.
- For drawer, overlay, resume, local media, or bridge admission changes, include
  interaction checks that prove hit testing, focus return, canonical id
  persistence, structured media resolution, and no-spawn admission rejection.

## Non-Promises And Host-Owned Boundaries

Agent UI does not provide hosted Codex access, authentication, tenant
isolation, persistence, audit storage, billing, deployment policy, or a generic
workflow runtime. Experimental App Server methods, unsupported generated
methods, raw protocol escape hatches, command/filesystem access, dynamic tool
execution, upload/static authorization, and remote deployment remain
host-owned unless a later design gate explicitly promotes a narrow public
contract.
