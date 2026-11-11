/**
 * AF Motion — 3D World Presets
 *
 * Pre-engineered cohesive environmental biomes, atmospheric lighting,
 * and hydrology presets composing existing terrain and simulation engines.
 */

import type { WorldPreset, World3DConfig } from "./types.js";

/**
 * Returns complete configuration for a named world preset.
 */
export function createWorldPreset(preset: WorldPreset, overrides: World3DConfig = {}): World3DConfig {
  switch (preset) {
    case "alpine-landscape":
      return {
        id: "world-alpine",
        preset,
        width: 256,
        length: 256,
        terrain: {
          preset: "mountain-ranges",
          resolutionX: 64,
          resolutionZ: 64,
          hydraulicErosion: { dropletCount: 2000 },
          thermalErosion: { iterations: 2 },
        },
        hydrology: {
          seaLevel: -5,
          enableRivers: true,
          riverCount: 3,
          waterColor: [0.08, 0.38, 0.65],
        },
        lighting: {
          initialTimeHours: 10.5,
          hazeDensity: 0.1,
          fogNear: 80,
          fogFar: 600,
        },
        environment: {
          initialWeather: "clear",
          windSpeed: 8,
          temperatureCelsius: 9,
          relativeHumidity: 0.45,
        },
        ...overrides,
      };

    case "dense-forest":
      return {
        id: "world-dense-forest",
        preset,
        width: 200,
        length: 200,
        terrain: {
          preset: "rolling-hills",
          resolutionX: 64,
          resolutionZ: 64,
          hydraulicErosion: true,
        },
        hydrology: {
          seaLevel: -2,
          enableRivers: true,
          riverCount: 2,
          waterColor: [0.15, 0.4, 0.35],
        },
        population: {
          autoClusterCount: 6,
        },
        lighting: {
          initialTimeHours: 8.5,
          hazeDensity: 0.25,
          fogNear: 25,
          fogFar: 280,
        },
        environment: {
          initialWeather: "cloudy",
          windSpeed: 4,
          temperatureCelsius: 18,
          relativeHumidity: 0.8,
        },
        ...overrides,
      };

    case "desert-world":
      return {
        id: "world-desert",
        preset,
        width: 256,
        length: 256,
        terrain: {
          preset: "canyons",
          resolutionX: 64,
          resolutionZ: 64,
          thermalErosion: { iterations: 3, talusAngleDegrees: 32 },
        },
        hydrology: {
          seaLevel: -30,
          enableRivers: false,
          waterColor: [0.2, 0.5, 0.6],
        },
        lighting: {
          initialTimeHours: 13.0,
          hazeDensity: 0.3,
          fogNear: 100,
          fogFar: 750,
        },
        environment: {
          initialWeather: "clear",
          windSpeed: 6,
          temperatureCelsius: 39,
          relativeHumidity: 0.15,
        },
        ...overrides,
      };

    case "tropical-island":
      return {
        id: "world-tropical-island",
        preset,
        width: 220,
        length: 220,
        terrain: {
          preset: "islands",
          resolutionX: 64,
          resolutionZ: 64,
        },
        hydrology: {
          seaLevel: 0,
          enableLakes: true,
          waterColor: [0.05, 0.65, 0.75],
          waterOpacity: 0.8,
        },
        lighting: {
          initialTimeHours: 14.5,
          hazeDensity: 0.12,
          fogNear: 150,
          fogFar: 800,
        },
        environment: {
          initialWeather: "clear",
          windSpeed: 7,
          temperatureCelsius: 29,
          relativeHumidity: 0.72,
        },
        ...overrides,
      };

    case "snow-mountains":
      return {
        id: "world-snow-mountains",
        preset,
        width: 256,
        length: 256,
        terrain: {
          preset: "mountain-ranges",
          resolutionX: 64,
          resolutionZ: 64,
          hydraulicErosion: { dropletCount: 1500 },
        },
        hydrology: {
          seaLevel: -10,
          waterColor: [0.1, 0.3, 0.55],
        },
        lighting: {
          initialTimeHours: 12.0,
          hazeDensity: 0.18,
          fogNear: 50,
          fogFar: 450,
        },
        environment: {
          initialWeather: "snow",
          windSpeed: 12,
          temperatureCelsius: -7,
          relativeHumidity: 0.6,
        },
        ...overrides,
      };

    case "rolling-grasslands":
      return {
        id: "world-rolling-grasslands",
        preset,
        width: 200,
        length: 200,
        terrain: {
          preset: "rolling-hills",
          resolutionX: 48,
          resolutionZ: 48,
        },
        hydrology: {
          seaLevel: -4,
          enableRivers: true,
          riverCount: 2,
          waterColor: [0.1, 0.45, 0.65],
        },
        lighting: {
          initialTimeHours: 17.5, // Golden hour sunset
          hazeDensity: 0.15,
          fogNear: 70,
          fogFar: 500,
        },
        environment: {
          initialWeather: "clear",
          windSpeed: 5,
          temperatureCelsius: 22,
          relativeHumidity: 0.5,
        },
        ...overrides,
      };

    case "volcanic-landscape":
      return {
        id: "world-volcanic",
        preset,
        width: 240,
        length: 240,
        terrain: {
          preset: "craters",
          resolutionX: 64,
          resolutionZ: 64,
          thermalErosion: { iterations: 3 },
        },
        hydrology: {
          seaLevel: -20,
          waterColor: [0.35, 0.18, 0.12], // Mineral/acidic springs
        },
        lighting: {
          initialTimeHours: 19.5, // Dusk
          hazeDensity: 0.45,
          fogNear: 30,
          fogFar: 300,
        },
        environment: {
          initialWeather: "fog",
          windSpeed: 6,
          temperatureCelsius: 34,
          relativeHumidity: 0.3,
        },
        ...overrides,
      };

    case "fantasy-world":
      return {
        id: "world-fantasy",
        preset,
        width: 256,
        length: 256,
        terrain: {
          preset: "archipelagos",
          resolutionX: 64,
          resolutionZ: 64,
          hydraulicErosion: true,
        },
        hydrology: {
          seaLevel: 0,
          enableRivers: true,
          riverCount: 3,
          waterColor: [0.2, 0.7, 0.8],
        },
        lighting: {
          initialTimeHours: 18.5, // Twilight purple/gold
          hazeDensity: 0.2,
          fogNear: 60,
          fogFar: 550,
        },
        environment: {
          initialWeather: "clear",
          windSpeed: 7,
          temperatureCelsius: 21,
          relativeHumidity: 0.65,
        },
        ...overrides,
      };

    default:
      return {
        id: "world-custom",
        preset: "custom",
        width: 200,
        length: 200,
        terrain: { preset: "rolling-hills" },
        ...overrides,
      };
  }
}
