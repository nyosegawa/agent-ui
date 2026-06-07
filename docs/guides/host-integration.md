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
- `@nyosegawa/agent-ui-react`: use public controllers, primitives, and the
  `components` replacement map. Prefer `components.blocks` or transcript
  controllers for raw-free rendering.
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

Use `useAgentComposerController()`,
`useAgentTranscriptController()`, and
`useAgentTranscriptScrollController()` when the host owns the layout instead
of widening the preset replacement map.

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
      browserMethodPolicy: { capabilities: ["connection", "models", "threadLifecycle", "turns"] },
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
owns pending first-message retry/cancel state without exposing operation maps.
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
should place their own sheets and modals relative to the public layer tokens
`--aui-z-backdrop`, `--aui-z-drawer`, `--aui-z-popover`, `--aui-z-sheet`,
`--aui-z-dialog`, and `--aui-z-toast` instead of styling private `.aui-*`
selectors. The preset keeps scroll containment inside the drawer and does not
impose host document/body scroll-lock policy.

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
