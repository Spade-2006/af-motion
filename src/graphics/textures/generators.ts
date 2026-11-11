/**
 * AF Motion Procedural Texture Generators
 *
 * 12 Deterministic procedural generators supporting Canvas2D, SVG/CSS fallbacks,
 * and WebGL texture descriptors.
 */

import type { PRNG } from "./prng.js";
import type {
  ProceduralTextureOptions,
  TextureGeneratorMetadata,
  TextureGeneratorName,
  WebGLTextureDescriptor,
} from "./types.js";
import { createSafeCanvas, encodeSvgDataUrl, getSafe2DContext, parseColor, safeToDataURL } from "./canvas-utils.js";

export interface GeneratorOutput {
  readonly canvas: HTMLCanvasElement | null;
  readonly dataUrl: string;
  readonly cssBackground: string;
  readonly webglDescriptor: WebGLTextureDescriptor | null;
}

export type GeneratorFn = (
  options: ProceduralTextureOptions,
  prng: PRNG,
  width: number,
  height: number
) => GeneratorOutput;

// Helper to create WebGL descriptor
function createDescriptor(
  width: number,
  height: number,
  source: HTMLCanvasElement | null
): WebGLTextureDescriptor | null {
  return {
    width,
    height,
    format: "rgba8",
    minFilter: "linear",
    magFilter: "linear",
    wrapS: "repeat",
    wrapT: "repeat",
    source,
  };
}

// ============================================================================
// 1. NOISE & GRAIN
// ============================================================================
export const generateNoise: GeneratorFn = (options, prng, width, height) => {
  const intensity = options.intensity ?? 0.35;
  const opacity = options.opacity ?? 0.8;
  const baseColor = parseColor(options.color ?? "#0f172a");
  const canvas = createSafeCanvas(width, height);

  let dataUrl = "";

  if (canvas) {
    const ctx = getSafe2DContext(canvas);
    if (ctx) {
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const grain = (prng.next() - 0.5) * intensity * 255;
        data[i] = Math.max(0, Math.min(255, baseColor.r + grain));
        data[i + 1] = Math.max(0, Math.min(255, baseColor.g + grain));
        data[i + 2] = Math.max(0, Math.min(255, baseColor.b + grain));
        data[i + 3] = Math.max(0, Math.min(255, Math.round(opacity * 255)));
      }
      ctx.putImageData(imgData, 0, 0);
      dataUrl = safeToDataURL(canvas);
    }
  }

  if (!dataUrl) {
    const freq = (options.frequency ?? 0.8).toFixed(2);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" seed="${prng.seed}"/><feColorMatrix type="matrix" values="0 0 0 0 ${baseColor.r / 255} 0 0 0 0 ${baseColor.g / 255} 0 0 0 0 ${baseColor.b / 255} 0 0 0 ${opacity} 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`;
    dataUrl = encodeSvgDataUrl(svg);
  }

  return {
    canvas,
    dataUrl,
    cssBackground: `url("${dataUrl}")`,
    webglDescriptor: createDescriptor(width, height, canvas),
  };
};

// ============================================================================
// 2. PAPER & PARCHMENT
// ============================================================================
export const generatePaper: GeneratorFn = (options, prng, width, height) => {
  const baseColor = options.color ?? "#fdfbf7";
  const fiberColor = options.secondaryColor ?? "rgba(180, 160, 140, 0.25)";
  const fiberCount = Math.floor(prng.range(40, 100) * (options.intensity ?? 1.0));
  const canvas = createSafeCanvas(width, height);

  let dataUrl = "";

  if (canvas) {
    const ctx = getSafe2DContext(canvas);
    if (ctx) {
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, width, height);

      // Fibers
      ctx.strokeStyle = fiberColor;
      ctx.lineWidth = 0.75;
      for (let i = 0; i < fiberCount; i++) {
        const x = prng.range(0, width);
        const y = prng.range(0, height);
        const len = prng.range(4, 16);
        const angle = prng.range(0, Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(
          x + Math.cos(angle) * (len / 2) + prng.range(-2, 2),
          y + Math.sin(angle) * (len / 2) + prng.range(-2, 2),
          x + Math.cos(angle) * len,
          y + Math.sin(angle) * len
        );
        ctx.stroke();
      }
      dataUrl = safeToDataURL(canvas);
    }
  }

  if (!dataUrl) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${baseColor}"/><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed="${prng.seed}"/><feDiffuseLighting in="turb" lighting-color="#fff" surfaceScale="1.5"><feDistantLight azimuth="45" elevation="60"/></feDiffuseLighting></filter><rect width="100%" height="100%" filter="url(#p)" opacity="0.12"/></svg>`;
    dataUrl = encodeSvgDataUrl(svg);
  }

  return {
    canvas,
    dataUrl,
    cssBackground: `url("${dataUrl}")`,
    webglDescriptor: createDescriptor(width, height, canvas),
  };
};

