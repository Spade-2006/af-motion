import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "website/src") },
      { find: /^af-motion\/react$/, replacement: path.resolve(__dirname, "src/react.ts") },
      { find: /^af-motion\/catalogue$/, replacement: path.resolve(__dirname, "src/catalogue.ts") },
      { find: /^af-motion\/catalog$/, replacement: path.resolve(__dirname, "src/catalogue.ts") },
      { find: /^af-motion\/presets$/, replacement: path.resolve(__dirname, "src/presets.ts") },
      { find: /^af-motion$/, replacement: path.resolve(__dirname, "src/index.ts") },
    ],
  },
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        react: "src/react.ts",
        catalogue: "src/catalogue.ts",
        presets: "src/presets.ts",
        cli: "src/cli/index.ts",
      },
      formats: ["es"],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        /^react\/.*/,
        /^react-dom\/.*/,
        /^node:.*/,
        "fs",
        "path",
        "process",
        "os",
        "child_process",
        "module",
        "url",
      ],
      output: {
        chunkFileNames: "chunks/[name]-[hash].js",
        manualChunks(id) {
          if (
            id.includes("/core/animate.") ||
            id.includes("/core/animation.") ||
            id.includes("/core/transform.") ||
            id.includes("/core/colors.") ||
            id.includes("/easing/")
          ) {
            return "core-animation";
          }
        },
      },
    },
    sourcemap: false,
    minify: "oxc",
  },
});
