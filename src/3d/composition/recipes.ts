/**
 * AF Motion 3D Scene Recipes
 *
 * Machine-readable, production-grade recipes for 3D scene compositions:
 * 1. product-showcase
 * 2. cinematic-hero
 * 3. abstract-environment
 * 4. interactive-portfolio
 * 5. spatial-storytelling
 * 6. architectural-viz
 * 7. floating-object
 * 8. scroll-product-narrative
 */

import { SCENE_SPECIFICATION_VERSION } from "../schemas/schemas.js";
import type {
  MaterialSpec,
  PrimitiveObjectSpec,
  Scene3DSpecification,
  SceneObjectSpec,
} from "../schemas/types.js";
import { CAMERA_PRESETS } from "../camera/presets.js";
import { LIGHTING_3D_PRESETS } from "../lighting/presets.js";
import { ENVIRONMENT_PRESETS } from "../environment/presets.js";
import { MATERIAL_3D_PRESETS } from "../materials/presets.js";

export type Scene3DRecipeName =
  | "product-showcase"
  | "cinematic-hero"
  | "abstract-environment"
  | "interactive-portfolio"
  | "spatial-storytelling"
  | "architectural-viz"
  | "floating-object"
  | "scroll-product-narrative";

export interface Scene3DRecipeOptions {
  readonly id?: string;
  readonly name?: string;
  readonly primaryColor?: string;
  readonly secondaryColor?: string;
  readonly modelUrl?: string;
  readonly fov?: number;
}

export interface RecipeDescriptor {
  readonly name: Scene3DRecipeName;
  readonly title: string;
  readonly description: string;
  readonly defaultCamera: string;
  readonly defaultLighting: string;
}

export const SCENE_3D_RECIPES_META: readonly RecipeDescriptor[] = [
  {
    name: "product-showcase",
    title: "Product Showcase",
    description: "Centered hero showcase with soft studio lighting, subtle ground reflection, and smooth orbit camera.",
    defaultCamera: "hero",
    defaultLighting: "studio",
  },
  {
    name: "cinematic-hero",
    title: "Cinematic Hero",
    description: "High-contrast cinematic scene with dramatic key lighting, low-angle perspective, and moody atmospheric fog.",
    defaultCamera: "cinematic",
    defaultLighting: "cinematic",
  },
  {
    name: "abstract-environment",
    title: "Abstract Environment",
    description: "Floating geometric primitives with neon/glassy materials and vibrant glow.",
    defaultCamera: "wide",
    defaultLighting: "neon",
  },
  {
    name: "interactive-portfolio",
    title: "Interactive Portfolio",
    description: "Showcase items arranged spatially with click-to-focus and hover highlighting.",
    defaultCamera: "hero",
    defaultLighting: "product",
  },
  {
    name: "spatial-storytelling",
    title: "Spatial Storytelling",
    description: "Multi-station narrative walkthrough with waypoints, guided camera paths, and waypoint interactions.",
    defaultCamera: "cinematic",
    defaultLighting: "sunset",
  },
  {
    name: "architectural-viz",
    title: "Architectural Visualization",
    description: "Clean orthographic/perspective visualization with directional sunlight and grid ground.",
    defaultCamera: "isometric",
    defaultLighting: "daylight",
  },
  {
    name: "floating-object",
    title: "Floating Object",
    description: "Single levitating hero object with continuous bobbing animation and interactive tilt.",
    defaultCamera: "portrait",
    defaultLighting: "studio",
  },
  {
    name: "scroll-product-narrative",
    title: "Scroll-Driven Product Narrative",
    description: "Scroll-linked multi-stage product breakdown revealing features across scroll sections.",
    defaultCamera: "hero",
    defaultLighting: "product",
  },
];

/**
 * 1. Product Showcase
 */
