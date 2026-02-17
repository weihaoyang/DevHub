import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["electron/main.ts", "electron/preload.ts"],
  outDir: "dist-electron",
  format: ["cjs"],
  platform: "node",
  target: "node20",
  sourcemap: true,
  splitting: false,
  clean: true,
  external: ["electron"]
});
