import baseConfig from "../../tsup.config";

export default {
  ...baseConfig,
  entry: ["src/index.ts", "src/request-builders.ts", "src/websocket.ts"],
};