function createProductShowcase(options?: Scene3DRecipeOptions): Scene3DSpecification {
  const id = options?.id ?? "product-showcase-scene";
  const name = options?.name ?? "Product Showcase";
  const color = options?.primaryColor ?? "#2563eb";

  const heroObject: SceneObjectSpec = options?.modelUrl
    ? {
        id: "hero-product",
        name: "Hero Product",
        type: "model",
        transform: { position: [0, 0.5, 0], scale: [1, 1, 1] },
        castShadow: true,
        receiveShadow: false,
        model: {
          type: "model",
          format: options.modelUrl.endsWith(".glb") ? "glb" : "gltf",
          url: options.modelUrl,
        },
      }
    : {
        id: "hero-product",
        name: "Hero Product Primitive",
        type: "primitive",
        transform: { position: [0, 0.5, 0], scale: [1, 1, 1] },
        castShadow: true,
        receiveShadow: false,
        geometry: {
          type: "primitive",
          primitive: "cylinder",
          parameters: { radiusTop: 0.8, radiusBottom: 0.8, height: 1.5, radialSegments: 32 },
        },
        material: {
          type: "physical",
          color,
          roughness: 0.2,
          metalness: 0.8,
        },
      };

  return {
    id,
    name,
    version: SCENE_SPECIFICATION_VERSION,
    camera: {
      type: "perspective",
      fov: options?.fov ?? CAMERA_PRESETS.hero.fov ?? 45,
      position: [0, 1.5, 6],
      target: [0, 0, 0],
      near: 0.1,
      far: 1000,
    },
    lighting: {
      ambient: { ...LIGHTING_3D_PRESETS.studio.ambient },
      directional: LIGHTING_3D_PRESETS.studio.directional ? [...LIGHTING_3D_PRESETS.studio.directional] : [],
    },
    environment: {
      background: "#0d0f14",
      ground: { enabled: true, size: 40, color: "#141721", receiveShadow: true },
    },
    renderer: {
      antialias: true,
      alpha: true,
      shadowMap: true,
      dpr: 2,
    },
    objects: [
      heroObject,
      {
        id: "accent-ring",
        name: "Accent Ring",
        type: "primitive",
        transform: { position: [0, 0.05, 0], rotation: [Math.PI / 2, 0, 0] },
        geometry: {
          type: "primitive",
          primitive: "torus",
          parameters: { radius: 1.8, tube: 0.04, radialSegments: 16, tubularSegments: 64 },
        },
        material: {
          type: "standard",
          color: options?.secondaryColor ?? "#60a5fa",
          roughness: 0.3,
          metalness: 0.9,
        },
      },
    ],
    interaction: {
      controls: {
        mode: "orbit",
        enableOrbit: true,
        enableZoom: true,
        enablePan: false,
        dampingFactor: 0.05,
        minDistance: 2,
        maxDistance: 12,
      },
      inputMapping: { pointer: true, touch: true, wheel: true },
    },
    autoStart: true,
    respectReducedMotion: true,
  };
}

/**
 * 2. Cinematic Hero
 */
function createCinematicHero(options?: Scene3DRecipeOptions): Scene3DSpecification {
  const id = options?.id ?? "cinematic-hero-scene";
  const name = options?.name ?? "Cinematic Hero";
  const color = options?.primaryColor ?? "#e11d48";

  return {
    id,
    name,
    version: SCENE_SPECIFICATION_VERSION,
    camera: {
      type: "perspective",
      fov: options?.fov ?? CAMERA_PRESETS.cinematic.fov ?? 32,
      position: [0, 2, 7],
      target: [0, 0.5, 0],
      near: 0.1,
      far: 1500,
    },
    lighting: {
      ambient: { color: "#050811", intensity: 0.2 },
      directional: [{ color: "#ffd2aa", intensity: 2.2, position: [8, 5, 2], castShadow: true }],
      point: [{ color: "#38bdf8", intensity: 1.8, position: [-5, 1, -3], distance: 20 }],
    },
    environment: {
      background: "#030712",
      fog: { type: "exponential", color: "#030712", density: 0.03 },
      ground: { enabled: true, size: 80, color: "#090d16", receiveShadow: true },
    },
    renderer: {
      antialias: true,
      shadowMap: true,
      dpr: 2,
    },
    objects: [
      {
        id: "cinematic-monolith",
        name: "Cinematic Monolith",
        type: "primitive",
        transform: { position: [0, 2, 0], scale: [1, 4, 0.4] },
        castShadow: true,
        receiveShadow: true,
        geometry: {
          type: "primitive",
          primitive: "box",
          parameters: { width: 1.5, height: 1, depth: 1 },
        },
        material: {
          type: "physical",
          color: "#0f172a",
          roughness: 0.1,
          metalness: 0.95,
        },
      },
      {
        id: "cinematic-orb",
        name: "Glowing Core",
        type: "primitive",
        transform: { position: [0, 2.5, 0.8], scale: [0.35, 0.35, 0.35] },
        geometry: {
          type: "primitive",
          primitive: "sphere",
          parameters: { radius: 1, widthSegments: 32, heightSegments: 32 },
        },
        material: {
          type: "standard",
          color,
          roughness: 0.1,
          metalness: 0.2,
        },
      },
    ],
    interaction: {
      controls: {
        mode: "orbit",
        enableOrbit: true,
        dampingFactor: 0.03,
        minDistance: 3,
        maxDistance: 15,
      },
    },
    autoStart: true,
    respectReducedMotion: true,
  };
}

