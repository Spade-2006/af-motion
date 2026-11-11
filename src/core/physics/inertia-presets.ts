/**
 * AF Motion — Inertia, Momentum, Friction & Gravity Presets
 *
 * Defines and registers standard presets for inertia simulations:
 * Natural, Heavy, Light, High Friction, Low Friction, Air Resistance,
 * Gravity, Zero Gravity, and Fast Deceleration.
 */

import type { InertiaPreset, InertiaPresetName, AdvancedInertiaConfig } from "./inertia-types.js";
import { registerPhysicsPreset } from "./presets.js";

export const INERTIA_PRESETS: Record<InertiaPresetName, InertiaPreset> = {
  natural: {
    id: "natural",
    name: "Natural Inertia",
    description: "Balanced natural glide with smooth exponential deceleration.",
    config: {
      mass: 1.0,
      friction: 4.0,
      linearFriction: 0,
      drag: 0,
      gravity: 0,
      minVelocity: 0.5,
      timeScale: 1.0,
    },
  },

  heavy: {
    id: "heavy",
    name: "Heavy Inertia",
    description: "High mass with prolonged momentum and slower deceleration.",
    config: {
      mass: 3.0,
      friction: 2.0,
      linearFriction: 0,
      drag: 0.001,
      gravity: 0,
      minVelocity: 0.2,
      timeScale: 1.0,
    },
  },

  light: {
    id: "light",
    name: "Light Inertia",
    description: "Low mass with rapid decay and nimble responsiveness.",
    config: {
      mass: 0.5,
      friction: 6.0,
      linearFriction: 0,
      drag: 0,
      gravity: 0,
      minVelocity: 1.0,
      timeScale: 1.0,
    },
  },

  "high-friction": {
    id: "high-friction",
    name: "High Friction",
    description: "High viscous and kinetic friction for rapid stopping.",
    config: {
      mass: 1.0,
      friction: 10.0,
      linearFriction: 5.0,
      drag: 0,
      gravity: 0,
      minVelocity: 1.0,
      timeScale: 1.0,
    },
  },

  "low-friction": {
    id: "low-friction",
    name: "Low Friction",
    description: "Ice-like surface with minimal resistance and long glides.",
    config: {
      mass: 1.0,
      friction: 0.8,
      linearFriction: 0,
      drag: 0.0005,
      gravity: 0,
      minVelocity: 0.1,
      timeScale: 1.0,
    },
  },

  "air-resistance": {
    id: "air-resistance",
    name: "Air Resistance",
    description: "Dominant quadratic aerodynamic drag slowing fast movements rapidly.",
    config: {
      mass: 1.0,
      friction: 1.0,
      linearFriction: 0,
      drag: 0.05,
      gravity: 0,
      minVelocity: 0.5,
      timeScale: 1.0,
    },
  },

  gravity: {
    id: "gravity",
    name: "Standard Gravity",
    description: "Downwards acceleration with terminal velocity cap and atmospheric drag.",
    config: {
      mass: 1.0,
      friction: 0.5,
      linearFriction: 0,
      drag: 0.005,
      gravity: 980, // 980 px/s^2 standard web gravity downwards
      terminalVelocity: 2500,
      minVelocity: 0.5,
      timeScale: 1.0,
    },
  },

  "zero-gravity": {
    id: "zero-gravity",
    name: "Zero Gravity Space Drift",
    description: "Near-frictionless space drift with pure momentum conservation.",
    config: {
      mass: 1.0,
      friction: 0.05,
      linearFriction: 0,
      drag: 0,
      gravity: 0,
      minVelocity: 0.01,
      timeScale: 1.0,
    },
  },

  "fast-deceleration": {
    id: "fast-deceleration",
    name: "Fast Deceleration",
    description: "Instantaneous snappy stopping ideal for snappy touch flings.",
    config: {
      mass: 1.0,
      friction: 16.0,
      linearFriction: 2.0,
      drag: 0,
      gravity: 0,
      minVelocity: 2.0,
      timeScale: 1.0,
    },
  },
};

// Register each inertia preset into the central physics preset architecture
for (const preset of Object.values(INERTIA_PRESETS)) {
  registerPhysicsPreset({
    id: `inertia-${preset.id}`,
    name: `Inertia: ${preset.name}`,
    description: preset.description,
    config: {
      timestep: 1 / 60,
      timeScale: preset.config.timeScale ?? 1.0,
      maxSubSteps: 10,
      precision: 1e-5,
      integrator: "semi-implicit-euler",
      autoStart: false,
      respectReducedMotion: true,
    },
  });
}

/**
 * Retrieves a registered inertia preset by name or identifier.
 */
export function getInertiaPreset(idOrName: string): InertiaPreset | undefined {
  const normalized = idOrName.toLowerCase().trim().replace(/^inertia-/, "") as InertiaPresetName;
  return INERTIA_PRESETS[normalized];
}

/**
 * Returns a list of all 9 registered inertia presets.
 */
export function listInertiaPresets(): readonly InertiaPreset[] {
  return Object.values(INERTIA_PRESETS);
}

/**
 * Default fallback inertia parameters.
 */
export const DEFAULT_INERTIA_CONFIG: Required<AdvancedInertiaConfig> = {
  mass: 1.0,
  friction: 4.0,
  linearFriction: 0,
  drag: 0,
  gravity: 0,
  terminalVelocity: 5000,
  minVelocity: 0.5,
  from: 0,
  initialVelocity: 0,
  min: -Infinity,
  max: Infinity,
  timestep: 1 / 60,
  integrator: "semi-implicit-euler",
  timeScale: 1.0,
  maxSubSteps: 10,
  precision: 1e-5,
  autoStart: false,
  respectReducedMotion: true,
};

/**
 * Resolves a partial configuration or preset identifier into a complete AdvancedInertiaConfig.
 */
export function resolveInertiaConfig(
  presetOrConfig?: InertiaPresetName | string | Partial<AdvancedInertiaConfig>
): Required<AdvancedInertiaConfig> {
  if (typeof presetOrConfig === "string") {
    const preset = getInertiaPreset(presetOrConfig);
    if (preset) {
      return {
        ...DEFAULT_INERTIA_CONFIG,
        ...preset.config,
      };
    }
  }

  if (presetOrConfig && typeof presetOrConfig === "object") {
    return {
      ...DEFAULT_INERTIA_CONFIG,
      ...presetOrConfig,
    };
  }

  return { ...DEFAULT_INERTIA_CONFIG };
}
