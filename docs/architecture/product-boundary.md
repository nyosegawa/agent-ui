# Product Boundary

## Name

```text
Agent UI
```

## Tagline

```text
Embeddable UI for Codex-powered coding agents
```

## Description

Agent UI provides React components, headless hooks, state management, and transport adapters for embedding a Codex App Server powered coding-agent interface into an existing web application.

## Scope

Agent UI handles:

- streaming assistant messages
- thread, turn, and item state
- command and tool-call display
- command output streaming
- file change and diff display
- command approval and file-change approval
- user-input requests from the agent
- local device-code login UI
- model/account/status display
- local bridge helpers for Node-based web apps

Agent UI does not handle:

- hosted Codex access
- OpenAI account creation
- OpenAI billing
- sharing one user's credentials with other users
- full IDE features
- Git client workflows
- arbitrary filesystem browsing
- generic chatbot UI unrelated to Codex App Server protocol

## Local Release Scope

```text
local-only
single-user
stdio app-server transport
ChatGPT managed auth
device-code login UI
React components
headless React hooks
stable App Server API only
```

## Branding

`Codex` is used as an integration target, not as the product name.

Approved wording:

```text
Agent UI
Agent UI for Codex
Embeddable React components for applications built on OpenAI Codex App Server.
```

Avoid:

```text
codex-ui
codex-kit
codex-chat
@codex-ui/react
OpenAI Codex UI
```

## Product Position

Agent UI is a UI library. It assumes the host application owns the product surface and the user owns the Codex/OpenAI authentication.

The core value is:

```text
Codex App Server protocol -> normalized state -> embeddable UI
```
