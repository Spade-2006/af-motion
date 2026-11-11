// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  computePsychedelicStyle,
  computeVaporwaveStyle,
  computeSteampunkStyle,
  getStyleMotionConfig,
  PSYCHEDELIC_WAVE_PATH,
  PSYCHEDELIC_FLOWER_PATH,
  VAPORWAVE_SUNSET_PATH,
  VAPORWAVE_GRID_PATH,
  STEAMPUNK_GEAR_PATH,
  STEAMPUNK_BRACKET_PATH,
} from "../src/catalogue.js";
import {
  PsychedelicButton,
  PsychedelicCard,
  PsychedelicPanel,
  PsychedelicInput,
  PsychedelicDecoration,
  VaporwaveButton,
  VaporwaveCard,
  VaporwavePanel,
  VaporwaveInput,
  VaporwaveDecoration,
  SteampunkButton,
  SteampunkCard,
  SteampunkPanel,
  SteampunkInput,
  SteampunkDecoration,
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

describe("Prompt 67 — Psychedelic, Vaporwave & Steampunk Components", () => {
  describe("1. Psychedelic Style Computations & Components", () => {
    it("computes saturated trippy styling across electric, swirl, cosmic-trip, and optical variants", () => {
      const electric = computePsychedelicStyle({ variant: "electric", elevation: 1 });
      expect(electric.background).toContain("linear-gradient");
      expect(electric.borderRadius).toBe("32px 16px 36px 18px");
      expect(electric.fontFamily).toContain("Cooper Black");

      const swirl = computePsychedelicStyle({ variant: "swirl", elevation: 2 });
      expect(swirl.background).toContain("#f72585");
      expect(swirl.color).toBe("#ffffff");

      const cosmic = computePsychedelicStyle({ variant: "cosmic-trip", elevation: 1 });
      expect(cosmic.background).toContain("#ffea00");
      expect(cosmic.boxShadow).toContain("rgba(157, 78, 221");

      const optical = computePsychedelicStyle({ variant: "optical" });
      expect(optical.background).toContain("repeating-linear-gradient");
      expect(optical.color).toBe("#ffffff");
    });

    it("distinguishes unpressed vs pressed fluid optical states", () => {
      const unpressed = computePsychedelicStyle({ variant: "electric", pressed: false });
      const pressed = computePsychedelicStyle({ variant: "electric", pressed: true });

      expect(unpressed.boxShadow).not.toEqual(pressed.boxShadow);
      expect(pressed.boxShadow).toContain("inset 0 3px 6px");
      expect(pressed.background).not.toEqual(unpressed.background);
    });

    it("applies high-contrast accessible borders when requested", () => {
      const normal = computePsychedelicStyle({ variant: "electric", highContrast: false });
      const hc = computePsychedelicStyle({ variant: "electric", highContrast: true });

      expect(normal.border).toContain("2px solid");
      expect(hc.border).toBe("2px solid #000000");

      const swirlHc = computePsychedelicStyle({ variant: "swirl", highContrast: true });
      expect(swirlHc.border).toBe("2px solid #ffffff");
    });

    it("renders PsychedelicButton with trippy warp and focus interactions", () => {
      const btnRef = createRef<HTMLButtonElement>();
      act(() => {
        root.render(
          createElement(
            PsychedelicButton,
            { ref: btnRef, variant: "swirl" },
            "Trippy Click",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn).toBeTruthy();
      expect(btn.textContent).toBe("Trippy Click");
      expect(btnRef.current).toBe(btn);

      // Hover
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("scale(1.05) rotate(-1deg)");

      // Press
      act(() => {
        btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("scale(0.97) rotate(0.5deg)");

      // Release
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("scale(1.05) rotate(-1deg)");

      // Focus
      act(() => {
        btn.focus();
      });
      expect(btn.style.outline).toContain("3px solid #ff007f");
    });

    it("disables interactive transforms when reducedMotion or disabled is active", () => {
      act(() => {
        root.render(
          createElement(
            PsychedelicButton,
            { variant: "electric", reducedMotion: true, disabled: true },
            "Static Trippy",
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

    it("renders PsychedelicCard and PsychedelicPanel with wavy contours", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(PsychedelicCard, { variant: "cosmic-trip", id: "psych-card" }, "Cosmic Card"),
            createElement(PsychedelicPanel, { variant: "swirl", title: "Astral Portal", id: "psych-panel" }, "Portal Contents"),
          ),
        );
      });

      const card = host.querySelector("#psych-card")!;
      expect(card.style.borderRadius).toBe("32px 16px 36px 18px");

      const panel = host.querySelector("#psych-panel")!;
      expect(panel.textContent).toContain("Astral Portal");
      expect(panel.textContent).toContain("Portal Contents");
    });

    it("renders PsychedelicInput with organic contour and focus ring", () => {
      act(() => {
        root.render(
          createElement(PsychedelicInput, {
            variant: "electric",
            placeholder: "Enter hallucination...",
          }),
        );
      });

      const input = host.querySelector("input")!;
      expect(input).toBeTruthy();
      expect(input.style.borderRadius).toBe("24px 14px 24px 14px");

      act(() => {
        input.focus();
      });
      expect(input.style.boxShadow).toContain("0 0 16px");
    });

    it("renders PsychedelicDecoration with waves and flowers", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(PsychedelicDecoration, { shape: "wave", id: "dec-wave" }),
            createElement(PsychedelicDecoration, { shape: "flower", id: "dec-flower" }),
          ),
        );
      });

      const wave = host.querySelector("#dec-wave")!;
      expect(wave.getAttribute("aria-hidden")).toBe("true");
      expect(wave.querySelector("path")!.getAttribute("d")).toBe(PSYCHEDELIC_WAVE_PATH);

      const flower = host.querySelector("#dec-flower")!;
      expect(flower.querySelector("path")!.getAttribute("d")).toBe(PSYCHEDELIC_FLOWER_PATH);
    });
  });

  describe("2. Vaporwave Style Computations & Components", () => {
    it("computes retro synthwave styling across sunset, cyber-grid, arcade, and pastel variants", () => {
      const sunset = computeVaporwaveStyle({ variant: "sunset", elevation: 1 });
      expect(sunset.background).toContain("linear-gradient");
      expect(sunset.fontFamily).toContain("VT323");
      expect(sunset.boxShadow).toContain("rgba(255, 113, 206");

      const cyberGrid = computeVaporwaveStyle({ variant: "cyber-grid" });
      expect(cyberGrid.background).toContain("rgba(13, 2, 33");
      expect(cyberGrid.color).toBe("#01cdfe");
      expect(cyberGrid.textShadow).toContain("#01cdfe");

      const arcade = computeVaporwaveStyle({ variant: "arcade" });
      expect(arcade.color).toBe("#05ffa1");
      expect(arcade.border).toContain("#b967ff");

      const pastel = computeVaporwaveStyle({ variant: "pastel" });
      expect(pastel.color).toBe("#2a1b4e");
    });

    it("renders VaporwaveButton with neon glow and hover lift", () => {
      const btnRef = createRef<HTMLButtonElement>();
      act(() => {
        root.render(
          createElement(
            VaporwaveButton,
            { ref: btnRef, variant: "sunset" },
            "PLAY NOW",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn).toBeTruthy();
      expect(btn.textContent).toBe("PLAY NOW");
      expect(btnRef.current).toBe(btn);
      expect(btn.style.fontFamily).toContain("VT323");

      // Hover
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translateY(-2px)");

      // Press
      act(() => {
        btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translateY(1px)");

      // Focus
      act(() => {
        btn.focus();
      });
      expect(btn.style.outline).toContain("2px solid #01cdfe");
    });

    it("renders VaporwaveCard and VaporwavePanel with neon glow headers", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(VaporwaveCard, { variant: "cyber-grid", id: "vw-card" }, "Aesthetic Card"),
            createElement(VaporwavePanel, { variant: "cyber-grid", title: "WINDOWS 95 DIALOG", id: "vw-panel" }, "System OK"),
          ),
        );
      });

      const card = host.querySelector("#vw-card")!;
      expect(card.style.backdropFilter).toContain("blur");

      const panel = host.querySelector("#vw-panel")!;
      expect(panel.textContent).toContain("WINDOWS 95 DIALOG");
      expect(panel.textContent).toContain("System OK");
    });

    it("renders VaporwaveInput with retro monospace typography and neon glow", () => {
      act(() => {
        root.render(
          createElement(VaporwaveInput, {
            variant: "cyber-grid",
            placeholder: "AESTHETICS",
          }),
        );
      });

      const input = host.querySelector("input")!;
      expect(input.style.fontFamily).toContain("VT323");

      act(() => {
        input.focus();
      });
      expect(input.style.boxShadow).toContain("0 0 14px #01cdfe");
    });

    it("renders VaporwaveDecoration with retro sunset and grid", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(VaporwaveDecoration, { shape: "sunset", id: "dec-sunset" }),
            createElement(VaporwaveDecoration, { shape: "grid", id: "dec-grid" }),
          ),
        );
      });

      const sunset = host.querySelector("#dec-sunset")!;
      expect(sunset.getAttribute("aria-hidden")).toBe("true");
      expect(sunset.querySelector("path")!.getAttribute("d")).toBe(VAPORWAVE_SUNSET_PATH);

      const grid = host.querySelector("#dec-grid")!;
      expect(grid.querySelector("path")!.getAttribute("d")).toBe(VAPORWAVE_GRID_PATH);
    });
  });

  describe("3. Steampunk Style Computations & Components", () => {
    it("computes industrial Victorian styling across brass, copper, bronze, and parchment variants", () => {
      const brass = computeSteampunkStyle({ variant: "brass", elevation: 1 });
      expect(brass.background).toContain("linear-gradient");
      expect(brass.border).toContain("2px solid");
      expect(brass.fontFamily).toContain("Playfair Display");
      expect(brass.boxShadow).toContain("inset");

      const copper = computeSteampunkStyle({ variant: "copper" });
      expect(copper.background).toContain("#b87333");
      expect(copper.color).toBe("#fdeed9");

      const bronze = computeSteampunkStyle({ variant: "bronze" });
      expect(bronze.background).toContain("#4a3726");
      expect(bronze.color).toBe("#e6d5c3");

      const parchment = computeSteampunkStyle({ variant: "parchment" });
      expect(parchment.background).toContain("#f5ecda");
      expect(parchment.color).toBe("#2d1f10");
    });

    it("renders SteampunkButton with metallic bevel and mechanical displacement", () => {
      const btnRef = createRef<HTMLButtonElement>();
      act(() => {
        root.render(
          createElement(
            SteampunkButton,
            { ref: btnRef, variant: "brass" },
            "ENGAGE BOILER",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn).toBeTruthy();
      expect(btn.textContent).toBe("ENGAGE BOILER");
      expect(btnRef.current).toBe(btn);

      // Hover
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translateY(-1px)");

      // Press
      act(() => {
        btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translateY(1px)");

      // Focus
      act(() => {
        btn.focus();
      });
      expect(btn.style.outline).toContain("2px solid #d4af37");
    });

    it("renders SteampunkCard with engraved brass perimeter", () => {
      act(() => {
        root.render(
          createElement(
            SteampunkCard,
            { variant: "copper", engraved: true, id: "sp-card" },
            "Clockwork Mechanism",
          ),
        );
      });

      const card = host.querySelector("#sp-card")!;
      expect(card.textContent).toContain("Clockwork Mechanism");

      const engraved = card.querySelector('[aria-hidden="true"]');
      expect(engraved).toBeTruthy();
      expect((engraved as HTMLElement).style.border).toContain("1px solid");
    });

    it("renders SteampunkPanel with metallic screws and brass title plate", () => {
      act(() => {
        root.render(
          createElement(
            SteampunkPanel,
            { variant: "bronze", title: "FURNACE CHAMBER", riveted: true },
            "Steam pressure nominal",
          ),
        );
      });

      const panel = host.querySelector("div")!;
      expect(panel.textContent).toContain("FURNACE CHAMBER");
      expect(panel.textContent).toContain("Steam pressure nominal");

      const screws = panel.querySelectorAll('span[aria-hidden="true"]');
      expect(screws.length).toBe(4);
    });

    it("renders SteampunkInput with recessed debossed well and amber focus ring", () => {
      act(() => {
        root.render(
          createElement(SteampunkInput, {
            variant: "brass",
            placeholder: "Gauge PSI...",
          }),
        );
      });

      const input = host.querySelector("input")!;
      expect(input.style.boxShadow).toContain("inset 0 2px 4px");

      act(() => {
        input.focus();
      });
      expect(input.style.boxShadow).toContain("0 0 8px");
    });

    it("renders SteampunkDecoration with clockwork gears and brackets", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(SteampunkDecoration, { shape: "gear", id: "dec-gear" }),
            createElement(SteampunkDecoration, { shape: "bracket", id: "dec-bracket" }),
          ),
        );
      });

      const gear = host.querySelector("#dec-gear")!;
      expect(gear.getAttribute("aria-hidden")).toBe("true");
      expect(gear.querySelector("path")!.getAttribute("d")).toBe(STEAMPUNK_GEAR_PATH);

      const bracket = host.querySelector("#dec-bracket")!;
      expect(bracket.querySelector("path")!.getAttribute("d")).toBe(STEAMPUNK_BRACKET_PATH);
    });
  });

  describe("4. AF Motion Integration", () => {
    it("returns verified motion configurations for psychedelic, vaporwave, and steampunk", () => {
      const psych = getStyleMotionConfig("psychedelic");
      expect(psych.preset).toBe("preset-scale-in");
      expect(psych.spring.stiffness).toBe(320);

      const vapor = getStyleMotionConfig("vaporwave");
      expect(vapor.preset).toBe("preset-fade-in");
      expect(vapor.spring.stiffness).toBe(220);

      const steam = getStyleMotionConfig("steampunk");
      expect(steam.preset).toBe("preset-fade-in");
      expect(steam.spring.stiffness).toBe(420);
    });
  });

  describe("5. Server-Side Rendering (SSR) Compatibility", () => {
    it("renders all 15 components with renderToString in pure Node.js without errors", () => {
      const htmlPsychBtn = renderToString(createElement(PsychedelicButton, { variant: "swirl" }, "SSR Trippy"));
      expect(htmlPsychBtn).toContain("SSR Trippy");

      const htmlPsychCard = renderToString(createElement(PsychedelicCard, { variant: "electric" }, "SSR Psych Card"));
      expect(htmlPsychCard).toContain("SSR Psych Card");

      const htmlPsychPanel = renderToString(createElement(PsychedelicPanel, { title: "Psych Title" }, "Body"));
      expect(htmlPsychPanel).toContain("Psych Title");

      const htmlPsychInput = renderToString(createElement(PsychedelicInput, { placeholder: "SSR Psych Input" }));
      expect(htmlPsychInput).toContain("<input");

      const htmlPsychDec = renderToString(createElement(PsychedelicDecoration, { shape: "flower" }));
      expect(htmlPsychDec).toContain('aria-hidden="true"');

      const htmlVaporBtn = renderToString(createElement(VaporwaveButton, { variant: "sunset" }, "SSR Vapor"));
      expect(htmlVaporBtn).toContain("SSR Vapor");

      const htmlVaporCard = renderToString(createElement(VaporwaveCard, null, "SSR Vapor Card"));
      expect(htmlVaporCard).toContain("SSR Vapor Card");

      const htmlVaporPanel = renderToString(createElement(VaporwavePanel, { title: "Retro Title" }, "Panel"));
      expect(htmlVaporPanel).toContain("Retro Title");

      const htmlVaporInput = renderToString(createElement(VaporwaveInput, { placeholder: "SSR Vapor Input" }));
      expect(htmlVaporInput).toContain("<input");

      const htmlVaporDec = renderToString(createElement(VaporwaveDecoration, { shape: "sunset" }));
      expect(htmlVaporDec).toContain('aria-hidden="true"');

      const htmlSteamBtn = renderToString(createElement(SteampunkButton, { variant: "brass" }, "SSR Brass"));
      expect(htmlSteamBtn).toContain("SSR Brass");

      const htmlSteamCard = renderToString(createElement(SteampunkCard, { variant: "copper" }, "SSR Copper Card"));
      expect(htmlSteamCard).toContain("SSR Copper Card");

      const htmlSteamPanel = renderToString(createElement(SteampunkPanel, { riveted: true, title: "Boiler" }, "Engine"));
      expect(htmlSteamPanel).toContain("Boiler");

      const htmlSteamInput = renderToString(createElement(SteampunkInput, { placeholder: "SSR Steampunk Input" }));
      expect(htmlSteamInput).toContain("<input");

      const htmlSteamDec = renderToString(createElement(SteampunkDecoration, { shape: "gear" }));
      expect(htmlSteamDec).toContain('aria-hidden="true"');
    });
  });
});
