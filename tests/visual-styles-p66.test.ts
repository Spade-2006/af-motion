// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  computeLiquidChromeStyle,
  computeDeStijlStyle,
  computeMemphisStyle,
  getStyleMotionConfig,
  MEMPHIS_SQUIGGLE_PATH,
  MEMPHIS_ZIGZAG_PATH,
  MEMPHIS_TRIANGLE_PATH,
  MEMPHIS_CIRCLE_PATH,
} from "../src/catalogue.js";
import {
  LiquidChromeButton,
  LiquidChromeCard,
  LiquidChromePanel,
  LiquidChromeInput,
  DeStijlButton,
  DeStijlCard,
  DeStijlPanel,
  DeStijlInput,
  MemphisButton,
  MemphisCard,
  MemphisPanel,
  MemphisInput,
  MemphisDecoration,
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

describe("Prompt 66 — Liquid Chrome, De Stijl & Memphis Components", () => {
  describe("1. Liquid Chrome Style Computations & Components", () => {
    it("computes reflective metallic styling across mirror, iridescent, dark-mercury, and holographic variants", () => {
      const mirror = computeLiquidChromeStyle({ variant: "mirror", elevation: 1 });
      expect(mirror.background).toContain("linear-gradient");
      expect(mirror.borderRadius).toBe("9999px");
      expect(mirror.backdropFilter).toContain("blur");
      expect(mirror.boxShadow).toContain("inset");

      const iridescent = computeLiquidChromeStyle({ variant: "iridescent", elevation: 2 });
      expect(iridescent.background).toContain("#f472b6");
      expect(iridescent.boxShadow).toContain("rgba(168, 85, 247");

      const darkMercury = computeLiquidChromeStyle({ variant: "dark-mercury", elevation: 1 });
      expect(darkMercury.color).toBe("#f8fafc");
      expect(darkMercury.textShadow).toContain("rgba(0, 0, 0");

      const holographic = computeLiquidChromeStyle({ variant: "holographic", elevation: 1 });
      expect(holographic.background).toContain("#c084fc");
    });

    it("distinguishes unpressed vs pressed molten metallic states", () => {
      const unpressed = computeLiquidChromeStyle({ variant: "mirror", pressed: false });
      const pressed = computeLiquidChromeStyle({ variant: "mirror", pressed: true });

      expect(unpressed.boxShadow).not.toEqual(pressed.boxShadow);
      expect(pressed.boxShadow).toContain("inset 0 3px 6px");
      expect(pressed.background).not.toEqual(unpressed.background);
    });

    it("applies high-contrast accessible borders when requested", () => {
      const normal = computeLiquidChromeStyle({ variant: "mirror", highContrast: false });
      const hc = computeLiquidChromeStyle({ variant: "mirror", highContrast: true });

      expect(normal.border).toContain("1px solid");
      expect(hc.border).toBe("2px solid #000000");

      const darkHc = computeLiquidChromeStyle({ variant: "dark-mercury", highContrast: true });
      expect(darkHc.border).toBe("2px solid #ffffff");
    });

    it("renders LiquidChromeButton with specular highlights and interactive states", () => {
      const btnRef = createRef<HTMLButtonElement>();
      act(() => {
        root.render(
          createElement(
            LiquidChromeButton,
            { ref: btnRef, variant: "iridescent" },
            "Molten Action",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn).toBeTruthy();
      expect(btn.textContent).toBe("Molten Action");
      expect(btnRef.current).toBe(btn);
      expect(btn.style.borderRadius).toBe("9999px");

      // Hover
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("scale(1.03)");

      // Press
      act(() => {
        btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("scale(0.98)");

      // Release
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("scale(1.03)");

      // Focus
      act(() => {
        btn.focus();
      });
      expect(btn.style.outline).toContain("2px solid");
    });

    it("disables interactive transforms when reducedMotion or disabled is active", () => {
      act(() => {
        root.render(
          createElement(
            LiquidChromeButton,
            { variant: "mirror", reducedMotion: true, disabled: true },
            "Static Chrome",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn.disabled).toBe(true);
      expect(btn.style.transform).toBe("none");
      expect(btn.style.cursor).toBe("not-allowed");

      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("none");
    });

    it("renders LiquidChromeCard and LiquidChromePanel with specular depth", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(LiquidChromeCard, { variant: "holographic", id: "lc-card" }, "Holo Card"),
            createElement(LiquidChromePanel, { variant: "dark-mercury", title: "Mercury Dock", id: "lc-panel" }, "Dock Details"),
          ),
        );
      });

      const card = host.querySelector("#lc-card")!;
      expect(card.style.borderRadius).toBe("28px");
      expect(card.style.backdropFilter).toContain("blur");

      const panel = host.querySelector("#lc-panel")!;
      expect(panel.textContent).toContain("Mercury Dock");
      expect(panel.textContent).toContain("Dock Details");
    });

    it("renders LiquidChromeInput with rounded metallic contour and focus glow", () => {
      act(() => {
        root.render(
          createElement(LiquidChromeInput, {
            variant: "mirror",
            placeholder: "Search frequency...",
          }),
        );
      });

      const input = host.querySelector("input")!;
      expect(input).toBeTruthy();
      expect(input.style.borderRadius).toBe("9999px");

      act(() => {
        input.focus();
      });
      expect(input.style.boxShadow).toContain("0 0 15px");
    });
  });

  describe("2. De Stijl Style Computations & Components", () => {
    it("computes strict geometric styling across primary colors and black/white", () => {
      const red = computeDeStijlStyle({ variant: "red", borderWidth: 4 });
      expect(red.background).toBe("#e63946");
      expect(red.color).toBe("#ffffff");
      expect(red.borderRadius).toBe("0px");
      expect(red.border).toBe("4px solid #000000");

      const blue = computeDeStijlStyle({ variant: "blue" });
      expect(blue.background).toBe("#0047ab");
      expect(blue.color).toBe("#ffffff");

      const yellow = computeDeStijlStyle({ variant: "yellow" });
      expect(yellow.background).toBe("#ffd166");
      expect(yellow.color).toBe("#000000");

      const black = computeDeStijlStyle({ variant: "black" });
      expect(black.background).toBe("#000000");
      expect(black.border).toBe("4px solid #ffffff");
    });

    it("renders DeStijlButton with rigid black borders and tactile step translation", () => {
      const btnRef = createRef<HTMLButtonElement>();
      act(() => {
        root.render(
          createElement(
            DeStijlButton,
            { ref: btnRef, variant: "yellow" },
            "Bauhaus Step",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn).toBeTruthy();
      expect(btn.textContent).toBe("Bauhaus Step");
      expect(btnRef.current).toBe(btn);
      expect(btn.style.borderRadius).toBe("0px");
      expect(btn.style.border).toContain("4px solid");

      // Hover
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translate(-2px, -2px)");
      expect(btn.style.boxShadow).toBe("3px 3px 0px #000000");

      // Press
      act(() => {
        btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translate(1px, 1px)");
      expect(btn.style.boxShadow).toBe("none");

      // Focus
      act(() => {
        btn.focus();
      });
      expect(btn.style.outline).toContain("3px solid #0047ab");
    });

    it("renders DeStijlCard with optional asymmetric primary color corner block", () => {
      act(() => {
        root.render(
          createElement(
            DeStijlCard,
            { variant: "white", accentVariant: "red", id: "ds-card" },
            "Mondrian Quadrant",
          ),
        );
      });

      const card = host.querySelector("#ds-card")!;
      expect(card.style.borderRadius).toBe("0px");
      expect(card.textContent).toContain("Mondrian Quadrant");

      const accentBlock = card.querySelector('[aria-hidden="true"]');
      expect(accentBlock).toBeTruthy();
      expect((accentBlock as HTMLElement).style.background).toBe("rgb(230, 57, 70)");
    });

    it("renders DeStijlPanel with primary color header block and black divider", () => {
      act(() => {
        root.render(
          createElement(
            DeStijlPanel,
            { variant: "white", headerVariant: "blue", title: "Composition II" },
            "Pure abstraction body",
          ),
        );
      });

      const panel = host.querySelector("div")!;
      expect(panel.textContent).toContain("Composition II");
      expect(panel.textContent).toContain("Pure abstraction body");

      const header = panel.querySelector("div")!;
      expect(header.style.textTransform).toBe("uppercase");
      expect(header.style.background).toBe("rgb(0, 71, 171)");
    });

    it("renders DeStijlInput with rigid rectangular borders and primary focus outline", () => {
      act(() => {
        root.render(
          createElement(DeStijlInput, {
            accentColor: "#0047ab",
            placeholder: "ABSTRACT",
          }),
        );
      });

      const input = host.querySelector("input")!;
      expect(input.style.borderRadius).toBe("0px");
      expect(input.style.border).toContain("4px solid");

      act(() => {
        input.focus();
      });
      expect(input.style.outline).toContain("4px solid #0047ab");
    });
  });

  describe("3. Memphis Style Computations & Components", () => {
    it("computes vibrant pop colors and hard zero-blur drop shadows", () => {
      const lemon = computeMemphisStyle({ variant: "lemon", shadowDistance: 5 });
      expect(lemon.background).toBe("#ffe600");
      expect(lemon.border).toBe("3px solid #000000");
      expect(lemon.boxShadow).toBe("5px 5px 0px #000000");

      const coral = computeMemphisStyle({ variant: "coral" });
      expect(coral.background).toBe("#ff5e7e");
      expect(coral.color).toBe("#ffffff");

      const teal = computeMemphisStyle({ variant: "teal" });
      expect(teal.background).toBe("#00d2d3");
    });

    it("supports Memphis pattern overlays (dots, stripes, grid)", () => {
      const dots = computeMemphisStyle({ variant: "lemon", pattern: "dots" });
      expect(dots.background).toContain("radial-gradient");

      const stripes = computeMemphisStyle({ variant: "teal", pattern: "stripes" });
      expect(stripes.background).toContain("repeating-linear-gradient");

      const grid = computeMemphisStyle({ variant: "coral", pattern: "grid" });
      expect(grid.background).toContain("linear-gradient");
    });

    it("renders MemphisButton with hard drop shadow and bouncy translation", () => {
      const btnRef = createRef<HTMLButtonElement>();
      act(() => {
        root.render(
          createElement(
            MemphisButton,
            { ref: btnRef, variant: "coral", shadowDistance: 4 },
            "Pop Button",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn).toBeTruthy();
      expect(btn.textContent).toBe("Pop Button");
      expect(btnRef.current).toBe(btn);
      expect(btn.style.boxShadow).toBe("4px 4px 0px #000000");

      // Hover
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translate(-2px, -2px)");
      expect(btn.style.boxShadow).toBe("6px 6px 0px #000000");

      // Press
      act(() => {
        btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translate(2px, 2px)");

      // Focus
      act(() => {
        btn.focus();
      });
      expect(btn.style.outline).toContain("3px solid #ff007f");
    });

    it("renders MemphisCard with hard drop shadow and optional patterns", () => {
      act(() => {
        root.render(
          createElement(
            MemphisCard,
            { variant: "teal", pattern: "dots", shadowDistance: 6, id: "m-card" },
            "Memphis Group 1981",
          ),
        );
      });

      const card = host.querySelector("#m-card")!;
      expect(card.style.background).toContain("radial-gradient");
      expect(card.style.boxShadow).toBe("6px 6px 0px #000000");
    });

    it("renders MemphisPanel with title badge", () => {
      act(() => {
        root.render(
          createElement(
            MemphisPanel,
            { variant: "lemon", title: "Milano Pop" },
            "Panel content",
          ),
        );
      });

      const panel = host.querySelector("div")!;
      expect(panel.textContent).toContain("Milano Pop");
      expect(panel.textContent).toContain("Panel content");

      const badge = panel.querySelector("span")!;
      expect(badge.style.background).toBe("rgb(0, 0, 0)");
      expect(badge.style.color).toBe("rgb(255, 255, 255)");
    });

    it("renders MemphisInput with hard drop shadow and focus outline", () => {
      act(() => {
        root.render(
          createElement(MemphisInput, {
            variant: "white",
            placeholder: "Sottsass",
          }),
        );
      });

      const input = host.querySelector("input")!;
      expect(input.style.border).toContain("3px solid");

      act(() => {
        input.focus();
      });
      expect(input.style.outline).toContain("2px solid #ff007f");
    });

    it("renders MemphisDecoration with squiggles, zigzags, triangles, and circles", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(MemphisDecoration, { shape: "squiggle", id: "dec-sq" }),
            createElement(MemphisDecoration, { shape: "zigzag", id: "dec-zz" }),
            createElement(MemphisDecoration, { shape: "triangle", id: "dec-tr" }),
            createElement(MemphisDecoration, { shape: "circle", id: "dec-ci" }),
          ),
        );
      });

      const sq = host.querySelector("#dec-sq")!;
      expect(sq.getAttribute("aria-hidden")).toBe("true");
      expect(sq.querySelector("path")!.getAttribute("d")).toBe(MEMPHIS_SQUIGGLE_PATH);

      const zz = host.querySelector("#dec-zz")!;
      expect(zz.querySelector("path")!.getAttribute("d")).toBe(MEMPHIS_ZIGZAG_PATH);

      const tr = host.querySelector("#dec-tr")!;
      expect(tr.querySelector("path")!.getAttribute("d")).toBe(MEMPHIS_TRIANGLE_PATH);

      const ci = host.querySelector("#dec-ci")!;
      expect(ci.querySelector("path")!.getAttribute("d")).toBe(MEMPHIS_CIRCLE_PATH);
    });
  });

  describe("4. AF Motion Integration", () => {
    it("returns verified motion configurations for liquid-chrome, de-stijl, and memphis", () => {
      const chrome = getStyleMotionConfig("liquid-chrome");
      expect(chrome.preset).toBe("preset-scale-in");
      expect(chrome.spring.stiffness).toBe(280);

      const destijl = getStyleMotionConfig("de-stijl");
      expect(destijl.preset).toBe("preset-slide-in-left");
      expect(destijl.spring.stiffness).toBe(450);

      const memphis = getStyleMotionConfig("memphis");
      expect(memphis.preset).toBe("preset-scale-in");
      expect(memphis.spring.stiffness).toBe(380);
    });
  });

  describe("5. Server-Side Rendering (SSR) Compatibility", () => {
    it("renders all 13 components with renderToString in pure Node.js without errors", () => {
      const htmlChromeBtn = renderToString(createElement(LiquidChromeButton, { variant: "mirror" }, "SSR Chrome"));
      expect(htmlChromeBtn).toContain("SSR Chrome");
      expect(htmlChromeBtn).toContain("linear-gradient");

      const htmlChromeCard = renderToString(createElement(LiquidChromeCard, { variant: "iridescent" }, "SSR Holo Card"));
      expect(htmlChromeCard).toContain("SSR Holo Card");

      const htmlChromePanel = renderToString(createElement(LiquidChromePanel, { title: "SSR Mercury" }, "Panel"));
      expect(htmlChromePanel).toContain("SSR Mercury");

      const htmlChromeInput = renderToString(createElement(LiquidChromeInput, { placeholder: "SSR Chrome Input" }));
      expect(htmlChromeInput).toContain('placeholder="SSR Chrome Input"');

      const htmlDeStijlBtn = renderToString(createElement(DeStijlButton, { variant: "red" }, "SSR De Stijl"));
      expect(htmlDeStijlBtn).toContain("SSR De Stijl");
      expect(htmlDeStijlBtn).toContain("4px solid #000000");

      const htmlDeStijlCard = renderToString(createElement(DeStijlCard, { accentVariant: "yellow" }, "SSR Mondrian Card"));
      expect(htmlDeStijlCard).toContain("SSR Mondrian Card");

      const htmlDeStijlPanel = renderToString(createElement(DeStijlPanel, { headerVariant: "blue", title: "Mondrian Panel" }, "Content"));
      expect(htmlDeStijlPanel).toContain("Mondrian Panel");

      const htmlDeStijlInput = renderToString(createElement(DeStijlInput, { placeholder: "SSR Input" }));
      expect(htmlDeStijlInput).toContain("<input");

      const htmlMemphisBtn = renderToString(createElement(MemphisButton, { variant: "coral" }, "SSR Memphis"));
      expect(htmlMemphisBtn).toContain("SSR Memphis");
      expect(htmlMemphisBtn).toContain("0px #000000");

      const htmlMemphisCard = renderToString(createElement(MemphisCard, { pattern: "stripes" }, "SSR Memphis Card"));
      expect(htmlMemphisCard).toContain("SSR Memphis Card");

      const htmlMemphisPanel = renderToString(createElement(MemphisPanel, { title: "Memphis Badge" }, "Body"));
      expect(htmlMemphisPanel).toContain("Memphis Badge");

      const htmlMemphisInput = renderToString(createElement(MemphisInput, { variant: "lemon" }));
      expect(htmlMemphisInput).toContain("<input");

      const htmlMemphisDec = renderToString(createElement(MemphisDecoration, { shape: "squiggle" }));
      expect(htmlMemphisDec).toContain('aria-hidden="true"');
      expect(htmlMemphisDec).toContain("<svg");
    });
  });
});