// ============================================================================
// 3. FABRIC & WOVEN
// ============================================================================
export const generateFabric: GeneratorFn = (options, prng, width, height) => {
  const baseColor = options.color ?? "#334155";
  const weftColor = options.secondaryColor ?? "#475569";
  const threadSpacing = Math.max(3, Math.round((options.frequency ?? 6) * 1.5));
  const canvas = createSafeCanvas(width, height);

  let dataUrl = "";

  if (canvas) {
    const ctx = getSafe2DContext(canvas);
    if (ctx) {
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, width, height);

      // Horizontal warp threads
      ctx.strokeStyle = weftColor;
      ctx.lineWidth = threadSpacing * 0.45;
      for (let y = 0; y < height; y += threadSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical weft threads with cross weaving
      ctx.strokeStyle = baseColor;
      for (let x = 0; x < width; x += threadSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      dataUrl = safeToDataURL(canvas);
    }
  }

  if (!dataUrl) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${threadSpacing * 2}" height="${threadSpacing * 2}"><rect width="100%" height="100%" fill="${baseColor}"/><path d="M0 0h${threadSpacing}v${threadSpacing}H0zM${threadSpacing} ${threadSpacing}h${threadSpacing}v${threadSpacing}H${threadSpacing}z" fill="${weftColor}" opacity="0.7"/></svg>`;
    dataUrl = encodeSvgDataUrl(svg);
  }

  return {
    canvas,
    dataUrl,
    cssBackground: `url("${dataUrl}")`,
    webglDescriptor: createDescriptor(width, height, canvas),
  };
};

// ============================================================================
// 4. MARBLE & STONE
// ============================================================================
export const generateMarble: GeneratorFn = (options, prng, width, height) => {
  const baseColor = parseColor(options.color ?? "#f8fafc");
  const veinColor = parseColor(options.secondaryColor ?? "#64748b");
  const freq = options.frequency ?? 0.02;
  const canvas = createSafeCanvas(width, height);

  let dataUrl = "";

  if (canvas) {
    const ctx = getSafe2DContext(canvas);
    if (ctx) {
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          // Marble sine turbulence formula
          const turb = Math.sin(x * freq + prng.range(-0.5, 0.5) * 2) + Math.cos(y * freq * 1.4);
          const v = Math.abs(Math.sin((x * 0.02 + y * 0.02 + turb * 2) * Math.PI));
          const t = Math.pow(v, 4); // sharpen veins

          data[idx] = Math.round(baseColor.r * (1 - t) + veinColor.r * t);
          data[idx + 1] = Math.round(baseColor.g * (1 - t) + veinColor.g * t);
          data[idx + 2] = Math.round(baseColor.b * (1 - t) + veinColor.b * t);
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      dataUrl = safeToDataURL(canvas);
    }
  }

  if (!dataUrl) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><filter id="m"><feTurbulence type="turbulence" baseFrequency="0.015" numOctaves="4" seed="${prng.seed}"/><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"/></filter><rect width="100%" height="100%" fill="${options.color ?? "#f8fafc"}"/><rect width="100%" height="100%" filter="url(#m)" fill="${options.secondaryColor ?? "#64748b"}" opacity="0.35"/></svg>`;
    dataUrl = encodeSvgDataUrl(svg);
  }

  return {
    canvas,
    dataUrl,
    cssBackground: `url("${dataUrl}")`,
    webglDescriptor: createDescriptor(width, height, canvas),
  };
};

