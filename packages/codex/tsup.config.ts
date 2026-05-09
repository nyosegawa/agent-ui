import baseConfig from "../../tsup.config";

export default {
  ...baseConfig,
  entry: ["src/index.ts", "src/websocket.ts"],
};
