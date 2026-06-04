# Attachments

The composer can accept attachments through paste, drag/drop, and file picker
buttons when the host provides `resolveLocalAttachment`.

Attachment handling is a host resource workflow. Agent UI owns browser UI
state, structured resource metadata, and explicit Codex input plumbing; the
host owns upload routes, static asset routes, admission/auth, persistence,
cleanup, tenant/workspace scoping, and any filesystem path that Codex App
Server should read.

## Why A Resolver Is Required

The browser only has a `File` object, blob URL, or filename. Codex App Server
stable v2 accepts `text`, `image`, `localImage`, `skill`, and `mention` user
inputs; it has no generic local-file input. Agent UI therefore never converts a
browser `File.name` into an App Server path by itself.
Raw local paths appear only in structured metadata so a host resolver can build
explicit App Server input. Browser previews must use `previewUrl`/`url` from a
host route or a temporary object URL for unresolved local image drafts.

## React Resolver

```tsx
import { localImageInput, textInput } from "@nyosegawa/agent-ui-codex/request-builders";
import { AgentChat } from "@nyosegawa/agent-ui-react";

<AgentChat
  resolveLocalAttachment={async (file, kind) => {
    const response = await fetch("/agent-ui/upload", {
      body: await file.arrayBuffer(),
      headers: {
        "x-agent-ui-filename": encodeURIComponent(file.name),
      },
      method: "POST",
    });
    const asset = await response.json();
    return {
      ...asset,
      input:
        kind === "image"
          ? localImageInput(asset.path)
          : textInput(`Attached file: ${asset.path}`),
    };
  }}
  resolveLocalMediaUrl={(path) => assetUrlForLocalPath(path)}
/>
```

React owns the attachment UI. Codex-shaped input construction stays explicit in
the resolver's `input` field and should use
`@nyosegawa/agent-ui-codex/request-builders`.

The shared resource primitive is `AgentResolvedResource`: browser-facing
metadata such as `displayName`, `url`, `previewUrl`, `redactedPath`,
`mimeType`, and `sizeBytes`, plus optional Codex `input`. Composer attachment
resolution uses the stricter `AgentResolvedLocalAttachment` form where `input`
is required. Transcript local media resolution may return either a URL string
or an `AgentResolvedResource`; `previewUrl` is preferred for browser rendering
and `displayName` is preferred for captions. Structured media resources can use
`mimeType` or `kind: "video"` to render video even when the App Server path is
opaque or extensionless.

The composer shows removable chips for resolved attachments and appends the
resolver's `input` items after the text when sending a turn. Images use the
structured `previewUrl`/`url` returned by the resolver when available; Agent UI
falls back to a temporary browser object URL only for unresolved local image
previews. Non-image files show filename, extension, and size, and can use
unknown extensions such as `.3mf` as long as the host upload endpoint accepts
and saves them. If a preview URL fails to load, the chip falls back to the
attachment icon without changing the Codex input payload.

Transcript image and video blocks use `resolveLocalMediaUrl(path, item)` rather
than raw local paths. The host should map a Codex local media path to a
browser-safe URL served by its local media route. Returning a structured
resource lets the host provide a safe caption without exposing the raw local
path. If the resolver is missing, returns no URL, or the browser media load
fails, Agent UI renders the default local-media fallback card instead of a
broken image/video.

## Local Media Helper

`@nyosegawa/agent-ui-server` exports `createAgentUiLocalMediaHelper()` for
local apps. It writes bytes to a host temp directory, applies a default 16 MB
limit, sanitizes filename suffixes while preserving extensions where possible,
registers each file under an unguessable asset ID, and returns structured JSON:

```json
{
  "id": "asset-token",
  "name": "diagram.png",
  "displayName": "diagram.png",
  "path": "/absolute/local/path/diagram.png",
  "url": "/agent-ui/assets/asset-token",
  "previewUrl": "/agent-ui/assets/asset-token",
  "redactedPath": "[agent-ui-local-media]/diagram.png",
  "mimeType": "image/png",
  "sizeBytes": 1234
}
```

Use `path` only when constructing explicit Codex App Server input such as
`localImageInput(path)`. Use `url`/`previewUrl` for browser rendering. Agent UI
does not derive preview URLs from raw filesystem paths.

The helper also exposes `serveAssetHandler`, but static serving is disabled
unless the host intentionally routes requests to it. The handler serves only
registered asset IDs, never arbitrary paths, and supports host admission checks
through `serveAsset.admitRequest`. Add host-owned auth/session checks before
non-loopback or shared use.

Call `releaseAsset(id)` when a preview-only asset is no longer needed. If the
asset's `path` was sent to Codex App Server as `localImageInput(path)` or as
explicit attachment text, keep it registered until the App Server has finished
reading it. `cleanup()` removes the whole helper session.

The older `createAgentUiLocalUploadHandler()` remains as the upload-only entry
point and now returns the same structured JSON while preserving `path` for
existing resolvers. Upload failures should be thrown or returned as `null` by
the resolver so the composer can show an inline error.

See [reference/server-bridge.md](../reference/server-bridge.md) for the server
contract.