// ============================================================================
// 5. WOOD GRAIN
// ============================================================================
export const generateWood: GeneratorFn = (options, prng, width, height) => {
  const baseColor = parseColor(options.color ?? "#92400e");
  const ringColor = parseColor(options.secondaryColor ?? "#713f12");
  const ringFreq = options.frequency ?? 0.05;
  const canvas = createSafeCanvas(width, height);

  let dataUrl = "";

  if (canvas) {
    const ctx = getSafe2DContext(canvas);
    if (ctx) {
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;
      const cx = width * 0.5 + prng.range(-width * 0.2, width * 0.2);
      const cy = -height * 0.5;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const dx = x - cx;
          const dy = (y - cy) * 0.35; // elongated oval rings
          const dist = Math.sqrt(dx * dx + dy * dy);
          const wobble = Math.sin(y * 0.04) * 8;
          const ring = Math.sin((dist + wobble) * ringFreq);
          const t = (ring + 1) * 0.5;

          data[idx] = Math.round(baseColor.r * (1 - t) + ringColor.r * t);
          data[idx + 1] = Math.round(baseColor.g * (1 - t) + ringColor.g * t);
          data[idx + 2] = Math.round(baseColor.b * (1 - t) + ringColor.b * t);
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      dataUrl = safeToDataURL(canvas);
    }
  }

  if (!dataUrl) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${options.color ?? "#92400e"}"/><filter id="w"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.15" numOctaves="3" seed="${prng.seed}"/><feColorMatrix type="matrix" values="0 0 0 0 0.44 0 0 0 0 0.25 0 0 0 0 0.07 0 0 0 0.4 0"/></filter><rect width="100%" height="100%" filter="url(#w)"/></svg>`;
    dataUrl = encodeSvgDataUrl(svg);
  }

  return {
    canvas,
    dataUrl,
    cssBackground: `url("${dataUrl}")`,
    webglDescriptor: createDescriptor(width, height, canvas),
  };
};

// ============================================================================
// 6. METAL BRUSH
// ============================================================================
export const generateMetalBrush: GeneratorFn = (options, prng, width, height) => {
  const baseColor = parseColor(options.color ?? "#94a3b8");
  const angle = (options.angle ?? 0) * (Math.PI / 180);
  const canvas = createSafeCanvas(width, height);

  let dataUrl = "";

  if (canvas) {
    const ctx = getSafe2DContext(canvas);
    if (ctx) {
      ctx.fillStyle = options.color ?? "#94a3b8";
      ctx.fillRect(0, 0, width, height);

      // Draw high density micro-lines
      const lineCount = Math.floor(width * 2.5);
      ctx.lineWidth = 1;
      for (let i = 0; i < lineCount; i++) {
        const offset = prng.range(0, Math.max(width, height) * 1.5);
        const brightness = prng.range(-35, 35);
        const r = Math.max(0, Math.min(255, baseColor.r + brightness));
        const g = Math.max(0, Math.min(255, baseColor.g + brightness));
        const b = Math.max(0, Math.min(255, baseColor.b + brightness));
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.25)`;

        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(-width, offset - height);
        ctx.lineTo(width * 2, offset - height);
        ctx.stroke();
        ctx.restore();
      }
      dataUrl = safeToDataURL(canvas);
    }
  }

  if (!dataUrl) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${options.color ?? "#94a3b8"}"/><filter id="b"><feTurbulence type="fractalNoise" baseFrequency="0.005 0.5" numOctaves="2" seed="${prng.seed}"/><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.3 0"/></filter><rect width="100%" height="100%" filter="url(#b)"/></svg>`;
    dataUrl = encodeSvgDataUrl(svg);
  }

  return {
    canvas,
    dataUrl,
    cssBackground: `url("${dataUrl}")`,
    webglDescriptor: createDescriptor(width, height, canvas),
  };
};

// ============================================================================
// 7. HALFTONE
// ============================================================================
export const generateHalftone: GeneratorFn = (options, prng, width, height) => {
  const dotColor = options.color ?? "#0f172a";
  const bgColor = options.secondaryColor ?? "transparent";
  const spacing = Math.max(6, Math.round(options.frequency ?? 14));
  const maxRadius = spacing * 0.45;
  const canvas = createSafeCanvas(width, height);

  let dataUrl = "";

  if (canvas) {
    const ctx = getSafe2DContext(canvas);
    if (ctx) {
      if (bgColor !== "transparent") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.fillStyle = dotColor;

      for (let y = spacing / 2; y < height; y += spacing) {
        for (let x = spacing / 2; x < width; x += spacing) {
          // Halftone radial gradient modulation
          const dx = x - width / 2;
          const dy = y - height / 2;
          const distNorm = Math.sqrt(dx * dx + dy * dy) / (Math.hypot(width, height) / 2);
          const r = Math.max(0.5, maxRadius * (1 - distNorm * 0.7));

          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      dataUrl = safeToDataURL(canvas);
    }
  }

  if (!dataUrl) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${spacing}" height="${spacing}"><rect width="100%" height="100%" fill="${bgColor}"/><circle cx="${spacing / 2}" cy="${spacing / 2}" r="${maxRadius * 0.7}" fill="${dotColor}"/></svg>`;
    dataUrl = encodeSvgDataUrl(svg);
  }

  return {
    canvas,
    dataUrl,
    cssBackground: `url("${dataUrl}")`,
    webglDescriptor: createDescriptor(width, height, canvas),
  };
};