/**
 * 3. Abstract Environment
 */
function createAbstractEnvironment(options?: Scene3DRecipeOptions): Scene3DSpecification {
  const id = options?.id ?? "abstract-env-scene";
  const name = options?.name ?? "Abstract Environment";
  const primary = options?.primaryColor ?? "#a855f7";
  const secondary = options?.secondaryColor ?? "#06b6d4";

  return {
    id,
    name,
    version: SCENE_SPECIFICATION_VERSION,
    camera: {
      type: "perspective",
      fov: options?.fov ?? 60,
      position: [0, 3, 10],
      target: [0, 0, 0],
      near: 0.1,
      far: 1000,
    },
    lighting: {
      ambient: { color: "#180d2b", intensity: 0.5 },
      point: [
        { color: primary, intensity: 2.5, position: [4, 4, 2], distance: 25 },
        { color: secondary, intensity: 2.0, position: [-4, -2, 3], distance: 25 },
      ],
    },
    environment: {
      background: "#080414",
      transparent: false,
    },
    renderer: {
      antialias: true,
      shadowMap: false,
      dpr: 2,
    },
    objects: [
      {
        id: "floating-octa",
        name: "Floating Octahedron",
        type: "primitive",
        transform: { position: [0, 0, 0], rotation: [0.4, 0.6, 0] },
        geometry: {
          type: "primitive",
          primitive: "sphere",
          parameters: { radius: 1.5, widthSegments: 8, heightSegments: 6 },
        },
        material: {
          type: "physical",
          color: primary,
          roughness: 0.1,
          metalness: 0.3,
          transmission: 0.8,
          transparent: true,
        },
      },
      {
        id: "floating-torus-1",
        name: "Floating Ring 1",
        type: "primitive",
        transform: { position: [2.5, 1.2, -1], rotation: [1.2, 0.4, 0] },
        geometry: {
          type: "primitive",
          primitive: "torus",
          parameters: { radius: 1, tube: 0.15, radialSegments: 16, tubularSegments: 32 },
        },
        material: {
          type: "standard",
          color: secondary,
          roughness: 0.2,
          metalness: 0.8,
        },
      },
      {
        id: "floating-torus-2",
        name: "Floating Ring 2",
        type: "primitive",
        transform: { position: [-2.8, -1, 1], rotation: [-0.8, 1.0, 0.2] },
        geometry: {
          type: "primitive",
          primitive: "torus",
          parameters: { radius: 0.8, tube: 0.12, radialSegments: 16, tubularSegments: 32 },
        },
        material: {
          type: "standard",
          color: "#ec4899",
          roughness: 0.3,
          metalness: 0.7,
        },
      },
    ],
    interaction: {
      controls: {
        mode: "orbit",
        enableOrbit: true,
        enableZoom: true,
        dampingFactor: 0.05,
      },
    },
    autoStart: true,
    respectReducedMotion: true,
  };
}

/**
 * 4. Interactive Portfolio
 */
