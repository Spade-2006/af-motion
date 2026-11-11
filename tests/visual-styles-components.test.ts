// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  computeSkeuomorphicStyle,
  computeNeumorphicStyle,
  computeArtNouveauStyle,
  getStyleMotionConfig,
  ART_NOUVEAU_WHIPLASH_PATH,
  ART_NOUVEAU_CORNER_PATH,
  ART_NOUVEAU_DIVIDER_PATH,
} from "../src/catalogue.js";
import {
  SkeuomorphicButton,
  SkeuomorphicCard,
  SkeuomorphicPanel,
  SkeuomorphicInput,
  NeumorphicButton,
  NeumorphicCard,
  NeumorphicPanel,
  NeumorphicInput,
  ArtNouveauButton,
  ArtNouveauCard,
  ArtNouveauFrame,
  ArtNouveauDivider,
  ArtNouveauInput,
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

describe("Prompt 65 — Skeuomorphism, Neumorphism & Art Nouveau Components", () => {
  describe("1. Skeuomorphism Style Computations & Components", () => {
    it("computes realistic styles across leather, metal, glass, and plastic materials", () => {
      const metal = computeSkeuomorphicStyle({ material: "metal", elevation: 1 });
      expect(metal.background).toContain("linear-gradient");
      expect(metal.borderRadius).toBe("6px");
      expect(metal.boxShadow).toContain("inset");

      const leather = computeSkeuomorphicStyle({ material: "leather", elevation: 2 });
      expect(leather.background).toContain("#443224");
      expect(leather.color).toBe("#f4eedb");
      expect(leather.textShadow).toContain("-1px");

      const glass = computeSkeuomorphicStyle({ material: "glass", elevation: 1 });
      expect(glass.backdropFilter).toContain("blur");
      expect(glass.borderRadius).toBe("10px");

      const plastic = computeSkeuomorphicStyle({ material: "plastic", elevation: 2 });
      expect(plastic.background).toContain("#3b82f6");
      expect(plastic.color).toBe("#ffffff");
    });

    it("distinguishes unpressed vs pressed physical tactile states", () => {
      const unpressed = computeSkeuomorphicStyle({ material: "metal", pressed: false });
      const pressed = computeSkeuomorphicStyle({ material: "metal", pressed: true });

      expect(unpressed.boxShadow).not.toEqual(pressed.boxShadow);
      expect(pressed.boxShadow).toContain("inset 0 2px 5px");
      expect(pressed.background).not.toEqual(unpressed.background);
    });

    it("applies high-contrast accessible borders when requested", () => {
      const normal = computeSkeuomorphicStyle({ material: "metal", highContrast: false });
      const hc = computeSkeuomorphicStyle({ material: "metal", highContrast: true });

      expect(normal.border).toBe("1px solid #9ea5af");
      expect(hc.border).toBe("2px solid #000000");

      const leatherHc = computeSkeuomorphicStyle({ material: "leather", highContrast: true });
      expect(leatherHc.border).toBe("2px solid #ffffff");
    });

    it("renders SkeuomorphicButton with tactile pressed and focus interactions", () => {
      const buttonRef = createRef<HTMLButtonElement>();
      act(() => {
        root.render(
          createElement(
            SkeuomorphicButton,
            { ref: buttonRef, material: "metal" },
            "Press Me",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn).toBeTruthy();
      expect(btn.textContent).toBe("Press Me");
      expect(buttonRef.current).toBe(btn);

      // Mouse interactions
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translateY(-1px)");

      act(() => {
        btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translateY(1px)");

      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translateY(-1px)");

      act(() => {
        btn.focus();
      });
      expect(btn.style.outline).toContain("3px solid");
    });

    it("disables interactive transforms when reducedMotion or disabled is active", () => {
      act(() => {
        root.render(
          createElement(
            SkeuomorphicButton,
            { material: "plastic", reducedMotion: true, disabled: true },
            "Static Button",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn.disabled).toBe(true);
      expect(btn.style.transform).toBe("none");
      expect(btn.style.cursor).toBe("not-allowed");

      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("none");
    });

    it("renders SkeuomorphicCard with optional stitched leather perimeter", () => {
      act(() => {
        root.render(
          createElement(
            SkeuomorphicCard,
            { material: "leather", stitched: true, id: "leather-card" },
            "Leather Content",
          ),
        );
      });

      const card = host.querySelector("#leather-card")!;
      expect(card).toBeTruthy();
      expect(card.textContent).toContain("Leather Content");

      const stitch = card.querySelector('[aria-hidden="true"]');
      expect(stitch).toBeTruthy();
      expect((stitch as HTMLElement).style.border).toContain("dashed");
    });

    it("renders SkeuomorphicPanel with corner rivets", () => {
      act(() => {
        root.render(
          createElement(
            SkeuomorphicPanel,
            { material: "metal", riveted: true, title: "Hardware Specs" },
            "Panel Details",
          ),
        );
      });

      const panel = host.querySelector("div")!;
      expect(panel.textContent).toContain("Hardware Specs");
      expect(panel.textContent).toContain("Panel Details");

      const rivets = panel.querySelectorAll('span[aria-hidden="true"]');
      expect(rivets.length).toBe(4);
    });

    it("renders SkeuomorphicInput with recessed inner shadow and focus ring", () => {
      const inputRef = createRef<HTMLInputElement>();
      act(() => {
        root.render(
          createElement(SkeuomorphicInput, {
            ref: inputRef,
            material: "metal",
            placeholder: "Enter code...",
          }),
        );
      });

      const input = host.querySelector("input")!;
      expect(input).toBeTruthy();
      expect(input.placeholder).toBe("Enter code...");
      expect(input.style.boxShadow).toContain("inset 0 2px 4px");

      act(() => {
        input.focus();
      });
      expect(input.style.boxShadow).toContain("0 0 0 3px");
    });
  });

  describe("2. Neumorphism Style Computations & Components", () => {
    it("computes dual-shadow lighting for flat, convex, concave, and pressed shapes", () => {
      const flat = computeNeumorphicStyle({ shape: "flat", surfaceColor: "#e0e5ec", distance: 6 });
      expect(flat.boxShadow).toContain("6px 6px 12px");
      expect(flat.boxShadow).toContain("-6px -6px 12px");
      expect(flat.background).toBe("#e0e5ec");

      const convex = computeNeumorphicStyle({ shape: "convex", surfaceColor: "#e0e5ec" });
      expect(convex.background).toContain("linear-gradient");

      const concave = computeNeumorphicStyle({ shape: "concave", surfaceColor: "#e0e5ec" });
      expect(concave.background).toContain("linear-gradient");

      const pressed = computeNeumorphicStyle({ shape: "pressed", surfaceColor: "#e0e5ec" });
      expect(pressed.boxShadow).toContain("inset 6px 6px 12px");
      expect(pressed.boxShadow).toContain("inset -6px -6px 12px");
    });

    it("adjusts lighting offsets across all 4 light source angles", () => {
      const tl = computeNeumorphicStyle({ lightSource: "top-left", distance: 5 });
      expect(tl.boxShadow).toContain("5px 5px");
      expect(tl.boxShadow).toContain("-5px -5px");

      const tr = computeNeumorphicStyle({ lightSource: "top-right", distance: 5 });
      expect(tr.boxShadow).toContain("-5px 5px");
      expect(tr.boxShadow).toContain("5px -5px");

      const bl = computeNeumorphicStyle({ lightSource: "bottom-left", distance: 5 });
      expect(bl.boxShadow).toContain("5px -5px");
      expect(bl.boxShadow).toContain("-5px 5px");

      const br = computeNeumorphicStyle({ lightSource: "bottom-right", distance: 5 });
      expect(br.boxShadow).toContain("-5px -5px");
      expect(br.boxShadow).toContain("5px 5px");
    });

    it("adapts shadows dynamically for dark mode surface colors", () => {
      const light = computeNeumorphicStyle({ surfaceColor: "#e0e5ec" });
      const dark = computeNeumorphicStyle({ surfaceColor: "#1e2229" });

      expect(light.color).toBe("#1e293b");
      expect(dark.color).toBe("#f1f5f9");
      expect(dark.boxShadow).toContain("rgba(0, 0, 0,");
    });

    it("applies accessible contrast borders and outlines when requested", () => {
      const standard = computeNeumorphicStyle({ accessibleContrast: false });
      const accessible = computeNeumorphicStyle({ accessibleContrast: true });

      expect(standard.border).toBe("1px solid transparent");
      expect(accessible.border).toContain("1px solid rgba(0, 0, 0,");
      expect(accessible.outline).toContain("1px solid rgba(0, 0, 0,");
    });

    it("renders NeumorphicButton with seamless extrusion to depression transitions", () => {
      const buttonRef = createRef<HTMLButtonElement>();
      act(() => {
        root.render(
          createElement(
            NeumorphicButton,
            { ref: buttonRef, surfaceColor: "#e0e5ec" },
            "Soft Toggle",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn).toBeTruthy();
      expect(buttonRef.current).toBe(btn);

      // Initial state: extruded drop shadow
      expect(btn.style.boxShadow).not.toContain("inset");

      // Press: switches to recessed inset well
      act(() => {
        btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(btn.style.boxShadow).toContain("inset");

      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      });
      expect(btn.style.boxShadow).not.toContain("inset");
    });

    it("renders NeumorphicCard and NeumorphicPanel with convex and recessed variants", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(NeumorphicCard, { shape: "convex", id: "n-card" }, "Card"),
            createElement(NeumorphicPanel, { recessed: true, id: "n-panel" }, "Sunken Well"),
          ),
        );
      });

      const card = host.querySelector("#n-card")!;
      expect(card.style.background).toContain("linear-gradient");

      const panel = host.querySelector("#n-panel")!;
      expect(panel.style.boxShadow).toContain("inset");
    });

    it("renders NeumorphicInput with recessed well and focus highlight", () => {
      act(() => {
        root.render(
          createElement(NeumorphicInput, {
            surfaceColor: "#e0e5ec",
            placeholder: "Search...",
          }),
        );
      });

      const input = host.querySelector("input")!;
      expect(input.style.boxShadow).toContain("inset");

      act(() => {
        input.focus();
      });
      expect(input.style.outline).toContain("2px solid");
    });
  });

  describe("3. Art Nouveau Style Computations & Components", () => {
    it("computes authentic organic styling across parchment, sage, terracotta, and emerald variants", () => {
      const parchment = computeArtNouveauStyle({ variant: "parchment" });
      expect(parchment.background).toBe("#faf7f0");
      expect(parchment.borderColor).toBe("#2e4a36");
      expect(parchment.fontFamily).toContain("Cinzel");

      const sage = computeArtNouveauStyle({ variant: "sage" });
      expect(sage.background).toBe("#e8efe9");
      expect(sage.borderColor).toBe("#1b3b28");

      const terracotta = computeArtNouveauStyle({ variant: "terracotta" });
      expect(terracotta.background).toBe("#fcf3ef");
      expect(terracotta.borderColor).toBe("#8b3a2b");

      const emerald = computeArtNouveauStyle({ variant: "dark-emerald" });
      expect(emerald.background).toBe("#14241b");
      expect(emerald.borderColor).toBe("#d4af37");
    });

    it("supports characteristic asymmetrical organic corner curves", () => {
      const symm = computeArtNouveauStyle({ asymmetric: false });
      const asymm = computeArtNouveauStyle({ asymmetric: true });

      expect(symm.borderRadius).toBe("24px");
      expect(asymm.borderRadius).toBe("32px 12px 32px 12px");
    });

    it("renders ArtNouveauButton with organic pill geometry and botanical SVG motifs", () => {
      const btnRef = createRef<HTMLButtonElement>();
      act(() => {
        root.render(
          createElement(
            ArtNouveauButton,
            { ref: btnRef, variant: "parchment", motif: "floral" },
            "Botanical Action",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn).toBeTruthy();
      expect(btn.style.borderRadius).toBe("9999px");
      expect(btn.style.fontFamily).toContain("Cinzel");

      // Verify decorative SVG motifs have aria-hidden="true"
      const svgs = btn.querySelectorAll("svg");
      expect(svgs.length).toBe(2);
      expect(svgs[0].getAttribute("aria-hidden")).toBe("true");
    });

    it("renders ArtNouveauCard with optional corner flourishes", () => {
      act(() => {
        root.render(
          createElement(
            ArtNouveauCard,
            { variant: "sage", cornerFlourish: true, asymmetric: true, id: "an-card" },
            "Art Nouveau Narrative",
          ),
        );
      });

      const card = host.querySelector("#an-card")!;
      expect(card.style.borderRadius).toBe("32px 12px 32px 12px");

      const flourishes = card.querySelectorAll('svg[aria-hidden="true"]');
      expect(flourishes.length).toBe(2);
    });

    it("renders ArtNouveauFrame wrapping children with 4 rotated botanical corners", () => {
      act(() => {
        root.render(
          createElement(
            ArtNouveauFrame,
            { variant: "dark-emerald", cornerSize: 36, id: "an-frame" },
            createElement("p", null, "Framed Poetry"),
          ),
        );
      });

      const frame = host.querySelector("#an-frame")!;
      expect(frame.textContent).toContain("Framed Poetry");

      const corners = frame.querySelectorAll('svg[aria-hidden="true"]');
      expect(corners.length).toBe(4);
      expect(corners[0].getAttribute("width")).toBe("36");
    });

    it("renders ArtNouveauDivider with scalable SVG paths and separator semantics", () => {
      act(() => {
        root.render(
          createElement(ArtNouveauDivider, {
            motif: "whiplash",
            color: "#2e4a36",
            height: 25,
          }),
        );
      });

      const divider = host.querySelector('[role="separator"]')!;
      expect(divider).toBeTruthy();
      expect(divider.getAttribute("aria-hidden")).toBe("true");

      const path = divider.querySelector("path")!;
      expect(path.getAttribute("d")).toBe(ART_NOUVEAU_WHIPLASH_PATH);
    });

    it("renders ArtNouveauInput with elegant typography and focus ring", () => {
      act(() => {
        root.render(
          createElement(ArtNouveauInput, {
            variant: "terracotta",
            placeholder: "Signature...",
          }),
        );
      });

      const input = host.querySelector("input")!;
      expect(input.style.borderRadius).toBe("16px");
      expect(input.style.fontFamily).toContain("Cinzel");

      act(() => {
        input.focus();
      });
      expect(input.style.boxShadow).toContain("0 0 0 3px");
    });
  });

  describe("4. AF Motion Integration", () => {
    it("returns verified motion configurations for all three styles", () => {
      const skeuo = getStyleMotionConfig("skeuomorphism");
      expect(skeuo.preset).toBe("preset-bounce");
      expect(skeuo.spring.stiffness).toBe(350);

      const neu = getStyleMotionConfig("neumorphism");
      expect(neu.preset).toBe("preset-fade-in");
      expect(neu.spring.stiffness).toBe(220);

      const an = getStyleMotionConfig("art-nouveau");
      expect(an.preset).toBe("preset-fade-in");
      expect(an.spring.stiffness).toBe(180);
    });
  });

  describe("5. Server-Side Rendering (SSR) Compatibility", () => {
    it("renders all 13 components with renderToString in pure Node.js without errors", () => {
      const htmlSkeuoBtn = renderToString(createElement(SkeuomorphicButton, { material: "leather" }, "SSR Leather"));
      expect(htmlSkeuoBtn).toContain("SSR Leather");
      expect(htmlSkeuoBtn).toContain("linear-gradient");

      const htmlSkeuoCard = renderToString(createElement(SkeuomorphicCard, { stitched: true }, "SSR Stitched Card"));
      expect(htmlSkeuoCard).toContain("SSR Stitched Card");
      expect(htmlSkeuoCard).toContain("dashed");

      const htmlSkeuoPanel = renderToString(createElement(SkeuomorphicPanel, { riveted: true, title: "Panel Title" }, "Panel"));
      expect(htmlSkeuoPanel).toContain("Panel Title");

      const htmlSkeuoInput = renderToString(createElement(SkeuomorphicInput, { placeholder: "SSR Input" }));
      expect(htmlSkeuoInput).toContain('placeholder="SSR Input"');

      const htmlNeuBtn = renderToString(createElement(NeumorphicButton, { shape: "convex" }, "Neu Button"));
      expect(htmlNeuBtn).toContain("Neu Button");

      const htmlNeuCard = renderToString(createElement(NeumorphicCard, { accessibleContrast: true }, "Neu Card"));
      expect(htmlNeuCard).toContain("Neu Card");

      const htmlNeuPanel = renderToString(createElement(NeumorphicPanel, { recessed: true }, "Neu Panel"));
      expect(htmlNeuPanel).toContain("Neu Panel");

      const htmlNeuInput = renderToString(createElement(NeumorphicInput, { surfaceColor: "#e0e5ec" }));
      expect(htmlNeuInput).toContain("<input");

      const htmlAnBtn = renderToString(createElement(ArtNouveauButton, { motif: "floral" }, "AN Button"));
      expect(htmlAnBtn).toContain("AN Button");
      expect(htmlAnBtn).toContain('aria-hidden="true"');

      const htmlAnCard = renderToString(createElement(ArtNouveauCard, { cornerFlourish: true }, "AN Card"));
      expect(htmlAnCard).toContain("AN Card");

      const htmlAnFrame = renderToString(createElement(ArtNouveauFrame, null, "AN Frame"));
      expect(htmlAnFrame).toContain("AN Frame");

      const htmlAnDivider = renderToString(createElement(ArtNouveauDivider, { motif: "floral" }));
      expect(htmlAnDivider).toContain('role="separator"');

      const htmlAnInput = renderToString(createElement(ArtNouveauInput, { variant: "sage" }));
      expect(htmlAnInput).toContain("<input");
    });
  });
});
