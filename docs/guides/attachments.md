# Attachments

The composer can accept attachments through paste, drag/drop, and file picker
buttons when the host provides `resolveLocalAttachment`.

## Why A Resolver Is Required

The browser only has a `File` object, blob URL, or filename. Codex App Server
stable v2 accepts `text`, `image`, `localImage`, `skill`, and `mention` user
inputs; it has no generic local-file input. Agent UI therefore never converts a
browser `File.name` into an App Server path by itself.

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
    const { path } = await response.json();
    return kind === "image"
      ? localImageInput(path)
      : textInput(`Attached file: ${path}`);
  }}
/>
```

React owns the attachment UI, while Codex-shaped input construction stays in
`@nyosegawa/agent-ui-codex/request-builders`.

The composer shows removable chips for resolved attachments and appends the
corresponding Codex input items after the text when sending a turn. Images show
thumbnails for paste, drag/drop, and file picker attachments. Non-image files
show filename, extension, and size, and can use unknown extensions such as
`.3mf` as long as the host upload endpoint accepts and saves them.

## Local Upload Helper

`@nyosegawa/agent-ui-server` exports `createAgentUiLocalUploadHandler()` for
local apps. It writes bytes to a host temp directory, applies a default 16 MB
limit, sanitizes filename suffixes while preserving extensions where possible,
and returns JSON with an absolute path. Upload failures should be thrown or
returned as `null` by the resolver so the composer can show an inline error.

See [reference/server-bridge.md](../reference/server-bridge.md) for the server
contract.
