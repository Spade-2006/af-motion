/**
 * AF Motion Environmental Simulation Engine — Weather Management
 *
 * Implements weather state transitions (clear, cloudy, rain, snow, storm, etc.)
 * with smooth parameter interpolation and coordinated atmospheric effects.
 */

import type {
  EnvironmentalParameters,
  EnvironmentSimulation,
  WeatherState,
  WeatherSystem,
  WeatherTransition,
} from "./types.js";

interface WeatherPreset {
  parameters: Required<EnvironmentalParameters>;
  windSpeed: number;
  rainIntensity: number;
  snowIntensity: number;
  fogDensity: number;
  cloudCoverage: number;
  lightningFrequency: number;
}

const WEATHER_PRESETS: Record<WeatherState, WeatherPreset> = {
  clear: {
    parameters: {
      temperature: 22,
      humidity: 0.35,
      visibility: 1.0,
      atmosphericDensity: 1.0,
      ambientLight: 1.0,
      skyColor: [135, 206, 235],
    },
    windSpeed: 0.8,
    rainIntensity: 0,
    snowIntensity: 0,
    fogDensity: 0,
    cloudCoverage: 0.15,
    lightningFrequency: 0,
  },
  cloudy: {
    parameters: {
      temperature: 18,
      humidity: 0.6,
      visibility: 0.88,
      atmosphericDensity: 1.1,
      ambientLight: 0.75,
      skyColor: [180, 195, 210],
    },
    windSpeed: 1.2,
    rainIntensity: 0,
    snowIntensity: 0,
    fogDensity: 0.1,
    cloudCoverage: 0.75,
    lightningFrequency: 0,
  },
  rain: {
    parameters: {
      temperature: 15,
      humidity: 0.9,
      visibility: 0.7,
      atmosphericDensity: 1.25,
      ambientLight: 0.55,
      skyColor: [120, 135, 150],
    },
    windSpeed: 2.0,
    rainIntensity: 1.0,
    snowIntensity: 0,
    fogDensity: 0.25,
    cloudCoverage: 0.85,
    lightningFrequency: 0,
  },
  "heavy-rain": {
    parameters: {
      temperature: 13,
      humidity: 0.98,
      visibility: 0.55,
      atmosphericDensity: 1.4,
      ambientLight: 0.45,
      skyColor: [90, 105, 120],
    },
    windSpeed: 3.5,
    rainIntensity: 2.0,
    snowIntensity: 0,
    fogDensity: 0.4,
    cloudCoverage: 0.95,
    lightningFrequency: 0.05,
  },
  snow: {
    parameters: {
      temperature: -2,
      humidity: 0.75,
      visibility: 0.8,
      atmosphericDensity: 1.15,
      ambientLight: 0.85,
      skyColor: [210, 220, 230],
    },
    windSpeed: 1.5,
    rainIntensity: 0,
    snowIntensity: 1.0,
    fogDensity: 0.15,
    cloudCoverage: 0.8,
    lightningFrequency: 0,
  },
  blizzard: {
    parameters: {
      temperature: -8,
      humidity: 0.85,
      visibility: 0.35,
      atmosphericDensity: 1.5,
      ambientLight: 0.6,
      skyColor: [190, 205, 220],
    },
    windSpeed: 5.0,
    rainIntensity: 0,
    snowIntensity: 2.5,
    fogDensity: 0.5,
    cloudCoverage: 1.0,
    lightningFrequency: 0,
  },
  fog: {
    parameters: {
      temperature: 10,
      humidity: 1.0,
      visibility: 0.3,
      atmosphericDensity: 1.6,
      ambientLight: 0.6,
      skyColor: [200, 205, 215],
    },
    windSpeed: 0.4,
    rainIntensity: 0,
    snowIntensity: 0,
    fogDensity: 0.85,
    cloudCoverage: 0.6,
    lightningFrequency: 0,
  },
  storm: {
    parameters: {
      temperature: 14,
      humidity: 0.95,
      visibility: 0.5,
      atmosphericDensity: 1.5,
      ambientLight: 0.35,
      skyColor: [60, 70, 85],
    },
    windSpeed: 4.5,
    rainIntensity: 2.2,
    snowIntensity: 0,
    fogDensity: 0.3,
    cloudCoverage: 1.0,
    lightningFrequency: 0.35,
  },
  firestorm: {
    parameters: {
      temperature: 45,
      humidity: 0.15,
      visibility: 0.45,
      atmosphericDensity: 1.8,
      ambientLight: 0.7,
      skyColor: [140, 50, 30],
    },
    windSpeed: 4.0,
    rainIntensity: 0,
    snowIntensity: 0,
    fogDensity: 0.2,
    cloudCoverage: 0.7,
    lightningFrequency: 0.1,
  },
  custom: {
    parameters: {
      temperature: 20,
      humidity: 0.5,
      visibility: 1.0,
      atmosphericDensity: 1.0,
      ambientLight: 1.0,
      skyColor: [135, 206, 235],
    },
    windSpeed: 1.0,
    rainIntensity: 0,
    snowIntensity: 0,
    fogDensity: 0,
    cloudCoverage: 0.5,
    lightningFrequency: 0,
  },
};

export class WeatherSystemImpl implements WeatherSystem {
  currentWeather: WeatherState;
  targetWeather: WeatherState | null = null;
  transitionProgress = 1.0;

