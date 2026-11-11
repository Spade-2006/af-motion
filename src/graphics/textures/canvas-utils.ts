/**
 * AF Motion Texture Canvas Utilities
 *
 * Canvas allocation, pixel manipulation, color parsing, and SSR fallbacks.
 */

export interface ColorRGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Parse hex or rgba color string into normalized 0-255 RGBA components.
 */
export function parseColor(colorStr?: string): ColorRGBA {
  if (!colorStr) {
    return { r: 255, g: 255, b: 255, a: 255 };
  }

  const str = colorStr.trim().toLowerCase();

  // Hex #RGB or #RRGGBB
  if (str.startsWith("#")) {
    let hex = str.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    if (hex.length === 6) {
      const num = parseInt(hex, 16);
      return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
        a: 255,
      };
    }
    if (hex.length === 8) {
      const num = parseInt(hex, 16);
      return {
        r: (num >> 24) & 255,
        g: (num >> 16) & 255,
        b: (num >> 8) & 255,
        a: num & 255,
      };
    }
  }

  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbaMatch = str.match(/rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (rgbaMatch) {
    return {
      r: Math.max(0, Math.min(255, Math.round(parseFloat(rgbaMatch[1])))),
      g: Math.max(0, Math.min(255, Math.round(parseFloat(rgbaMatch[2])))),
      b: Math.max(0, Math.min(255, Math.round(parseFloat(rgbaMatch[3])))),
      a: rgbaMatch[4] !== undefined ? Math.max(0, Math.min(255, Math.round(parseFloat(rgbaMatch[4]) * 255))) : 255,
    };
  }

  // Common named colors
  if (str === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  if (str === "black") return { r: 0, g: 0, b: 0, a: 255 };
  if (str === "white") return { r: 255, g: 255, b: 255, a: 255 };

  return { r: 255, g: 255, b: 255, a: 255 };
}

/**
 * Safe canvas creator. In SSR or environments without DOM, returns null.
 */
export function createSafeCanvas(width: number, height: number): HTMLCanvasElement | null {
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    return null;
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(width));
    canvas.height = Math.max(1, Math.floor(height));
    return canvas;
  } catch {
    return null;
  }
}

/**
 * Safely get 2D context without throwing in JSDOM/SSR environments.
 */
export function getSafe2DContext(canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null {
  if (!canvas) return null;
  try {
    return canvas.getContext("2d");
  } catch {
    return null;
  }
}

/**
 * Safely convert canvas to Data URL, returning empty string if unsupported.
 */
export function safeToDataURL(canvas: HTMLCanvasElement | null, type = "image/png"): string {
  if (!canvas) return "";
  try {
    return canvas.toDataURL(type);
  } catch {
    return "";
  }
}

/**
 * Format an SVG string into a valid Data URL (safe for SSR and CSS background-image).
 */
export function encodeSvgDataUrl(svgContent: string): string {
  const cleanSvg = svgContent.replace(/[\n\r\t]+/g, " ").replace(/\s+/g, " ").trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
}