// ============================================================================
// 8. DOTS & GRIDS
// ============================================================================
export const generateDots: GeneratorFn = (options, prng, width, height) => {
  const dotColor = options.color ?? "#64748b";
  const bgColor = options.secondaryColor ?? "transparent";
  const spacing = Math.max(8, Math.round(options.frequency ?? 20));
  const dotRadius = Math.max(1, (options.intensity ?? 1.5) * 1.5);
  const canvas = createSafeCanvas(width, height);

  let dataUrl = "";

  if (canvas) {
    const ctx = getSafe2DContext(canvas);
    if (ctx) {
      if (bgColor !== "transparent") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.fillStyle = dotColor;

      for (let y = spacing / 2; y < height; y += spacing) {
        for (let x = spacing / 2; x < width; x += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      dataUrl = safeToDataURL(canvas);
    }
  }

  if (!dataUrl) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${spacing}" height="${spacing}"><rect width="100%" height="100%" fill="${bgColor}"/><circle cx="${spacing / 2}" cy="${spacing / 2}" r="${dotRadius}" fill="${dotColor}"/></svg>`;
    dataUrl = encodeSvgDataUrl(svg);
  }

  return {
    canvas,
    dataUrl,
    cssBackground: `url("${dataUrl}")`,
    webglDescriptor: createDescriptor(width, height, canvas),
  };
};

// ============================================================================
// 9. STRIPES & GEOMETRIC
// ============================================================================
export const generateStripes: GeneratorFn = (options, prng, width, height) => {
  const stripeColor = options.color ?? "#38bdf8";
  const bgColor = options.secondaryColor ?? "#0284c7";
  const stripeWidth = Math.max(4, Math.round(options.frequency ?? 16));
  const angle = (options.angle ?? 45) * (Math.PI / 180);
  const canvas = createSafeCanvas(width, height);

  let dataUrl = "";

  if (canvas) {
    const ctx = getSafe2DContext(canvas);
    if (ctx) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(angle);
      ctx.fillStyle = stripeColor;

      const diagonal = Math.hypot(width, height) * 1.5;
      for (let x = -diagonal; x < diagonal; x += stripeWidth * 2) {
        ctx.fillRect(x, -diagonal, stripeWidth, diagonal * 2);
      }
      ctx.restore();
      dataUrl = safeToDataURL(canvas);
    }
  }

  if (!dataUrl) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${stripeWidth * 2}" height="${stripeWidth * 2}"><rect width="100%" height="100%" fill="${bgColor}"/><path d="M0 0h${stripeWidth}v${stripeWidth * 2}H0z" fill="${stripeColor}"/></svg>`;
    dataUrl = encodeSvgDataUrl(svg);
  }

  return {
    canvas,
    dataUrl,
    cssBackground: `url("${dataUrl}")`,
    webglDescriptor: createDescriptor(width, height, canvas),
  };
};

