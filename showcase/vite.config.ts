import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const showcaseRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: showcaseRoot,
  server: {
    fs: {
      allow: [fileURLToPath(new URL("..", import.meta.url))],
    },
  },
  build: {
    outDir: "../showcase-dist",
    emptyOutDir: true,
  },
});
