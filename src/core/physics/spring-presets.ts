/**
 * AF Motion — Standard Spring Presets & Registry Integration
 *
 * Defines and registers calibrated spring physics presets:
 * Gentle, Smooth, Snappy, Bouncy, Stiff, Heavy, Soft, Elastic, Critical.
 */

import type { SpringPreset, SpringPresetName, AdvancedSpringConfig } from "./spring-types.js";
import { calculateDampingRatio, classifyDampingBehavior } from "./spring-math.js";
import { registerPhysicsPreset } from "./presets.js";

export const SPRING_PRESETS: Record<SpringPresetName, SpringPreset> = {
  gentle: {
    id: "gentle",
    name: "Gentle",
    description: "Soft and relaxed motion with slight overshoot.",
    behavior: "underdamped",
    config: {
      stiffness: 120,
      damping: 14,
      mass: 1.0,
      restDelta: 0.01,
      restSpeed: 0.01,
      timeScale: 1.0,
    },
  },

  smooth: {
    id: "smooth",
    name: "Smooth",
    description: "Balanced, elegant movement with minimal oscillation.",
    behavior: "underdamped",
    config: {
      stiffness: 180,
      damping: 22,
      mass: 1.0,
      restDelta: 0.01,
      restSpeed: 0.01,
      timeScale: 1.0,
    },
  },

  snappy: {
    id: "snappy",
    name: "Snappy",
    description: "Quick, energetic response for UI microinteractions.",
    behavior: "underdamped",
    config: {
      stiffness: 300,
      damping: 30,
      mass: 1.0,
      restDelta: 0.005,
      restSpeed: 0.005,
      timeScale: 1.0,
    },
  },

  bouncy: {
    id: "bouncy",
    name: "Bouncy",
    description: "Playful, pronounced oscillation and dynamic overshoot.",
    behavior: "underdamped",
    config: {
      stiffness: 200,
      damping: 10,
      mass: 1.0,
      restDelta: 0.01,
      restSpeed: 0.01,
      timeScale: 1.0,
    },
  },

  stiff: {
    id: "stiff",
    name: "Stiff",
    description: "High tension, rigid response with rapid settling.",
    behavior: "underdamped",
    config: {
      stiffness: 400,
      damping: 35,
      mass: 1.0,
      restDelta: 0.005,
      restSpeed: 0.005,
      timeScale: 1.0,
    },
  },

  heavy: {
    id: "heavy",
    name: "Heavy",
    description: "High mass inertia with weighty momentum.",
    behavior: "underdamped",
    config: {
      stiffness: 150,
      damping: 25,
      mass: 2.0,
      restDelta: 0.01,
      restSpeed: 0.01,
      timeScale: 1.0,
    },
  },

  soft: {
    id: "soft",
    name: "Soft",
    description: "Subtle and cushiony movement.",
    behavior: "underdamped",
    config: {
      stiffness: 100,
      damping: 18,
      mass: 1.0,
      restDelta: 0.01,
      restSpeed: 0.01,
      timeScale: 1.0,
    },
  },

  elastic: {
    id: "elastic",
    name: "Elastic",
    description: "Very low damping with prolonged harmonic reverberation.",
    behavior: "underdamped",
    config: {
      stiffness: 250,
      damping: 8,
      mass: 1.0,
      restDelta: 0.01,
      restSpeed: 0.01,
      timeScale: 1.0,
    },
  },

  critical: {
    id: "critical",
    name: "Critical",
    description: "Critically damped spring: fastest possible convergence with zero overshoot.",
    behavior: "critically-damped",
    config: {
      stiffness: 170,
      damping: 26.0768, // 2 * sqrt(170 * 1)
      mass: 1.0,
      restDelta: 0.01,
      restSpeed: 0.01,
      timeScale: 1.0,
    },
  },
};

// Register each spring preset into the central physics preset architecture
for (const preset of Object.values(SPRING_PRESETS)) {
  registerPhysicsPreset({
    id: `spring-${preset.id}`,
    name: `Spring: ${preset.name}`,
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
 * Retrieves a registered spring preset by name or identifier.
 */
export function getSpringPreset(idOrName: string): SpringPreset | undefined {
  const normalized = idOrName.toLowerCase().trim().replace(/^spring-/, "") as SpringPresetName;
  return SPRING_PRESETS[normalized];
}

/**
 * Returns a list of all 9 registered spring presets.
 */
export function listSpringPresets(): readonly SpringPreset[] {
  return Object.values(SPRING_PRESETS);
}

/**
 * Computes the critical damping coefficient for any given stiffness and mass:
 *   c_crit = 2 * sqrt(k * m)
 */
export function calculateCriticalDamping(stiffness: number, mass: number): number {
  if (stiffness <= 0 || mass <= 0) return 0;
  return 2 * Math.sqrt(stiffness * mass);
}

/**
 * Default fallback spring parameters.
 */
export const DEFAULT_SPRING_CONFIG: Required<AdvancedSpringConfig> = {
  stiffness: 170,
  damping: 26,
  mass: 1.0,
  from: 0,
  target: 1,
  initialVelocity: 0,
  restDelta: 0.01,
  restSpeed: 0.01,
  timestep: 1 / 60,
  integrator: "semi-implicit-euler",
  timeScale: 1.0,
  maxSubSteps: 10,
  precision: 1e-5,
  maxDuration: 0, // 0 = no timeout
  autoStart: false,
  respectReducedMotion: true,
};

/**
 * Resolves a partial configuration or preset identifier into a complete AdvancedSpringConfig.
 */
export function resolveSpringConfig(
  presetOrConfig?: SpringPresetName | string | Partial<AdvancedSpringConfig>
): Required<AdvancedSpringConfig> {
  if (typeof presetOrConfig === "string") {
    const preset = getSpringPreset(presetOrConfig);
    if (preset) {
      return {
        ...DEFAULT_SPRING_CONFIG,
        ...preset.config,
      };
    }
  }

  if (presetOrConfig && typeof presetOrConfig === "object") {
    return {
      ...DEFAULT_SPRING_CONFIG,
      ...presetOrConfig,
    };
  }

  return { ...DEFAULT_SPRING_CONFIG };
}
