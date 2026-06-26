import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/headless.ts", "src/index.ts", "src/primitives.ts"],
  external: ["react", "react-dom"],
  format: ["esm", "cjs"],
  sourcemap: true,
  splitting: false,
  target: "es2022",
});
