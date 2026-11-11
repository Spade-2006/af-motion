import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const docsRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: docsRoot,
  server: {
    fs: {
      allow: [fileURLToPath(new URL("..", import.meta.url))],
    },
  },
  build: {
    outDir: "../docs-dist",
    emptyOutDir: true,
  },
});
