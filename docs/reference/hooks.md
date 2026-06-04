# Hooks

Headless hooks are the stable customization surface for hosts that need custom
layout, product chrome, fixed thread views, or host-owned panels. Hooks return
normalized Agent UI state and stable actions. React exposes Agent UI option
types for hook inputs; generated Codex App Server params and request builders
stay inside the Codex package boundary.

vNext treats the exported hooks below as the public controller layer when their
return values are raw-free view models and stable host actions. Controllers that
still expose reducer reconciliation, optimistic operation maps, queued
attachment restore internals, collection request sequencing, or raw generated
protocol payloads stay source-level until examples, tests, docs, API snapshots,
and package-resolution gates prove the boundary. `AgentThreadScope` and other
view-state keys are Agent UI UI metadata only; hosts still own tenant,
workspace, project, authorization, persistence, and routing policy.

## Thread Controllers

```tsx
const thread = useAgentThreadController(threadId);
const turns = useAgentTurnController(threadId);
```

`useAgentThreadController()` is the preferred name for `useAgentThread()`. It can
follow the active thread or lock to a supplied `threadId`. Use `startThread()`
for a new Codex thread and `resumeThread(threadId)` only when the host explicitly
wants to rejoin a stored session. `resumeThread()` dispatches the normalized
App Server `thread/resume` response in order: the active thread id comes from
the returned canonical `thread.id`, and upstream active/running status is not
overwritten to ready. When the requested id differs from the returned canonical
id, Agent UI reconciles the requested id into the canonical id so active-thread
state, scoped collections, pending operations, and server requests stay
consistent. Its React options stay stable-only; experimental resume fields such
as `excludeTurns`, `initialTurnsPage`, path/history resume, and cursor ownership
remain host-managed raw protocol usage.

`useAgentTurnController()` is the preferred name for `useAgentTurn()`. It sends
`turn/start` with normalized run settings, `turn/steer` for continuing an active
turn, and `turn/interrupt` for the visible stop action.

`turn/steer` is the Codex App Server same-turn continuation path. It requires
an active regular turn and the matching `expectedTurnId`; review and manual
compact turns reject steering. Hosts that want generic "queue this after the
current turn finishes" behaviour must own that queue themselves because App
Server does not provide it. Agent UI's default follow-up queue is exactly that:
UI-local state, not an App Server queue API.

## Thread Collection And History

```tsx
const { threads, activeThreadId, setActiveThread } = useAgentThreads();
const history = useAgentThreadHistory();
const reader = useAgentThreadReader();
```

`useAgentThreads()` returns normalized thread state in `selectOrderedThreads()`
order: the active thread first, then the default lifecycle collection newest
first, with uncollected in-memory thread entities appended last as a fallback.

`useAgentThreadHistory().listThreads()` calls `thread/list`, supports search and
pagination cursor inputs, tracks the latest cursor, and upserts returned thread
metadata without forcing activation.

`useAgentThreadListController(scope, options)` is the public scoped history
controller used by the default sidebar and host-owned thread-list recipes. Its
`AgentThreadScope` is Agent UI view-state metadata, not a host workspace,
tenant, project, or authorization model. `scope.key` lets a host keep
independent visible lists; Agent UI stores the key, search term, cwd, archive
flag, cursor, ids, loading state, and sync timestamp for that list, while the
host still owns what those dimensions mean in its product. `onHistorySynced`
reports normalized sync metadata such as scope, thread ids, cursor, append
mode, search term, and timestamp; it does not expose raw App Server
`thread/list` payloads or ask Agent UI to persist history.

`useAgentThreadReader().readThread(threadId, { includeTurns: true })` calls
`thread/read` and hydrates persisted turns/items before activation. This is the
preferred preview path for stored sessions. Stored turn outcomes remain visible
on the hydrated turns, but they do not replace the thread-level preview status;
for example, a stored session whose last turn was interrupted still hydrates as
a resumable preview instead of an interrupted live thread. Passing
`activate: false` keeps the current active thread while still updating the
requested thread's normalized snapshot state; the hook uses the Codex
`normalizeThreadReadResponse()` boundary for item aliases, command output, file
patches, and text extraction.

