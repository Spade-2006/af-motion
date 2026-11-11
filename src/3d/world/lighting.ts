/**
 * AF Motion — 3D World Lighting & Atmospheric Day/Night Engine
 *
 * Diurnal solar tracking, directional sunlight/moonlight vector calculations,
 * weather-reactive ambient radiance, and distance-based atmospheric fog transitions.
 */

import type { Vector3 } from "../physics/types.js";
import type { WeatherState } from "../../graphics/environment/types.js";
import type { DayNightState, WorldLightingConfig, WorldLighting } from "./types.js";

/**
 * Creates and initializes the world lighting and atmospheric orchestration engine.
 */
export function createWorldLighting(
  config: WorldLightingConfig = {},
  initialWeather: WeatherState = "clear"
): WorldLighting {
  let currentTime = config.initialTimeHours ?? 11.5;
  const timeScale = config.timeScale ?? 0.0;
  const latitudeRad = ((config.latitudeDegrees ?? 45) * Math.PI) / 180;
  const hazeDensity = config.hazeDensity ?? 0.15;
  let fogNear = config.fogNear ?? 50;
  let fogFar = config.fogFar ?? 500;
  let currentWeather = initialWeather;

  // Compute state for current time
  let dayNight = computeDayNightState(currentTime, latitudeRad, currentWeather);

  let fogColor: [number, number, number] = config.fogColor ?? [...dayNight.skyColor];

  const setWeather = (weather: WeatherState): void => {
    currentWeather = weather;
    dayNight = computeDayNightState(currentTime, latitudeRad, currentWeather);
    if (!config.fogColor) {
      fogColor = [...dayNight.skyColor];
    }
  };

  const setTime = (hours: number): void => {
    currentTime = ((hours % 24) + 24) % 24;
    dayNight = computeDayNightState(currentTime, latitudeRad, currentWeather);
    if (!config.fogColor) {
      fogColor = [...dayNight.skyColor];
    }
  };

  const update = (deltaMs: number): void => {
    if (timeScale > 0) {
      // deltaMs in ms -> advance hours
      const hoursAdvanced = (deltaMs / 1000 / 3600) * timeScale;
      setTime(currentTime + hoursAdvanced);
    }
  };

  return {
    get dayNight() {
      return dayNight;
    },
    hazeDensity,
    get fogNear() {
      return fogNear;
    },
    get fogFar() {
      return fogFar;
    },
    get fogColor() {
      return fogColor;
    },
    setTime,
    setWeather,
    update,
  };
}

/**
 * Computes solar celestial mechanics and diurnal illumination spectrums.
 */
export function computeDayNightState(
  timeHours: number,
  latitudeRad: number,
  weather: WeatherState = "clear"
): DayNightState {
  // Solar hour angle: 12:00 = 0 rad, 06:00 = -pi/2, 18:00 = pi/2
  const hourAngle = ((timeHours - 12) / 12) * Math.PI;

  // Solar declination (approximate equinox declination 0 to simplify or +/- 0.3)
  const declination = 0.1;

  // Solar elevation angle (sin(alpha) = sin(lat)*sin(dec) + cos(lat)*cos(dec)*cos(h))
  const sinElevation =
    Math.sin(latitudeRad) * Math.sin(declination) +
    Math.cos(latitudeRad) * Math.cos(declination) * Math.cos(hourAngle);
  const elevationRad = Math.asin(Math.max(-1, Math.min(1, sinElevation)));
  const elevationDeg = (elevationRad * 180) / Math.PI;

  // Azimuth
  const cosAzimuth =
    (Math.sin(declination) - Math.sin(latitudeRad) * sinElevation) /
    (Math.cos(latitudeRad) * Math.cos(elevationRad) + 1e-6);
  const azimuthRad = hourAngle > 0 ? 2 * Math.PI - Math.acos(Math.max(-1, Math.min(1, cosAzimuth))) : Math.acos(Math.max(-1, Math.min(1, cosAzimuth)));
  const azimuthDeg = (azimuthRad * 180) / Math.PI;

  // Direction vectors (normalized)
  const sunX = Math.cos(elevationRad) * Math.sin(azimuthRad);
  const sunY = Math.sin(elevationRad);
  const sunZ = Math.cos(elevationRad) * Math.cos(azimuthRad);

  const sunDirection: Vector3 = { x: sunX, y: sunY, z: sunZ };
  const moonDirection: Vector3 = { x: -sunX, y: -sunY, z: -sunZ };

  const isDay = elevationDeg > -2.0;

  // Color Spectrum Interpolation based on solar elevation
  let sunColor: [number, number, number];
  let ambientColor: [number, number, number];
  let skyColor: [number, number, number];
  let sunIntensity: number;
  let ambientIntensity: number;

  if (elevationDeg > 15) {
    // Full Daylight / Noon
    sunColor = [1.0, 0.98, 0.92];
    ambientColor = [0.65, 0.75, 0.88];
    skyColor = [0.45, 0.65, 0.9];
    sunIntensity = 1.0;
    ambientIntensity = 0.5;
  } else if (elevationDeg > 0) {
    // Golden Hour / Dawn / Dusk
    const t = elevationDeg / 15;
    sunColor = [1.0, 0.65 + t * 0.33, 0.3 + t * 0.62];
    ambientColor = [0.45 + t * 0.2, 0.35 + t * 0.4, 0.45 + t * 0.43];
    skyColor = [0.85 - t * 0.4, 0.5 + t * 0.15, 0.35 + t * 0.55];
    sunIntensity = 0.3 + t * 0.7;
    ambientIntensity = 0.3 + t * 0.2;
  } else if (elevationDeg > -12) {
    // Twilight / Civil & Nautical Dawn
    const t = (elevationDeg + 12) / 12;
    sunColor = [0.7 * t, 0.35 * t, 0.2 * t];
    ambientColor = [0.1 + t * 0.35, 0.12 + t * 0.23, 0.25 + t * 0.2];
    skyColor = [0.15 + t * 0.7, 0.15 + t * 0.35, 0.3 + t * 0.05];
    sunIntensity = 0.05 + t * 0.25;
    ambientIntensity = 0.15 + t * 0.15;
  } else {
    // Deep Night / Moonlight
    sunColor = [0.2, 0.25, 0.45];
    ambientColor = [0.06, 0.08, 0.16];
    skyColor = [0.03, 0.04, 0.09];
    sunIntensity = 0.1; // Moonlight
    ambientIntensity = 0.12;
  }

  // Weather modifiers
  if (weather === "rain" || weather === "firestorm") {
    sunIntensity *= 0.2;
    ambientIntensity *= 0.6;
    ambientColor = [ambientColor[0] * 0.5, ambientColor[1] * 0.55, ambientColor[2] * 0.6];
    skyColor = [0.2, 0.22, 0.26];
  } else if (weather === "fog") {
    sunIntensity *= 0.4;
    ambientIntensity *= 0.9;
    skyColor = [0.7, 0.72, 0.75];
    ambientColor = [0.65, 0.67, 0.7];
  } else if (weather === "snow" || weather === "blizzard") {
    // Ground snow increases ambient albedo
    ambientIntensity *= 1.3;
    sunColor = [sunColor[0] * 0.9, sunColor[1] * 0.92, sunColor[2] * 0.98];
  }

  return {
    timeOfDayHours: timeHours,
    sunElevationDegrees: elevationDeg,
    sunAzimuthDegrees: azimuthDeg,
    sunDirection,
    moonDirection,
    sunColor,
    sunIntensity,
    ambientColor,
    ambientIntensity,
    skyColor,
    isDay,
  };
}
