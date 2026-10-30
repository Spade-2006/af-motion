import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const studioRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: studioRoot,
  server: {
    fs: {
      allow: [fileURLToPath(new URL("..", import.meta.url))],
    },
  },
  build: {
    outDir: "../studio-dist",
    emptyOutDir: true,
  },
});
