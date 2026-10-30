import {
  countUp,
  glow,
  gradientText,
  magnetic,
  reveal,
  textScramble,
  tilt,
  typewriter,
} from "../src/index.js";
import { onReducedMotionChange, prefersReducedMotion } from "../src/core/motion.js";

export type EffectName =
  | "reveal"
  | "typewriter"
  | "scramble"
  | "gradient"
  | "glow"
  | "count-up"
  | "tilt"
  | "magnetic";

interface EffectDefinition {
  name: EffectName;
  title: string;
  eyebrow: string;
  description: string;
  target: "card" | "title" | "counter";
}

interface StudioElements {
  presets: HTMLElement;
  effect: HTMLSelectElement;
  duration: HTMLInputElement;
  delay: HTMLInputElement;
  intensity: HTMLInputElement;
  once: HTMLInputElement;
  sample: HTMLInputElement;
  durationValue: HTMLOutputElement;
  delayValue: HTMLOutputElement;
  intensityValue: HTMLOutputElement;
  effectTitle: HTMLElement;
  effectDescription: HTMLElement;
  effectEyebrow: HTMLElement;
  card: HTMLElement;
  title: HTMLElement;
  counter: HTMLElement;
  status: HTMLElement;
  replay: HTMLButtonElement;
  reset: HTMLButtonElement;
  snippet: HTMLElement;
  copy: HTMLButtonElement;
  share: HTMLButtonElement;
  shareFallback: HTMLInputElement;
  comparisonToggle: HTMLInputElement;
  comparisonControls: HTMLElement;
  comparisonEffect: HTMLSelectElement;
  comparisonLayout: HTMLElement;
  comparisonStage: HTMLElement;
  comparisonCard: HTMLElement;
  comparisonTitle: HTMLElement;
  comparisonCounter: HTMLElement;
}

interface EffectSurface {
  card: HTMLElement;
  title: HTMLElement;
  counter: HTMLElement;
}

export interface UsageSnippetSettings {
  effect: EffectName;
  duration: number;
  delay: number;
  intensity: number;
  once: boolean;
  text: string;
}

const URL_KEYS = {
  effect: "effect",
  duration: "duration",
  delay: "delay",
  intensity: "intensity",
  once: "once",
  text: "text",
} as const;

export interface StudioPreset {
  id: string;
  name: string;
  description: string;
  settings: UsageSnippetSettings;
}

const EFFECTS: readonly EffectDefinition[] = [
  {
    name: "reveal",
    title: "Scroll reveal",
    eyebrow: "ENTRANCE",
    description: "A soft fade and lift that starts when the card enters view.",
    target: "card",
  },
  {
    name: "typewriter",
    title: "Typewriter",
    eyebrow: "TEXT",
    description: "Types your sample copy one character at a time.",
    target: "title",
  },
  {
    name: "scramble",
    title: "Text scramble",
    eyebrow: "TEXT",
    description: "Resolves randomized characters into your sample copy.",
    target: "title",
  },
  {
    name: "gradient",
    title: "Gradient text",
    eyebrow: "TEXT",
    description: "Paints a crisp color gradient across the sample copy.",
    target: "title",
  },
  {
    name: "glow",
    title: "Pulse glow",
    eyebrow: "AMBIENT",
    description: "Adds a gentle, looping glow around the sample card.",
    target: "card",
  },
  {
    name: "count-up",
    title: "Count up",
    eyebrow: "NUMBER",
    description: "Counts a number into place with the shared frame loop.",
    target: "counter",
  },
  {
    name: "tilt",
    title: "3D tilt",
    eyebrow: "POINTER",
    description: "Tilts the card toward your pointer. Move over the preview.",
    target: "card",
  },
  {
    name: "magnetic",
    title: "Magnetic",
    eyebrow: "POINTER",
    description: "Gently follows your pointer while it is over the card.",
    target: "card",
  },
];

const INITIAL_TEXT = "Make motion feel effortless.";
const INITIAL_DURATION = 900;
const INITIAL_DELAY = 0;
const INITIAL_INTENSITY = 65;

const DEFAULT_SETTINGS: UsageSnippetSettings = {
  effect: "reveal",
  duration: INITIAL_DURATION,
  delay: INITIAL_DELAY,
  intensity: INITIAL_INTENSITY / 100,
  once: true,
  text: INITIAL_TEXT,
};

