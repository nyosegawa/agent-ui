# Host Integration

This guide is for host applications that embed Agent UI packages. Agent UI
provides reusable Codex App Server UI components and integration helpers, but it
does not move hosted runtime policy into core.

## Who Should Read This

Use this guide if your host imports Agent UI packages and does any of the
following:

- imports source modules or package `dist/*` files instead of package exports
- depends on the old `AgentChat` slot shape
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

Before:

```ts
import { threadStartParams } from "@nyosegawa/agent-ui-react";
```

The old stylesheet path was the package's internal `dist/styles/tokens.css`
chunk.

After:

```ts
import { threadStartParams } from "@nyosegawa/agent-ui-codex/request-builders";
import { AgentChat } from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/styles.css";
```

## React Examples

Before:

```tsx
<AgentChat slots={{ approval: ApprovalSlot }} />
```

After:

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

## Local Media Helper

Before:

```tsx
resolveLocalAttachment={async (file) => ({
  input: { type: "localImage", path: file.name },
})}
```

After:

```tsx
resolveLocalAttachment={async (file, kind) => {
  const asset = await uploadToHostLocalMedia(file);
  return {
    ...asset,
    input:
      kind === "image"
        ? localImageInput(asset.path)
        : textInput(`Attached file: ${asset.path}`),
  };
}}
resolveLocalMediaUrl={(path) => browserUrlForLocalMediaPath(path)}
```

The host owns upload authorization, static serving, persistence, cleanup, and
tenant/workspace scoping. Agent UI owns browser metadata and explicit Codex
input plumbing.

## First Message Optimistic State

Do not call source-level first-message helpers from host code. Start empty
threads through `useAgentThreadController().startThread()` or submit the first
message through `useAgentComposerController()`. The public composer controller
owns pending first-message retry/cancel state without exposing operation maps.

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

## Non-Promises And Host-Owned Boundaries

Agent UI does not provide hosted Codex access, authentication, tenant
isolation, persistence, audit storage, billing, deployment policy, or a generic
workflow runtime. Experimental App Server methods, unsupported generated
methods, raw protocol escape hatches, command/filesystem access, dynamic tool
execution, upload/static authorization, and remote deployment remain
host-owned unless a later design gate explicitly promotes a narrow public
contract.