The default `AgentChat` history sidebar uses `thread/read` so browsing a stored
transcript from the list does not imply `thread/resume`. A direct
`threadUrlRouting` URL such as `/threads/<id>` first hydrates with
`thread/read includeTurns: true`, then resumes that thread because direct links
represent opening the live conversation. If App Server returns a different
canonical thread id from `thread/resume`, that returned id becomes active. The
root route stays a no-thread start state.

## Composer And Run Settings

```tsx
const composer = useAgentComposerController(threadId);
const run = useAgentRunSettings();
```

`useAgentComposerController()` owns input text and submits turns through the
turn controller. `useAgentComposer()` remains a public alias for the same
raw-free controller view. The public view exposes `value`, `setValue`,
`canSubmit`, `submitMode`, `disabledReason`, `isSubmitting`, `isInterrupting`,
`activeTurnId`, queued follow-ups, failed first-message pending messages, and
retry/cancel actions for those failed pending messages. It does not expose the
internal operation map or raw generated protocol payloads. Idle threads submit
`turn/start`. Running threads keep the textarea editable: Enter adds to
`queuedFollowUps`, Cmd/Ctrl+Enter calls `turn/steer` immediately, and
`sendQueuedFollowUp(id)` calls `turn/steer` for that item with its stored
`expectedTurnId`. Cmd/Ctrl+Enter on an idle or complete thread still submits
through `turn/start`. Queued items are scoped by thread, retain structured
attachment metadata for Edit, and remain queued with an item error if the active
turn no longer matches their stored `expectedTurnId`. `Stop` calls only
`turn/interrupt` and does not clear unsent queued follow-ups. The hook keeps
queue state separate from App Server pending input with `queuedFollowUps`,
`sendingFollowUpIds`, `followUpErrors`, and `activeTurnId`. Attachment-local
draft state and host-disabled states are composed by the visual composer layer;
`canSubmit` reflects the controller's text/running state before those external
constraints are applied. The default `AgentComposerPanel` still blocks
submission for approval-waiting threads and stored read-only previews.
The source-level first-message start helper is not public package API; hosts
start empty threads with `useAgentThreadController().startThread()` or submit
through the public composer controller.

`useAgentRunSettings()` exposes execution modes, available models, supported
efforts, cwd, current selections, and setters. Execution modes map to React-owned
`TurnStartOptions`; the hook layer converts those options to Codex params before
calling App Server.

## Server Requests And Approvals

```tsx
const { requests, respond, reject } = useAgentServerRequests(threadId);
const { approvals, approve } = useAgentApprovals(threadId);
```

## Transcript Controller

```tsx
const transcript = useAgentTranscriptController(threadId, {
  density: {
    default: "compact",
    byBlockKind: { commandExecution: "verbose" },
  },
});

const scroll = useAgentTranscriptScrollController({
  hiddenItemCount: transcript.hiddenItemCount,
  onShowEarlierItems: transcript.showEarlierItems,
  scrollContainerRef,
  threadId,
  turnCount,
});
```

`useAgentTranscriptController()` returns raw-free transcript entry view models,
windowing state, and the `showEarlierItems()` action. `density` may be
`"default"`, `"compact"`, `"verbose"`, `"critical-only"`, or an object with a
default density plus `byBlockKind` overrides. The resolved entry density is
presentation metadata for host renderers and the default list. `critical-only`
filters noncritical entries; entries with failed or in-progress status, or an
anchored pending approval, stay visible. Density is not persisted and does not
change Codex App Server lifecycle state.

`useAgentTranscriptScrollController()` owns transcript viewport behavior for
headless transcript compositions. It accepts either an Agent UI-owned scroll ref
or a host-owned `scrollContainerRef`, exposes `jumpToLatest()`,
`jumpToPendingApproval()`, and `showEarlierItems()`, and returns booleans for
the default jump/show-earlier affordances. The hook manages only browser scroll
state; hosts remain responsible for layout, persistence of transcript
preferences, routing, and any virtualizer they choose to compose around it.

