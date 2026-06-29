import baseConfig from "../../tsup.config";

export default {
  ...baseConfig,
  entry: [
    "src/clients.ts",
    "src/index.ts",
    "src/normalizer.ts",
    "src/request-builders.ts",
    "src/session.ts",
    "src/stable-types.ts",
    "src/test-fixtures.ts",
    "src/websocket.ts",
  ],
};
