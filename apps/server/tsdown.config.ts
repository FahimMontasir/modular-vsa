import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.ts",
  format: "esm",
  outDir: "./dist",
  clean: true,
  deps: {
    // Replaces 'external'
    neverBundle: ["bun", /^bun:/],
    // Replaces 'noExternal'
    alwaysBundle: [/@modular-vsa\/.*/],
  },
});
