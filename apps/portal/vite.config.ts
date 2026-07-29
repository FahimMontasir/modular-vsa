import { lingui, linguiTransformerBabelPreset } from "@lingui/vite-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: lazyPlugins(() => [
    tanstackRouter({ target: "react", autoCodeSplitting: true, quoteStyle: "double" }),
    tailwindcss(),
    devtools(),
    react(),
    lingui(),
    babel({
      plugins: ["@lingui/babel-plugin-lingui-macro"],
      presets: [linguiTransformerBabelPreset(), reactCompilerPreset()],
    }),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      manifest: {
        name: "modular-vsa",
        short_name: "modular-vsa",
        description: "modular-vsa - PWA Application",
        theme_color: "#0c0c0c",
      },
      pwaAssets: { disabled: false, config: true },
      devOptions: { enabled: true, type: "module" },
      injectManifest: { minify: true },
    }),
  ]),
  build: {
    rolldownOptions: { output: { comments: false } },
    emptyOutDir: true,
    sourcemap: "hidden",
  },
});