// ============================================================================
// 10. ORGANIC GRADIENT
// ============================================================================
export const generateOrganicGradient: GeneratorFn = (options, prng, width, height) => {
  const color1 = options.color ?? "#ec4899";
  const color2 = options.secondaryColor ?? "#8b5cf6";
  const color3 = options.accentColor ?? "#3b82f6";
  const canvas = createSafeCanvas(width, height);

  let dataUrl = "";

  if (canvas) {
    const ctx = getSafe2DContext(canvas);
    if (ctx) {
      ctx.fillStyle = color1;
      ctx.fillRect(0, 0, width, height);

      // Point 1
      const g1 = ctx.createRadialGradient(
        width * prng.range(0.2, 0.4),
        height * prng.range(0.2, 0.4),
        0,
        width * 0.3,
        height * 0.3,
        width * 0.7
      );
      g1.addColorStop(0, color2);
      g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      // Point 2
      const g2 = ctx.createRadialGradient(
        width * prng.range(0.6, 0.8),
        height * prng.range(0.6, 0.8),
        0,
        width * 0.7,
        height * 0.7,
        width * 0.8
      );
      g2.addColorStop(0, color3);
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);
      dataUrl = safeToDataURL(canvas);
    }
  }

  if (!dataUrl) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><radialGradient id="og1" cx="30%" cy="30%" r="70%"><stop offset="0%" stop-color="${color2}"/><stop offset="100%" stop-color="${color1}"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#og1)"/></svg>`;
    dataUrl = encodeSvgDataUrl(svg);
  }

  return {
    canvas,
    dataUrl,
    cssBackground: `url("${dataUrl}")`,
    webglDescriptor: createDescriptor(width, height, canvas),
  };
};