export const STUDIO_PRESETS: readonly StudioPreset[] = [
  {
    id: "subtle-reveal",
    name: "Subtle reveal",
    description: "Soft entrance",
    settings: { effect: "reveal", duration: 900, delay: 100, intensity: 0.3, once: true, text: INITIAL_TEXT },
  },
  {
    id: "dramatic-reveal",
    name: "Dramatic reveal",
    description: "Deep, slow lift",
    settings: { effect: "reveal", duration: 1600, delay: 200, intensity: 0.95, once: true, text: "A little more feeling." },
  },
  {
    id: "typewriter-intro",
    name: "Typewriter intro",
    description: "Character by character",
    settings: { effect: "typewriter", duration: 1400, delay: 150, intensity: 0.65, once: true, text: "Ideas in motion." },
  },
  {
    id: "gradient-headline",
    name: "Gradient headline",
    description: "Color in motion",
    settings: { effect: "gradient", duration: 1500, delay: 0, intensity: 0.7, once: true, text: "Move with intention." },
  },
  {
    id: "glowing-card",
    name: "Glowing card",
    description: "Ambient pulse",
    settings: { effect: "glow", duration: 1200, delay: 0, intensity: 0.8, once: true, text: "Make it glow." },
  },
  {
    id: "magnetic-interaction",
    name: "Magnetic interaction",
    description: "Pointer response",
    settings: { effect: "magnetic", duration: 500, delay: 0, intensity: 0.75, once: false, text: "Follow the feeling." },
  },
];

