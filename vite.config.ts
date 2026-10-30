import { defineConfig } from "vite";

export default defineConfig({
build: {
lib: {
entry: {
index: "src/index.ts",
react: "src/react.ts"
},
formats: ["es"],
fileName: (_, entryName) => `${entryName}.js`
},
rollupOptions: {
external: ["react"]
},
sourcemap: true,
minify: "oxc"
}
});
