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
Return Codex input items from `@nyosegawa/agent-ui-codex/request-builders`:

```tsx
import { localImageInput, textInput } from "@nyosegawa/agent-ui-codex/request-builders";

<AgentChat
  resolveLocalAttachment={async (file, kind) => {
    const response = await fetch("/agent-ui/upload", {
      body: await file.arrayBuffer(),
      headers: {
        "x-agent-ui-filename": encodeURIComponent(file.name),
      },
      method: "POST",
    });
    const { path } = await response.json();
    return kind === "image" ? localImageInput(path) : textInput(`Attached file: ${path}`);
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

## Local Helper

`@nyosegawa/agent-ui-server` exports `createAgentUiLocalUploadHandler()` for
local apps. It accepts `POST`, sanitizes `x-agent-ui-filename`, enforces a 16 MB
default limit, stores files in per-session temp directories, expires sessions
after a one hour default TTL, and returns JSON with `path`.
