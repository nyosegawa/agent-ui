import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@nyosegawa/agent-ui-codex/request-builders": `${repoRoot}/packages/codex/src/request-builders.ts`,
      "@nyosegawa/agent-ui-core": `${repoRoot}/packages/core/src/index.ts`,
      "@nyosegawa/agent-ui-react/styles.css": `${repoRoot}/packages/react/src/styles.css`,
      "@nyosegawa/agent-ui-react": `${repoRoot}/packages/react/src/index.ts`,
    },
  },
});