function createInteractivePortfolio(options?: Scene3DRecipeOptions): Scene3DSpecification {
  const id = options?.id ?? "interactive-portfolio-scene";
  const name = options?.name ?? "Interactive Portfolio";
  const color = options?.primaryColor ?? "#10b981";

  const items: SceneObjectSpec[] = [
    {
      id: "portfolio-item-1",
      name: "Project Alpha",
      type: "primitive",
      transform: { position: [-2.5, 0, 0] },
      geometry: { type: "primitive", primitive: "box", parameters: { width: 1.2, height: 1.6, depth: 0.3 } },
      material: { type: "standard", color },
      interaction: {
        trigger: "click",
        action: "focus",
        targetId: "portfolio-item-1",
      },
      accessibility: { ariaLabel: "Project Alpha 3D Card", role: "button", focusable: true },
    },
    {
      id: "portfolio-item-2",
      name: "Project Beta",
      type: "primitive",
      transform: { position: [0, 0, 0] },
      geometry: { type: "primitive", primitive: "box", parameters: { width: 1.2, height: 1.6, depth: 0.3 } },
      material: { type: "standard", color: "#3b82f6" },
      interaction: {
        trigger: "click",
        action: "focus",
        targetId: "portfolio-item-2",
      },
      accessibility: { ariaLabel: "Project Beta 3D Card", role: "button", focusable: true },
    },
    {
      id: "portfolio-item-3",
      name: "Project Gamma",
      type: "primitive",
      transform: { position: [2.5, 0, 0] },
      geometry: { type: "primitive", primitive: "box", parameters: { width: 1.2, height: 1.6, depth: 0.3 } },
      material: { type: "standard", color: "#f59e0b" },
      interaction: {
        trigger: "click",
        action: "focus",
        targetId: "portfolio-item-3",
      },
      accessibility: { ariaLabel: "Project Gamma 3D Card", role: "button", focusable: true },
    },
  ];

  return {
    id,
    name,
    version: SCENE_SPECIFICATION_VERSION,
    camera: {
      type: "perspective",
      fov: 45,
      position: [0, 0.5, 6],
      target: [0, 0, 0],
    },
    lighting: {
      ambient: { color: "#ffffff", intensity: 0.5 },
      directional: [{ color: "#ffffff", intensity: 1.0, position: [0, 5, 5], castShadow: true }],
    },
    environment: {
      background: "#111827",
      ground: { enabled: true, size: 30, color: "#1f2937", receiveShadow: true },
    },
    renderer: {
      antialias: true,
      shadowMap: true,
      dpr: 2,
    },
    objects: items,
    interaction: {
      controls: {
        mode: "pan",
        enablePan: true,
        enableOrbit: false,
        enableZoom: true,
      },
      defaultHighlightColor: "#67e8f9",
    },
    autoStart: true,
    respectReducedMotion: true,
  };
}

/**
 * 5. Spatial Storytelling
 */
function createSpatialStorytelling(options?: Scene3DRecipeOptions): Scene3DSpecification {
  const id = options?.id ?? "spatial-storytelling-scene";
  const name = options?.name ?? "Spatial Storytelling";

  return {
    id,
    name,
    version: SCENE_SPECIFICATION_VERSION,
    camera: {
      type: "perspective",
      fov: 50,
      position: [0, 2, 8],
      target: [0, 0, 0],
    },
    lighting: {
      ambient: { color: "#1e1b4b", intensity: 0.4 },
      directional: [{ color: "#fbbf24", intensity: 1.6, position: [6, 8, 4], castShadow: true }],
    },
    environment: {
      background: "#0f172a",
      fog: { type: "linear", color: "#0f172a", near: 8, far: 35 },
    },
    renderer: { antialias: true, shadowMap: true, dpr: 2 },
    objects: [
      {
        id: "station-1",
        name: "Chapter 1: Origin",
        type: "primitive",
        transform: { position: [0, 0, 0] },
        geometry: { type: "primitive", primitive: "sphere", parameters: { radius: 0.8 } },
        material: { type: "standard", color: "#6366f1" },
      },
      {
        id: "station-2",
        name: "Chapter 2: Evolution",
        type: "primitive",
        transform: { position: [4, 1, -5] },
        geometry: { type: "primitive", primitive: "cylinder", parameters: { radiusTop: 0.6, radiusBottom: 0.6, height: 1.4 } },
        material: { type: "standard", color: "#ec4899" },
      },
      {
        id: "station-3",
        name: "Chapter 3: Future",
        type: "primitive",
        transform: { position: [-3, 2, -10] },
        geometry: { type: "primitive", primitive: "torus", parameters: { radius: 1, tube: 0.2 } },
        material: { type: "standard", color: "#14b8a6" },
      },
    ],
    scrollTimeline: {
      id: "story-timeline",
      name: "Story Narrative Path",
      keyframes: [
        { progress: 0, cameraPosition: [0, 2, 8], cameraTarget: [0, 0, 0] },
        { progress: 0.5, cameraPosition: [4, 3, 2], cameraTarget: [4, 1, -5] },
        { progress: 1.0, cameraPosition: [-3, 3, -4], cameraTarget: [-3, 2, -10] },
      ],
      sections: [
        { id: "origin", progressStart: 0, progressEnd: 0.35, title: "Origin" },
        { id: "evolution", progressStart: 0.35, progressEnd: 0.7, title: "Evolution" },
        { id: "future", progressStart: 0.7, progressEnd: 1.0, title: "Future" },
      ],
    },
    autoStart: true,
    respectReducedMotion: true,
  };
}

