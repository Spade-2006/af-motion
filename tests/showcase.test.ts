// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../src/index.js";
import { createShowcase, generateShowcaseSnippet } from "../showcase/showcase.js";
import type { ShowcaseSettings } from "../showcase/showcase.js";

let root: HTMLDivElement;
let destroyShowcase: (() => void) | undefined;

function choose(selector: string, value: string, eventName = "change"): void {
  const control = root.querySelector<HTMLSelectElement | HTMLInputElement>(selector);
  if (!control) throw new Error(`Missing showcase control: ${selector}`);
  control.value = value;
  control.dispatchEvent(new Event(eventName, { bubbles: true }));
}

beforeEach(() => {
  root = document.createElement("div");
  document.body.append(root);
});

afterEach(() => {
  destroyShowcase?.();
  destroyShowcase = undefined;
  root.remove();
  vi.restoreAllMocks();
});

describe("AF Motion showcase", () => {
  it("shows all 33 built-in palettes and creates the initial gradient preview", () => {
    destroyShowcase = createShowcase(root).destroy;
    expect(root.querySelectorAll("#showcase-palette option")).toHaveLength(33);
    expect(root.querySelector<HTMLSelectElement>("#showcase-palette")?.value).toBe("Electric Teal");
    expect(root.querySelector("#showcase-preview")?.getAttribute("data-effect")).toBe("gradient");
    expect(root.querySelector("#effect-name")?.textContent).toBe("Aurora mesh");
    expect(root.querySelectorAll(".palette-swatch")).toHaveLength(3);
  });

  it("switches effects after destroying the previous preview", () => {
    const gradientDestroy = vi.fn();
    const particleDestroy = vi.fn();
    vi.spyOn(api, "advancedGradientBackground").mockReturnValue({ destroy: gradientDestroy });
    vi.spyOn(api, "particleBackground").mockReturnValue({ destroy: particleDestroy });
    const current = createShowcase(root);
    destroyShowcase = current.destroy;

    expect(api.advancedGradientBackground).toHaveBeenCalledOnce();
    choose("#showcase-effect", "particles");
    expect(gradientDestroy).toHaveBeenCalledOnce();
    expect(api.particleBackground).toHaveBeenCalledOnce();
    expect(root.querySelector("#showcase-preview")?.getAttribute("data-effect")).toBe("particles");

    current.destroy();
    expect(particleDestroy).toHaveBeenCalledOnce();
    destroyShowcase = undefined;
  });

  it("recreates previews with the selected built-in palette and updated controls", () => {
    const gradientDestroy = vi.fn();
    vi.spyOn(api, "advancedGradientBackground")
      .mockReturnValueOnce({ destroy: gradientDestroy })
      .mockReturnValue({ destroy: vi.fn() });
    const current = createShowcase(root);
    destroyShowcase = current.destroy;

    choose("#showcase-palette", "Cobalt Classic");
    expect(gradientDestroy).toHaveBeenCalledOnce();
    expect(api.advancedGradientBackground).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ palette: "Cobalt Classic" }),
    );
    expect(root.querySelector("#showcase-snippet")?.textContent).toContain('"palette": "Cobalt Classic"');

    choose("#showcase-speed", "1.4", "input");
    expect(root.querySelector("#showcase-speed-value")?.textContent).toBe("1.4×");
    expect(root.querySelector("#showcase-snippet")?.textContent).toContain('"speed": 1.4');
    current.destroy();
    destroyShowcase = undefined;
  });

  it.each([
    ["gradient", "advancedGradientBackground", '"type": "mesh"'],
    ["particles", "particleBackground", '"mode": "network"'],
    ["cosmic", "cosmicBackground", '"effect": "starfield"'],
    ["geometric", "geometricBackground", '"effect": "polygon-mesh"'],
    ["fluid", "fluidBackground", '"effect": "liquid-blobs"'],
    ["atmospheric", "atmosphericBackground", '"effect": "fog"'],
    ["energy", "energyBackground", '"effect": "electric-arcs"'],
  ] as const)(
    "generates a valid %s usage snippet with cleanup",
    (effect, apiName, optionValue) => {
      const settings: ShowcaseSettings = {
        effect,
        palette: "Electric Teal",
        speed: 0.8,
        intensity: 0.7,
      };
      const snippet = generateShowcaseSnippet(settings);

      expect(snippet).toContain(`import { ${apiName} } from "af-motion";`);
      expect(snippet).toContain(optionValue);
      expect(snippet).toContain('"palette": "Electric Teal"');
      expect(snippet).toContain("controls.destroy();");
    },
  );
});