  private activeTransition: WeatherTransition | null = null;

  constructor(initialWeather: WeatherState = "clear") {
    this.currentWeather = initialWeather;
  }

  setWeather(weather: WeatherState, durationSec = 3.0): void {
    if (weather === this.currentWeather && !this.activeTransition) return;

    if (durationSec <= 0) {
      this.currentWeather = weather;
      this.targetWeather = null;
      this.activeTransition = null;
      this.transitionProgress = 1.0;
      return;
    }

    this.targetWeather = weather;
    this.transitionProgress = 0;
    this.activeTransition = {
      from: this.currentWeather,
      to: weather,
      duration: Math.max(0.1, durationSec),
      progress: 0,
    };
  }

  update(dt: number, env: EnvironmentSimulation): void {
    if (!this.activeTransition) {
      this.applyPreset(this.currentWeather, env, 1.0);
      return;
    }

    this.activeTransition.progress += dt / this.activeTransition.duration;
    const t = Math.min(1.0, this.activeTransition.progress);
    this.transitionProgress = t;

    // Smoothstep interpolation
    const smoothT = t * t * (3 - 2 * t);

    this.interpolatePresets(this.activeTransition.from, this.activeTransition.to, smoothT, env);

    if (t >= 1.0) {
      this.currentWeather = this.activeTransition.to;
      this.targetWeather = null;
      this.activeTransition = null;
    }
  }

  private applyPreset(weather: WeatherState, env: EnvironmentSimulation, factor: number): void {
    const preset = WEATHER_PRESETS[weather];
    if (!preset) return;

    env.parameters.temperature = preset.parameters.temperature;
    env.parameters.humidity = preset.parameters.humidity;
    env.parameters.visibility = preset.parameters.visibility;
    env.parameters.atmosphericDensity = preset.parameters.atmosphericDensity;
    env.parameters.ambientLight = preset.parameters.ambientLight;
    env.parameters.skyColor = preset.parameters.skyColor;

    env.wind.speed = preset.windSpeed;

    // Synchronize attached effects
    const effects = env.getEffects();
    for (let i = 0; i < effects.length; i++) {
      const effect = effects[i]!;
      if (effect.type === "rain") {
        effect.intensity = preset.rainIntensity * factor;
      } else if (effect.type === "snow") {
        effect.intensity = preset.snowIntensity * factor;
      } else if (effect.type === "fog") {
        effect.intensity = preset.fogDensity * factor;
      } else if (effect.type === "cloud") {
        effect.intensity = preset.cloudCoverage * factor;
      } else if (effect.type === "lightning") {
        effect.intensity = preset.lightningFrequency > 0 ? 1.0 : 0;
      }
    }
  }

  private interpolatePresets(
    from: WeatherState,
    to: WeatherState,
    t: number,
    env: EnvironmentSimulation,
  ): void {
    const p0 = WEATHER_PRESETS[from] || WEATHER_PRESETS.clear;
    const p1 = WEATHER_PRESETS[to] || WEATHER_PRESETS.clear;

    const lerp = (a: number, b: number) => a + (b - a) * t;

    env.parameters.temperature = lerp(p0.parameters.temperature, p1.parameters.temperature);
    env.parameters.humidity = lerp(p0.parameters.humidity, p1.parameters.humidity);
    env.parameters.visibility = lerp(p0.parameters.visibility, p1.parameters.visibility);
    env.parameters.atmosphericDensity = lerp(
      p0.parameters.atmosphericDensity,
      p1.parameters.atmosphericDensity,
    );
    env.parameters.ambientLight = lerp(p0.parameters.ambientLight, p1.parameters.ambientLight);

    const r = Math.round(lerp(p0.parameters.skyColor[0], p1.parameters.skyColor[0]));
    const g = Math.round(lerp(p0.parameters.skyColor[1], p1.parameters.skyColor[1]));
    const b = Math.round(lerp(p0.parameters.skyColor[2], p1.parameters.skyColor[2]));
    env.parameters.skyColor = [r, g, b];

    env.wind.speed = lerp(p0.windSpeed, p1.windSpeed);

    // Coordinate effect intensities
    const rainInt = lerp(p0.rainIntensity, p1.rainIntensity);
    const snowInt = lerp(p0.snowIntensity, p1.snowIntensity);
    const fogInt = lerp(p0.fogDensity, p1.fogDensity);
    const cloudInt = lerp(p0.cloudCoverage, p1.cloudCoverage);
    const lightInt = lerp(p0.lightningFrequency, p1.lightningFrequency);

    const effects = env.getEffects();
    for (let i = 0; i < effects.length; i++) {
      const effect = effects[i]!;
      if (effect.type === "rain") {
        effect.intensity = rainInt;
      } else if (effect.type === "snow") {
        effect.intensity = snowInt;
      } else if (effect.type === "fog") {
        effect.intensity = fogInt;
      } else if (effect.type === "cloud") {
        effect.intensity = cloudInt;
      } else if (effect.type === "lightning") {
        effect.intensity = lightInt > 0.05 ? 1.0 : 0;
      }
    }
  }
}

export function createWeatherSystem(initialWeather?: WeatherState): WeatherSystem {
  return new WeatherSystemImpl(initialWeather);
}
