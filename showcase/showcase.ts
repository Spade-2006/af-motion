import {
  advancedGradientBackground,
  atmosphericBackground,
  cosmicBackground,
  energyBackground,
  fluidBackground,
  geometricBackground,
  getPalette,
  particleBackground,
} from "../src/index.js";
import { BUILT_IN_PALETTE_INPUTS } from "../src/core/built-in-palettes.js";
import type {
  AdvancedGradientControls,
  AtmosphericBackgroundControls,
  CosmicBackgroundControls,
  EnergyBackgroundControls,
  FluidBackgroundControls,
  GeometricBackgroundControls,
  ParticleBackgroundControls,
} from "../src/index.js";

export type ShowcaseEffectId =
  | "gradient"
  | "particles"
  | "cosmic"
  | "geometric"
  | "fluid"
  | "atmospheric"
  | "energy";

export interface ShowcaseSettings {
  readonly effect: ShowcaseEffectId;
  readonly palette: string;
  readonly speed: number;
  readonly intensity: number;
}

interface ShowcaseEffectDefinition {
  readonly id: ShowcaseEffectId;
  readonly name: string;
  readonly family: string;
  readonly description: string;
  readonly apiName: string;
  readonly start: (target: HTMLElement, settings: ShowcaseSettings) => ShowcaseControls;
  readonly snippetOptions: (settings: ShowcaseSettings) => Readonly<Record<string, string | number>>;
}

type ShowcaseControls =
  | AdvancedGradientControls
  | ParticleBackgroundControls
  | CosmicBackgroundControls
  | GeometricBackgroundControls
  | FluidBackgroundControls
  | AtmosphericBackgroundControls
  | EnergyBackgroundControls;

interface ShowcaseElements {
  readonly effect: HTMLSelectElement;
  readonly palette: HTMLSelectElement;
  readonly speed: HTMLInputElement;
  readonly intensity: HTMLInputElement;
  readonly speedValue: HTMLOutputElement;
  readonly intensityValue: HTMLOutputElement;
  readonly swatches: HTMLElement;
  readonly preview: HTMLElement;
  readonly snippet: HTMLElement;
  readonly status: HTMLElement;
  readonly copy: HTMLButtonElement;
}

