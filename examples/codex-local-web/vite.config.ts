import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@nyosegawa/agent-ui-codex/websocket": `${repoRoot}/packages/codex/src/websocket.ts`,
      "@nyosegawa/agent-ui-codex": `${repoRoot}/packages/codex/src/index.ts`,
      "@nyosegawa/agent-ui-core": `${repoRoot}/packages/core/src/index.ts`,
      "@nyosegawa/agent-ui-react/style.css": `${repoRoot}/packages/react/src/style.css`,
      "@nyosegawa/agent-ui-react": `${repoRoot}/packages/react/src/index.ts`,
    },
  },
});
