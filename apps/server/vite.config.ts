import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: "./src/index.ts",
    format: "esm",
    outDir: "./dist",
    clean: true,
    deps: {
      neverBundle: ["bun", /^bun:/],
      alwaysBundle: [/@modular-vsa\/.*/],
    },
  },
});
