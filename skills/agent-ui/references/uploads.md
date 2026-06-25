# Uploads

Use this when the host app needs paste, drag/drop, image thumbnails, or local
file attachments.

## Ownership

Attachments are host-resolved local inputs. Agent UI can render and send
attachment metadata, but the host owns:

- upload route
- storage directory or object store
- file size and content-type policy
- expiry and cleanup
- local path resolution for Codex App Server
- redaction of paths and diagnostics

## React Resolver

The composer calls `resolveLocalAttachment(file, kind)` when the host wires it.
Return structured attachment metadata with explicit Codex input items from
`@nyosegawa/agent-ui-codex/request-builders`:

```tsx
import { localImageInput, textInput } from "@nyosegawa/agent-ui-codex/request-builders";
import type { AgentResolvedLocalAttachment } from "@nyosegawa/agent-ui-react/primitives";

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
    } satisfies AgentResolvedLocalAttachment;
  }}
/>;
```

## Codex Input Shape

Images use `localImage` paths when Codex can read the local file.

Generic files are represented as explicit text such as:

```text
Attached file: /absolute/path
```

Do not invent a generic browser `File` transport directly into App Server.

## Checks

- Missing `content-type` should be handled deliberately.
- Allow only the content types the host expects.
- Enforce a size limit.
- Expire temporary files.
- Keep per-user or per-session storage isolated for remote or multi-user apps.
- Never derive arbitrary absolute paths from untrusted browser input.

## Transcript Local Media

Transcript image/video blocks receive App Server local paths. Hosts must map
those paths to browser-safe URLs with `resolveLocalMediaUrl(path, item)` and
return a structured resource object:

```tsx
const localMediaUrlsByPath = new Map<string, string>();

resolveLocalMediaUrl={(path) => {
  const previewUrl = localMediaUrlsByPath.get(path);
  return previewUrl ? { kind: "url", previewUrl } : null;
}}
```

Do not return raw strings or pass filesystem paths to browser `src` attributes.
Populate the lookup only from registered asset URLs returned by the host upload
or local media helper. Return `null`/`undefined` when the host cannot serve the
path; Agent UI will render the local-media fallback.

## Local Helper

`@nyosegawa/agent-ui-server` exports `createAgentUiLocalMediaHelper()` for
local apps. It accepts `POST`, sanitizes `x-agent-ui-filename`, enforces a 16 MB
default limit, stores files in per-session temp directories, expires sessions
after a one hour default TTL, registers opaque asset IDs, and returns structured
JSON with `path`, `url`, `previewUrl`, `id`, `displayName`, `redactedPath`,
`mimeType`, and `sizeBytes`.

Use `path` only for explicit App Server input such as `localImageInput(path)`.
Use `url` or `previewUrl` for browser rendering. The helper does not install a
static route by itself; hosts must intentionally route asset requests to
`serveAssetHandler`, which serves only registered asset IDs and supports
host-owned admission checks. `createAgentUiLocalUploadHandler()` remains
available for hosts that only need a browser `File` to local-path upload
adapter, but new examples should prefer the local media helper.
