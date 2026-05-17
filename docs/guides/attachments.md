# Attachments

The composer can accept attachments through paste, drag/drop, and file picker
buttons when the host provides `resolveLocalAttachment`.

## Why A Resolver Is Required

The browser only has a `File` object, blob URL, or filename. Codex App Server
needs an input it can actually read, such as a local image path on the server
machine or a host-supported uploaded URL. Agent UI therefore never converts a
browser `File.name` into an App Server path by itself.

## React Resolver

```tsx
<AgentChat
  resolveLocalAttachment={async (file) => {
    const response = await fetch("/agent-ui/upload", {
      body: file,
      headers: {
        "x-agent-ui-filename": encodeURIComponent(file.name),
      },
      method: "POST",
    });
    const { path } = await response.json();
    return localImageInput(path);
  }}
/>
```

The composer shows removable chips for resolved attachments and appends the
corresponding Codex input items after the text when sending a turn.

## Local Upload Helper

`@nyosegawa/agent-ui-server` exports `createAgentUiLocalUploadHandler()` for
local apps. It writes bytes to a host temp directory, applies a default 16 MB
limit, sanitizes filename suffixes, and returns JSON with an absolute path.

See [reference/server-bridge.md](../reference/server-bridge.md) for the server
contract.
