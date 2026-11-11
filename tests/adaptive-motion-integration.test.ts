import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ADAPTIVE_MOTION_SCHEMA_VERSION,
  adaptAnimationOptions,
  detectRuntimeContext,
  disableAdaptiveMotion,
  enableAdaptiveMotion,
  getAdaptiveMotionConfig,
  inspectAdaptiveMotion,
  isAdaptiveMotionEnabled,
  resetAdaptiveMotionConfig,
  resolveAdaptiveMotion,
  setAdaptiveMotionConfig,
  setAdaptiveMotionEnabled,
  subscribeAdaptiveMotion,
  type AdaptiveMotionConditions,
  type RuntimeContext,
} from "../src/core/adaptive-motion.js";
import { applyAdaptivePreset, applyPreset, getPreset, resolvePresetAnimation } from "../src/presets.js";
import { runRecipe, type DeclarativeMotionRecipe } from "../src/core/motion-recipe.js";
import { createMotionChoreography } from "../src/core/motion-choreography.js";
import { composeEffects } from "../src/core/effect-composer.js";
import { animate } from "../src/core/animate.js";
import { applyMotionDNA, registerMotionDNA, removeMotionDNA } from "../src/core/motion-dna.js";

class FakeStyle {
  values = new Map<string, string>();
  setProperty(name: string, value: string): void {
    this.values.set(name, value);
  }
  get(name: string): string | undefined {
    return this.values.get(name);
  }
}

class FakeHTMLElement {
  style = new FakeStyle();
}

let frames: Map<number, FrameRequestCallback>;
let nextId: number;
let clockTime: number;

function flushFrame(time: number): void {
  clockTime = time;
  const callbacks = [...frames.values()];
  frames.clear();
  for (const callback of callbacks) callback(time);
}

function makeElement(): HTMLElement {
  return new FakeHTMLElement() as unknown as HTMLElement;
}

