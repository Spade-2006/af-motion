/**
 * AF Motion 3D Scene Schemas & AI Motion Registry Integration
 *
 * Machine-readable schemas, validation, configuration correction, and
 * dynamic discovery integration for 3D rendering.
 */

import type { Camera3DConfig, Lighting3DConfig, Scene3DDefinition } from "./types.js";

export const SCENE_3D_SCHEMA_VERSION = "1.0.0";

export const CAMERA_3D_SCHEMA = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["perspective", "orthographic"], default: "perspective" },
    fov: { type: "number", minimum: 1, maximum: 179, default: 50 },
    near: { type: "number", minimum: 0.001, default: 0.1 },
    far: { type: "number", minimum: 1, default: 1000 },
    position: {
      type: "array",
      items: { type: "number" },
      minItems: 3,
      maxItems: 3,
      default: [0, 0, 5],
    },
    target: {
      type: "array",
      items: { type: "number" },
      minItems: 3,
      maxItems: 3,
      default: [0, 0, 0],
    },
  },
} as const;

export const LIGHTING_3D_SCHEMA = {
  type: "object",
  properties: {
    ambient: {
      type: "object",
      properties: {
        color: { type: "string", default: "#ffffff" },
        intensity: { type: "number", minimum: 0, maximum: 10, default: 0.5 },
      },
    },
    directional: {
      type: "array",
      items: {
        type: "object",
        properties: {
          color: { type: "string", default: "#ffffff" },
          intensity: { type: "number", minimum: 0, default: 1 },
          position: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3 },
          castShadow: { type: "boolean", default: false },
        },
      },
    },
  },
} as const;

export const SCENE_3D_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Scene3DDefinition",
  version: SCENE_3D_SCHEMA_VERSION,
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", minLength: 1 },
    name: { type: "string" },
    version: { type: "string", default: SCENE_3D_SCHEMA_VERSION },
    camera: CAMERA_3D_SCHEMA,
    lighting: LIGHTING_3D_SCHEMA,
    autoStart: { type: "boolean", default: true },
    respectReducedMotion: { type: "boolean", default: true },
    renderer: {
      type: "object",
      properties: {
        backend: { type: "string", enum: ["three", "webgl", "null"], default: "three" },
        powerPreference: { type: "string", enum: ["default", "high-performance", "low-power"] },
        antialias: { type: "boolean", default: true },
        alpha: { type: "boolean", default: true },
        dpr: { type: ["number", "string"], default: "auto" },
      },
    },
  },
} as const;

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Validate a 3D scene definition against schema contracts.
 */