/**
 * 6. Architectural Visualization
 */
function createArchitecturalViz(options?: Scene3DRecipeOptions): Scene3DSpecification {
  const id = options?.id ?? "arch-viz-scene";
  const name = options?.name ?? "Architectural Visualization";

  return {
    id,
    name,
    version: SCENE_SPECIFICATION_VERSION,
    camera: {
      type: "orthographic",
      zoom: 60,
      position: [12, 12, 12],
      target: [0, 0, 0],
    },
    lighting: {
      ambient: { color: "#ffffff", intensity: 0.4 },
      directional: [{ color: "#fffbeb", intensity: 1.8, position: [15, 20, 10], castShadow: true }],
    },
    environment: {
      background: "#f8fafc",
      ground: { enabled: true, size: 50, color: "#e2e8f0", receiveShadow: true },
    },
    renderer: { antialias: true, shadowMap: true, dpr: 2 },
    objects: [
      {
        id: "building-main",
        name: "Main Structure",
        type: "primitive",
        transform: { position: [0, 1.5, 0], scale: [3, 3, 2] },
        castShadow: true,
        receiveShadow: true,
        geometry: { type: "primitive", primitive: "box", parameters: { width: 1, height: 1, depth: 1 } },
        material: { type: "standard", color: "#ffffff" },
      },
      {
        id: "building-wing",
        name: "Secondary Wing",
        type: "primitive",
        transform: { position: [2.5, 1, 0.5], scale: [2, 2, 1.5] },
        castShadow: true,
        receiveShadow: true,
        geometry: { type: "primitive", primitive: "box", parameters: { width: 1, height: 1, depth: 1 } },
        material: { type: "standard", color: "#94a3b8" },
      },
    ],
    interaction: {
      controls: {
        mode: "combined",
        enableOrbit: true,
        enablePan: true,
        enableZoom: true,
      },
    },
    autoStart: true,
    respectReducedMotion: true,
  };
}

/**
 * 7. Floating Object
 */
function createFloatingObject(options?: Scene3DRecipeOptions): Scene3DSpecification {
  const id = options?.id ?? "floating-object-scene";
  const name = options?.name ?? "Floating Object";
  const color = options?.primaryColor ?? "#f43f5e";

  return {
    id,
    name,
    version: SCENE_SPECIFICATION_VERSION,
    camera: {
      type: "perspective",
      fov: 40,
      position: [0, 1.2, 5],
      target: [0, 1, 0],
    },
    lighting: {
      ambient: { color: "#ffffff", intensity: 0.5 },
      directional: [{ color: "#ffffff", intensity: 1.2, position: [3, 5, 4], castShadow: true }],
    },
    environment: {
      background: "#09090b",
      ground: { enabled: true, size: 25, color: "#18181b", receiveShadow: true },
    },
    renderer: { antialias: true, shadowMap: true, dpr: 2 },
    objects: [
      {
        id: "levitating-hero",
        name: "Levitating Hero",
        type: "primitive",
        transform: { position: [0, 1.2, 0] },
        castShadow: true,
        geometry: { type: "primitive", primitive: "capsule", parameters: { radius: 0.5, length: 1 } },
        material: { type: "physical", color },
      },
    ],
    animations: [
      {
        targetId: "levitating-hero",
        autoPlay: true,
        tracks: [
          {
            property: "position",
            loop: true,
            duration: 3,
            keyframes: [
              { time: 0, value: [0, 1.1, 0] },
              { time: 1.5, value: [0, 1.4, 0] },
              { time: 3.0, value: [0, 1.1, 0] },
            ],
          },
        ],
      },
    ],
    interaction: {
      controls: {
        mode: "orbit",
        enableOrbit: true,
        dampingFactor: 0.05,
      },
    },
    autoStart: true,
    respectReducedMotion: true,
  };
}