`useAgentServerRequests()` returns the queued normalized server requests for the
active or supplied thread, including host integration requests such as
permissions, MCP elicitation, user input, auth refresh, and attestation. Dynamic
tool calls are not retained in the default queue; bridge or host integrations
must handle them out of band so stale tool calls do not linger in UI state. The
hook exposes neutral `respond(requestId, result)` and
`reject(requestId, errorOrMessage)` actions so hosts can send method-specific
payloads instead of approval-shaped decisions.

`useAgentApprovals()` is approval-only: it returns only `commandApproval`,
`fileChangeApproval`, `legacyExecApproval`, and `legacyPatchApproval` requests
with stable `approve()` and `reject()` actions for decision flows.

Migration note: broad server-request handling should use
`useAgentServerRequests().respond()` / `.reject()`. The broad hook no longer
returns `approvals` or an `approve()` alias, so non-approval requests cannot
accidentally receive generic `{ decision }` responses.

## Auth, Models, And Usage

```tsx
const bootstrap = useAgentBootstrap();
const account = useAgentAccount();
const diagnostics = useAgentDiagnostics();
const models = useAgentModels();
const usage = useAgentUsage();
```

`useAgentBootstrap()` performs local startup reads after the transport connects:
`account/read`, `model/list`, and authenticated `account/rateLimits/read`.

`useAgentAccount()` starts and cancels ChatGPT device-code login while storing only
normalized account/login state.

`useAgentDiagnostics()` exposes normalized diagnostic banners, warnings, errors,
protocol notifications, and audience-filtered views. `userDiagnostics` is the
default visible UI surface. `developerDiagnostics` and `auditDiagnostics` carry
redacted stderr, raw protocol notifications, bridge/debug phases, and other
host-owned support or audit signals. Agent UI does not persist those logs or add
tenant/workspace meaning.

`useAgentUsage().refreshUsage()` calls `account/rateLimits/read` and stores the
normalized rate-limit snapshot used by `AgentUsagePanel`.

## Skills, Hooks, Apps, And Panels

```tsx
const skills = useAgentSkills(cwd);
const hooks = useAgentHooks(cwd);
const apps = useAgentApps(threadId);
```

`useAgentSkills()` calls `skills/list`, stores normalized skills, and exposes
`setSkillEnabled()` through `skills/config/write`. Agent UI treats
`skills/config/write` as a productized skill toggle surface because it is scoped
to Codex skill metadata; broader host configuration writes such as
`config/value/write` and `config/batchWrite` remain host-only protocol methods.

`useAgentHooks()` calls `hooks/list` and stores normalized hook metadata.
Upstream `HookMetadata.key` becomes `AgentHook.id`; hooks without `key`, `id`,
`name`, or `path` are skipped instead of producing `id: "undefined"`.

`useAgentApps()` calls `app/list`, preserves `nextCursor`, scopes state by
`threadId`, and exposes `loadMoreApps()` so hosts can page through connector/app
metadata. App records keep upstream `AppInfo` vocabulary: `isEnabled` becomes
`enabled`, `isAccessible` becomes `accessible`, and `installUrl` is preserved as
an install URL, not interpreted as an installed/not-installed state. An
inaccessible app is shown as unavailable unless a host has stronger auth
semantics from its own integration. The normalizer also preserves description,
`logoUrl`, `logoUrlDark`, normalized `logos`, labels, branding,
`distributionChannel`, `appMetadata` / compatibility `metadata`, and plugin
display metadata when the App Server provides them.

Host-specific workflows can compose `useAgentThreadController()`,
`useAgentTurnController()`, `useAgentServerRequests()`, and `AgentWorkspace`
slots. The core library does not own app registries, sidecar storage, plan-only
turn orchestration, or workflow-specific panel state.

Hosts that need lower-level Codex protocol construction should use
`@nyosegawa/agent-ui-codex` directly. The React package keeps generated params
out of its public API and accepts Agent UI input/options instead.

## SDK Adapter Notes

`@nyosegawa/agent-ui-codex` exports `createCodexSdkTransportAdapter()` for
hosts that already own a Codex SDK-like client with request, response, and event
methods.
