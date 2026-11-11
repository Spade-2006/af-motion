/**
 * AF Motion — Foundational Physics Presets
 *
 * Built-in presets for common simulation frequencies, precision thresholds,
 * and playback speeds.
 */

import type { PhysicsConfiguration, PhysicsPreset } from "./types.js";

export const PHYSICS_PRESET_STANDARD: PhysicsPreset = {
  id: "standard",
  name: "Standard 60Hz",
  description: "Standard web animation physics running at 60Hz with semi-implicit Euler integration.",
  config: {
    timestep: 1 / 60,
    timeScale: 1.0,
    maxSubSteps: 10,
    precision: 1e-5,
    integrator: "semi-implicit-euler",
    autoStart: false,
    respectReducedMotion: true,
  },
};

export const PHYSICS_PRESET_HIGH_PRECISION: PhysicsPreset = {
  id: "high-precision",
  name: "High Precision 120Hz",
  description: "Ultra-smooth high-frequency 120Hz simulation using 4th-order Runge-Kutta (RK4) integration.",
  config: {
    timestep: 1 / 120,
    timeScale: 1.0,
    maxSubSteps: 20,
    precision: 1e-6,
    integrator: "rk4",
    autoStart: false,
    respectReducedMotion: true,
  },
};

export const PHYSICS_PRESET_LOW_OVERHEAD: PhysicsPreset = {
  id: "low-overhead",
  name: "Low Overhead 30Hz",
  description: "Lightweight 30Hz simulation optimized for low-power mobile devices and battery saving.",
  config: {
    timestep: 1 / 30,
    timeScale: 1.0,
    maxSubSteps: 5,
    precision: 1e-4,
    integrator: "semi-implicit-euler",
    autoStart: false,
    respectReducedMotion: true,
  },
};

export const PHYSICS_PRESET_BULLET_TIME: PhysicsPreset = {
  id: "bullet-time",
  name: "Bullet Time (0.25x)",
  description: "Slow-motion physics progression running at 0.25x speed.",
  config: {
    timestep: 1 / 60,
    timeScale: 0.25,
    maxSubSteps: 10,
    precision: 1e-5,
    integrator: "semi-implicit-euler",
    autoStart: false,
    respectReducedMotion: true,
  },
};

export const PHYSICS_PRESET_FAST_FORWARD: PhysicsPreset = {
  id: "fast-forward",
  name: "Fast Forward (2.0x)",
  description: "Accelerated physics progression running at 2.0x speed with increased catch-up bounds.",
  config: {
    timestep: 1 / 60,
    timeScale: 2.0,
    maxSubSteps: 15,
    precision: 1e-5,
    integrator: "semi-implicit-euler",
    autoStart: false,
    respectReducedMotion: true,
  },
};

const builtinPresets: Map<string, PhysicsPreset> = new Map([
  [PHYSICS_PRESET_STANDARD.id, PHYSICS_PRESET_STANDARD],
  [PHYSICS_PRESET_HIGH_PRECISION.id, PHYSICS_PRESET_HIGH_PRECISION],
  [PHYSICS_PRESET_LOW_OVERHEAD.id, PHYSICS_PRESET_LOW_OVERHEAD],
  [PHYSICS_PRESET_BULLET_TIME.id, PHYSICS_PRESET_BULLET_TIME],
  [PHYSICS_PRESET_FAST_FORWARD.id, PHYSICS_PRESET_FAST_FORWARD],
]);

/**
 * Retrieves a registered physics preset by ID or name.
 */
export function getPhysicsPreset(idOrName: string): PhysicsPreset | undefined {
  const normalized = idOrName.toLowerCase().trim();
  return (
    builtinPresets.get(normalized) ??
    Array.from(builtinPresets.values()).find(
      (p) => p.name.toLowerCase() === normalized
    )
  );
}

/**
 * Returns a list of all available physics presets.
 */
export function listPhysicsPresets(): readonly PhysicsPreset[] {
  return Array.from(builtinPresets.values());
}

/**
 * Registers a new custom physics preset.
 */
export function registerPhysicsPreset(preset: PhysicsPreset): void {
  builtinPresets.set(preset.id.toLowerCase().trim(), preset);
}

/**
 * Resolves a partial configuration or preset identifier into a full PhysicsConfiguration.
 */
export function resolvePhysicsConfig(
  presetOrConfig?: string | Partial<PhysicsConfiguration>
): Required<PhysicsConfiguration> {
  if (typeof presetOrConfig === "string") {
    const preset = getPhysicsPreset(presetOrConfig);
    if (preset) {
      return { ...preset.config };
    }
  }

  const base = { ...PHYSICS_PRESET_STANDARD.config };
  if (presetOrConfig && typeof presetOrConfig === "object") {
    return {
      ...base,
      ...presetOrConfig,
    };
  }
  return base;
}