describe("Adaptive Motion Unified Intelligence Layer", () => {
  beforeEach(() => {
    resetAdaptiveMotionConfig();
    frames = new Map();
    nextId = 1;
    clockTime = 0;
    vi.stubGlobal("performance", { now: () => clockTime } as Performance);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      const id = nextId++;
      frames.set(id, callback);
      return id;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
    vi.stubGlobal("HTMLElement", FakeHTMLElement);
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      media: "",
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    }));
  });

  afterEach(() => {
    resetAdaptiveMotionConfig();
    removeMotionDNA("testAdaptiveDNA");
    vi.unstubAllGlobals();
    frames.clear();
  });

  describe("Schema and Runtime Context Detection", () => {
    it("exposes schema version 1.0.0", () => {
      expect(ADAPTIVE_MOTION_SCHEMA_VERSION).toBe("1.0.0");
    });

    it("detects runtime context with conservative defaults in SSR/headless", () => {
      const context = detectRuntimeContext();
      expect(typeof context.reducedMotion).toBe("boolean");
      expect(typeof context.lowPower).toBe("boolean");
      expect(typeof context.hardwareConcurrency).toBe("number");
      expect(typeof context.viewportWidth).toBe("number");
      expect(typeof context.isMobile).toBe("boolean");
      expect(Object.isFrozen(context)).toBe(true);
    });

    it("allows context overrides for testing and simulation", () => {
      const context = detectRuntimeContext({
        lowPower: true,
        isMobile: true,
        viewportWidth: 375,
      });
      expect(context.lowPower).toBe(true);
      expect(context.isMobile).toBe(true);
      expect(context.viewportWidth).toBe(375);
    });
  });

  describe("Configuration, Enabling, and Inspection", () => {
    it("supports getting, updating, and resetting configuration", () => {
      const initial = getAdaptiveMotionConfig();
      expect(initial.enabled).toBe(true);
      expect(initial.intensity).toBe(1.0);

      setAdaptiveMotionConfig({
        intensity: 0.8,
        lowPowerIntensity: 0.4,
      });

      const updated = getAdaptiveMotionConfig();
      expect(updated.intensity).toBe(0.8);
      expect(updated.lowPowerIntensity).toBe(0.4);

      resetAdaptiveMotionConfig();
      expect(getAdaptiveMotionConfig().intensity).toBe(1.0);
    });

    it("supports explicit enable and disable controls", () => {
      expect(isAdaptiveMotionEnabled()).toBe(true);
      disableAdaptiveMotion();
      expect(isAdaptiveMotionEnabled()).toBe(false);
      enableAdaptiveMotion();
      expect(isAdaptiveMotionEnabled()).toBe(true);
      setAdaptiveMotionEnabled(false);
      expect(isAdaptiveMotionEnabled()).toBe(false);
    });

    it("inspects current adaptive motion state with effective intensity resolution", () => {
      setAdaptiveMotionConfig({
        intensity: 0.75,
        lowPowerIntensity: 0.5,
      });

      const normalState = inspectAdaptiveMotion();
      expect(normalState.enabled).toBe(true);
      expect(normalState.effectiveIntensity).toBe(0.75);

      const lowPowerState = inspectAdaptiveMotion({ lowPower: true });
      expect(lowPowerState.effectiveIntensity).toBe(0.5);

      const overrideState = inspectAdaptiveMotion({ intensity: 0.25 });
      expect(overrideState.effectiveIntensity).toBe(0.25);
    });
  });

  describe("Deterministic Precedence", () => {
    it("strictly enforces accessibility/reduced-motion over runtime overrides", () => {
      vi.stubGlobal("matchMedia", (q: string) => ({
        matches: q.includes("prefers-reduced-motion"),
        media: q,
      }));

      // When reduced motion is detected, adaptAnimationOptions forces respectReducedMotion: true
      const adapted = adaptAnimationOptions({
        duration: 400,
        respectReducedMotion: false, // Attempt to bypass accessibility
      });

      expect(adapted.respectReducedMotion).toBe(true);
    });

    it("respects reducedMotion: 'ignore' only when explicitly configured by user", () => {
      vi.stubGlobal("matchMedia", (q: string) => ({
        matches: q.includes("prefers-reduced-motion"),
        media: q,
      }));

      setAdaptiveMotionConfig({ reducedMotion: "ignore" });
      const adapted = adaptAnimationOptions({
        duration: 400,
        respectReducedMotion: false,
      });
      expect(adapted.respectReducedMotion).toBe(false);
    });

    it("follows hierarchy: Accessibility > Adaptive Intensity > DNA Defaults > Preset Defaults > Overrides", () => {
      registerMotionDNA("testAdaptiveDNA", {
        duration: 300,
        easing: "easeOutQuad",
      });

      // 1. Preset defaults
      const rawPreset = getPreset("fadeIn")!;
      expect(rawPreset.animation.duration).toBe(400);

      // 2. Preset with Motion DNA
      const dnaPreset = resolvePresetAnimation("fadeIn", { motionDNA: "testAdaptiveDNA" });
      expect(dnaPreset.options.duration).toBe(300);

      // 3. Preset with Motion DNA + Adaptive condition (intensity 0.5 doubles duration: 300 / 0.5 = 600)
      const adaptedPreset = resolvePresetAnimation("fadeIn", {
        motionDNA: "testAdaptiveDNA",
        adaptive: { intensity: 0.5 },
      });
      expect(adaptedPreset.options.duration).toBe(600);

      // 4. Direct duration override wins over base timing, but adaptive intensity scales the override:
      // duration 200 / intensity 0.5 = 400
      const overriddenPreset = resolvePresetAnimation("fadeIn", {
        motionDNA: "testAdaptiveDNA",
        duration: 200,
        adaptive: { intensity: 0.5 },
      });
      expect(overriddenPreset.options.duration).toBe(400);
    });
  });

  describe("Subscriptions and Clean Teardown", () => {
    it("notifies subscribers when configuration changes and cleans up on unsubscribe", () => {
      const notifications: number[] = [];
      const unsubscribe = subscribeAdaptiveMotion((state) => {
        notifications.push(state.effectiveIntensity);
      });

      setAdaptiveMotionConfig({ intensity: 0.8 });
      setAdaptiveMotionConfig({ intensity: 0.6 });

      expect(notifications.length).toBe(2);
      expect(notifications[0]).toBe(0.8);
      expect(notifications[1]).toBe(0.6);

      // After unsubscribe, no further notifications occur
      unsubscribe();
      setAdaptiveMotionConfig({ intensity: 0.4 });
      expect(notifications.length).toBe(2);

      // Calling unsubscribe again is a safe no-op
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe("Integration Across Systems", () => {
    it("integrates with core animate() via options.adaptive", () => {
      const el = makeElement();
      // intensity 0.5 doubles duration from 200ms to 400ms
      const anim = animate(el, { opacity: [0, 1] }, {
        duration: 200,
        adaptive: { intensity: 0.5 },
      });

      expect(anim).toBeDefined();
      expect(typeof anim.cancel).toBe("function");
      flushFrame(16);
      anim.cancel();
    });

    it("integrates with presets via applyAdaptivePreset()", () => {
      const el = makeElement();
      const anim = applyAdaptivePreset(el, "fadeIn", { lowPower: true }, { duration: 300 });
      expect(anim).toBeDefined();
      flushFrame(16);
      anim.cancel();
    });

    it("integrates with Motion DNA and adaptAnimationOptions", () => {
      const dna = applyMotionDNA("snappy");
      expect(dna.duration).toBe(200);

      // Adapt with lowPower: true (lowPowerIntensity 0.6: 200 / 0.6 = ~333ms)
      const adapted = adaptAnimationOptions(dna, { lowPower: true });
      expect(adapted.duration).toBe(Math.round(200 / 0.6));
    });

    it("integrates with declarative motion recipes", () => {
      const el = makeElement();
      const recipe: DeclarativeMotionRecipe = {
        id: "test-adaptive-recipe",
        name: "testAdaptiveRecipe",
        description: "Declarative recipe with adaptive conditions",
        steps: [{ preset: "fadeIn", target: el, duration: 200 }],
      };

      const controls = runRecipe(recipe, {
        adaptive: { intensity: 0.5 },
      });

      controls.finished?.catch(() => {});
      expect(controls).toBeDefined();
      controls.cancel();
    });

    it("integrates with motion choreography via action.adaptive", () => {
      const el = makeElement();
      const choreography = createMotionChoreography([
        {
          type: "animation",
          target: el,
          properties: { opacity: [0, 1] },
          options: { duration: 200 },
          adaptive: { intensity: 0.5 },
        },
      ]);

      expect(choreography).toBeDefined();
      choreography.finished.catch(() => {});
      flushFrame(16);
      choreography.cancel();
    });

    it("integrates with effect composer via entry.adaptive", () => {
      let receivedDuration = 0;
      const controls = composeEffects([
        {
          start: (options) => {
            receivedDuration = options.duration ?? 0;
            return { destroy: () => {} };
          },
          motionDNA: { name: "snappy" },
          adaptive: { intensity: 0.5 },
        },
      ]);

      expect(controls).toBeDefined();
      // snappy duration 200 / intensity 0.5 = 400
      expect(receivedDuration).toBe(400);
      controls.destroy();
    });
  });

  describe("Validation of Invalid Configuration", () => {
    it("rejects invalid intensity values in setAdaptiveMotionConfig", () => {
      expect(() => setAdaptiveMotionConfig({ intensity: -1 })).toThrow(/intensity/);
      expect(() => setAdaptiveMotionConfig({ intensity: 0 })).toThrow(/intensity/);
      expect(() => setAdaptiveMotionConfig({ intensity: 3 })).toThrow(/intensity/);
      expect(() => setAdaptiveMotionConfig({ lowPowerIntensity: 0 })).toThrow(/lowPowerIntensity/);
      expect(() => setAdaptiveMotionConfig({ mobileIntensity: -0.5 })).toThrow(/mobileIntensity/);
      expect(() => setAdaptiveMotionConfig({ reducedMotion: "invalid" as any })).toThrow(/reducedMotion/);
      expect(() => setAdaptiveMotionConfig({ enabled: "yes" as any })).toThrow(/enabled/);
      expect(() => setAdaptiveMotionConfig(null as any)).toThrow(/object/);
    });

    it("rejects invalid options passed to adaptAnimationOptions", () => {
      expect(() => adaptAnimationOptions(null as any)).toThrow(/object/);
      expect(() => adaptAnimationOptions([] as any)).toThrow(/object/);
    });

    it("rejects invalid listener passed to subscribeAdaptiveMotion", () => {
      expect(() => subscribeAdaptiveMotion(null as any)).toThrow(/function/);
      expect(() => subscribeAdaptiveMotion("not-a-fn" as any)).toThrow(/function/);
    });
  });

  describe("Backward Compatibility", () => {
    it("preserves resolveAdaptiveMotion() behavior and validations", () => {
      registerMotionDNA("adaptiveBaseline", {
        duration: 200,
        delay: 20,
        easing: "easeOutQuad",
      });

      expect(resolveAdaptiveMotion({
        motionDNA: "adaptiveBaseline",
        intensity: 0.8,
        lowPowerIntensity: 0.5,
      }, { lowPower: true })).toEqual({
        duration: 400,
        delay: 20,
        easing: "easeOutQuad",
      });

      removeMotionDNA("adaptiveBaseline");
    });
  });
});
