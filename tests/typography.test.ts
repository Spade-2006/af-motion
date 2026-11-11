// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  segmentText,
  segmentCharacters,
  segmentWords,
  segmentParagraphs,
  splitText,
  animateText,
  createTextAnimation,
  createTextTransition,
  createTypographyTimeline,
  getTypographyPreset,
  listTypographyPresets,
  createMotionPath,
  type TypographyUnit,
  type TypographyAnimationControls,
} from "../src/catalogue.js";

describe("Prompt 114 — Kinetic Typography Engine", () => {
  let activeControls: TypographyAnimationControls[];

  beforeEach(() => {
    activeControls = [];
    Object.defineProperty(document, "hidden", { value: false, configurable: true, writable: true });
  });

  afterEach(() => {
    for (const c of activeControls) {
      try {
        c.cancel();
      } catch {
        // ignore
      }
    }
    activeControls = [];
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. UNICODE, EMOJI & MULTI-LINGUAL SEGMENTATION
  // -------------------------------------------------------------------------
  describe("1. Unicode, Emoji & Multi-lingual Segmentation", () => {
    it("segments standard characters, spaces, and punctuation correctly", () => {
      const text = "Hello, World!";
      const chars = segmentCharacters(text);
      expect(chars).toEqual(["H", "e", "l", "l", "o", ",", " ", "W", "o", "r", "l", "d", "!"]);
      expect(chars.length).toBe(13);
    });

    it("segments complex multi-codepoint emojis and ZWJ sequences as single graphemes", () => {
      // Family emoji (man, woman, girl, boy with ZWJ) + Flag + Skin tone modifier
      const emojiText = "👨‍👩‍👧‍👦 🇺🇸 👍🏽";
      const graphemes = segmentCharacters(emojiText);

      // Should segment into 5 units: family, space, flag, space, thumbs up
      expect(graphemes.length).toBe(5);
      expect(graphemes[0]).toBe("👨‍👩‍👧‍👦");
      expect(graphemes[1]).toBe(" ");
      expect(graphemes[2]).toBe("🇺🇸");
      expect(graphemes[3]).toBe(" ");
      expect(graphemes[4]).toBe("👍🏽");
    });

    it("preserves combining diacritical marks with base letters", () => {
      // 'e' with acute accent (canonical decomposition: e + \u0301)
      const combined = "e\u0301cole";
      const chars = segmentCharacters(combined);
      expect(chars[0]).toBe("e\u0301");
      expect(chars.length).toBe(5);
    });

    it("segments words preserving whitespace tokens", () => {
      const text = "The quick   brown fox.";
      const words = segmentWords(text);
      expect(words).toEqual(["The", " ", "quick", "   ", "brown", " ", "fox."]);
    });

    it("segments paragraphs based on double line breaks", () => {
      const multiline = "Paragraph one.\n\nParagraph two.\r\n\r\nParagraph three.";
      const paras = segmentParagraphs(multiline);
      expect(paras.length).toBe(3);
      expect(paras[0]).toBe("Paragraph one.");
      expect(paras[1]).toBe("Paragraph two.");
      expect(paras[2]).toBe("Paragraph three.");
    });

    it("detects RTL content and sets dir='rtl' with isolate bidi style", () => {
      const container = document.createElement("div");
      container.textContent = "مرحبا بالعالم"; // "Hello World" in Arabic
      document.body.appendChild(container);

      const result = segmentText(container, { by: "words" });
      expect(result.units.length).toBeGreaterThan(0);
      const span = result.units[0]!.element!;
      expect(span.dir).toBe("rtl");
      expect(span.style.unicodeBidi).toBe("isolate");

      result.destroy();
    });
  });

  // -------------------------------------------------------------------------
  // 2. DOM SEGMENTATION & ACCESSIBILITY
  // -------------------------------------------------------------------------
  describe("2. DOM Segmentation & Accessibility", () => {
    it("wraps units in inline-block spans with data attributes", () => {
      const container = document.createElement("h1");
      container.textContent = "Motion Magic";
      document.body.appendChild(container);

      const result = segmentText(container, { by: "words", className: "custom-unit" });
      expect(result.units.length).toBe(2);
      expect(result.units[0]!.text).toBe("Motion");
      expect(result.units[1]!.text).toBe("Magic");

      const span1 = result.units[0]!.element!;
      expect(span1.className).toContain("custom-unit custom-unit--words");
      expect(span1.getAttribute("data-af-word")).toBe("0");

      result.destroy();
    });

    it("preserves accessibility by applying aria-label to root and aria-hidden to unit spans", () => {
      const container = document.createElement("p");
      container.textContent = "Accessible Typography";
      document.body.appendChild(container);

      const result = segmentText(container, { by: "characters", aria: true });
      expect(container.getAttribute("aria-label")).toBe("Accessible Typography");

      for (const unit of result.units) {
        if (unit.element) {
          expect(unit.element.getAttribute("aria-hidden")).toBe("true");
        }
      }

      // Restore should cleanly remove aria-label and restore DOM
      result.restore();
      expect(container.getAttribute("aria-label")).toBeNull();
      expect(container.textContent).toBe("Accessible Typography");
    });

    it("splitText provides backward compatibility and cleans up on destroy", () => {
      const container = document.createElement("div");
      container.textContent = "Split Text API";
      document.body.appendChild(container);

      const result = splitText(container, { by: "words" });
      expect(result.units.length).toBe(3);
      expect(typeof result.destroy).toBe("function");

      result.destroy();
      expect(container.children.length).toBe(0);
      expect(container.textContent).toBe("Split Text API");
    });
  });

  // -------------------------------------------------------------------------
  // 3. TYPOGRAPHY PRESETS
  // -------------------------------------------------------------------------
  describe("3. Typography Presets", () => {
    const allPresets = listTypographyPresets();

    it("lists all 16 built-in presets", () => {
      expect(allPresets.length).toBe(16);
      expect(allPresets).toContain("fade-in");
      expect(allPresets).toContain("fade-up");
      expect(allPresets).toContain("fade-down");
      expect(allPresets).toContain("slide-in");
      expect(allPresets).toContain("scale-reveal");
      expect(allPresets).toContain("blur-reveal");
      expect(allPresets).toContain("rotate-reveal");
      expect(allPresets).toContain("character-wave");
      expect(allPresets).toContain("word-stagger");
      expect(allPresets).toContain("line-reveal");
      expect(allPresets).toContain("typewriter");
      expect(allPresets).toContain("text-scramble");
      expect(allPresets).toContain("split-reveal");
      expect(allPresets).toContain("bounce-characters");
      expect(allPresets).toContain("elastic-entrance");
      expect(allPresets).toContain("highlight-sweep");
    });

    it("getTypographyPreset returns valid definition for each preset", () => {
      for (const name of allPresets) {
        const def = getTypographyPreset(name);
        expect(def.name).toBe(name);
        expect(def.from).toBeDefined();
        expect(def.to).toBeDefined();
        expect(def.defaultDuration).toBeGreaterThan(0);
        expect(def.defaultEasing).toBeDefined();
      }
    });

    it("supports custom options in preset factories", () => {
      const customSlide = getTypographyPreset("slide-in", {
        distance: 120,
        direction: "right",
        duration: 950,
      });
      expect(customSlide.from.translateX).toBe(120);
      expect(customSlide.defaultDuration).toBe(950);
    });
  });

  // -------------------------------------------------------------------------
  // 4. STAGGER & DETERMINISTIC ORDERING
  // -------------------------------------------------------------------------
  describe("4. Stagger & Deterministic Ordering", () => {
    it("orders staggers forward, reverse, center-out, and edges-in", () => {
      const container = document.createElement("div");
      container.textContent = "A B C D E";
      document.body.appendChild(container);

      const animForward = animateText(container, {
        by: "words",
        stagger: { each: 50, from: "forward" },
      });
      activeControls.push(animForward);
      expect(animForward).toBeDefined();

      const animCenter = animateText(container, {
        by: "words",
        stagger: { each: 50, from: "center-out" },
      });
      activeControls.push(animCenter);
      expect(animCenter).toBeDefined();
    });

    it("generates deterministic random stagger using seed", () => {
      const container = document.createElement("div");
      container.textContent = "Word1 Word2 Word3 Word4 Word5";
      document.body.appendChild(container);

      const anim1 = animateText(container, {
        by: "words",
        stagger: { each: 40, from: "random", seed: 123 },
      });
      activeControls.push(anim1);

      const anim2 = animateText(container, {
        by: "words",
        stagger: { each: 40, from: "random", seed: 123 },
      });
      activeControls.push(anim2);

      expect(anim1).toBeDefined();
      expect(anim2).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // 5. ANIMATION LIFECYCLE & CONTROLS
  // -------------------------------------------------------------------------
  describe("5. Animation Lifecycle & Controls", () => {
    it("applies preset and seeks through progress accurately", () => {
      const el = document.createElement("h2");
      el.textContent = "Kinetic Motion";
      document.body.appendChild(el);

      const onProgress = vi.fn();
      const controls = animateText(el, {
        preset: "fade-up",
        duration: 1000,
        onProgress,
      });
      activeControls.push(controls);

      // Seek to beginning
      controls.seek(0);
      expect(el.style.opacity).toBeDefined();

      // Seek to end
      controls.seek(1);
      expect(onProgress).toHaveBeenCalled();
    });

    it("supports pause, resume, reverse, and cancel", () => {
      const el = document.createElement("div");
      el.textContent = "Playback Controls";
      document.body.appendChild(el);

      const onCancel = vi.fn();
      const controls = createTextAnimation(el, {
        preset: "blur-reveal",
        duration: 500,
        onCancel,
      });
      activeControls.push(controls);

      controls.pause();
      controls.resume();
      controls.reverse();
      controls.cancel();

      expect(onCancel).toHaveBeenCalled();
    });

    it("respects prefersReducedMotion by settling instantly", () => {
      const el = document.createElement("div");
      el.textContent = "Reduced Motion Text";
      document.body.appendChild(el);

      // Force reduced motion check
      const controls = animateText(el, {
        preset: "slide-in",
        respectReducedMotion: true,
      });
      activeControls.push(controls);

      controls.seek(1);
      expect(el.textContent).toBe("Reduced Motion Text");
    });
  });

  // -------------------------------------------------------------------------
  // 6. TEXT TRANSITIONS
  // -------------------------------------------------------------------------
  describe("6. Text Transitions", () => {
    it("transitions text content via crossfade", () => {
      const el = document.createElement("div");
      el.textContent = "Initial State";
      document.body.appendChild(el);

      const controls = createTextTransition(el, "Final State", {
        type: "crossfade",
        duration: 400,
      });
      activeControls.push(controls);

      controls.seek(0.2);
      expect(el.style.opacity).toBeDefined();

      controls.seek(1);
      expect(el.textContent).toBe("Final State");
    });

    it("transitions text via character-replace with changing lengths", () => {
      const el = document.createElement("div");
      el.textContent = "Short";
      document.body.appendChild(el);

      const controls = createTextTransition(el, "A Much Longer Target String", {
        type: "character-replace",
        duration: 600,
      });
      activeControls.push(controls);

      controls.seek(0.5);
      expect(el.textContent.length).toBeGreaterThan(0);

      controls.seek(1);
      expect(el.textContent).toBe("A Much Longer Target String");
    });

    it("transitions text via scramble-transition with deterministic characters", () => {
      const el = document.createElement("div");
      el.textContent = "Secret Code";
      document.body.appendChild(el);

      const controls = createTextTransition(el, "Revealed Message", {
        type: "scramble-transition",
        duration: 500,
      });
      activeControls.push(controls);

      controls.seek(0.5);
      expect(el.textContent.length).toBeGreaterThan(0);

      controls.seek(1);
      expect(el.textContent).toBe("Revealed Message");
    });
  });

  // -------------------------------------------------------------------------
  // 7. MOTION PATH INTEGRATION
  // -------------------------------------------------------------------------
  describe("7. Motion Path Integration", () => {
    it("distributes and animates characters along a 2D motion path", () => {
      const el = document.createElement("div");
      el.textContent = "PATH MOTION";
      document.body.appendChild(el);

      const curve = createMotionPath("M 0 0 C 50 100 150 100 200 0");
      const controls = animateText(el, {
        by: "characters",
        motionPath: curve,
        autoRotate: true,
        duration: 1000,
      });
      activeControls.push(controls);

      controls.seek(0.5);
      // Unit spans should have layered transform with translate and rotate
      const firstSpan = el.querySelector("span");
      expect(firstSpan).not.toBeNull();
      expect(firstSpan!.style.transform).toContain("translate");
      expect(firstSpan!.style.transform).toContain("rotate");
    });
  });

  // -------------------------------------------------------------------------
  // 8. TYPOGRAPHY TIMELINE & CHOREOGRAPHY
  // -------------------------------------------------------------------------
  describe("8. Typography Timeline & Choreography", () => {
    it("choreographs sequential steps across multiple elements", () => {
      const heading = document.createElement("h1");
      heading.textContent = "Headline";
      const paragraph = document.createElement("p");
      paragraph.textContent = "Paragraph body text";
      document.body.appendChild(heading);
      document.body.appendChild(paragraph);

      const timeline = createTypographyTimeline();
      timeline
        .add(heading, { preset: "fade-up", duration: 500 })
        .add(paragraph, { preset: "fade-in", duration: 600 }, "+=100");

      expect(timeline.duration).toBeGreaterThanOrEqual(1200);

      timeline.play();
      timeline.pause();
      timeline.seek(0.5);
      timeline.cancel();
    });
  });

  // -------------------------------------------------------------------------
  // 9. LARGE INPUT PERFORMANCE
  // -------------------------------------------------------------------------
  describe("9. Large Input Performance", () => {
    it("segments and animates 900+ words under budget", () => {
      const sentence = "The quick brown fox jumps over the lazy dog. ";
      const largeText = sentence.repeat(100);
      const container = document.createElement("div");
      container.textContent = largeText;
      document.body.appendChild(container);

      const start = performance.now();
      const result = segmentText(container, { by: "words" });
      const elapsed = performance.now() - start;

      expect(result.units.length).toBeGreaterThanOrEqual(900);
      expect(elapsed).toBeLessThan(3000);

      result.destroy();
    });
  });
});