const STUDIO_MARKUP = `
  <div class="studio-shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="AF Motion Studio home">
        <span class="brand-mark" aria-hidden="true">af</span>
        <span>AF <span class="brand-light">Motion</span></span>
        <span class="studio-pill">STUDIO</span>
      </a>
      <div class="topbar-right">
        <span class="status-dot" aria-hidden="true"></span>
        <span>Interactive playground</span>
      </div>
    </header>
    <main class="studio-layout">
      <aside class="control-panel" aria-label="Effect controls">
        <div class="panel-heading">
          <span class="section-kicker">PLAYGROUND</span>
          <h1>Shape the<br /><span>moment.</span></h1>
          <p>Choose an effect, tune the details, and see it come to life.</p>
        </div>
        <label class="field-label" for="effect-select">Effect</label>
        <div class="select-wrap">
          <select id="effect-select" aria-label="Choose an effect">
            ${EFFECTS.map(({ name, title, eyebrow }) =>
              `<option value="${name}">${eyebrow} / ${title}</option>`,
            ).join("")}
          </select>
          <span class="select-chevron" aria-hidden="true">⌄</span>
        </div>
        <section class="effect-summary" aria-live="polite" aria-atomic="true">
          <div class="effect-icon" aria-hidden="true"><span></span><span></span><span></span></div>
          <div>
            <p class="summary-label" id="effect-eyebrow"></p>
            <h2 id="effect-title"></h2>
            <p class="summary-description" id="effect-description"></p>
          </div>
        </section>
        <section class="preset-section" aria-label="Effect presets">
          <div class="preset-heading">
            <span class="field-label">Quick start</span>
            <span class="preset-count">06 PRESETS</span>
          </div>
          <div class="preset-gallery" id="preset-gallery">
            ${STUDIO_PRESETS.map(({ id, name, description }) =>
              `<button class="preset-card" type="button" data-preset="${id}" aria-pressed="false">
                <span class="preset-card-name">${name}</span>
                <span class="preset-card-description">${description}</span>
              </button>`,
            ).join("")}
          </div>
        </section>
        <div class="control-divider"></div>
        <div class="field-row">
          <label class="field-label" for="duration-range">Duration</label>
          <output class="field-value" id="duration-value" for="duration-range"></output>
        </div>
        <input id="duration-range" type="range" min="200" max="2400" step="100" />
        <div class="range-scale"><span>200 ms</span><span>2.4 s</span></div>
        <div class="field-row delay-row">
          <label class="field-label" for="delay-range">Delay</label>
          <output class="field-value" id="delay-value" for="delay-range"></output>
        </div>
        <input id="delay-range" type="range" min="0" max="1200" step="50" />
        <div class="range-scale"><span>0 ms</span><span>1.2 s</span></div>
        <div class="field-row intensity-row">
          <label class="field-label" for="intensity-range">Intensity</label>
          <output class="field-value" id="intensity-value" for="intensity-range"></output>
        </div>
        <input id="intensity-range" type="range" min="10" max="100" step="5" />
        <label class="once-control">
          <span>
            <span class="field-label">Play once</span>
            <span class="once-caption">Keep entrance effects from repeating</span>
          </span>
          <input id="once-toggle" type="checkbox" />
          <span class="switch" aria-hidden="true"></span>
        </label>
        <label class="field-label sample-label" for="sample-input">Sample copy</label>
        <input id="sample-input" class="text-input" type="text" maxlength="64" />
        <div class="panel-actions">
          <button class="button button-primary" id="replay-button" type="button">
            <span aria-hidden="true">↻</span> Replay effect
          </button>
          <button class="button button-quiet" id="reset-button" type="button">Reset</button>
        </div>
        <p class="keyboard-hint">Tip: hover the card for pointer effects.</p>
      </aside>
      <section class="preview-panel" aria-label="Effect preview">
        <div class="preview-topline">
          <div>
            <span class="section-kicker">LIVE PREVIEW</span>
            <p>Canvas <span class="canvas-separator">/</span> 01</p>
          </div>
          <div class="preview-tools">
            <label class="compare-toggle" for="comparison-toggle">
              <input id="comparison-toggle" type="checkbox" />
              <span>Compare</span>
            </label>
            <label class="compare-select-wrap" id="comparison-controls" hidden>
              <select id="comparison-effect" aria-label="Choose second effect">
                ${EFFECTS.map(({ name, title, eyebrow }) =>
                  `<option value="${name}"${name === "scramble" ? " selected" : ""}>${eyebrow} / ${title}</option>`,
                ).join("")}
              </select>
            </label>
            <span class="preview-badge"><span aria-hidden="true"></span> READY</span>
          </div>
        </div>
        <div class="preview-comparison" id="preview-comparison">
          <div class="preview-stage">
          <div class="stage-grid" aria-hidden="true"></div>
          <div class="stage-orb stage-orb-one" aria-hidden="true"></div>
          <div class="stage-orb stage-orb-two" aria-hidden="true"></div>
          <article class="sample-card" id="sample-card" aria-label="Effect sample">
            <div class="card-topline">
              <span class="card-brand"><span class="mini-mark" aria-hidden="true">a</span> AF / MOTION</span>
              <span class="card-index">SAMPLE&nbsp;&nbsp; 001</span>
            </div>
            <div class="card-content">
              <span class="card-kicker"><span></span> MOTION, MADE HUMAN</span>
              <h2 id="sample-title"></h2>
              <p>Small details. Fluid interactions. A little more feeling in every frame.</p>
            </div>
            <div class="card-footer">
              <div><span class="footer-caption">MOTION SCORE</span><strong id="sample-counter"></strong></div>
              <span class="card-arrow" aria-hidden="true">↗</span>
            </div>
          </article>
          <span class="stage-coordinate coordinate-top" aria-hidden="true">40° 43′ 55.3″ N</span>
          <span class="stage-coordinate coordinate-bottom" aria-hidden="true">AF / PLAYGROUND</span>
          </div>
          <div class="preview-stage comparison-stage" id="comparison-stage" hidden>
          <div class="stage-grid" aria-hidden="true"></div>
          <div class="stage-orb stage-orb-one" aria-hidden="true"></div>
          <div class="stage-orb stage-orb-two" aria-hidden="true"></div>
          <article class="sample-card" id="comparison-card" aria-label="Second effect sample">
            <div class="card-topline">
              <span class="card-brand"><span class="mini-mark" aria-hidden="true">a</span> AF / MOTION</span>
              <span class="card-index">SAMPLE&nbsp;&nbsp; 002</span>
            </div>
            <div class="card-content">
              <span class="card-kicker"><span></span> MOTION, MADE HUMAN</span>
              <h2 id="comparison-title"></h2>
              <p>Small details. Fluid interactions. A little more feeling in every frame.</p>
            </div>
            <div class="card-footer">
              <div><span class="footer-caption">MOTION SCORE</span><strong id="comparison-counter"></strong></div>
              <span class="card-arrow" aria-hidden="true">↗</span>
            </div>
          </article>
          <span class="stage-coordinate coordinate-top" aria-hidden="true">COMPARISON</span>
          <span class="stage-coordinate coordinate-bottom" aria-hidden="true">AF / PLAYGROUND</span>
          </div>
        </div>
        <div class="preview-footer">
          <p id="preview-status" role="status" aria-live="polite" aria-atomic="true"></p>
          <span>Built with <strong>AF Motion</strong></span>
        </div>
        <section class="snippet-panel" aria-label="Generated TypeScript usage">
          <div class="snippet-heading">
            <div>
              <span class="section-kicker">USAGE SNIPPET</span>
              <p>Ready to use in your project</p>
            </div>
            <div class="snippet-actions">
              <button class="button button-copy" id="copy-button" type="button">Copy code</button>
              <button class="button button-share" id="share-button" type="button">
                <span aria-hidden="true">↗</span> Share
              </button>
            </div>
          </div>
          <input class="share-fallback" id="share-fallback" type="text" readonly aria-label="Share URL" hidden />
          <pre class="snippet-code"><code id="usage-snippet"></code></pre>
        </section>
      </section>
    </main>
  </div>
`;