const EFFECTS: readonly ShowcaseEffectDefinition[] = [
  {
    id: "gradient",
    name: "Aurora mesh",
    family: "GRADIENT",
    description: "Layered color fields drift into a soft, luminous mesh.",
    apiName: "advancedGradientBackground",
    start: (target, settings) => advancedGradientBackground(target, {
      type: "mesh",
      palette: settings.palette,
      speed: settings.speed,
      intensity: settings.intensity,
    }),
    snippetOptions: (settings) => ({
      type: "mesh",
      palette: settings.palette,
      speed: settings.speed,
      intensity: settings.intensity,
    }),
  },
  {
    id: "particles",
    name: "Particle network",
    family: "PARTICLES",
    description: "A connected field of points responds with gentle movement.",
    apiName: "particleBackground",
    start: (target, settings) => particleBackground(target, {
      mode: "network",
      palette: settings.palette,
      count: 48,
      speed: settings.speed,
      opacity: settings.intensity,
    }),
    snippetOptions: (settings) => ({
      mode: "network",
      palette: settings.palette,
      count: 48,
      speed: settings.speed,
      opacity: settings.intensity,
    }),
  },
  {
    id: "cosmic",
    name: "Cosmic starfield",
    family: "COSMIC",
    description: "Depth-layered stars create a quiet sense of distant motion.",
    apiName: "cosmicBackground",
    start: (target, settings) => cosmicBackground(target, {
      effect: "starfield",
      palette: settings.palette,
      density: 1.5,
      speed: settings.speed,
      intensity: settings.intensity,
    }),
    snippetOptions: (settings) => ({
      effect: "starfield",
      palette: settings.palette,
      density: 1.5,
      speed: settings.speed,
      intensity: settings.intensity,
    }),
  },
  {
    id: "geometric",
    name: "Polygon mesh",
    family: "GEOMETRIC",
    description: "An adaptive mesh connects softly shifting geometric points.",
    apiName: "geometricBackground",
    start: (target, settings) => geometricBackground(target, {
      effect: "polygon-mesh",
      palette: settings.palette,
      spacing: 76,
      speed: settings.speed,
      intensity: settings.intensity,
    }),
    snippetOptions: (settings) => ({
      effect: "polygon-mesh",
      palette: settings.palette,
      spacing: 76,
      speed: settings.speed,
      intensity: settings.intensity,
    }),
  },
  {
    id: "fluid",
    name: "Liquid blobs",
    family: "FLUID",
    description: "Organic color shapes float and softly merge across the stage.",
    apiName: "fluidBackground",
    start: (target, settings) => fluidBackground(target, {
      effect: "liquid-blobs",
      palette: settings.palette,
      count: 5,
      size: 78,
      speed: settings.speed,
      intensity: settings.intensity,
    }),
    snippetOptions: (settings) => ({
      effect: "liquid-blobs",
      palette: settings.palette,
      count: 5,
      size: 78,
      speed: settings.speed,
      intensity: settings.intensity,
    }),
  },
  {
    id: "atmospheric",
    name: "Fog & mist",
    family: "ATMOSPHERIC",
    description: "Slow, translucent fog banks add depth without obscuring content.",
    apiName: "atmosphericBackground",
    start: (target, settings) => atmosphericBackground(target, {
      effect: "fog",
      palette: settings.palette,
      density: 6,
      speed: settings.speed,
      intensity: settings.intensity,
    }),
    snippetOptions: (settings) => ({
      effect: "fog",
      palette: settings.palette,
      density: 6,
      speed: settings.speed,
      intensity: settings.intensity,
    }),
  },
  {
    id: "energy",
    name: "Electric arcs",
    family: "ENERGY",
    description: "Bright branching connections flicker into energized paths.",
    apiName: "energyBackground",
    start: (target, settings) => energyBackground(target, {
      effect: "electric-arcs",
      palette: settings.palette,
      density: 8,
      speed: settings.speed,
      intensity: settings.intensity,
    }),
    snippetOptions: (settings) => ({
      effect: "electric-arcs",
      palette: settings.palette,
      density: 8,
      speed: settings.speed,
      intensity: settings.intensity,
    }),
  },
];

const DEFAULT_SETTINGS: ShowcaseSettings = {
  effect: "gradient",
  palette: "Electric Teal",
  speed: 0.8,
  intensity: 0.7,
};
const BUILT_IN_PALETTE_NAMES = BUILT_IN_PALETTE_INPUTS.map(({ name }) => name);

