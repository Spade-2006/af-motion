// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, createRef, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  computeAntiDesignStyle,
  compute3DInflatedStyle,
  computeIsometricStyle,
  getStyleMotionConfig,
  visualStyleRegistry,
  resolveVisualStyle,
  ANTI_DESIGN_STRIPES_PATH,
  ANTI_DESIGN_CROSS_PATH,
  ANTI_DESIGN_BURST_PATH,
  INFLATED_3D_BUBBLE_PATH,
  INFLATED_3D_PILL_PATH,
  INFLATED_3D_CLOUD_PATH,
  ISOMETRIC_CUBE_PATH,
  ISOMETRIC_GRID_PATH,
  ISOMETRIC_PYRAMID_PATH,
} from "../src/catalogue.js";
import {
  AntiDesignButton,
  AntiDesignCard,
  AntiDesignPanel,
  AntiDesignInput,
  AntiDesignDecoration,
  Inflated3DButton,
  Inflated3DCard,
  Inflated3DPanel,
  Inflated3DInput,
  Inflated3DDecoration,
  IsometricButton,
  IsometricCard,
  IsometricPanel,
  IsometricInput,
  IsometricDecoration,
} from "../src/react.js";

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Prompt 69 — Anti-Design, 3D Inflated & Isometric Styles & Components", () => {
  describe("1. Visual Style Registry Definitions", () => {
    it("resolves the complete anti-design style definition with all required properties", () => {
      const def = visualStyleRegistry.getVisualStyle("anti-design");
      expect(def).toBeDefined();
      expect(def?.name).toBe("Anti-design");
      expect(def?.category).toBe("experimental");
      expect(def?.personality).toContain("provocative");
      expect(def?.typography.headingFont).toContain("Druk Wide");
      expect(def?.graphics.decorativeElements).toContain("warning-stripes");

      const resolved = resolveVisualStyle("anti-design");
      expect(resolved).toBeDefined();
      expect(resolved?.styleName).toBe("Anti-design");
      expect(resolved?.category).toBe("experimental");
      expect(resolved?.cssVariables["--af-caution-yellow"]).toBe("#FFFF00");
      expect(resolved?.cssVariables["--af-toxic-magenta"]).toBe("#FF00FF");
    });

    it("resolves the complete 3d-inflated style definition with bubbly characteristics", () => {
      const def = visualStyleRegistry.getVisualStyle("3d-inflated");
      expect(def).toBeDefined();
      expect(def?.name).toBe("3D Inflated");
      expect(def?.category).toBe("dimensional");
      expect(def?.shapeLanguage.cornerRadius).toBe("36px");
      expect(def?.personality).toContain("bubbly");
      expect(def?.graphics.decorativeElements).toContain("bubble-spheres");

      const resolved = resolveVisualStyle("3d-inflated");
      expect(resolved).toBeDefined();
      expect(resolved?.styleName).toBe("3D Inflated");
      expect(resolved?.category).toBe("dimensional");
      expect(resolved?.cssVariables["--af-bubble-shadow"]).toBe("0 15px 35px rgba(255,100,150,0.25)");
      expect(resolved?.cssVariables["--af-bubble-radius"]).toBe("36px");
    });

    it("resolves the complete isometric style definition with technical precision properties", () => {
      const def = visualStyleRegistry.getVisualStyle("isometric");
      expect(def).toBeDefined();
      expect(def?.name).toBe("Isometric");
      expect(def?.category).toBe("dimensional");
      expect(def?.personality).toContain("architectural");
      expect(def?.graphics.decorativeElements).toContain("isometric-cubes");

      const resolved = resolveVisualStyle("isometric");
      expect(resolved).toBeDefined();
      expect(resolved?.styleName).toBe("Isometric");
      expect(resolved?.category).toBe("dimensional");
      expect(resolved?.cssVariables["--af-iso-angle"]).toBe("rotateX(60deg) rotateZ(-45deg)");
      expect(resolved?.cssVariables["--af-iso-shadow"]).toBe("5px 7px 0px rgba(0,0,0,0.18)");
    });
  });

  describe("2. Anti-Design Style Computations & Components", () => {
    it("computes radical clashing styling across toxic-yellow, acid-magenta, raw-brutalist, and clash-cyan variants", () => {
      const yellow = computeAntiDesignStyle({ variant: "toxic-yellow", elevation: 1 });
      expect(yellow.background).toBe("#ffff00");
      expect(yellow.color).toBe("#000000");
      expect(yellow.border).toBe("3px solid #000000");
      expect(yellow.boxShadow).toContain("#ff00ff");
      expect(yellow.fontFamily).toContain("Druk Wide");

      const magenta = computeAntiDesignStyle({ variant: "acid-magenta", elevation: 1 });
      expect(magenta.background).toBe("#ff00ff");
      expect(magenta.border).toContain("dashed");
      expect(magenta.boxShadow).toContain("#ffff00");

      const brutalist = computeAntiDesignStyle({ variant: "raw-brutalist", elevation: 1 });
      expect(brutalist.background).toBe("#ffffff");
      expect(brutalist.boxShadow).toContain("#ff0033");

      const cyan = computeAntiDesignStyle({ variant: "clash-cyan", elevation: 1 });
      expect(cyan.background).toBe("#00f0ff");
      expect(cyan.color).toBe("#1a0033");
      expect(cyan.boxShadow).toContain("#ff5500");
    });

    it("applies physical offsets and tilt transforms", () => {
      const tilted = computeAntiDesignStyle({ tilted: true });
      expect(tilted.transform).toBe("rotate(-1.5deg)");

      const pressed = computeAntiDesignStyle({ pressed: true });
      expect(pressed.transform).toBe("translate(3px, 3px) rotate(0deg)");
      expect(pressed.boxShadow).toBe("1px 1px 0px #000000");
    });

    it("renders AntiDesignButton with jarring hover skew and focus state", () => {
      const btnRef = createRef<HTMLButtonElement>();
      act(() => {
        root.render(
          createElement(
            AntiDesignButton,
            {
              ref: btnRef,
              variant: "toxic-yellow",
              elevation: 1,
            },
            "DISRUPT NOW",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn).not.toBeNull();
      expect(btn.textContent).toBe("DISRUPT NOW");
      expect(btn.style.fontFamily).toContain("Druk Wide");

      // Hover
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("rotate(3deg) scale(1.04)");

      // Press
      act(() => {
        btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translate(3px, 3px) rotate(0deg)");

      // Leave
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("none");

      // Focus
      act(() => {
        btn.focus();
      });
      expect(btn.style.outline).toContain("solid");
    });

    it("disables transforms on AntiDesignButton when reducedMotion is true or disabled", () => {
      act(() => {
        root.render(
          createElement(
            AntiDesignButton,
            {
              reducedMotion: true,
              disabled: true,
            },
            "Static Anti",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn.disabled).toBe(true);

      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("none");
    });

    it("renders AntiDesignCard and AntiDesignPanel with hazard stripe decoration", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(AntiDesignCard, { variant: "raw-brutalist", tilted: true }, "Card Content"),
            createElement(AntiDesignPanel, { variant: "toxic-yellow", hazardStripe: true }, "Hazard Panel"),
          ),
        );
      });

      const card = host.children[0].children[0] as HTMLElement;
      expect(card.textContent).toBe("Card Content");
      expect(card.style.transform).toBe("rotate(-1.5deg)");

      const panel = host.children[0].children[1] as HTMLElement;
      expect(panel.textContent).toBe("Hazard Panel");
      const stripeBar = panel.querySelector("[aria-hidden='true']");
      expect(stripeBar).not.toBeNull();
    });

    it("renders AntiDesignInput with high-contrast clashing focus ring", () => {
      act(() => {
        root.render(
          createElement(AntiDesignInput, {
            placeholder: "CHAOS INPUT",
            variant: "toxic-yellow",
          }),
        );
      });

      const input = host.querySelector("input")!;
      expect(input.placeholder).toBe("CHAOS INPUT");
      expect(input.style.fontFamily).toContain("Courier New");

      act(() => {
        input.focus();
      });
      expect(input.style.boxShadow).toContain("4px 4px 0px");
    });

    it("renders AntiDesignDecoration with stripes, cross, and burst shapes", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(AntiDesignDecoration, { shape: "stripes", size: 60 }),
            createElement(AntiDesignDecoration, { shape: "cross", size: 40 }),
            createElement(AntiDesignDecoration, { shape: "burst", size: 50, color: "#ff00ff" }),
          ),
        );
      });

      const svgs = host.querySelectorAll("svg");
      expect(svgs.length).toBe(3);
      expect(svgs[0].querySelector("path")?.getAttribute("d")).toBe(ANTI_DESIGN_STRIPES_PATH);
      expect(svgs[1].querySelector("path")?.getAttribute("d")).toBe(ANTI_DESIGN_CROSS_PATH);
      expect(svgs[2].querySelector("path")?.getAttribute("d")).toBe(ANTI_DESIGN_BURST_PATH);
    });
  });

  describe("3. 3D Inflated Style Computations & Components", () => {
    it("computes pillowy volumetric styling across bubblegum-pink, mallow-lavender, cloud-cyan, and sunny-peach variants", () => {
      const pink = compute3DInflatedStyle({ variant: "bubblegum-pink", elevation: 1 });
      expect(pink.background).toContain("linear-gradient");
      expect(pink.borderRadius).toBe("9999px");
      expect(pink.boxShadow).toContain("inset 0 3px 6px rgba(255,255,255,0.8)");
      expect(pink.fontFamily).toContain("Fredoka");

      const lavender = compute3DInflatedStyle({ variant: "mallow-lavender", elevation: 1 });
      expect(lavender.boxShadow).toContain("rgba(147, 51, 234");

      const cyan = compute3DInflatedStyle({ variant: "cloud-cyan", elevation: 2 });
      expect(cyan.boxShadow).toContain("rgba(2, 132, 199");

      const peach = compute3DInflatedStyle({ variant: "sunny-peach", pill: false });
      expect(peach.borderRadius).toBe("32px");
      expect(peach.boxShadow).toContain("rgba(234, 88, 12");
    });

    it("handles pill geometry toggle and pressed deflation state", () => {
      const pill = compute3DInflatedStyle({ pill: true });
      const rounded = compute3DInflatedStyle({ pill: false });
      expect(pill.borderRadius).toBe("9999px");
      expect(rounded.borderRadius).toBe("32px");

      const pressed = compute3DInflatedStyle({ pressed: true });
      expect(pressed.transform).toBe("scale(0.96)");
      expect(pressed.boxShadow).toContain("inset 0 4px 10px");
    });

    it("renders Inflated3DButton with tactile balloon expansion on hover and deflation on press", () => {
      act(() => {
        root.render(
          createElement(
            Inflated3DButton,
            {
              variant: "bubblegum-pink",
              elevation: 1,
            },
            "Puffy Button",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn.textContent).toBe("Puffy Button");
      expect(btn.style.fontFamily).toContain("Fredoka");
      expect(btn.style.borderRadius).toBe("9999px");

      // Hover expands
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("scale(1.05) translateY(-2px)");

      // Press deflates
      act(() => {
        btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("scale(0.96)");

      // Leave
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("none");
    });

    it("renders Inflated3DCard and Inflated3DPanel with glossy floating badge", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(Inflated3DCard, { variant: "mallow-lavender" }, "Pillowy Card"),
            createElement(Inflated3DPanel, { variant: "bubblegum-pink", glossBadge: "HOT" }, "Bubble Panel"),
          ),
        );
      });

      const card = host.children[0].children[0] as HTMLElement;
      expect(card.textContent).toBe("Pillowy Card");
      expect(card.style.borderRadius).toBe("32px");

      const panel = host.children[0].children[1] as HTMLElement;
      expect(panel.textContent).toContain("HOT");
      expect(panel.textContent).toContain("Bubble Panel");
    });

    it("renders Inflated3DInput with soft pillowy candy borders", () => {
      act(() => {
        root.render(
          createElement(Inflated3DInput, {
            variant: "cloud-cyan",
            placeholder: "Enter fluffy text...",
          }),
        );
      });

      const input = host.querySelector("input")!;
      expect(input.placeholder).toBe("Enter fluffy text...");
      expect(input.style.borderRadius).toBe("9999px");

      act(() => {
        input.focus();
      });
      expect(input.style.boxShadow).toContain("inset");
    });

    it("renders Inflated3DDecoration with bubble, pill, and cloud vector shapes", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(Inflated3DDecoration, { shape: "bubble", size: 40 }),
            createElement(Inflated3DDecoration, { shape: "pill", size: 44 }),
            createElement(Inflated3DDecoration, { shape: "cloud", size: 50, color: "#7dd3fc" }),
          ),
        );
      });

      const svgs = host.querySelectorAll("svg");
      expect(svgs.length).toBe(3);
      expect(svgs[0].querySelector("path")?.getAttribute("d")).toBe(INFLATED_3D_BUBBLE_PATH);
      expect(svgs[1].querySelector("path")?.getAttribute("d")).toBe(INFLATED_3D_PILL_PATH);
      expect(svgs[2].querySelector("path")?.getAttribute("d")).toBe(INFLATED_3D_CLOUD_PATH);
    });
  });

  describe("4. Isometric Style Computations & Components", () => {
    it("computes extruded perspective styling across cobalt-blueprint, concrete-slate, emerald-matrix, and clean-elevation variants", () => {
      const blueprint = computeIsometricStyle({ variant: "cobalt-blueprint", elevation: 1 });
      expect(blueprint.background).toBe("#0f233a");
      expect(blueprint.color).toBe("#00f0ff");
      expect(blueprint.border).toBe("1.5px solid #00f0ff");
      expect(blueprint.boxShadow).toContain("4px 4px 0px #071320");
      expect(blueprint.fontFamily).toContain("Space Grotesk");

      const concrete = computeIsometricStyle({ variant: "concrete-slate", elevation: 1 });
      expect(concrete.background).toBe("#2b303a");
      expect(concrete.boxShadow).toContain("4px 4px 0px #181b21");

      const emerald = computeIsometricStyle({ variant: "emerald-matrix", elevation: 1 });
      expect(emerald.color).toBe("#00ff88");
      expect(emerald.boxShadow).toContain("4px 4px 0px #04120c");

      const clean = computeIsometricStyle({ variant: "clean-elevation", elevation: 1 });
      expect(clean.background).toBe("#ffffff");
      expect(clean.color).toBe("#002244");
    });

    it("handles extruded toggle and pressed extrusion collapse", () => {
      const unextruded = computeIsometricStyle({ extruded: false });
      expect(unextruded.boxShadow).toBe("none");

      const pressed = computeIsometricStyle({ pressed: true });
      expect(pressed.transform).toBe("translate(3px, 3px)");
      expect(pressed.boxShadow).toContain("1px 1px 0px");
    });

    it("renders IsometricButton with 3D lift on hover and depress on press", () => {
      act(() => {
        root.render(
          createElement(
            IsometricButton,
            {
              variant: "cobalt-blueprint",
              elevation: 1,
            },
            "Extrude View",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn.textContent).toBe("Extrude View");
      expect(btn.style.fontFamily).toContain("Space Grotesk");

      // Hover lifts perspective
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translate(-2px, -2px)");

      // Press depresses face
      act(() => {
        btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translate(3px, 3px)");

      // Leave
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("none");

      // Focus
      act(() => {
        btn.focus();
      });
      expect(btn.style.outline).toContain("solid");
    });

    it("renders IsometricCard and IsometricPanel with optional orthographic grid", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(IsometricCard, { variant: "concrete-slate" }, "Concrete Slab"),
            createElement(IsometricPanel, { variant: "cobalt-blueprint", orthoGrid: true }, "Blueprint Grid"),
          ),
        );
      });

      const card = host.children[0].children[0] as HTMLElement;
      expect(card.textContent).toBe("Concrete Slab");

      const panel = host.children[0].children[1] as HTMLElement;
      expect(panel.textContent).toBe("Blueprint Grid");
      expect(panel.style.backgroundImage).toContain("linear-gradient(30deg");
    });

    it("renders IsometricInput with technical blueprint typography", () => {
      act(() => {
        root.render(
          createElement(IsometricInput, {
            variant: "cobalt-blueprint",
            placeholder: "COORD_X: 120",
          }),
        );
      });

      const input = host.querySelector("input")!;
      expect(input.placeholder).toBe("COORD_X: 120");
      expect(input.style.fontFamily).toContain("Space Grotesk");

      act(() => {
        input.focus();
      });
      expect(input.style.boxShadow).toContain("2px 2px 0px");
    });

    it("renders IsometricDecoration with cube, grid, and pyramid 30-degree geometries", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(IsometricDecoration, { shape: "cube", size: 40 }),
            createElement(IsometricDecoration, { shape: "grid", size: 48 }),
            createElement(IsometricDecoration, { shape: "pyramid", size: 44 }),
          ),
        );
      });

      const svgs = host.querySelectorAll("svg");
      expect(svgs.length).toBe(3);
      expect(svgs[0].querySelector("path")?.getAttribute("d")).toBe(ISOMETRIC_CUBE_PATH);
      expect(svgs[1].querySelector("path")?.getAttribute("d")).toBe(ISOMETRIC_GRID_PATH);
      expect(svgs[2].querySelector("path")?.getAttribute("d")).toBe(ISOMETRIC_PYRAMID_PATH);
    });
  });

  describe("5. Motion Config, SSR & StrictMode Integration", () => {
    it("returns specialized spring and transition timing from getStyleMotionConfig for all three styles", () => {
      const antiMotion = getStyleMotionConfig("anti-design");
      expect(antiMotion.spring.stiffness).toBe(480);
      expect(antiMotion.transition).toContain("cubic-bezier(0.68, -0.55");

      const inflatedMotion = getStyleMotionConfig("3d-inflated");
      expect(inflatedMotion.spring.stiffness).toBe(260);
      expect(inflatedMotion.transition).toContain("240ms");

      const isoMotion = getStyleMotionConfig("isometric");
      expect(isoMotion.preset).toBe("preset-slide-in-up");
      expect(isoMotion.spring.stiffness).toBe(380);
    });

    it("renders cleanly without errors in React StrictMode", () => {
      act(() => {
        root.render(
          createElement(
            StrictMode,
            null,
            createElement(AntiDesignButton, null, "StrictMode Anti"),
            createElement(Inflated3DButton, null, "StrictMode 3D"),
            createElement(IsometricButton, null, "StrictMode Iso"),
          ),
        );
      });

      const buttons = host.querySelectorAll("button");
      expect(buttons.length).toBe(3);
      expect(buttons[0].textContent).toBe("StrictMode Anti");
      expect(buttons[1].textContent).toBe("StrictMode 3D");
      expect(buttons[2].textContent).toBe("StrictMode Iso");
    });

    it("renders all components identically on server via renderToString", () => {
      const ssrHtml = renderToString(
        createElement(
          "div",
          null,
          createElement(AntiDesignButton, { variant: "toxic-yellow" }, "SSR Anti"),
          createElement(Inflated3DCard, { variant: "bubblegum-pink" }, "SSR 3D"),
          createElement(IsometricPanel, { variant: "cobalt-blueprint", orthoGrid: true }, "SSR Iso"),
        ),
      );

      expect(ssrHtml).toContain("SSR Anti");
      expect(ssrHtml).toContain("SSR 3D");
      expect(ssrHtml).toContain("SSR Iso");
      expect(ssrHtml).toContain("Druk Wide");
      expect(ssrHtml).toContain("Fredoka");
      expect(ssrHtml).toContain("Space Grotesk");
    });
  });
});