/**
 * 8. Scroll-Driven Product Narrative
 */
function createScrollProductNarrative(options?: Scene3DRecipeOptions): Scene3DSpecification {
  const id = options?.id ?? "scroll-product-scene";
  const name = options?.name ?? "Scroll-Driven Product Narrative";
  const color = options?.primaryColor ?? "#3b82f6";

  return {
    id,
    name,
    version: SCENE_SPECIFICATION_VERSION,
    camera: {
      type: "perspective",
      fov: 45,
      position: [0, 1.5, 6],
      target: [0, 0, 0],
    },
    lighting: {
      ambient: { color: "#ffffff", intensity: 0.4 },
      directional: [{ color: "#ffffff", intensity: 1.5, position: [5, 6, 5], castShadow: true }],
    },
    environment: {
      background: "#020617",
      ground: { enabled: true, size: 40, color: "#0b1329", receiveShadow: true },
    },
    renderer: { antialias: true, shadowMap: true, dpr: 2 },
    objects: [
      {
        id: "narrative-product",
        name: "Narrative Product",
        type: "primitive",
        transform: { position: [0, 0, 0], rotation: [0, 0, 0] },
        castShadow: true,
        geometry: { type: "primitive", primitive: "cylinder", parameters: { radiusTop: 0.7, radiusBottom: 0.7, height: 1.8 } },
        material: { type: "physical", color },
      },
    ],
    scrollTimeline: {
      id: "product-narrative-timeline",
      name: "Product Breakdown Stages",
      keyframes: [
        { progress: 0, targetRotation: [0, 0, 0], cameraDistance: 6 },
        { progress: 0.33, targetRotation: [0, Math.PI * 0.5, 0], cameraDistance: 5 },
        { progress: 0.66, targetRotation: [0.3, Math.PI, 0], cameraDistance: 4.5 },
        { progress: 1.0, targetRotation: [0, Math.PI * 2, 0], cameraDistance: 6 },
      ],
      sections: [
        { id: "overview", progressStart: 0, progressEnd: 0.33, title: "Complete Overview" },
        { id: "details", progressStart: 0.33, progressEnd: 0.66, title: "Precision Engineering" },
        { id: "performance", progressStart: 0.66, progressEnd: 1.0, title: "Unmatched Performance" },
      ],
    },
    interaction: {
      controls: {
        mode: "orbit",
        enableOrbit: true,
        dampingFactor: 0.05,
      },
    },
    autoStart: true,
    respectReducedMotion: true,
  };
}

export const SCENE_3D_RECIPES: Record<
  Scene3DRecipeName,
  (options?: Scene3DRecipeOptions) => Scene3DSpecification
> = {
  "product-showcase": createProductShowcase,
  "cinematic-hero": createCinematicHero,
  "abstract-environment": createAbstractEnvironment,
  "interactive-portfolio": createInteractivePortfolio,
  "spatial-storytelling": createSpatialStorytelling,
  "architectural-viz": createArchitecturalViz,
  "floating-object": createFloatingObject,
  "scroll-product-narrative": createScrollProductNarrative,
};

export function getSceneRecipe(
  name: Scene3DRecipeName,
  options?: Scene3DRecipeOptions
): Scene3DSpecification {
  const factory = SCENE_3D_RECIPES[name];
  if (!factory) {
    return createProductShowcase(options);
  }
  return factory(options);
}

export function listSceneRecipes(): readonly RecipeDescriptor[] {
  return SCENE_3D_RECIPES_META;
}