function getElement<T extends HTMLElement>(root: HTMLElement, id: string): T {
  const element = root.querySelector<T>(`#${id}`);
  if (!element) throw new Error(`Studio element "${id}" was not found`);
  return element;
}

function getEffect(name: string): EffectDefinition {
  const effect = EFFECTS.find((candidate) => candidate.name === name);
  if (!effect) throw new TypeError(`Unknown Studio effect "${name}"`);
  return effect;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function validRangeValue(value: string | null, min: number, max: number, step: number): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max || (parsed - min) % step !== 0) {
    return undefined;
  }
  return parsed;
}

function snippetForEffect(settings: UsageSnippetSettings): { importName: string; options: string } {
  const { effect, duration, intensity, once, text } = settings;
  switch (effect) {
    case "reveal":
      return {
        importName: "reveal",
        options: `{
  duration: ${duration},
  delay: ${settings.delay},
  once: ${once},
  properties: {
    opacity: [0, 1],
    transform: ["translateY(${Math.round(12 + intensity * 28)}px)", "translateY(0px)"],
  },
}`,
      };
    case "typewriter":
      return {
        importName: "typewriter",
        options: `{
  phrases: [${JSON.stringify(text)}],
  typeSpeed: ${Math.max(15, Math.round(duration / Math.max(Array.from(text).length, 1)))},
  deleteSpeed: 30,
  pause: 1200,
  loop: ${!once},
  cursor: "_",
}`,
      };
    case "scramble":
      return {
        importName: "textScramble",
        options: `{
  duration: ${duration},
  speed: ${Math.max(16, Math.round(40 - intensity * 24))},
}`,
      };
    case "gradient":
      return {
        importName: "gradientText",
        options: `{
  colors: ["#a78bfa", "#67e8f9", "#a78bfa"],
  duration: ${duration},
  animated: true,
  loop: ${!once},
}`,
      };
    case "glow":
      return {
        importName: "glow",
        options: `{
  color: "#8b5cf6",
  intensity: ${intensity},
  blur: 32,
  duration: ${duration},
  mode: "pulse",
}`,
      };
    case "count-up":
      return {
        importName: "countUp",
        options: `{
  from: 0,
  to: 100,
  duration: ${duration},
  suffix: "+",
}`,
      };
    case "tilt":
      return {
        importName: "tilt",
        options: `{
  maxTilt: ${intensity * 16},
  speed: ${duration},
}`,
      };
    case "magnetic":
      return {
        importName: "magnetic",
        options: `{
  strength: ${intensity * 0.45},
  maxTranslate: ${intensity * 24},
  duration: ${duration},
}`,
      };
  }
}

export function generateUsageSnippet(settings: UsageSnippetSettings): string {
  const definition = getEffect(settings.effect);
  const { importName, options } = snippetForEffect(settings);
  const elementId = definition.target === "card"
    ? "sample-card"
    : definition.target === "counter"
      ? "sample-counter"
      : "sample-title";
  const call = `${importName}(element, ${options})`;
  const textSetup = definition.target === "title"
    ? `element.textContent = ${JSON.stringify(settings.text)};`
    : "";
  const setup = `import { ${importName} } from "af-motion";

const element = document.querySelector<HTMLElement>("#${elementId}");
if (!element) throw new Error("Preview element was not found");
${textSetup}`;

  if (settings.delay > 0 && settings.effect !== "reveal") {
    return `${setup}
let controls: ReturnType<typeof ${importName}> | undefined;
const timer = window.setTimeout(() => {
  controls = ${call};
}, ${settings.delay});

function cleanup() {
  window.clearTimeout(timer);
  controls?.destroy();
}`;
  }

  return `${setup}
const controls = ${call};

function cleanup() {
  controls.destroy();
}`;
}

