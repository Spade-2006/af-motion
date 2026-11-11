import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const websiteRoot = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  root: websiteRoot,
  plugins: [tailwindcss()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(websiteRoot, "src") },
      { find: /^af-motion\/react$/, replacement: path.resolve(repoRoot, "src/react.ts") },
      { find: /^af-motion\/catalogue$/, replacement: path.resolve(repoRoot, "src/catalogue.ts") },
      { find: /^af-motion\/catalog$/, replacement: path.resolve(repoRoot, "src/catalogue.ts") },
      { find: /^af-motion\/presets$/, replacement: path.resolve(repoRoot, "src/presets.ts") },
      { find: /^af-motion$/, replacement: path.resolve(repoRoot, "src/index.ts") },
    ],
  },
  server: {
    port: 5174,
    fs: {
      allow: [repoRoot],
    },
  },
  build: {
    outDir: "../website-dist",
    emptyOutDir: true,
  },
});