// ============================================================================
// 11. TOPOGRAPHIC CONTOURS
// ============================================================================
export const generateTopographic: GeneratorFn = (options, prng, width, height) => {
  const lineColor = options.color ?? "rgba(255, 255, 255, 0.45)";
  const bgColor = options.secondaryColor ?? "#0f172a";
  const numRings = Math.max(4, Math.round(options.frequency ?? 12));
  const canvas = createSafeCanvas(width, height);

  let dataUrl = "";

  if (canvas) {
    const ctx = getSafe2DContext(canvas);
    if (ctx) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.25;

      const centers = [
        { x: width * 0.35, y: height * 0.4 },
        { x: width * 0.7, y: height * 0.65 },
      ];

      for (const center of centers) {
        for (let r = 10; r < Math.max(width, height) * 0.8; r += (Math.max(width, height) * 0.7) / numRings) {
          ctx.beginPath();
          for (let angle = 0; angle <= Math.PI * 2; angle += 0.1) {
            const wobble = Math.sin(angle * 4 + prng.range(-0.2, 0.2)) * 6;
            const currentR = r + wobble;
            const px = center.x + Math.cos(angle) * currentR;
            const py = center.y + Math.sin(angle) * currentR;
            if (angle === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
      dataUrl = safeToDataURL(canvas);
    }
  }

  if (!dataUrl) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${bgColor}"/><circle cx="${width * 0.5}" cy="${height * 0.5}" r="${width * 0.35}" fill="none" stroke="${lineColor}" stroke-width="1.5"/></svg>`;
    dataUrl = encodeSvgDataUrl(svg);
  }

  return {
    canvas,
    dataUrl,
    cssBackground: `url("${dataUrl}")`,
    webglDescriptor: createDescriptor(width, height, canvas),
  };
};

// ============================================================================
// 12. IMPERFECTIONS (Scratches & Dust)
// ============================================================================
export const generateImperfections: GeneratorFn = (options, prng, width, height) => {
  const scratchColor = options.color ?? "rgba(255, 255, 255, 0.35)";
  const dustColor = options.secondaryColor ?? "rgba(255, 255, 255, 0.4)";
  const scratchCount = Math.floor(prng.range(8, 20) * (options.intensity ?? 1.0));
  const dustCount = Math.floor(prng.range(30, 80) * (options.intensity ?? 1.0));
  const canvas = createSafeCanvas(width, height);

  let dataUrl = "";

  if (canvas) {
    const ctx = getSafe2DContext(canvas);
    if (ctx) {
      ctx.clearRect(0, 0, width, height);

      // Scratches (thin line strokes)
      ctx.strokeStyle = scratchColor;
      ctx.lineWidth = 0.8;
      for (let i = 0; i < scratchCount; i++) {
        const x = prng.range(0, width);
        const y = prng.range(0, height);
        const len = prng.range(10, 45);
        const angle = prng.range(0, Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctx.stroke();
      }

      // Dust specks
      ctx.fillStyle = dustColor;
      for (let i = 0; i < dustCount; i++) {
        const x = prng.range(0, width);
        const y = prng.range(0, height);
        const r = prng.range(0.4, 1.2);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      dataUrl = safeToDataURL(canvas);
    }
  }

  if (!dataUrl) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><line x1="10" y1="20" x2="60" y2="35" stroke="${scratchColor}" stroke-width="0.8"/><circle cx="${width * 0.3}" cy="${height * 0.7}" r="1" fill="${dustColor}"/></svg>`;
    dataUrl = encodeSvgDataUrl(svg);
  }

  return {
    canvas,
    dataUrl,
    cssBackground: `url("${dataUrl}")`,
    webglDescriptor: createDescriptor(width, height, canvas),
  };
};

// ============================================================================
// GENERATORS REGISTRY & METADATA
// ============================================================================
export const TEXTURE_GENERATORS: Readonly<Record<TextureGeneratorName, GeneratorFn>> = {
  noise: generateNoise,
  paper: generatePaper,
  fabric: generateFabric,
  marble: generateMarble,
  wood: generateWood,
  "metal-brush": generateMetalBrush,
  halftone: generateHalftone,
  dots: generateDots,
  stripes: generateStripes,
  "organic-gradient": generateOrganicGradient,
  topographic: generateTopographic,
  imperfections: generateImperfections,
};

export const TEXTURE_GENERATORS_METADATA: Readonly<Record<TextureGeneratorName, TextureGeneratorMetadata>> = {
  noise: {
    name: "noise",
    displayName: "Noise & Grain",
    description: "Multi-frequency film grain and pixel-level procedural noise texture.",
    category: "noise",
    defaultOptions: { intensity: 0.35, opacity: 0.8, color: "#0f172a" },
    tags: ["noise", "grain", "film", "roughness"],
  },
  paper: {
    name: "paper",
    displayName: "Paper & Parchment",
    description: "Fibrous paper pulp, parchment mottling, and organic pressed surface.",
    category: "material",
    defaultOptions: { color: "#fdfbf7", secondaryColor: "rgba(180, 160, 140, 0.25)" },
    tags: ["paper", "parchment", "fiber", "craft"],
  },
  fabric: {
    name: "fabric",
    displayName: "Fabric & Woven",
    description: "Interwoven warp and weft textile mesh with tactile micro-depth.",
    category: "material",
    defaultOptions: { color: "#334155", secondaryColor: "#475569", frequency: 6 },
    tags: ["fabric", "cloth", "linen", "woven"],
  },
  marble: {
    name: "marble",
    displayName: "Marble & Stone",
    description: "Organic mineral vein turbulence and metamorphic rock striations.",
    category: "organic",
    defaultOptions: { color: "#f8fafc", secondaryColor: "#64748b", frequency: 0.02 },
    tags: ["marble", "stone", "veins", "luxury"],
  },
  wood: {
    name: "wood",
    displayName: "Wood Grain",
    description: "Annual tree growth rings with organic grain distortion and fibers.",
    category: "organic",
    defaultOptions: { color: "#92400e", secondaryColor: "#713f12", frequency: 0.05 },
    tags: ["wood", "timber", "rings", "nature"],
  },
  "metal-brush": {
    name: "metal-brush",
    displayName: "Metal Brushing",
    description: "Anisotropic linear micro-scratches representing brushed aluminum and steel.",
    category: "material",
    defaultOptions: { color: "#94a3b8", angle: 45 },
    tags: ["metal", "brushed", "aluminum", "steel", "specular"],
  },
  halftone: {
    name: "halftone",
    displayName: "Halftone Screen",
    description: "Printmaking dot matrix screen with coordinate-modulated dot sizing.",
    category: "artistic",
    defaultOptions: { color: "#0f172a", frequency: 14 },
    tags: ["halftone", "dots", "print", "pop-art", "retro"],
  },
  dots: {
    name: "dots",
    displayName: "Dots & Grids",
    description: "Configurable regular polka dots, technical dots, and coordinate grid points.",
    category: "geometric",
    defaultOptions: { color: "#64748b", frequency: 20 },
    tags: ["dots", "grid", "geometric", "pattern"],
  },
  stripes: {
    name: "stripes",
    displayName: "Stripes & Geometric",
    description: "Diagonal and parallel alternating geometric bands with configurable angle.",
    category: "geometric",
    defaultOptions: { color: "#38bdf8", secondaryColor: "#0284c7", angle: 45, frequency: 16 },
    tags: ["stripes", "bands", "geometric", "lines"],
  },
  "organic-gradient": {
    name: "organic-gradient",
    displayName: "Organic Gradient",
    description: "Multi-point diffused radial color clouds with organic spatial blending.",
    category: "artistic",
    defaultOptions: { color: "#ec4899", secondaryColor: "#8b5cf6", accentColor: "#3b82f6" },
    tags: ["gradient", "organic", "aurora", "mesh"],
  },
  topographic: {
    name: "topographic",
    displayName: "Topographic Contours",
    description: "Stepped elevation isoline rings mapping geometric contour landscapes.",
    category: "artistic",
    defaultOptions: { color: "rgba(255, 255, 255, 0.45)", secondaryColor: "#0f172a", frequency: 12 },
    tags: ["topographic", "contours", "map", "isolines"],
  },
  imperfections: {
    name: "imperfections",
    displayName: "Surface Imperfections",
    description: "Subtle micro-scratches, dust particles, and weathered surface artifacts.",
    category: "material",
    defaultOptions: { color: "rgba(255, 255, 255, 0.35)", secondaryColor: "rgba(255, 255, 255, 0.4)" },
    tags: ["scratches", "dust", "imperfections", "weathered", "patina"],
  },
};