export function readStudioSettings(search: string): UsageSnippetSettings {
  const params = new URLSearchParams(search);
  const effectValue = params.get(URL_KEYS.effect);
  const effect = EFFECTS.find(({ name }) => name === effectValue)?.name ?? DEFAULT_SETTINGS.effect;
  const duration = validRangeValue(params.get(URL_KEYS.duration), 200, 2400, 100)
    ?? DEFAULT_SETTINGS.duration;
  const delay = validRangeValue(params.get(URL_KEYS.delay), 0, 1200, 50)
    ?? DEFAULT_SETTINGS.delay;
  const intensityPercent = validRangeValue(params.get(URL_KEYS.intensity), 10, 100, 5)
    ?? INITIAL_INTENSITY;
  const onceValue = params.get(URL_KEYS.once);
  const once = onceValue === "true" ? true : onceValue === "false" ? false : DEFAULT_SETTINGS.once;
  const textValue = params.get(URL_KEYS.text);
  const text = textValue && textValue.trim() !== "" && textValue.length <= 64
    ? textValue
    : DEFAULT_SETTINGS.text;

  return {
    effect,
    duration,
    delay,
    intensity: intensityPercent / 100,
    once,
    text,
  };
}

export function createStudioShareUrl(href: string, settings: UsageSnippetSettings): string {
  const url = new URL(href);
  const params = url.searchParams;
  params.set(URL_KEYS.effect, settings.effect);
  params.set(URL_KEYS.duration, String(settings.duration));
  params.set(URL_KEYS.delay, String(settings.delay));
  params.set(URL_KEYS.intensity, String(Math.round(settings.intensity * 100)));
  params.set(URL_KEYS.once, String(settings.once));
  params.set(URL_KEYS.text, settings.text);
  return url.toString();
}

export interface StudioControls {
  destroy(): void;
}