const SHOWCASE_MARKUP = `
  <main class="showcase-shell">
    <header class="showcase-header">
      <a class="showcase-brand" href="#" aria-label="AF Motion effect showcase">
        <span class="showcase-mark" aria-hidden="true">af</span>
        <span>AF <span class="brand-light">Motion</span></span>
        <span class="showcase-tag">EFFECT SHOWCASE</span>
      </a>
      <span class="header-note"><span class="live-dot" aria-hidden="true"></span> INTERACTIVE LIBRARY</span>
    </header>
    <section class="intro">
      <p class="eyebrow">MOTION, MADE EXPLORABLE</p>
      <h1>Find your next<br /><span>favorite effect.</span></h1>
      <p class="intro-copy">Explore a few of AF Motion’s effect families, tune the feel, and take a ready-to-use TypeScript snippet with you.</p>
    </section>
    <section class="explorer" aria-label="Interactive effect explorer">
      <aside class="controls-panel" aria-label="Showcase controls">
        <div class="control-group">
          <label for="showcase-effect">Effect</label>
          <select id="showcase-effect">
            ${EFFECTS.map(({ id, family, name }) => `<option value="${id}">${family} / ${name}</option>`).join("")}
          </select>
        </div>
        <div class="control-group">
          <label for="showcase-palette">Built-in palette</label>
          <select id="showcase-palette">
            ${BUILT_IN_PALETTE_NAMES.map((name) => `<option value="${escapeHtml(name)}"${name === DEFAULT_SETTINGS.palette ? " selected" : ""}>${escapeHtml(name)}</option>`).join("")}
          </select>
          <div class="palette-swatches" id="palette-swatches" aria-label="Selected palette colors"></div>
        </div>
        <div class="range-group">
          <div class="range-heading"><label for="showcase-speed">Speed</label><output id="showcase-speed-value" for="showcase-speed"></output></div>
          <input id="showcase-speed" type="range" min="0.1" max="2" step="0.1" />
          <div class="range-scale"><span>Slow</span><span>Fast</span></div>
        </div>
        <div class="range-group">
          <div class="range-heading"><label for="showcase-intensity">Intensity</label><output id="showcase-intensity-value" for="showcase-intensity"></output></div>
          <input id="showcase-intensity" type="range" min="0.2" max="1" step="0.05" />
          <div class="range-scale"><span>Subtle</span><span>Bold</span></div>
        </div>
        <div class="controls-footnote">
          <span class="footnote-icon" aria-hidden="true">i</span>
          <p>Every preview cleans up before the next effect or setting is applied.</p>
        </div>
      </aside>
      <div class="showcase-main">
        <div class="preview-heading">
          <div>
            <p class="eyebrow" id="effect-family"></p>
            <h2 id="effect-name"></h2>
            <p class="effect-description" id="effect-description"></p>
          </div>
          <span class="preview-state"><span aria-hidden="true"></span> LIVE PREVIEW</span>
        </div>
        <div class="preview-stage" id="showcase-preview" aria-label="Effect preview" data-effect="">
          <div class="stage-grid" aria-hidden="true"></div>
          <div class="preview-content">
            <span class="preview-overline">AF / MOTION</span>
            <strong>Make motion<br />feel effortless.</strong>
            <span class="preview-caption">A small sample, in motion.</span>
          </div>
          <span class="stage-index" aria-hidden="true">PREVIEW / 001</span>
        </div>
        <div class="snippet-card">
          <div class="snippet-heading">
            <div><p class="eyebrow">TAKE IT WITH YOU</p><h3>TypeScript snippet</h3></div>
            <button type="button" class="copy-button" id="copy-snippet">Copy code</button>
          </div>
          <pre><code id="showcase-snippet"></code></pre>
        </div>
        <p class="showcase-status" id="showcase-status" role="status" aria-live="polite" aria-atomic="true"></p>
      </div>
    </section>
    <footer class="showcase-footer"><span>Seven families. Thirty-three palettes. One tiny API.</span><span>Built with <strong>AF Motion</strong></span></footer>
  </main>
`;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function findEffect(id: string): ShowcaseEffectDefinition {
  const effect = EFFECTS.find((candidate) => candidate.id === id);
  if (!effect) throw new TypeError(`Unknown showcase effect "${id}"`);
  return effect;
}

