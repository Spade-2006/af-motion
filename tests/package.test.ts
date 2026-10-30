import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import viteConfig from "../vite.config.js";

interface PackageManifest {
  readonly sideEffects?: boolean;
  readonly files?: readonly string[];
  readonly scripts?: Readonly<Record<string, string>>;
  readonly main?: string;
  readonly module?: string;
  readonly types?: string;
  readonly exports?: Readonly<Record<string, {
    readonly types?: string;
    readonly import?: string;
  }>>;
}

const manifest = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as PackageManifest;

describe("npm package configuration", () => {
  it("allows bundlers to remove unused library modules", () => {
    expect(manifest.sideEffects).toBe(false);
  });

  it("builds distributable JavaScript and declarations before packing", () => {
    expect(manifest.scripts?.prepack).toBe("npm run build");
    expect(manifest.files).toContain("dist");
    expect(manifest.main).toBe("./dist/index.js");
    expect(manifest.module).toBe("./dist/index.js");
    expect(manifest.types).toBe("./dist/index.d.ts");
  });

  it("maps only the supported ESM and React entry points to built files", () => {
    expect(manifest.exports).toEqual({
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
      },
      "./react": {
        types: "./dist/react.d.ts",
        import: "./dist/react.js",
      },
    });
  });

  it("writes JavaScript entry filenames with the package-required extension", () => {
    const fileName = viteConfig.build?.lib?.fileName;
    expect(typeof fileName).toBe("function");
    if (typeof fileName !== "function") throw new Error("Vite library filename function was not configured");
    expect(fileName("es", "index")).toBe("index.js");
    expect(fileName("es", "react")).toBe("react.js");
  });
});