export function createStudio(root: HTMLElement): StudioControls {
  root.innerHTML = STUDIO_MARKUP;

  const elements: StudioElements = {
    presets: getElement(root, "preset-gallery"),
    effect: getElement(root, "effect-select"),
    duration: getElement(root, "duration-range"),
    delay: getElement(root, "delay-range"),
    intensity: getElement(root, "intensity-range"),
    once: getElement(root, "once-toggle"),
    sample: getElement(root, "sample-input"),
    durationValue: getElement(root, "duration-value"),
    delayValue: getElement(root, "delay-value"),
    intensityValue: getElement(root, "intensity-value"),
    effectTitle: getElement(root, "effect-title"),
    effectDescription: getElement(root, "effect-description"),
    effectEyebrow: getElement(root, "effect-eyebrow"),
    card: getElement(root, "sample-card"),
    title: getElement(root, "sample-title"),
    counter: getElement(root, "sample-counter"),
    status: getElement(root, "preview-status"),
    replay: getElement(root, "replay-button"),
    reset: getElement(root, "reset-button"),
    snippet: getElement(root, "usage-snippet"),
    copy: getElement(root, "copy-button"),
    share: getElement(root, "share-button"),
    shareFallback: getElement(root, "share-fallback"),
    comparisonToggle: getElement(root, "comparison-toggle"),
    comparisonControls: getElement(root, "comparison-controls"),
    comparisonEffect: getElement(root, "comparison-effect"),
    comparisonLayout: getElement(root, "preview-comparison"),
    comparisonStage: getElement(root, "comparison-stage"),
    comparisonCard: getElement(root, "comparison-card"),
    comparisonTitle: getElement(root, "comparison-title"),
    comparisonCounter: getElement(root, "comparison-counter"),
  };

  const initialSettings = readStudioSettings(typeof window === "undefined" ? "" : window.location.search);
  elements.effect.value = initialSettings.effect;
  elements.duration.value = String(initialSettings.duration);
  elements.delay.value = String(initialSettings.delay);
  elements.intensity.value = String(Math.round(initialSettings.intensity * 100));
  elements.once.checked = initialSettings.once;
  elements.sample.value = initialSettings.text;

  let destroyed = false;
  let runId = 0;
  let delayTimer: ReturnType<typeof setTimeout> | null = null;
  let comparisonDelayTimer: ReturnType<typeof setTimeout> | null = null;
  let destroyEffect = (): void => undefined;
  let destroyComparisonEffect = (): void => undefined;

  const updateLabels = (): void => {
    elements.durationValue.value = `${elements.duration.value} ms`;
    elements.delayValue.value = `${elements.delay.value} ms`;
    elements.intensityValue.value = `${elements.intensity.value}%`;
  };

  const updateSnippet = (): void => {
    elements.snippet.textContent = generateUsageSnippet({
      effect: getEffect(elements.effect.value).name,
      duration: Number(elements.duration.value),
      delay: Number(elements.delay.value),
      intensity: Number(elements.intensity.value) / 100,
      once: elements.once.checked,
      text: elements.sample.value.trim() || INITIAL_TEXT,
    });
  };

  const currentSettings = (): UsageSnippetSettings => ({
    effect: getEffect(elements.effect.value).name,
    duration: Number(elements.duration.value),
    delay: Number(elements.delay.value),
    intensity: Number(elements.intensity.value) / 100,
    once: elements.once.checked,
    text: elements.sample.value.trim() || INITIAL_TEXT,
  });

  const updateShareUrl = (): string => {
    const url = createStudioShareUrl(window.location.href, currentSettings());
    window.history.replaceState(null, "", url);
    return url;
  };

  const updateDescription = (): void => {
    const definition = getEffect(elements.effect.value);
    elements.effectTitle.textContent = definition.title;
    elements.effectDescription.textContent = definition.description;
    elements.effectEyebrow.textContent = definition.eyebrow;
  };

  const clearEffect = (): void => {
    runId++;
    if (delayTimer !== null) {
      clearTimeout(delayTimer);
      delayTimer = null;
    }
    if (comparisonDelayTimer !== null) {
      clearTimeout(comparisonDelayTimer);
      comparisonDelayTimer = null;
    }
    destroyEffect();
    destroyEffect = (): void => undefined;
    destroyComparisonEffect();
    destroyComparisonEffect = (): void => undefined;
  };

  const setStatus = (message: string): void => {
    elements.status.textContent = message;
  };

  const clearPresetSelection = (): void => {
    for (const button of elements.presets.querySelectorAll<HTMLButtonElement>("[data-preset]")) {
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
    }
  };

  const startSurfaceEffect = (effectName: string, surface: EffectSurface): (() => void) => {
    const definition = getEffect(effectName);
    const duration = Number(elements.duration.value);
    const delay = Number(elements.delay.value);
    const intensity = Number(elements.intensity.value) / 100;
    const text = elements.sample.value.trim() || INITIAL_TEXT;
    const target = definition.target === "card"
      ? surface.card
      : definition.target === "counter"
        ? surface.counter
        : surface.title;
    surface.title.textContent = text;
    surface.counter.textContent = "42";

    switch (definition.name) {
      case "reveal":
        return reveal(target, {
          duration,
          delay,
          once: elements.once.checked,
          properties: {
            opacity: [0, 1],
            transform: [`translateY(${Math.round(12 + intensity * 28)}px)`, "translateY(0px)"],
          },
        }).destroy;
      case "typewriter":
        return typewriter(target, {
          phrases: [text],
          typeSpeed: Math.max(15, Math.round(duration / Math.max(Array.from(text).length, 1))),
          deleteSpeed: 30,
          pause: 1200,
          loop: !elements.once.checked,
          cursor: "_",
        }).destroy;
      case "scramble":
        return textScramble(target, {
          duration,
          speed: Math.max(16, Math.round(40 - intensity * 24)),
        }).destroy;
      case "gradient":
        return gradientText(target, {
          colors: ["#a78bfa", "#67e8f9", "#a78bfa"],
          duration,
          animated: true,
          loop: !elements.once.checked,
        }).destroy;
      case "glow":
        return glow(target, {
          color: "#8b5cf6",
          intensity,
          blur: 32,
          duration,
          mode: "pulse",
        }).destroy;
      case "count-up":
        return countUp(target, {
          from: 0,
          to: 100,
          duration,
          suffix: "+",
        }).destroy;
      case "tilt":
        return tilt(target, {
          maxTilt: intensity * 16,
          speed: duration,
        }).destroy;
      case "magnetic":
        return magnetic(target, {
          strength: intensity * 0.45,
          maxTranslate: intensity * 24,
          duration,
        }).destroy;
    }
  };

  const renderStaticPreviews = (): void => {
    const text = elements.sample.value.trim() || INITIAL_TEXT;
    for (const surface of [
      { card: elements.card, title: elements.title, counter: elements.counter },
      { card: elements.comparisonCard, title: elements.comparisonTitle, counter: elements.comparisonCounter },
    ]) {
      surface.title.textContent = text;
      surface.counter.textContent = "42";
    }
  };

  const replay = (): void => {
    updateShareUrl();
    updateSnippet();
    clearEffect();
    const currentRun = runId;
    const delay = Number(elements.delay.value);
    const definition = getEffect(elements.effect.value);
    elements.card.dataset.effect = definition.name;
    elements.title.textContent = elements.sample.value.trim() || INITIAL_TEXT;
    elements.counter.textContent = "42";
    elements.comparisonStage.hidden = !elements.comparisonToggle.checked;
    elements.comparisonControls.hidden = !elements.comparisonToggle.checked;
    elements.comparisonLayout.classList.toggle("is-comparing", elements.comparisonToggle.checked);
    if (prefersReducedMotion()) {
      renderStaticPreviews();
      setStatus("Reduced motion is enabled; previews are static.");
      return;
    }
    const launch = (effectName: string, surface: EffectSurface, comparison: boolean): void => {
      const selectedDefinition = getEffect(effectName);
      if (comparison) comparisonDelayTimer = null;
      else delayTimer = null;
      if (destroyed || currentRun !== runId) return;
      try {
        const destroy = startSurfaceEffect(effectName, surface);
        if (comparison) {
          surface.card.dataset.effect = selectedDefinition.name;
          destroyComparisonEffect = destroy;
        } else {
          surface.card.dataset.effect = selectedDefinition.name;
          destroyEffect = destroy;
        }
      } catch (error) {
        setStatus(`Unable to start ${comparison ? "comparison " : ""}effect: ${describeError(error)}`);
      }
    };
    const schedule = (effectName: string, surface: EffectSurface, comparison: boolean): void => {
      const selectedDefinition = getEffect(effectName);
      if (delay > 0 && selectedDefinition.name !== "reveal") {
        const timer = setTimeout(() => launch(effectName, surface, comparison), delay);
        if (comparison) comparisonDelayTimer = timer;
        else delayTimer = timer;
      } else {
        launch(effectName, surface, comparison);
      }
    };
    if (delay > 0 && definition.name !== "reveal") {
      setStatus(`Starting in ${delay} ms…`);
    } else {
      setStatus(`${definition.title} is ready${delay > 0 ? ` · ${delay} ms delay` : ""}`);
    }
    schedule(elements.effect.value, {
      card: elements.card,
      title: elements.title,
      counter: elements.counter,
    }, false);
    if (elements.comparisonToggle.checked) {
      elements.comparisonTitle.textContent = elements.sample.value.trim() || INITIAL_TEXT;
      elements.comparisonCounter.textContent = "42";
      elements.comparisonCard.dataset.effect = elements.comparisonEffect.value;
      schedule(elements.comparisonEffect.value, {
        card: elements.comparisonCard,
        title: elements.comparisonTitle,
        counter: elements.comparisonCounter,
      }, true);
    }
  };

  const onEffectChange = (): void => {
    clearPresetSelection();
    updateDescription();
    replay();
  };
  const onComparisonChange = (event: Event): void => {
    replay();
    if (event.currentTarget === elements.comparisonToggle) {
      const message = elements.comparisonToggle.checked
        ? `Comparison enabled: ${getEffect(elements.effect.value).title} and ${getEffect(elements.comparisonEffect.value).title}.`
        : "Comparison disabled.";
      setStatus(message);
    } else {
      setStatus(`Second preview effect changed to ${getEffect(elements.comparisonEffect.value).title}.`);
    }
  };
  const onParameterChange = (): void => {
    clearPresetSelection();
    updateLabels();
    replay();
  };
  const onSampleChange = (): void => {
    clearPresetSelection();
    replay();
  };
  const onReplay = (): void => replay();
  const onReset = (): void => {
    clearPresetSelection();
    elements.effect.value = "reveal";
    elements.duration.value = String(INITIAL_DURATION);
    elements.delay.value = String(INITIAL_DELAY);
    elements.intensity.value = String(INITIAL_INTENSITY);
    elements.once.checked = true;
    elements.sample.value = INITIAL_TEXT;
    updateLabels();
    updateDescription();
    replay();
  };
  const onPresetSelect = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>("[data-preset]");
    if (!button || !elements.presets.contains(button)) return;
    const preset = STUDIO_PRESETS.find((candidate) => candidate.id === button.dataset.preset);
    if (!preset) throw new TypeError(`Unknown Studio preset "${button.dataset.preset}"`);

    elements.effect.value = preset.settings.effect;
    elements.duration.value = String(preset.settings.duration);
    elements.delay.value = String(preset.settings.delay);
    elements.intensity.value = String(Math.round(preset.settings.intensity * 100));
    elements.once.checked = preset.settings.once;
    elements.sample.value = preset.settings.text;
    for (const presetButton of elements.presets.querySelectorAll<HTMLButtonElement>("[data-preset]")) {
      const selected = presetButton === button;
      presetButton.classList.toggle("is-selected", selected);
      presetButton.setAttribute("aria-pressed", String(selected));
    }
    updateLabels();
    updateDescription();
    replay();
  };
  const onCopy = async (): Promise<void> => {
    const snippet = elements.snippet.textContent ?? "";
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(snippet);
        setStatus("Usage snippet copied to clipboard.");
        return;
      }
    } catch {
      // Fall through to the selectable-text fallback when clipboard permission is denied.
    }

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(elements.snippet);
    selection?.removeAllRanges();
    selection?.addRange(range);
    if (typeof document.execCommand === "function" && document.execCommand("copy")) {
      setStatus("Usage snippet copied to clipboard.");
    } else {
      setStatus("Clipboard unavailable — snippet selected; copy it manually.");
    }
  };
  const onShare = async (): Promise<void> => {
    const shareUrl = updateShareUrl();
    elements.shareFallback.hidden = true;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setStatus("Configuration URL copied to clipboard.");
        return;
      }
    } catch {
      // Use the visible manual-copy fallback when clipboard permission is denied.
    }

    elements.shareFallback.value = shareUrl;
    elements.shareFallback.hidden = false;
    elements.shareFallback.focus();
    elements.shareFallback.select();
    if (typeof document.execCommand === "function" && document.execCommand("copy")) {
      setStatus("Configuration URL copied to clipboard.");
    } else {
      setStatus("Clipboard unavailable — share URL selected; copy it manually.");
    }
  };
  const onMotionPreferenceChange = (reduced: boolean): void => {
    if (destroyed) return;
    if (reduced) {
      clearEffect();
      renderStaticPreviews();
      setStatus("Reduced motion is enabled; previews are static.");
    } else {
      setStatus("Reduced motion is off. Replay an effect to animate the previews.");
    }
  };
  const stopWatchingReducedMotion = onReducedMotionChange(onMotionPreferenceChange);

  elements.effect.addEventListener("change", onEffectChange);
  elements.duration.addEventListener("input", onParameterChange);
  elements.delay.addEventListener("input", onParameterChange);
  elements.intensity.addEventListener("input", onParameterChange);
  elements.once.addEventListener("change", onParameterChange);
  elements.sample.addEventListener("input", onSampleChange);
  elements.replay.addEventListener("click", onReplay);
  elements.reset.addEventListener("click", onReset);
  elements.copy.addEventListener("click", onCopy);
  elements.share.addEventListener("click", onShare);
  elements.comparisonToggle.addEventListener("change", onComparisonChange);
  elements.comparisonEffect.addEventListener("change", onComparisonChange);
  elements.presets.addEventListener("click", onPresetSelect);

  updateLabels();
  updateDescription();
  replay();

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      clearEffect();
      elements.effect.removeEventListener("change", onEffectChange);
      elements.duration.removeEventListener("input", onParameterChange);
      elements.delay.removeEventListener("input", onParameterChange);
      elements.intensity.removeEventListener("input", onParameterChange);
      elements.once.removeEventListener("change", onParameterChange);
      elements.sample.removeEventListener("input", onSampleChange);
      elements.replay.removeEventListener("click", onReplay);
      elements.reset.removeEventListener("click", onReset);
      elements.copy.removeEventListener("click", onCopy);
      elements.share.removeEventListener("click", onShare);
      elements.comparisonToggle.removeEventListener("change", onComparisonChange);
      elements.comparisonEffect.removeEventListener("change", onComparisonChange);
      elements.presets.removeEventListener("click", onPresetSelect);
      stopWatchingReducedMotion();
    },
  };
}
