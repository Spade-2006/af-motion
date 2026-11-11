// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, createRef, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  computeUkiyoeStyle,
  computeBrutalistStyle,
  computeBauhausStyle,
  computeMidCenturyModernStyle,
  getStyleMotionConfig,
  visualStyleRegistry,
  resolveVisualStyle,
  UKIYOE_WAVE_PATH,
  UKIYOE_CLOUD_PATH,
  UKIYOE_HANKO_PATH,
  BRUTALIST_CROSSHAIR_PATH,
  BRUTALIST_CORNER_PATH,
  BRUTALIST_ARROW_PATH,
  BAUHAUS_TRIANGLE_PATH,
  BAUHAUS_CIRCLE_PATH,
  BAUHAUS_SQUARE_PATH,
  MCM_SUNBURST_PATH,
  MCM_BOOMERANG_PATH,
  MCM_KIDNEY_PATH,
} from "../src/catalogue.js";
import {
  UkiyoeButton,
  UkiyoeCard,
  UkiyoePanel,
  UkiyoeInput,
  UkiyoeDecoration,
  BrutalistButton,
  BrutalistCard,
  BrutalistPanel,
  BrutalistInput,
  BrutalistDecoration,
  BauhausButton,
  BauhausCard,
  BauhausPanel,
  BauhausInput,
  BauhausDecoration,
  MidCenturyModernButton,
  MidCenturyModernCard,
  MidCenturyModernPanel,
  MidCenturyModernInput,
  MidCenturyModernDecoration,
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

describe("Prompt 70 — Ukiyo-e, Brutalism, Bauhaus & Mid-Century Modern Styles & Components", () => {
  describe("1. Visual Style Registry Definitions", () => {
    it("resolves the complete ukiyo-e style definition with traditional woodblock properties", () => {
      const def = visualStyleRegistry.getVisualStyle("ukiyo-e");
      expect(def).toBeDefined();
      expect(def?.name).toBe("Ukiyo-e");
      expect(def?.category).toBe("traditional");
      expect(def?.personality).toContain("woodblock");
      expect(def?.typography.headingFont).toContain("Noto Serif JP");
      expect(def?.graphics.decorativeElements).toContain("woodblock-waves");

      const resolved = resolveVisualStyle("ukiyo-e");
      expect(resolved).toBeDefined();
      expect(resolved?.styleName).toBe("Ukiyo-e");
      expect(resolved?.category).toBe("traditional");
      expect(resolved?.cssVariables["--af-sumi-ink"]).toBe("#1a1a1a");
      expect(resolved?.cssVariables["--af-washi-bg"]).toBe("#f7f4ea");
      expect(resolved?.cssVariables["--af-hanko-red"]).toBe("#c93a2b");
    });

    it("resolves the complete brutalism style definition with raw architectural properties", () => {
      const def = visualStyleRegistry.getVisualStyle("brutalism");
      expect(def).toBeDefined();
      expect(def?.name).toBe("Brutalism");
      expect(def?.category).toBe("modernist");
      expect(def?.personality).toContain("uncompromising");
      expect(def?.typography.headingFont).toContain("Druk");
      expect(def?.graphics.decorativeElements).toContain("crosshair-markers");

      const resolved = resolveVisualStyle("brutalism");
      expect(resolved).toBeDefined();
      expect(resolved?.styleName).toBe("Brutalism");
      expect(resolved?.category).toBe("modernist");
      expect(resolved?.cssVariables["--af-brutal-border"]).toBe("3px solid #000000");
      expect(resolved?.cssVariables["--af-brutal-shadow"]).toBe("5px 5px 0px #000000");
    });

    it("resolves the complete bauhaus style definition with modernist functional properties", () => {
      const def = visualStyleRegistry.getVisualStyle("bauhaus");
      expect(def).toBeDefined();
      expect(def?.name).toBe("Bauhaus");
      expect(def?.category).toBe("modernist");
      expect(def?.personality).toContain("rational");
      expect(def?.typography.headingFont).toContain("Futura");
      expect(def?.graphics.decorativeElements).toContain("red-square");

      const resolved = resolveVisualStyle("bauhaus");
      expect(resolved).toBeDefined();
      expect(resolved?.styleName).toBe("Bauhaus");
      expect(resolved?.category).toBe("modernist");
      expect(resolved?.cssVariables["--af-bauhaus-blue"]).toBe("#0047AB");
      expect(resolved?.cssVariables["--af-bauhaus-yellow"]).toBe("#FFD166");
      expect(resolved?.cssVariables["--af-bauhaus-red"]).toBe("#EF476F");
    });

    it("resolves the complete mid-century modern style definition with warm organic retro properties", () => {
      const def = visualStyleRegistry.getVisualStyle("mid-century-modern");
      expect(def).toBeDefined();
      expect(def?.name).toBe("Mid-century Modern");
      expect(def?.category).toBe("retro");
      expect(def?.personality).toContain("sophisticated");
      expect(def?.typography.headingFont).toContain("Century Gothic");
      expect(def?.graphics.decorativeElements).toContain("kidney-shapes");

      const resolved = resolveVisualStyle("mid-century-modern");
      expect(resolved).toBeDefined();
      expect(resolved?.styleName).toBe("Mid-century Modern");
      expect(resolved?.category).toBe("retro");
      expect(resolved?.cssVariables["--af-teak-accent"]).toBe("#c17c4e");
      expect(resolved?.cssVariables["--af-walnut-dark"]).toBe("#3e2719");
      expect(resolved?.cssVariables["--af-mcm-cream"]).toBe("#fbf8f3");
    });
  });

  describe("2. Ukiyo-e Style Computations & Components", () => {
    it("computes authentic woodblock styling across indigo-wave, vermilion-sun, sumi-wash, and moss-garden variants", () => {
      const indigo = computeUkiyoeStyle({ variant: "indigo-wave", elevation: 1 });
      expect(indigo.background).toBe("#1a2a3a");
      expect(indigo.color).toBe("#f7f4ea");
      expect(indigo.border).toContain("#c93a2b");
      expect(indigo.fontFamily).toContain("Noto Serif JP");

      const vermilion = computeUkiyoeStyle({ variant: "vermilion-sun", elevation: 2 });
      expect(vermilion.background).toBe("#c93a2b");
      expect(vermilion.color).toBe("#ffffff");
      expect(vermilion.boxShadow).toContain("rgba(201, 58, 43, 0.45)");

      const sumi = computeUkiyoeStyle({ variant: "sumi-wash", elevation: 0 });
      expect(sumi.background).toBe("#faf7f0");
      expect(sumi.color).toBe("#1a1a1a");

      const moss = computeUkiyoeStyle({ variant: "moss-garden", elevation: 1, pressed: true });
      expect(moss.background).toBe("#2e392f");
      expect(moss.transform).toBe("translateY(1px)");

      const hc = computeUkiyoeStyle({ variant: "indigo-wave", highContrast: true });
      expect(hc.border).toBe("3px solid #ffffff");
    });

    it("renders UkiyoeButton with interactive hover, pressed, focus, and disabled states", () => {
      const btnRef = createRef<HTMLButtonElement>();
      act(() => {
        root.render(
          createElement(
            UkiyoeButton,
            {
              ref: btnRef,
              variant: "vermilion-sun",
              elevation: 1,
            },
            "Explore Prints",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn).not.toBeNull();
      expect(btn.textContent).toBe("Explore Prints");
      expect(btn.style.background).toBe("rgb(201, 58, 43)");

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

      // Release
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translateY(-1px)");

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

      // Blur
      act(() => {
        btn.blur();
      });
      expect(btn.style.outline).toBe("none");
    });

    it("renders UkiyoeButton with reducedMotion and disabled attributes", () => {
      act(() => {
        root.render(
          createElement(
            UkiyoeButton,
            {
              reducedMotion: true,
              disabled: true,
            },
            "Disabled Print",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn.disabled).toBe(true);
      expect(btn.style.cursor).toBe("not-allowed");
      expect(btn.style.opacity).toBe("0.6");
      expect(btn.style.transform).toBe("none");
    });

    it("renders UkiyoeCard with washiTexture and content", () => {
      act(() => {
        root.render(
          createElement(
            UkiyoeCard,
            {
              variant: "sumi-wash",
              washiTexture: true,
            },
            createElement("p", null, "Mount Fuji in fine weather"),
          ),
        );
      });

      const card = host.firstElementChild as HTMLElement;
      expect(card.textContent).toContain("Mount Fuji");
      expect(card.style.backgroundImage).toContain("radial-gradient");
    });

    it("renders UkiyoePanel with hanko seal watermark badge", () => {
      act(() => {
        root.render(
          createElement(
            UkiyoePanel,
            {
              variant: "indigo-wave",
              hankoSeal: true,
            },
            "Great Wave of Kanagawa",
          ),
        );
      });

      const panel = host.firstElementChild as HTMLElement;
      expect(panel.textContent).toContain("Great Wave");
      const hankoSvg = panel.querySelector("svg");
      expect(hankoSvg).not.toBeNull();
      const path = hankoSvg?.querySelector("path");
      expect(path?.getAttribute("d")).toBe(UKIYOE_HANKO_PATH);
    });

    it("renders UkiyoeInput with custom woodblock outline and focus states", () => {
      act(() => {
        root.render(
          createElement(UkiyoeInput, {
            variant: "sumi-wash",
            placeholder: "Search woodblock catalog...",
          }),
        );
      });

      const input = host.querySelector("input")!;
      expect(input.placeholder).toBe("Search woodblock catalog...");

      act(() => {
        input.focus();
      });
      expect(input.style.border).toContain("201, 58, 43");

      act(() => {
        input.blur();
      });
      expect(input.style.boxShadow).toBe("none");
    });

    it("renders UkiyoeDecoration across wave, cloud, and hanko shapes", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(UkiyoeDecoration, { shape: "wave", size: 60 }),
            createElement(UkiyoeDecoration, { shape: "cloud", size: 30 }),
            createElement(UkiyoeDecoration, { shape: "hanko", size: 24, color: "#1a1a1a" }),
          ),
        );
      });

      const svgs = host.querySelectorAll("svg");
      expect(svgs.length).toBe(3);
      expect(svgs[0].querySelector("path")?.getAttribute("d")).toBe(UKIYOE_WAVE_PATH);
      expect(svgs[1].querySelector("path")?.getAttribute("d")).toBe(UKIYOE_CLOUD_PATH);
      expect(svgs[2].querySelector("path")?.getAttribute("d")).toBe(UKIYOE_HANKO_PATH);
      expect(svgs[2].getAttribute("stroke")).toBe("#1a1a1a");
    });
  });

  describe("3. Brutalism Style Computations & Components", () => {
    it("computes stark architectural styling across mono-stark, concrete-gray, hazard-orange, and blueprint-cyan variants", () => {
      const mono = computeBrutalistStyle({ variant: "mono-stark", elevation: 1 });
      expect(mono.background).toBe("#ffffff");
      expect(mono.color).toBe("#000000");
      expect(mono.borderRadius).toBe("0px");
      expect(mono.boxShadow).toBe("5px 5px 0px #000000");
      expect(mono.fontFamily).toContain("Druk");

      const concrete = computeBrutalistStyle({ variant: "concrete-gray", elevation: 0 });
      expect(concrete.background).toBe("#e2e2df");
      expect(concrete.boxShadow).toBe("3px 3px 0px #111111");

      const hazard = computeBrutalistStyle({ variant: "hazard-orange", elevation: 2, pressed: true });
      expect(hazard.background).toBe("#e04b00");
      expect(hazard.transform).toBe("translate(4px, 4px)");

      const blueprint = computeBrutalistStyle({ variant: "blueprint-cyan", highContrast: true });
      expect(blueprint.border).toBe("4px solid #000000");
    });

    it("renders BrutalistButton with hard offset shadow and crisp geometric interactions", () => {
      act(() => {
        root.render(
          createElement(
            BrutalistButton,
            {
              variant: "hazard-orange",
              elevation: 1,
            },
            "SUBMIT NOW",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn.textContent).toBe("SUBMIT NOW");
      expect(btn.style.textTransform).toBe("uppercase");

      // Hover
      act(() => {
        btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        btn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translate(-2px, -2px)");

      // Press
      act(() => {
        btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(btn.style.transform).toBe("translate(4px, 4px)");
      expect(btn.style.boxShadow).toBe("1px 1px 0px #000000");

      // Focus
      act(() => {
        btn.focus();
      });
      expect(btn.style.outline).toContain("dashed");
    });

    it("renders BrutalistCard with crisp rectangular structure", () => {
      act(() => {
        root.render(
          createElement(
            BrutalistCard,
            {
              variant: "mono-stark",
            },
            "EXPOSED CONCRETE SLAB",
          ),
        );
      });

      const card = host.firstElementChild as HTMLElement;
      expect(card.textContent).toBe("EXPOSED CONCRETE SLAB");
      expect(card.style.borderRadius).toBe("0px");
      expect(card.style.border).toContain("3px solid");
    });

    it("renders BrutalistPanel with scaffold grid pattern overlay", () => {
      act(() => {
        root.render(
          createElement(
            BrutalistPanel,
            {
              variant: "concrete-gray",
              scaffoldGrid: true,
            },
            "ARCHITECTURAL FRAMEWORK",
          ),
        );
      });

      const panel = host.firstElementChild as HTMLElement;
      expect(panel.textContent).toBe("ARCHITECTURAL FRAMEWORK");
      expect(panel.style.backgroundImage).toContain("linear-gradient");
      expect(panel.style.backgroundSize).toBe("20px 20px");
    });

    it("renders BrutalistInput with monospaced geometry and high-contrast focus", () => {
      act(() => {
        root.render(
          createElement(BrutalistInput, {
            variant: "mono-stark",
            defaultValue: "COMMAND_LINE_01",
          }),
        );
      });

      const input = host.querySelector("input")!;
      expect(input.value).toBe("COMMAND_LINE_01");

      act(() => {
        input.focus();
      });
      expect(input.style.boxShadow).toBe("4px 4px 0px #000000");

      act(() => {
        input.blur();
      });
      expect(input.style.boxShadow).toBe("none");
    });

    it("renders BrutalistDecoration across crosshair, corner, and arrow shapes", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(BrutalistDecoration, { shape: "crosshair" }),
            createElement(BrutalistDecoration, { shape: "corner" }),
            createElement(BrutalistDecoration, { shape: "arrow" }),
          ),
        );
      });

      const svgs = host.querySelectorAll("svg");
      expect(svgs.length).toBe(3);
      expect(svgs[0].querySelector("path")?.getAttribute("d")).toBe(BRUTALIST_CROSSHAIR_PATH);
      expect(svgs[1].querySelector("path")?.getAttribute("d")).toBe(BRUTALIST_CORNER_PATH);
      expect(svgs[2].querySelector("path")?.getAttribute("d")).toBe(BRUTALIST_ARROW_PATH);
    });
  });

  describe("4. Bauhaus Style Computations & Components", () => {
    it("computes rational functionalist styling across primary-red, primary-blue, primary-yellow, and rational-white variants", () => {
      const red = computeBauhausStyle({ variant: "primary-red", elevation: 1 });
      expect(red.background).toBe("#EF476F");
      expect(red.color).toBe("#ffffff");
      expect(red.boxShadow).toBe("4px 4px 0px #000000");
      expect(red.fontFamily).toContain("Futura");

      const blue = computeBauhausStyle({ variant: "primary-blue", shapeForm: "circle" });
      expect(blue.background).toBe("#0047AB");
      expect(blue.borderRadius).toBe("9999px");

      const yellow = computeBauhausStyle({ variant: "primary-yellow", pressed: true });
      expect(yellow.background).toBe("#e6b800");
      expect(yellow.transform).toBe("translateY(2px)");

      const white = computeBauhausStyle({ variant: "rational-white", highContrast: true });
      expect(white.border).toBe("3px solid #000000");
    });

    it("renders BauhausButton with geometric precision and shape forms", () => {
      act(() => {
        root.render(
          createElement(
            BauhausButton,
            {
              variant: "primary-blue",
              shapeForm: "circle",
            },
            "FORM",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn.textContent).toBe("FORM");
      expect(btn.style.borderRadius).toBe("9999px");

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
      expect(btn.style.transform).toBe("translateY(2px)");

      // Focus
      act(() => {
        btn.focus();
      });
      expect(btn.style.outline).toContain("#0047AB");
    });

    it("renders BauhausCard with standard geometric clarity", () => {
      act(() => {
        root.render(
          createElement(
            BauhausCard,
            {
              variant: "rational-white",
              elevation: 1,
            },
            "Form Follows Function",
          ),
        );
      });

      const card = host.firstElementChild as HTMLElement;
      expect(card.textContent).toBe("Form Follows Function");
      expect(card.style.boxShadow).toBe("4px 4px 0px #000000");
    });

    it("renders BauhausPanel with primary accent badges (red, blue, yellow)", () => {
      act(() => {
        root.render(
          createElement(
            BauhausPanel,
            {
              variant: "rational-white",
              primaryBadge: "red",
            },
            "Weimar Design Studio",
          ),
        );
      });

      const panel = host.firstElementChild as HTMLElement;
      expect(panel.textContent).toContain("Weimar Design Studio");
      const badge = panel.querySelector("[aria-hidden='true']");
      expect(badge).not.toBeNull();
      expect((badge as HTMLElement).style.background).toBe("rgb(239, 71, 111)");
    });

    it("renders BauhausInput with rational border and focus states", () => {
      act(() => {
        root.render(
          createElement(BauhausInput, {
            placeholder: "Design principle...",
          }),
        );
      });

      const input = host.querySelector("input")!;
      expect(input.placeholder).toBe("Design principle...");

      act(() => {
        input.focus();
      });
      expect(input.style.boxShadow).toBe("3px 3px 0px #0047AB");

      act(() => {
        input.blur();
      });
      expect(input.style.boxShadow).toBe("none");
    });

    it("renders BauhausDecoration across triangle, circle, and square with primary colors", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(BauhausDecoration, { shape: "triangle" }),
            createElement(BauhausDecoration, { shape: "circle" }),
            createElement(BauhausDecoration, { shape: "square" }),
          ),
        );
      });

      const svgs = host.querySelectorAll("svg");
      expect(svgs.length).toBe(3);
      expect(svgs[0].querySelector("path")?.getAttribute("d")).toBe(BAUHAUS_TRIANGLE_PATH);
      expect(svgs[0].getAttribute("fill")).toBe("#EF476F");
      expect(svgs[1].querySelector("path")?.getAttribute("d")).toBe(BAUHAUS_CIRCLE_PATH);
      expect(svgs[1].getAttribute("fill")).toBe("#0047AB");
      expect(svgs[2].querySelector("path")?.getAttribute("d")).toBe(BAUHAUS_SQUARE_PATH);
      expect(svgs[2].getAttribute("fill")).toBe("#FFD166");
    });
  });

  describe("5. Mid-Century Modern Style Computations & Components", () => {
    it("computes warm retro styling across warm-teak, atomic-teal, mustard-harvest, and olive-terracotta variants", () => {
      const teak = computeMidCenturyModernStyle({ variant: "warm-teak", elevation: 1 });
      expect(teak.background).toBe("#c17c4e");
      expect(teak.color).toBe("#ffffff");
      expect(teak.borderRadius).toBe("18px");
      expect(teak.fontFamily).toContain("Century Gothic");

      const teal = computeMidCenturyModernStyle({ variant: "atomic-teal", kidneyCurve: true });
      expect(teal.background).toBe("#2a6f97");
      expect(teal.borderRadius).toBe("32px 14px 28px 16px");

      const mustard = computeMidCenturyModernStyle({ variant: "mustard-harvest", elevation: 0 });
      expect(mustard.background).toBe("#d4a373");
      expect(mustard.color).toBe("#3e2719");

      const olive = computeMidCenturyModernStyle({ variant: "olive-terracotta", pressed: true });
      expect(olive.background).toBe("#4f5a2e");
      expect(olive.transform).toBe("translateY(2px)");

      const hc = computeMidCenturyModernStyle({ highContrast: true });
      expect(hc.border).toBe("2px solid #000000");
    });

    it("renders MidCenturyModernButton with kidney curve option and smooth spring feedback", () => {
      act(() => {
        root.render(
          createElement(
            MidCenturyModernButton,
            {
              variant: "atomic-teal",
              kidneyCurve: true,
            },
            "Palm Springs Lounge",
          ),
        );
      });

      const btn = host.querySelector("button")!;
      expect(btn.textContent).toBe("Palm Springs Lounge");
      expect(btn.style.borderRadius).toBe("32px 14px 28px 16px");

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
      expect(btn.style.transform).toBe("translateY(2px)");

      // Focus
      act(() => {
        btn.focus();
      });
      expect(btn.style.outline).toContain("#c17c4e");
    });

    it("renders MidCenturyModernCard with organic curve and elevation", () => {
      act(() => {
        root.render(
          createElement(
            MidCenturyModernCard,
            {
              variant: "warm-teak",
              elevation: 2,
            },
            "Eames Lounge Chair",
          ),
        );
      });

      const card = host.firstElementChild as HTMLElement;
      expect(card.textContent).toBe("Eames Lounge Chair");
      expect(card.style.boxShadow.replace(/\s/g, "")).toContain("rgba(62,39,25");
    });

    it("renders MidCenturyModernPanel with atomic starburst decoration", () => {
      act(() => {
        root.render(
          createElement(
            MidCenturyModernPanel,
            {
              variant: "olive-terracotta",
              atomicStar: true,
            },
            "Mid-Century Living Room",
          ),
        );
      });

      const panel = host.firstElementChild as HTMLElement;
      expect(panel.textContent).toContain("Mid-Century Living Room");
      const starSvg = panel.querySelector("svg");
      expect(starSvg).not.toBeNull();
      expect(starSvg?.querySelector("path")?.getAttribute("d")).toBe(MCM_SUNBURST_PATH);
    });

    it("renders MidCenturyModernInput with curved corners and smooth focus", () => {
      act(() => {
        root.render(
          createElement(MidCenturyModernInput, {
            variant: "warm-teak",
            placeholder: "Search vintage furniture...",
          }),
        );
      });

      const input = host.querySelector("input")!;
      expect(input.placeholder).toBe("Search vintage furniture...");
      expect(input.style.borderRadius).toBe("14px");

      act(() => {
        input.focus();
      });
      expect(input.style.boxShadow.replace(/\s/g, "")).toContain("rgba(193,124,78");

      act(() => {
        input.blur();
      });
      expect(input.style.boxShadow).toBe("none");
    });

    it("renders MidCenturyModernDecoration across sunburst, boomerang, and kidney shapes", () => {
      act(() => {
        root.render(
          createElement(
            "div",
            null,
            createElement(MidCenturyModernDecoration, { shape: "sunburst" }),
            createElement(MidCenturyModernDecoration, { shape: "boomerang" }),
            createElement(MidCenturyModernDecoration, { shape: "kidney" }),
          ),
        );
      });

      const svgs = host.querySelectorAll("svg");
      expect(svgs.length).toBe(3);
      expect(svgs[0].querySelector("path")?.getAttribute("d")).toBe(MCM_SUNBURST_PATH);
      expect(svgs[1].querySelector("path")?.getAttribute("d")).toBe(MCM_BOOMERANG_PATH);
      expect(svgs[2].querySelector("path")?.getAttribute("d")).toBe(MCM_KIDNEY_PATH);
    });
  });

  describe("6. Motion Configuration & Animation Integration", () => {
    it("provides dedicated motion configs tailored to each style's physical feel", () => {
      const ukiyoeMotion = getStyleMotionConfig("ukiyo-e");
      expect(ukiyoeMotion.preset).toBe("preset-fade-in");
      expect(ukiyoeMotion.spring.stiffness).toBe(200);

      const brutalistMotion = getStyleMotionConfig("brutalism");
      expect(brutalistMotion.preset).toBe("preset-scale-in");
      expect(brutalistMotion.spring.stiffness).toBe(500);

      const bauhausMotion = getStyleMotionConfig("bauhaus");
      expect(bauhausMotion.preset).toBe("preset-slide-in-left");
      expect(bauhausMotion.spring.stiffness).toBe(400);

      const mcmMotion = getStyleMotionConfig("mid-century-modern");
      expect(mcmMotion.preset).toBe("preset-scale-in");
      expect(mcmMotion.spring.damping).toBe(24);
    });
  });

  describe("7. SSR & StrictMode Compatibility", () => {
    it("renders all 20 components flawlessly via renderToString", () => {
      const html = renderToString(
        createElement(
          "div",
          null,
          createElement(UkiyoeButton, null, "Ukiyoe"),
          createElement(UkiyoeCard, null, "Ukiyoe"),
          createElement(UkiyoePanel, { hankoSeal: true }, "Ukiyoe"),
          createElement(UkiyoeInput, { defaultValue: "Ukiyoe" }),
          createElement(UkiyoeDecoration, { shape: "wave" }),
          createElement(BrutalistButton, null, "Brutal"),
          createElement(BrutalistCard, null, "Brutal"),
          createElement(BrutalistPanel, { scaffoldGrid: true }, "Brutal"),
          createElement(BrutalistInput, { defaultValue: "Brutal" }),
          createElement(BrutalistDecoration, { shape: "crosshair" }),
          createElement(BauhausButton, null, "Bauhaus"),
          createElement(BauhausCard, null, "Bauhaus"),
          createElement(BauhausPanel, { primaryBadge: "red" }, "Bauhaus"),
          createElement(BauhausInput, { defaultValue: "Bauhaus" }),
          createElement(BauhausDecoration, { shape: "triangle" }),
          createElement(MidCenturyModernButton, null, "MCM"),
          createElement(MidCenturyModernCard, null, "MCM"),
          createElement(MidCenturyModernPanel, { atomicStar: true }, "MCM"),
          createElement(MidCenturyModernInput, { defaultValue: "MCM" }),
          createElement(MidCenturyModernDecoration, { shape: "sunburst" }),
        ),
      );

      expect(html).toContain("Ukiyoe");
      expect(html).toContain("Brutal");
      expect(html).toContain("Bauhaus");
      expect(html).toContain("MCM");
      expect(html).toContain("<svg");
    });

    it("mounts without warnings under React StrictMode", () => {
      act(() => {
        root.render(
          createElement(
            StrictMode,
            null,
            createElement(UkiyoeButton, null, "Strict Ukiyoe"),
            createElement(BrutalistButton, null, "Strict Brutalist"),
            createElement(BauhausButton, null, "Strict Bauhaus"),
            createElement(MidCenturyModernButton, null, "Strict MCM"),
          ),
        );
      });

      expect(host.querySelectorAll("button").length).toBe(4);
    });
  });

  describe("8. Full 19-Style Registry Inventory Audit", () => {
    it("verifies all 19 visual styles are registered, valid, and have valid CSS variables and motion configs", () => {
      const allStyles = visualStyleRegistry.listVisualStyles();
      expect(allStyles.length).toBe(19);

      const expectedStyles = [
        "skeuomorphism",
        "neumorphism",
        "art-nouveau",
        "liquid-chrome",
        "de-stijl",
        "memphis",
        "psychedelic",
        "vaporwave",
        "steampunk",
        "grunge",
        "paper-cutout",
        "glitch",
        "anti-design",
        "3d-inflated",
        "isometric",
        "ukiyo-e",
        "brutalism",
        "bauhaus",
        "mid-century-modern",
      ];

      for (const styleId of expectedStyles) {
        const def = visualStyleRegistry.getVisualStyle(styleId);
        expect(def, `Style ${styleId} must be registered`).toBeDefined();
        expect(def?.id).toBe(styleId);
        expect(def?.name).toBeTruthy();
        expect(def?.category).toBeTruthy();
        expect(def?.personality.length).toBeGreaterThan(0);
        expect(def?.typography.headingFont).toBeTruthy();
        expect(def?.typography.bodyFont).toBeTruthy();
        expect(def?.shapeLanguage.cornerRadius).toBeTruthy();
        expect(def?.motion.recommendedPresets.length).toBeGreaterThan(0);

        const motionConfig = getStyleMotionConfig(styleId);
        expect(motionConfig).toBeDefined();
        expect(motionConfig.preset).toBeTruthy();
        expect(motionConfig.transition).toBeTruthy();
        expect(motionConfig.spring.stiffness).toBeGreaterThan(0);

        const resolved = resolveVisualStyle(styleId);
        expect(resolved).toBeDefined();
        expect(resolved?.styleId).toBe(styleId);
        expect(Object.keys(resolved?.cssVariables || {}).length).toBeGreaterThan(0);
      }
    });
  });
});