function getElement<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Showcase element "${selector}" was not found`);
  return element;
}

function readSettings(elements: ShowcaseElements): ShowcaseSettings {
  return {
    effect: findEffect(elements.effect.value).id,
    palette: elements.palette.value,
    speed: Number(elements.speed.value),
    intensity: Number(elements.intensity.value),
  };
}

export function generateShowcaseSnippet(settings: ShowcaseSettings): string {
  const effect = findEffect(settings.effect);
  const options = effect.snippetOptions(settings);
  return [
    `import { ${effect.apiName} } from "af-motion";`,
    "",
    'const target = document.querySelector<HTMLElement>("#showcase-preview");',
    'if (!target) throw new Error("Preview element was not found");',
    "",
    `const controls = ${effect.apiName}(target, ${JSON.stringify(options, null, 2)});`,
    "",
    "// Call when the preview is no longer needed.",
    "controls.destroy();",
  ].join("\n");
}

function renderPaletteSwatches(container: HTMLElement, paletteName: string): void {
  const palette = getPalette(paletteName);
  if (!palette) throw new TypeError(`Unknown built-in palette "${paletteName}"`);
  const tokens = ["primary", "secondary", "accent"] as const;
  container.replaceChildren(...tokens.map((token) => {
    const swatch = document.createElement("span");
    swatch.className = "palette-swatch";
    swatch.style.setProperty("--swatch-color", palette.tokens[token]);
    swatch.title = `${token}: ${palette.tokens[token]}`;
    swatch.setAttribute("aria-label", `${token} ${palette.tokens[token]}`);
    return swatch;
  }));
}

export function createShowcase(root: HTMLElement): { destroy(): void } {
  root.innerHTML = SHOWCASE_MARKUP;
  const elements: ShowcaseElements = {
    effect: getElement(root, "#showcase-effect"),
    palette: getElement(root, "#showcase-palette"),
    speed: getElement(root, "#showcase-speed"),
    intensity: getElement(root, "#showcase-intensity"),
    speedValue: getElement(root, "#showcase-speed-value"),
    intensityValue: getElement(root, "#showcase-intensity-value"),
    swatches: getElement(root, "#palette-swatches"),
    preview: getElement(root, "#showcase-preview"),
    snippet: getElement(root, "#showcase-snippet"),
    status: getElement(root, "#showcase-status"),
    copy: getElement(root, "#copy-snippet"),
  };

  elements.speed.value = String(DEFAULT_SETTINGS.speed);
  elements.intensity.value = String(DEFAULT_SETTINGS.intensity);

  let destroyed = false;
  let previewControls: ShowcaseControls | undefined;
  const listeners: Array<() => void> = [];

  const listen = <T extends HTMLElement>(
    element: T,
    eventName: string,
    handler: EventListener,
  ): void => {
    element.addEventListener(eventName, handler);
    listeners.push(() => element.removeEventListener(eventName, handler));
  };

  const updatePreview = (): void => {
    previewControls?.destroy();
    previewControls = undefined;
    const settings = readSettings(elements);
    const effect = findEffect(settings.effect);
    elements.preview.dataset.effect = effect.id;
    elements.speedValue.value = `${settings.speed.toFixed(1)}×`;
    elements.intensityValue.value = `${Math.round(settings.intensity * 100)}%`;
    getElement(root, "#effect-family").textContent = effect.family;
    getElement(root, "#effect-name").textContent = effect.name;
    getElement(root, "#effect-description").textContent = effect.description;
    renderPaletteSwatches(elements.swatches, settings.palette);
    elements.snippet.textContent = generateShowcaseSnippet(settings);

    try {
      previewControls = effect.start(elements.preview, settings);
      elements.status.textContent = `${effect.name} preview is ready with ${settings.palette}.`;
    } catch (error) {
      elements.status.textContent = `Could not start ${effect.name}: ${error instanceof Error ? error.message : String(error)}`;
    }
  };

  const handleChange: EventListener = () => {
    updatePreview();
  };
  listen(elements.effect, "change", handleChange);
  listen(elements.palette, "change", handleChange);
  listen(elements.speed, "input", handleChange);
  listen(elements.intensity, "input", handleChange);
  listen(elements.copy, "click", () => {
    const snippet = elements.snippet.textContent ?? "";
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(snippet).then(
        () => {
          elements.status.textContent = "TypeScript snippet copied.";
        },
        () => {
          elements.status.textContent = "Clipboard unavailable. Select and copy the snippet below.";
        },
      );
    } else {
      elements.status.textContent = "Select and copy the TypeScript snippet below.";
    }
  });

  updatePreview();
  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      previewControls?.destroy();
      previewControls = undefined;
      for (const removeListener of listeners) removeListener();
    },
  };
}
