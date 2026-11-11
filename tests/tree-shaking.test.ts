import { describe, expect, it } from "vitest";
import { build } from "vite";
import fs from "node:fs";
import path from "node:path";

describe("package.json export configuration", () => {
  const pkgPath = path.resolve(__dirname, "../package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  it("declares sideEffects: false for bundler tree-shaking", () => {
    expect(pkg.sideEffects).toBe(false);
  });

  it("exports root, react, and package.json subpaths with types and import", () => {
    expect(pkg.exports).toBeDefined();
    expect(pkg.exports["."]).toEqual({
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
      default: "./dist/index.js",
    });
    expect(pkg.exports["./react"]).toEqual({
      types: "./dist/react.d.ts",
      import: "./dist/react.js",
      default: "./dist/react.js",
    });
    expect(pkg.exports["./package.json"]).toBe("./package.json");
    expect(pkg.exports["./presets"]).toEqual({
      types: "./dist/presets.d.ts",
      import: "./dist/presets.js",
      default: "./dist/presets.js",
    });
    expect(pkg.exports["./catalogue"]).toEqual({
      types: "./dist/catalogue.d.ts",
      import: "./dist/catalogue.js",
      default: "./dist/catalogue.js",
    });
    expect(pkg.exports["./catalog"]).toEqual({
      types: "./dist/catalogue.d.ts",
      import: "./dist/catalogue.js",
      default: "./dist/catalogue.js",
    });
  });

  it("marks react as an optional peer dependency", () => {
    expect(pkg.peerDependencies?.react).toBeDefined();
    expect(pkg.peerDependenciesMeta?.react?.optional).toBe(true);
  });

  it("emits root and react type declarations in dist", () => {
    expect(fs.existsSync(path.resolve(__dirname, "../dist/index.d.ts"))).toBe(true);
    expect(fs.existsSync(path.resolve(__dirname, "../dist/react.d.ts"))).toBe(true);
    expect(fs.existsSync(path.resolve(__dirname, "../dist/presets.d.ts"))).toBe(true);
    expect(fs.existsSync(path.resolve(__dirname, "../dist/catalogue.d.ts"))).toBe(true);
    const indexDts = fs.readFileSync(path.resolve(__dirname, "../dist/index.d.ts"), "utf8");
    const reactDts = fs.readFileSync(path.resolve(__dirname, "../dist/react.d.ts"), "utf8");
    expect(indexDts).toContain('export { animate } from "./core/animate.js";');
    expect(reactDts).toContain("export declare function useAnimate");
    expect(reactDts).toContain("export declare const Reveal");
  });
});

describe("production tree-shaking verification", () => {
  async function bundleSnippet(code: string): Promise<string> {
    const result = await build({
      configFile: false,
      logLevel: "silent",
      build: {
        write: false,
        minify: "oxc",
        rollupOptions: {
          input: "virtual-entry.js",
          external: ["react", "react-dom", /^react\/.*/, /^react-dom\/.*/],
        },
      },
      plugins: [
        {
          name: "virtual-entry-plugin",
          resolveId(id) {
            if (id === "virtual-entry.js") return id;
          },
          load(id) {
            if (id === "virtual-entry.js") return code;
          },
        },
      ],
    });

    const output = Array.isArray(result) ? result[0].output : result.output;
    const jsChunk = output.find((o) => o.type === "chunk" || o.fileName.endsWith(".js"));
    if (!jsChunk || !("code" in jsChunk)) {
      throw new Error("No JS chunk emitted in bundle experiment");
    }
    return jsChunk.code;
  }

  it("tree-shakes dist/index.js so that importing only animate excludes canvas & background effects", async () => {
    const fullBundle = await bundleSnippet('import * as all from "./dist/index.js"; console.log(all);');
    const animateOnlyBundle = await bundleSnippet('import { animate } from "./dist/index.js"; console.log(animate);');

    expect(animateOnlyBundle.length).toBeLessThan(fullBundle.length * 0.15); // > 85% tree-shaken
    expect(animateOnlyBundle).not.toContain("cosmicBackground");
    expect(animateOnlyBundle).not.toContain("atmosphericBackground");
    expect(animateOnlyBundle).not.toContain("aurora");
  });

  it("tree-shakes dist/index.js so that importing only inView produces a lightweight bundle", async () => {
    const inViewBundle = await bundleSnippet('import { inView } from "./dist/index.js"; console.log(inView);');
    expect(inViewBundle.length).toBeLessThan(15000); // lightweight (~4 kB minified)
    expect(inViewBundle).not.toContain("particleBackground");
    expect(inViewBundle).not.toContain("fluidBackground");
  });

  it("tree-shakes dist/react.js so that importing only useInView excludes text effects and Reveal", async () => {
    const fullReactBundle = await bundleSnippet('import * as all from "./dist/react.js"; console.log(all);');
    const hookOnlyBundle = await bundleSnippet('import { useInView } from "./dist/react.js"; console.log(useInView);');

    expect(hookOnlyBundle.length).toBeLessThan(fullReactBundle.length * 0.6);
  });
});
