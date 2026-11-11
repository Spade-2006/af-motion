/**
 * AF Motion Studio — Background Engine Integration
 *
 * Renders procedural, gradient, particle, and aurora backgrounds powered by
 * AF Motion's 33 built-in palettes and graphics primitives.
 */

import { BUILT_IN_PALETTE_INPUTS } from "../../src/core/built-in-palettes.js";
import type { StudioBackgroundConfig } from "../types/index.js";

export interface PaletteOption {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

// Convert all 33 palettes into selectable studio palette options
export const STUDIO_PALETTES: PaletteOption[] = BUILT_IN_PALETTE_INPUTS.map((p) => {
  const id = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const isDark = (p.primary as string).startsWith("#0") || (p.primary as string).startsWith("#1") || (p.primary as string) === "#242424";
  return {
    id,
    name: p.name,
    primary: p.primary,
    secondary: p.secondary,
    accent: p.accent,
    background: isDark ? "#0A0C10" : "#F8F9FA",
  };
});

export function getPaletteById(id: string): PaletteOption {
  return STUDIO_PALETTES.find((p) => p.id === id) ?? STUDIO_PALETTES[0];
}

export function getDefaultBackgroundConfig(): StudioBackgroundConfig {
  const defaultPalette = STUDIO_PALETTES[0]; // Cobalt Classic
  return {
    type: "gradient",
    paletteId: defaultPalette.id,
    paletteName: defaultPalette.name,
    colors: {
      primary: defaultPalette.primary,
      secondary: defaultPalette.secondary,
      accent: defaultPalette.accent,
      background: defaultPalette.background,
    },
    speed: 1.0,
    density: 50,
    scale: 1.0,
    angle: 135,
    intensity: 0.7,
    quality: "high",
    fpsCap: 60,
  };
}

/**
 * Computes CSS background string or SVG data for CSS-driven background types.
 */
export function computeCSSBackground(config: StudioBackgroundConfig): string {
  const { primary, secondary, accent, background } = config.colors;
  const angle = config.angle;

  switch (config.type) {
    case "solid":
      return background || primary;

    case "gradient":
      return `linear-gradient(${angle}deg, ${background} 0%, ${primary} 50%, ${secondary} 100%)`;

    case "animated-gradient":
      return `linear-gradient(${angle}deg, ${primary}, ${accent}, ${secondary}, ${background})`;

    case "grid": {
      const size = Math.round(24 * config.scale);
      return `linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
              ${background}`;
    }

    case "dots": {
      const spacing = Math.round(20 * config.scale);
      return `radial-gradient(circle, ${accent}33 1.5px, transparent 1.5px), ${background}`;
    }

    case "waves":
      return `radial-gradient(ellipse at 50% 120%, ${accent}44 0%, ${primary}22 50%, ${background} 100%)`;

    case "aurora":
      return `radial-gradient(circle at 20% 30%, ${accent}66 0%, transparent 60%),
              radial-gradient(circle at 80% 70%, ${secondary}55 0%, transparent 60%),
              ${background}`;

    case "noise":
    case "particles":
    default:
      return background;
  }
}

/**
 * Initializes and draws procedural canvas effects (particles, noise).
 */
export function renderCanvasBackground(
  canvas: HTMLCanvasElement,
  config: StudioBackgroundConfig,
  timeMs: number
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (config.type === "particles") {
    const count = Math.min(100, Math.round(config.density * (config.quality === "low" ? 0.3 : 0.8)));
    const speed = config.speed * 0.001;

    ctx.fillStyle = config.colors.background;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < count; i++) {
      const seed = i * 137.5;
      const x = ((seed * 11 + timeMs * speed * 40) % width + width) % width;
      const y = ((seed * 23 + Math.sin(timeMs * speed + i) * 30) % height + height) % height;
      const radius = 1.5 + (i % 3) * 0.8;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? config.colors.accent : config.colors.secondary;
      ctx.globalAlpha = 0.4 + (i % 5) * 0.1;
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  } else if (config.type === "noise") {
    ctx.fillStyle = config.colors.background;
    ctx.fillRect(0, 0, width, height);

    const step = config.quality === "low" ? 4 : 2;
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4 * step) {
      const noise = (Math.random() * 255) | 0;
      data[i] = noise;
      data[i + 1] = noise;
      data[i + 2] = noise;
      data[i + 3] = (config.intensity * 25) | 0;
    }
    ctx.putImageData(imgData, 0, 0);
  }
}
