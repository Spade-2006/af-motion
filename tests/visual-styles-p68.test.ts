// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, createRef, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  computeGrungeStyle,
  computePaperCutoutStyle,
  computeGlitchStyle,
  getStyleMotionConfig,
  visualStyleRegistry,
  resolveVisualStyle,
  GRUNGE_TAPE_PATH,
  GRUNGE_SPLATTER_PATH,
  GRUNGE_SCRATCH_PATH,
  PAPER_CUTOUT_WAVE_PATH,
  PAPER_FOLDED_CORNER_PATH,
  PAPER_PERFORATION_PATH,
  GLITCH_CROSSHAIR_PATH,
  GLITCH_BARCODE_PATH,
  GLITCH_CORNER_TECH_PATH,
} from "../src/catalogue.js";
import {
  GrungeButton,
  GrungeCard,
  GrungePanel,
  GrungeInput,
  GrungeDecoration,
  PaperCutoutButton,
  PaperCutoutCard,
  PaperCutoutPanel,
  PaperCutoutInput,
  PaperCutoutDecoration,
  GlitchButton,
  GlitchCard,
  GlitchPanel,
  GlitchInput,
  GlitchDecoration,
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

describe("Prompt 68 — Grunge, Paper Cutout & Glitch Styles & Components", () => {
  describe("1. Visual Style Registry Definitions", () => {
    it("resolves the complete grunge style definition with all required properties", () => {
      const def = visualStyleRegistry.getVisualStyle("grunge");
      expect(def).toBeDefined();
      expect(def?.name).toBe("Grunge");
      expect(def?.category).toBe("expressive");
      expect(def?.personality).toContain("gritty");
      expect(def?.textures.primaryTexture).toBe("grain");
      expect(def?.graphics.decorativeElements).toContain("torn-edges");
      expect(def?.react.recommendedComponents).toContain("TornCard");

      const resolved = resolveVisualStyle("grunge");
      expect(resolved).toBeDefined();
      expect(resolved?.styleName).toBe("Grunge");
      expect(resolved?.category).toBe("expressive");
      expect(resolved?.cssVariables["--af-grit-color"]).toBe("#202020");
    });

    it("resolves the complete paper-cutout style definition with layered characteristics", () => {
      const def = visualStyleRegistry.getVisualStyle("paper-cutout");
      expect(def).toBeDefined();
      expect(def?.name).toBe("Paper Cutout");
      expect(def?.category).toBe("skeuomorphic");
      expect(def?.shapeLanguage.cornerRadius).toBe("20px");
      expect(def?.lighting.shadowStyle).toBe("layered");
      expect(def?.graphics.decorativeElements).toContain("layered-waves");
      expect(def?.react.recommendedComponents).toContain("PapercraftButton");

      const resolved = resolveVisualStyle("paper-cutout");
      expect(resolved).toBeDefined();
      expect(resolved?.styleName).toBe("Paper Cutout");
      expect(resolved?.category).toBe("skeuomorphic");
      expect(resolved?.cssVariables["--af-paper-shadow-1"]).toBe("0 4px 10px rgba(0,0,0,0.08)");
    });

    it("resolves the complete glitch style definition with cyber distortion properties", () => {
      const def = visualStyleRegistry.getVisualStyle("glitch");
      expect(def).toBeDefined();
      expect(def?.name).toBe("Glitch");
      expect(def?.category).toBe("cyber");
      expect(def?.personality).toContain("cybernetic");
      expect(def?.graphics.decorativeElements).toContain("scanlines");
      expect(def?.lighting.shadowStyle).toBe("colored");
      expect(def?.react.recommendedComponents).toContain("GlitchText");

      const resolved = resolveVisualStyle("glitch");
      expect(resolved).toBeDefined();
      expect(resolved?.styleName).toBe("Glitch");
      expect(resolved?.category).toBe("cyber");
      expect(resolved?.cssVariables["--af-glitch-cyan"]).toBe("#00FFFF");
    });
  });

  describe("2. Grunge Style Computations & Components", () => {
    it("computes distressed raw styling across distressed-paper, zine-dark, photocopy, and decay variants", () => {
      const paper = computeGrungeStyle({ variant: "distressed-paper", elevation: 1 });
      expect(paper.background).toBe("#e8e5df");
      expect(paper.borderRadius).toBe("0px");
      expect(paper.boxShadow).toContain("4px 4px 0px #000000");
      expect(paper.fontFamily).toContain("Permanent Marker");

      const zine = computeGrungeStyle({ variant: "zine-dark", elevation: 2 });
      expect(zine.background).toBe("#181818");
      expect(zine.color).toBe("#f0f0f0");
      expect(zine.border).toContain("#e63946");
      expect(zine.boxShadow).toContain("#e63946");

      const photocopy = computeGrungeStyle({ variant: "photocopy", elevation: 1 });
      expect(photocopy.background).toBe("#ffffff");
      expect(photocopy.color).toBe("#000000");
      expect(photocopy.boxShadow).toBe("5px 5px 0px #000000");

      const decay = computeGrungeStyle({ variant: "decay", elevation: 1 });
      expect(decay.background).toBe("#2c3028");
      expect(decay.color).toBe("#d4a373");
    });

    it("distinguishes unpressed vs pressed raw states with physical transform offset", () => {
      const unpressed = computeGrungeStyle({ variant: "distressed-paper", pressed: false });
      const pressed = computeGrungeStyle({ variant: "distressed-paper", pressed: true });

      expect(unpressed.boxShadow).not.toEqual(pressed.boxShadow);
      expect(pressed.boxShadow).toBe("1px 1px 0px #000000");
      expect(pressed.transform).toBe("translate(2px, 2px)");
      expect(pressed.background).toBe("#dedad3");
    });

    it("applies high-contrast accessible borders when requested", () => {
      const normal = computeGrungeStyle({ variant: "distressed-paper", highContrast: false });
      const hc = computeGrungeStyle({ variant: "distressed-paper", highContrast: true });

      expect(normal.border).toBe("2px solid #1a1a1a");
      expect(hc.border).toBe("3px solid #000000");

      const zineHc = computeGrungeStyle({ variant: "zine-dark", highContrast: true });
      expect(zineHc.border).toBe("3px solid #ffffff");
    });

    it("renders GrungeButton with interactive hover, active, and focus states", () => {
      const btnRef = createRef<HTMLButtonElement>();
      act(() => {
        root.render(
          createElement(
            GrungeButton,
            {
              ref: btnRef,
              variant: "zine-dark",
              elevation: 1,
            },
            "PUNK REVOLT",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn).not.toBeNull();
      expect(btn.textContent).toBe("PUNK REVOLT");
      expect(btn.style.fontFamily).toContain("Permanent Marker");

      // Hover
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("rotate(-1.5deg) scale(1.02)");

      // Press
      act(() => {
        btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translate(2px, 2px)");

      // Release
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("rotate(-1.5deg) scale(1.02)");

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
      expect(btn.style.outline).toContain("dashed");
    });

    it("disables transforms on GrungeButton when reducedMotion is true or button is disabled", () => {
      const btnRef = createRef<HTMLButtonElement>();
      act(() => {
        root.render(
          createElement(
            GrungeButton,
            {
              ref: btnRef,
              variant: "distressed-paper",
              reducedMotion: true,
              disabled: true,
            },
            "Static Raw",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn.disabled).toBe(true);
      expect(btn.style.cursor).toBe("not-allowed");

      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("none");
    });

    it("renders GrungeCard and GrungePanel with optional tape decoration", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(GrungeCard, { variant: "photocopy" }, "Card Body"),
            createElement(GrungePanel, { variant: "distressed-paper", tape: true }, "Panel Body"),
          ),
        );
      });

      const card = host.children[0].children[0] as HTMLElement;
      expect(card.textContent).toBe("Card Body");
      expect(card.style.background).toBe("rgb(255, 255, 255)");

      const panel = host.children[0].children[1] as HTMLElement;
      expect(panel.textContent).toBe("Panel Body");
      const tapeOverlay = panel.querySelector("[aria-hidden='true']");
      expect(tapeOverlay).not.toBeNull();
    });

    it("renders GrungeInput with typing and focus transitions", () => {
      act(() => {
        root.render(
          createElement(GrungeInput, {
            placeholder: "Enter title...",
            variant: "distressed-paper",
          }),
        );
      });

      const input = host.querySelector("input")!;
      expect(input.placeholder).toBe("Enter title...");
      expect(input.style.fontFamily).toContain("Courier Prime");

      act(() => {
        input.focus();
      });
      expect(input.style.boxShadow).toContain("3px 3px 0px");
    });

    it("renders GrungeDecoration with tape, splatter, and scratch vector shapes", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(GrungeDecoration, { shape: "tape", size: 64, color: "#222222" }),
            createElement(GrungeDecoration, { shape: "splatter", size: 40, color: "#e63946" }),
            createElement(GrungeDecoration, { shape: "scratch", size: 32, color: "#ffffff" }),
          ),
        );
      });

      const svgs = host.querySelectorAll("svg");
      expect(svgs.length).toBe(3);
      expect(svgs[0].querySelector("path")?.getAttribute("d")).toBe(GRUNGE_TAPE_PATH);
      expect(svgs[1].querySelector("path")?.getAttribute("d")).toBe(GRUNGE_SPLATTER_PATH);
      expect(svgs[2].querySelector("path")?.getAttribute("d")).toBe(GRUNGE_SCRATCH_PATH);
    });
  });

  describe("3. Paper Cutout Style Computations & Components", () => {
    it("computes layered tactile styling across cardstock, kraft, pastel-stack, and dark-construction variants", () => {
      const cardstock = computePaperCutoutStyle({ variant: "cardstock", elevation: 1 });
      expect(cardstock.background).toBe("#faf9f5");
      expect(cardstock.color).toBe("#2c3437");
      expect(cardstock.borderRadius).toBe("16px");
      expect(cardstock.fontFamily).toContain("Quicksand");
      expect(cardstock.boxShadow).toContain("0 4px 10px rgba(0, 0, 0, 0.08)");

      const kraft = computePaperCutoutStyle({ variant: "kraft", elevation: 2 });
      expect(kraft.background).toBe("#ebdcc6");
      expect(kraft.color).toBe("#3b2a1a");
      expect(kraft.boxShadow).toContain("rgba(78, 52, 26, 0.2)");

      const pastel = computePaperCutoutStyle({ variant: "pastel-stack", elevation: 1 });
      expect(pastel.background).toBe("#eaf4f4");
      expect(pastel.color).toBe("#1b3a4b");

      const dark = computePaperCutoutStyle({ variant: "dark-construction", elevation: 1 });
      expect(dark.background).toBe("#22272b");
      expect(dark.color).toBe("#f0f2f5");
    });

    it("supports foldedCorner dog-ear geometric border radius", () => {
      const standard = computePaperCutoutStyle({ foldedCorner: false });
      const folded = computePaperCutoutStyle({ foldedCorner: true });

      expect(standard.borderRadius).toBe("16px");
      expect(folded.borderRadius).toBe("18px 18px 4px 18px");
    });

    it("renders PaperCutoutButton with smooth hover lift and press recoil", () => {
      act(() => {
        root.render(
          createElement(
            PaperCutoutButton,
            {
              variant: "cardstock",
              elevation: 1,
            },
            "Cutout Button",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn.textContent).toBe("Cutout Button");
      expect(btn.style.fontFamily).toContain("Quicksand");

      // Hover lifts paper
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translateY(-2px)");

      // Press depresses paper
      act(() => {
        btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translateY(2px)");

      // Leave
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("none");
    });

    it("renders PaperCutoutCard and multi-layered PaperCutoutPanel", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(PaperCutoutCard, { variant: "kraft", foldedCorner: true }, "Kraft Note"),
            createElement(PaperCutoutPanel, { variant: "cardstock", layers: 3 }, "Stacked Paper"),
          ),
        );
      });

      const card = host.children[0].children[0] as HTMLElement;
      expect(card.textContent).toBe("Kraft Note");
      expect(card.style.borderRadius).toBe("18px 18px 4px 18px");

      const panel = host.children[0].children[1] as HTMLElement;
      expect(panel.textContent).toBe("Stacked Paper");
      expect(panel.style.boxShadow).toContain("6px 6px");
    });

    it("renders PaperCutoutInput with soft recessed depth", () => {
      act(() => {
        root.render(
          createElement(PaperCutoutInput, {
            variant: "cardstock",
            placeholder: "Search craft...",
          }),
        );
      });

      const input = host.querySelector("input")!;
      expect(input.placeholder).toBe("Search craft...");
      expect(input.style.borderRadius).toBe("12px");
      expect(input.style.boxShadow).toContain("inset");
    });

    it("renders PaperCutoutDecoration with wave, folded-corner, and perforation shapes", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(PaperCutoutDecoration, { shape: "wave", size: 100 }),
            createElement(PaperCutoutDecoration, { shape: "folded-corner", size: 30 }),
            createElement(PaperCutoutDecoration, { shape: "perforation", size: 80 }),
          ),
        );
      });

      const svgs = host.querySelectorAll("svg");
      expect(svgs.length).toBe(3);
      expect(svgs[0].querySelector("path")?.getAttribute("d")).toBe(PAPER_CUTOUT_WAVE_PATH);
      expect(svgs[1].querySelector("path")?.getAttribute("d")).toBe(PAPER_FOLDED_CORNER_PATH);
      expect(svgs[2].querySelector("path")?.getAttribute("d")).toBe(PAPER_PERFORATION_PATH);
    });
  });

  describe("4. Glitch Style Computations & Components", () => {
    it("computes digital distortion styling across cyber-terminal, rgb-split, matrix-green, and hologram variants", () => {
      const terminal = computeGlitchStyle({ variant: "cyber-terminal", elevation: 1, scanlines: true });
      expect(terminal.background).toContain("rgba(8, 8, 15");
      expect(terminal.color).toBe("#00ffff");
      expect(terminal.textShadow).toContain("#ff0055");
      expect(terminal.backgroundImage).toContain("repeating-linear-gradient");
      expect(terminal.fontFamily).toContain("Orbitron");

      const rgb = computeGlitchStyle({ variant: "rgb-split", elevation: 1 });
      expect(rgb.background).toBe("#050508");
      expect(rgb.boxShadow).toContain("#ff0055");
      expect(rgb.textShadow).toBe("-2px 0 #ff0055, 2px 0 #00ffff");

      const matrix = computeGlitchStyle({ variant: "matrix-green", elevation: 1 });
      expect(matrix.color).toBe("#00ff66");
      expect(matrix.boxShadow).toContain("rgba(0, 255, 102");

      const holo = computeGlitchStyle({ variant: "hologram-dissonance" });
      expect(holo.backdropFilter).toBe("blur(8px)");
      expect(holo.color).toBe("#d6a4ff");
    });

    it("handles chromaticAberration toggle and pressed state", () => {
      const withAberration = computeGlitchStyle({ chromaticAberration: true });
      const withoutAberration = computeGlitchStyle({ chromaticAberration: false });
      expect(withAberration.textShadow).toContain("#ff0055");
      expect(withoutAberration.textShadow).toBe("0 0 6px #00ffff");

      const pressed = computeGlitchStyle({ pressed: true });
      expect(pressed.boxShadow).toContain("inset");
    });

    it("renders GlitchButton with stepped motion and focus borders", () => {
      act(() => {
        root.render(
          createElement(
            GlitchButton,
            {
              variant: "cyber-terminal",
              elevation: 1,
            },
            "ACCESS FEED",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn.textContent).toBe("ACCESS FEED");
      expect(btn.style.fontFamily).toContain("Orbitron");

      // Hover
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translate(2px, -2px)");

      // Press
      act(() => {
        btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translate(-1px, 1px)");

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
      expect(btn.style.outline).toBe("2px solid #00ffff");
    });

    it("renders GlitchCard and GlitchPanel with cyber HUD header", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(GlitchCard, { variant: "matrix-green" }, "Mainframe Data"),
            createElement(GlitchPanel, { variant: "cyber-terminal", hudHeader: "SYS_STATUS:ACTIVE" }, "Panel Stream"),
          ),
        );
      });

      const card = host.children[0].children[0] as HTMLElement;
      expect(card.textContent).toBe("Mainframe Data");

      const panel = host.children[0].children[1] as HTMLElement;
      expect(panel.textContent).toContain("SYS_STATUS:ACTIVE");
      expect(panel.textContent).toContain("Panel Stream");
    });

    it("renders GlitchInput with cyber caret and monospace typography", () => {
      act(() => {
        root.render(
          createElement(GlitchInput, {
            variant: "cyber-terminal",
            placeholder: "EXECUTE COMMAND...",
          }),
        );
      });

      const input = host.querySelector("input")!;
      expect(input.placeholder).toBe("EXECUTE COMMAND...");
      expect(input.style.fontFamily).toContain("Share Tech Mono");

      act(() => {
        input.focus();
      });
      expect(input.style.boxShadow).toContain("-2px 0 0 #ff0055");
    });

    it("renders GlitchDecoration with crosshair, barcode, and corner-tech paths", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(GlitchDecoration, { shape: "crosshair", size: 30, color: "#00ffff" }),
            createElement(GlitchDecoration, { shape: "barcode", size: 40, color: "#ff0055" }),
            createElement(GlitchDecoration, { shape: "corner-tech", size: 20, color: "#00ff66" }),
          ),
        );
      });

      const svgs = host.querySelectorAll("svg");
      expect(svgs.length).toBe(3);
      expect(svgs[0].querySelector("path")?.getAttribute("d")).toBe(GLITCH_CROSSHAIR_PATH);
      expect(svgs[1].querySelector("path")?.getAttribute("d")).toBe(GLITCH_BARCODE_PATH);
      expect(svgs[2].querySelector("path")?.getAttribute("d")).toBe(GLITCH_CORNER_TECH_PATH);
    });
  });

  describe("5. Motion Config, SSR & StrictMode Integration", () => {
    it("returns specialized spring and transition timing from getStyleMotionConfig for all three styles", () => {
      const grungeMotion = getStyleMotionConfig("grunge");
      expect(grungeMotion.spring.stiffness).toBe(450);
      expect(grungeMotion.transition).toContain("steps(3, end)");

      const paperMotion = getStyleMotionConfig("paper-cutout");
      expect(paperMotion.preset).toBe("preset-slide-in-up");
      expect(paperMotion.spring.stiffness).toBe(300);

      const glitchMotion = getStyleMotionConfig("glitch");
      expect(glitchMotion.spring.stiffness).toBe(500);
      expect(glitchMotion.transition).toContain("steps(2, jump-none)");
    });

    it("renders cleanly without errors in React StrictMode", () => {
      act(() => {
        root.render(
          createElement(
            StrictMode,
            null,
            createElement(GrungeButton, null, "StrictMode Grunge"),
            createElement(PaperCutoutButton, null, "StrictMode Paper"),
            createElement(GlitchButton, null, "StrictMode Glitch"),
          ),
        );
      });

      const buttons = host.querySelectorAll("button");
      expect(buttons.length).toBe(3);
      expect(buttons[0].textContent).toBe("StrictMode Grunge");
      expect(buttons[1].textContent).toBe("StrictMode Paper");
      expect(buttons[2].textContent).toBe("StrictMode Glitch");
    });

    it("renders all components identically on server via renderToString", () => {
      const ssrHtml = renderToString(
        createElement(
          "div",
          null,
          createElement(GrungeButton, { variant: "zine-dark" }, "SSR Grunge"),
          createElement(PaperCutoutCard, { variant: "kraft" }, "SSR Paper"),
          createElement(GlitchPanel, { variant: "cyber-terminal", hudHeader: "NODE:1" }, "SSR Glitch"),
        ),
      );

      expect(ssrHtml).toContain("SSR Grunge");
      expect(ssrHtml).toContain("SSR Paper");
      expect(ssrHtml).toContain("NODE:1");
      expect(ssrHtml).toContain("Permanent Marker");
      expect(ssrHtml).toContain("Quicksand");
      expect(ssrHtml).toContain("Orbitron");
    });
  });
});