export function validateScene3D(config: unknown): ValidationResult {
  const errors: string[] = [];

  if (!config || typeof config !== "object") {
    return { valid: false, errors: ["Scene definition must be an object"] };
  }

  const def = config as Record<string, unknown>;

  if (!def.id || typeof def.id !== "string" || def.id.trim() === "") {
    errors.push("Scene requires a non-empty string 'id'");
  }

  if (def.camera && typeof def.camera === "object") {
    const cam = def.camera as Record<string, unknown>;
    if (cam.fov !== undefined && (typeof cam.fov !== "number" || cam.fov <= 0 || cam.fov >= 180)) {
      errors.push("Camera fov must be between 1 and 179 degrees");
    }
    if (cam.near !== undefined && (typeof cam.near !== "number" || cam.near <= 0)) {
      errors.push("Camera near plane must be greater than 0");
    }
    if (cam.far !== undefined && (typeof cam.far !== "number" || cam.far <= 0)) {
      errors.push("Camera far plane must be greater than 0");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Automatically sanitize and correct a malformed 3D scene configuration.
 */
export function correctScene3D(config: unknown): Scene3DDefinition {
  if (!config || typeof config !== "object") {
    return {
      id: "corrected-scene-3d",
      name: "Default 3D Scene",
      version: SCENE_3D_SCHEMA_VERSION,
      camera: { type: "perspective", fov: 50, near: 0.1, far: 1000, position: [0, 0, 5], target: [0, 0, 0] },
      lighting: { ambient: { color: "#ffffff", intensity: 0.5 } },
      autoStart: true,
      respectReducedMotion: true,
    };
  }

  const raw = config as Partial<Scene3DDefinition>;
  const id = typeof raw.id === "string" && raw.id.trim().length > 0 ? raw.id.trim() : "scene-3d";

  const rawCam = (raw.camera ?? {}) as Partial<Camera3DConfig>;
  const camera: Camera3DConfig = {
    type: rawCam.type === "orthographic" ? "orthographic" : "perspective",
    fov: typeof rawCam.fov === "number" && rawCam.fov > 0 && rawCam.fov < 180 ? rawCam.fov : 50,
    near: typeof rawCam.near === "number" && rawCam.near > 0 ? rawCam.near : 0.1,
    far: typeof rawCam.far === "number" && rawCam.far > 0 ? rawCam.far : 1000,
    position: Array.isArray(rawCam.position) && rawCam.position.length === 3 ? rawCam.position : [0, 0, 5],
    target: Array.isArray(rawCam.target) && rawCam.target.length === 3 ? rawCam.target : [0, 0, 0],
  };

  const rawLight = (raw.lighting ?? {}) as Partial<Lighting3DConfig>;
  const lighting: Lighting3DConfig = {
    ambient: {
      color: rawLight.ambient?.color ?? "#ffffff",
      intensity: typeof rawLight.ambient?.intensity === "number" ? Math.max(0, rawLight.ambient.intensity) : 0.5,
    },
    directional: Array.isArray(rawLight.directional) ? rawLight.directional : [],
    point: Array.isArray(rawLight.point) ? rawLight.point : [],
    spot: Array.isArray(rawLight.spot) ? rawLight.spot : [],
  };

  return {
    id,
    name: raw.name ?? id,
    version: raw.version ?? SCENE_3D_SCHEMA_VERSION,
    camera,
    lighting,
    environment: raw.environment,
    objects: Array.isArray(raw.objects) ? raw.objects : [],
    renderer: raw.renderer,
    autoStart: raw.autoStart ?? true,
    respectReducedMotion: raw.respectReducedMotion ?? true,
  };
}

/**
 * AI Motion Capability definition for 3D Scene Infrastructure.
 */
export const SCENE_3D_CAPABILITY = {
  id: "scene-3d",
  name: "createScene3D",
  category: "composition" as const,
  description:
    "Framework-independent 3D scene engine, camera controls, lighting setups, and optional Three.js/R3F renderer adapters.",
  tags: ["3d", "three", "r3f", "webgl", "camera", "lighting", "scene"],
  version: SCENE_3D_SCHEMA_VERSION,
  parameters: [
    {
      name: "definition",
      kind: "positional" as const,
      type: "Scene3DDefinition",
      required: true,
      description: "Scene 3D definition containing camera, lighting, environment, and object graph.",
    },
    {
      name: "options",
      kind: "option" as const,
      type: "CreateScene3DOptions",
      required: false,
      description: "Optional runtime configurations such as renderer adapter and DPR.",
    },
  ],
  supportedTargets: ["HTMLCanvasElement"],
  signature: {
    importStatement: 'import { createScene3D } from "af-motion/catalogue";',
    invocation: "const scene = createScene3D(definition); await scene.attach(canvas);",
    exampleCode: "const scene = createScene3D({ id: 'cube-scene', camera: { fov: 60 } });",
  },
  controls: ["attach", "detach", "start", "stop", "requestFrame", "addObject", "removeObject", "updateCamera", "updateLighting", "destroy"],
  callbacks: ["onContextLost", "onContextRestored"],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: false, requiresCanvas: true },
  react: {
    available: true,
    componentName: "Scene3DView",
    hookName: "useScene3D",
    importPath: "af-motion/react",
  },
};

/**
 * Register the 3D scene capability with an AI Motion Registry instance.
 */
export function registerScene3DCapability(registry: {
  registerCapability: (cap: any, opts?: any) => void;
}): void {
  registry.registerCapability(SCENE_3D_CAPABILITY, { override: true });
}

// ---------------------------------------------------------------------------
// 3D Intelligence AI Capabilities (Prompts 78, 79 & 80)
// ---------------------------------------------------------------------------

export const CAMERA_3D_INTELLIGENCE_CAPABILITY = {
  id: "camera-3d-intelligence",
  name: "Camera3DIntelligence",
  category: "composition" as const,
  description: "Intelligent 3D camera staging with presets (hero, isometric, portrait, cinematic, macro), spatial constraints, and responsive FOV.",
  tags: ["3d", "camera", "perspective", "orthographic", "presets", "constraints"],
  version: SCENE_3D_SCHEMA_VERSION,
  parameters: [
    { name: "preset", kind: "option" as const, type: "CameraPresetName", required: false, description: "Preset staging mode (hero, isometric, portrait, wide, top-down, cinematic, macro)" },
    { name: "fov", kind: "option" as const, type: "number", required: false, description: "Field of view in degrees" },
    { name: "constraints", kind: "option" as const, type: "CameraConstraints", required: false, description: "Distance and angle constraints" },
  ],
  supportedTargets: ["Object"],
  signature: {
    importStatement: 'import { getCameraPreset, interpolateCamera } from "af-motion/catalogue";',
    invocation: "const cam = getCameraPreset('hero');",
    exampleCode: "const cinematicCam = getCameraPreset('cinematic');",
  },
  controls: ["interpolateCamera", "applyCameraConstraints", "resolveResponsiveFov"],
  callbacks: [],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
};

export const LIGHTING_3D_INTELLIGENCE_CAPABILITY = {
  id: "lighting-3d-intelligence",
  name: "Lighting3DIntelligence",
  category: "composition" as const,
  description: "Intelligent 3D lighting system with presets (studio, cinematic, dramatic, daylight, sunset, neon, product) and fallback resolution.",
  tags: ["3d", "lighting", "shadows", "studio", "cinematic", "neon", "daylight"],
  version: SCENE_3D_SCHEMA_VERSION,
  parameters: [
    { name: "preset", kind: "option" as const, type: "LightingPresetName", required: false, description: "Curated lighting setup (studio, cinematic, dramatic, daylight, sunset, neon, product)" },
    { name: "shadows", kind: "option" as const, type: "ShadowConfig", required: false, description: "Shadow resolution and bias settings" },
  ],
  supportedTargets: ["Object"],
  signature: {
    importStatement: 'import { getLightingPreset, resolveLightingFallbacks } from "af-motion/catalogue";',
    invocation: "const lights = getLightingPreset('studio');",
    exampleCode: "const neonLights = getLightingPreset('neon');",
  },
  controls: ["resolveLightingFallbacks", "correctLightingConfig"],
  callbacks: [],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
};

export const ENVIRONMENT_3D_INTELLIGENCE_CAPABILITY = {
  id: "environment-3d-intelligence",
  name: "Environment3DIntelligence",
  category: "composition" as const,
  description: "Intelligent 3D environments with backdrops, ground planes, atmospheric fog, gradients, and sky configs.",
  tags: ["3d", "environment", "fog", "ground", "sky", "studio", "cyberpunk"],
  version: SCENE_3D_SCHEMA_VERSION,
  parameters: [
    { name: "preset", kind: "option" as const, type: "EnvironmentPresetName", required: false, description: "Atmospheric environment preset (studio-dark, studio-light, dawn, cyberpunk, desert, void, cloudy)" },
  ],
  supportedTargets: ["Object"],
  signature: {
    importStatement: 'import { getEnvironmentPreset } from "af-motion/catalogue";',
    invocation: "const env = getEnvironmentPreset('cyberpunk');",
    exampleCode: "const studioEnv = getEnvironmentPreset('studio-dark');",
  },
  controls: ["correctEnvironmentConfig"],
  callbacks: [],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
};

export const MATERIAL_3D_INTELLIGENCE_CAPABILITY = {
  id: "material-3d-intelligence",
  name: "Material3DIntelligence",
  category: "composition" as const,
  description: "Intelligent 3D PBR materials with presets (chrome, gold, frosted-glass, clear-glass, matte-plastic, velvet, neon-glow) and 2D surface bridging.",
  tags: ["3d", "material", "pbr", "glass", "chrome", "gold", "velvet"],
  version: SCENE_3D_SCHEMA_VERSION,
  parameters: [
    { name: "preset", kind: "option" as const, type: "Material3DPresetName", required: false, description: "PBR material recipe (chrome, gold, frosted-glass, clear-glass, matte-plastic, glossy-plastic, velvet, neon-glow)" },
  ],
  supportedTargets: ["Object"],
  signature: {
    importStatement: 'import { getMaterial3DPreset, surfaceToMaterial3D } from "af-motion/catalogue";',
    invocation: "const chrome = getMaterial3DPreset('chrome');",
    exampleCode: "const glass = getMaterial3DPreset('frosted-glass');",
  },
  controls: ["surfaceToMaterial3D", "correctMaterial3D"],
  callbacks: [],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
};

export const ASSET_3D_MANAGEMENT_CAPABILITY = {
  id: "asset-3d-management",
  name: "Asset3DManagement",
  category: "composition" as const,
  description: "Intelligent 3D asset management, GLTF/GLB/OBJ loading, caching, deduplication, scene graph inspection, and memory cleanup.",
  tags: ["3d", "assets", "model", "gltf", "glb", "obj", "caching", "loader"],
  version: SCENE_3D_SCHEMA_VERSION,
  parameters: [
    { name: "url", kind: "string" as const, type: "string", required: true, description: "URL or path of the 3D asset" },
    { name: "format", kind: "option" as const, type: "Asset3DFormat", required: false, description: "File format (gltf, glb, obj, fbx, usdz)" },
    { name: "forceReload", kind: "option" as const, type: "boolean", required: false, description: "Bypass cache" },
  ],
  supportedTargets: ["Object"],
  signature: {
    importStatement: 'import { getDefaultAssetManager, createThreeGLTFLoader } from "af-motion/catalogue";',
    invocation: "const asset = await getDefaultAssetManager().load('model.glb');",
    exampleCode: "const { scene } = await getDefaultAssetManager().load('hero.gltf');",
  },
  controls: ["load", "unload", "instantiate", "inspectModelGraph", "deepDisposeModel"],
  callbacks: ["onProgress"],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
};

export const GEOMETRY_3D_PROCEDURAL_CAPABILITY = {
  id: "geometry-3d-procedural",
  name: "Geometry3DProcedural",
  category: "composition" as const,
  description: "Configurable procedural 3D geometry generators: box, sphere, plane, cylinder, cone, torus, capsule, ring, rounded-box, extrude, and parametric.",
  tags: ["3d", "geometry", "procedural", "box", "sphere", "torus", "capsule", "rounded-box", "extrude"],
  version: SCENE_3D_SCHEMA_VERSION,
  parameters: [
    { name: "type", kind: "option" as const, type: "Geometry3DType", required: true, description: "Geometry type (box, sphere, plane, cylinder, cone, torus, capsule, ring, rounded-box, extrude, parametric)" },
    { name: "dimensions", kind: "option" as const, type: "Record<string, number>", required: false, description: "Dimensions and segment controls" },
  ],
  supportedTargets: ["Object"],
  signature: {
    importStatement: 'import { generateProceduralGeometry, toThreeGeometry } from "af-motion/catalogue";',
    invocation: "const geom = generateProceduralGeometry({ type: 'box', width: 2, height: 2, depth: 2 });",
    exampleCode: "const sphere = generateProceduralGeometry({ type: 'sphere', radius: 1, widthSegments: 32 });",
  },
  controls: ["generateProceduralGeometry", "toThreeGeometry", "validateGeometryDescriptor", "correctGeometryDescriptor"],
  callbacks: [],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
};

export const INTERACTION_3D_CAPABILITY = {
  id: "interaction-3d",
  name: "Interaction3D",
  category: "composition" as const,
  description: "Framework-independent pointer, touch, keyboard, selection, and raycasting interactions for 3D environments.",
  tags: ["3d", "interaction", "pointer", "touch", "keyboard", "selection", "raycast", "hover"],
  version: SCENE_3D_SCHEMA_VERSION,
  parameters: [
    { name: "enableKeyboard", kind: "option" as const, type: "boolean", required: false, default: true, description: "Enable keyboard navigation (Tab, Arrow keys, Enter, Escape)" },
    { name: "multiSelect", kind: "option" as const, type: "boolean", required: false, default: false, description: "Allow multi-object selection with Shift/Ctrl" },
    { name: "highlightColor", kind: "option" as const, type: "string", required: false, default: "#6366f1", description: "Highlight color for selected objects" },
  ],
  supportedTargets: ["HTMLCanvasElement", "HTMLElement"],
  signature: {
    importStatement: 'import { InteractionManager3D } from "af-motion/catalogue";',
    invocation: "const manager = new InteractionManager3D(options); manager.attach(canvas);",
    exampleCode: "const manager = new InteractionManager3D({ onSelect: (ids) => console.log('Selected:', ids) });",
  },
  controls: ["attach", "detach", "select", "deselect", "clearSelection", "getState"],
  callbacks: ["onHover", "onSelect", "onClick", "onDrag"],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
};

export const CAMERA_CONTROLS_3D_CAPABILITY = {
  id: "camera-controls-3d",
  name: "CameraControls3D",
  category: "composition" as const,
  description: "Smooth Orbit, Pan, Zoom, and Focus-on camera controller with damping, angle limits, and reduced-motion bypass.",
  tags: ["3d", "camera", "orbit", "pan", "zoom", "controls", "damping", "focus"],
  version: SCENE_3D_SCHEMA_VERSION,
  parameters: [
    { name: "mode", kind: "option" as const, type: "string", required: false, default: "combined", description: "Control mode (orbit, pan, zoom, combined, none)" },
    { name: "enableDamping", kind: "option" as const, type: "boolean", required: false, default: true, description: "Smooth inertial deceleration" },
    { name: "dampingFactor", kind: "option" as const, type: "number", required: false, default: 0.08, description: "Inertia damping rate" },
  ],
  supportedTargets: ["Object"],
  signature: {
    importStatement: 'import { CameraControls3D } from "af-motion/catalogue";',
    invocation: "const controls = new CameraControls3D(camera, config); const newCamera = controls.update(dt);",
    exampleCode: "controls.rotate(deltaX, deltaY); controls.focusOn(boundingBox);",
  },
  controls: ["rotate", "pan", "zoom", "focusOn", "lookAt", "update", "getState"],
  callbacks: [],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
};

export const SCROLL_SCENE_3D_CAPABILITY = {
  id: "scroll-scene-3d",
  name: "ScrollScene3D",
  category: "scroll" as const,
  description: "Scroll-driven 3D scene orchestration linking scroll progress to camera staging, object transformations, and narrative sections.",
  tags: ["3d", "scroll", "timeline", "camera", "keyframes", "sections", "storytelling"],
  version: SCENE_3D_SCHEMA_VERSION,
  parameters: [
    { name: "timeline", kind: "positional" as const, type: "ScrollSceneTimeline", required: true, description: "Scroll timeline definition with keyframe stages" },
    { name: "respectReducedMotion", kind: "option" as const, type: "boolean", required: false, default: true, description: "Jump directly to keyframe stops without heavy camera motion" },
  ],
  supportedTargets: ["HTMLElement", "Window"],
  signature: {
    importStatement: 'import { ScrollSceneController, getScrollTimelinePreset } from "af-motion/catalogue";',
    invocation: "const controller = new ScrollSceneController({ timeline }); controller.evaluate(progress);",
    exampleCode: "const controller = new ScrollSceneController({ timeline: getScrollTimelinePreset('product-exploded-view') });",
  },
  controls: ["evaluate", "attachScroll", "detachScroll", "getProgress", "destroy"],
  callbacks: ["onProgress", "onSectionChange"],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
};

export const INTERACTIVE_ENVIRONMENTS_3D_CAPABILITY = {
  id: "interactive-environments-3d",
  name: "InteractiveEnvironments3D",
  category: "composition" as const,
  description: "Composable interactive environment presets for product showcases, portfolios, immersive landings, and spatial narratives.",
  tags: ["3d", "environment", "preset", "showcase", "portfolio", "landing", "narrative"],
  version: SCENE_3D_SCHEMA_VERSION,
  parameters: [
    { name: "preset", kind: "option" as const, type: "InteractionPresetName", required: true, description: "Interactive environment preset (product-showcase, portfolio, immersive-landing, spatial-story, object-display, scroll-narrative)" },
  ],
  supportedTargets: ["Object"],
  signature: {
    importStatement: 'import { getInteractionPreset } from "af-motion/catalogue";',
    invocation: "const preset = getInteractionPreset('product-showcase');",
    exampleCode: "const landing = getInteractionPreset('immersive-landing');",
  },
  controls: ["getInteractionPreset"],
  callbacks: [],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
};

export function getAvailableGeometryTypes(): readonly {
  type: string;
  description: string;
  requiredParams: readonly string[];
  optionalParams: readonly string[];
}[] {
  return [
    { type: "box", description: "Standard cuboid", requiredParams: [], optionalParams: ["width", "height", "depth", "widthSegments", "heightSegments", "depthSegments"] },
    { type: "sphere", description: "UV sphere", requiredParams: [], optionalParams: ["radius", "widthSegments", "heightSegments", "phiStart", "phiLength", "thetaStart", "thetaLength"] },
    { type: "plane", description: "Flat 2D rectangular surface", requiredParams: [], optionalParams: ["width", "height", "widthSegments", "heightSegments"] },
    { type: "cylinder", description: "Cylindrical column", requiredParams: [], optionalParams: ["radiusTop", "radiusBottom", "height", "radialSegments", "heightSegments", "openEnded"] },
    { type: "cone", description: "Conical geometry with circular base", requiredParams: [], optionalParams: ["radius", "height", "radialSegments", "heightSegments", "openEnded"] },
    { type: "torus", description: "Donut-shaped ring", requiredParams: [], optionalParams: ["radius", "tube", "radialSegments", "tubularSegments", "arc"] },
    { type: "capsule", description: "Cylinder with hemispherical caps", requiredParams: [], optionalParams: ["radius", "length", "capSubdivisions", "radialSegments"] },
    { type: "ring", description: "2D disk with central circular hole", requiredParams: [], optionalParams: ["innerRadius", "outerRadius", "thetaSegments", "phiSegments"] },
    { type: "rounded-box", description: "Box with smoothed edges and corners", requiredParams: [], optionalParams: ["width", "height", "depth", "radius", "smoothness"] },
    { type: "extrude", description: "2D polygon extruded along normal axis", requiredParams: ["points"], optionalParams: ["depth", "bevelEnabled", "bevelThickness", "bevelSize", "bevelSegments"] },
    { type: "parametric", description: "Custom parametric surface evaluated over UV space", requiredParams: [], optionalParams: ["evaluatorName", "evaluator", "uSegments", "vSegments"] },
  ];
}

export function getGeometryParameters(type: string): Record<string, unknown> {
  const types = getAvailableGeometryTypes();
  const match = types.find((t) => t.type === type);
  return {
    type,
    found: Boolean(match),
    requiredParams: match ? match.requiredParams : [],
    optionalParams: match ? match.optionalParams : [],
  };
}

export function getSupportedModelFormats(): readonly {
  format: string;
  description: string;
  extension: string;
  loaderRequired: boolean;
}[] {
  return [
    { format: "gltf", description: "GL Transmission Format (JSON/embedded)", extension: ".gltf", loaderRequired: true },
    { format: "glb", description: "Binary GLTF container", extension: ".glb", loaderRequired: true },
    { format: "obj", description: "Wavefront OBJ 3D geometry", extension: ".obj", loaderRequired: true },
    { format: "fbx", description: "FilmBox interchange format", extension: ".fbx", loaderRequired: true },
    { format: "usdz", description: "Universal Scene Description (AR)", extension: ".usdz", loaderRequired: true },
    { format: "json", description: "Three.js Object/BufferGeometry JSON", extension: ".json", loaderRequired: false },
    { format: "texture", description: "Image texture map (PNG/JPG/WebP)", extension: ".png", loaderRequired: false },
  ];
}

export function getAvailableInteractionPresets(): readonly { name: string; description: string }[] {
  return [
    { name: "product-showcase", description: "Product inspection with auto-rotation, constrained orbit, and part highlighting" },
    { name: "portfolio", description: "Multi-stand portfolio showcase with horizontal navigation and focal framing" },
    { name: "immersive-landing", description: "Hero landing scene with gentle pointer parallax and smooth depth response" },
    { name: "spatial-story", description: "Spatial journey through 3D waypoints with cinematic camera framing" },
    { name: "object-display", description: "Classic turntable display for 3D statues, models, and artifacts" },
    { name: "scroll-narrative", description: "Narrative scene orchestrated with scroll-linked camera stages" },
  ];
}

export function getScrollTimelinePresets(): readonly { id: string; name: string; sectionsCount: number }[] {
  return [
    { id: "product-exploded-view", name: "Product Exploded View", sectionsCount: 3 },
    { id: "camera-flythrough", name: "Cinematic Camera Flythrough", sectionsCount: 3 },
    { id: "narrative-chapters", name: "Narrative Chapters Staging", sectionsCount: 3 },
  ];
}

export const SCENE_3D_COMPOSITION_CAPABILITY = {
  id: "scene-3d-composition",
  name: "Scene3DComposition",
  category: "composition" as const,
  description: "Unified 3D scene composition coordinating assets, materials, lighting, cameras, interactions, and adaptive quality.",
  tags: ["3d", "composition", "scene", "unified", "performance", "recipes", "fallbacks"],
  version: SCENE_3D_SCHEMA_VERSION,
  parameters: [
    { name: "definition", kind: "positional" as const, type: "Scene3DCompositionDefinition", required: true, description: "3D scene composition definition with spec and performance constraints" },
    { name: "options", kind: "option" as const, type: "Scene3DCompositionOptions", required: false, description: "Composition options (DOM element, asset manager, capabilities)" },
  ],
  supportedTargets: ["HTMLElement", "Object"],
  signature: {
    importStatement: 'import { createScene3DComposition } from "af-motion/catalogue";',
    invocation: "const comp = createScene3DComposition(definition, options);",
    exampleCode: "const comp = createScene3DComposition({ id: 'hero-comp', spec }); comp.setQuality('medium');",
  },
  controls: ["updateSpec", "updateObject", "setQuality", "destroy"],
  callbacks: ["onQualityDegrade", "onSpecChange"],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
};

export const SCENE_3D_GENERATION_CAPABILITY = {
  id: "scene-3d-generation",
  name: "Scene3DGeneration",
  category: "composition" as const,
  description: "Deterministic AI scene generation from natural-language descriptions or structured 3D intent pipelines.",
  tags: ["3d", "ai", "generation", "intent", "recipes", "prompt-to-3d"],
  version: SCENE_3D_SCHEMA_VERSION,
  parameters: [
    { name: "intentOrPrompt", kind: "positional" as const, type: "Scene3DIntent | string", required: true, description: "Natural-language prompt or structured Scene3DIntent" },
    { name: "options", kind: "option" as const, type: "FallbackResolutionOptions", required: false, description: "Fallback and hardware constraints" },
  ],
  supportedTargets: ["Object"],
  signature: {
    importStatement: 'import { generate3DSceneFromIntent, parseNaturalLanguageSceneIntent } from "af-motion/catalogue";',
    invocation: "const result = generate3DSceneFromIntent('cinematic dark watch showcase');",
    exampleCode: "const result = generate3DSceneFromIntent({ visualStyle: 'product-showcase', materialPreset: 'gold' });",
  },
  controls: ["generate3DSceneFromIntent", "parseNaturalLanguageSceneIntent"],
  callbacks: [],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
};

export function getAvailableSceneRecipes(): readonly {
  name: string;
  title: string;
  description: string;
  defaultCamera: string;
  defaultLighting: string;
}[] {
  return [
    { name: "product-showcase", title: "Product Showcase", description: "Centered hero showcase with soft studio lighting, subtle ground reflection, and smooth orbit camera.", defaultCamera: "hero", defaultLighting: "studio" },
    { name: "cinematic-hero", title: "Cinematic Hero", description: "High-contrast cinematic scene with dramatic key lighting, low-angle perspective, and moody atmospheric fog.", defaultCamera: "cinematic", defaultLighting: "cinematic" },
    { name: "abstract-environment", title: "Abstract Environment", description: "Floating geometric primitives with neon/glassy materials and vibrant glow.", defaultCamera: "wide", defaultLighting: "neon" },
    { name: "interactive-portfolio", title: "Interactive Portfolio", description: "Showcase items arranged spatially with click-to-focus and hover highlighting.", defaultCamera: "hero", defaultLighting: "product" },
    { name: "spatial-storytelling", title: "Spatial Storytelling", description: "Multi-station narrative walkthrough with waypoints, guided camera paths, and waypoint interactions.", defaultCamera: "cinematic", defaultLighting: "sunset" },
    { name: "architectural-viz", title: "Architectural Visualization", description: "Clean orthographic/perspective visualization with directional sunlight and grid ground.", defaultCamera: "isometric", defaultLighting: "daylight" },
    { name: "floating-object", title: "Floating Object", description: "Single levitating hero object with continuous bobbing animation and interactive tilt.", defaultCamera: "portrait", defaultLighting: "studio" },
    { name: "scroll-product-narrative", title: "Scroll-Driven Product Narrative", description: "Scroll-linked multi-stage product breakdown revealing features across scroll sections.", defaultCamera: "hero", defaultLighting: "product" },
  ];
}

export function register3DIntelligenceCapabilities(registry: {
  registerCapability: (cap: any, opts?: any) => void;
}): void {
  registry.registerCapability(CAMERA_3D_INTELLIGENCE_CAPABILITY, { override: true });
  registry.registerCapability(LIGHTING_3D_INTELLIGENCE_CAPABILITY, { override: true });
  registry.registerCapability(ENVIRONMENT_3D_INTELLIGENCE_CAPABILITY, { override: true });
  registry.registerCapability(MATERIAL_3D_INTELLIGENCE_CAPABILITY, { override: true });
  registry.registerCapability(ASSET_3D_MANAGEMENT_CAPABILITY, { override: true });
  registry.registerCapability(GEOMETRY_3D_PROCEDURAL_CAPABILITY, { override: true });
  registry.registerCapability(INTERACTION_3D_CAPABILITY, { override: true });
  registry.registerCapability(CAMERA_CONTROLS_3D_CAPABILITY, { override: true });
  registry.registerCapability(SCROLL_SCENE_3D_CAPABILITY, { override: true });
  registry.registerCapability(INTERACTIVE_ENVIRONMENTS_3D_CAPABILITY, { override: true });
  registry.registerCapability(SCENE_3D_COMPOSITION_CAPABILITY, { override: true });
  registry.registerCapability(SCENE_3D_GENERATION_CAPABILITY, { override: true });
}
