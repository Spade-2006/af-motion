/**
 * AF Motion AI Scene Generation Presets (Prompt 143)
 *
 * 10 curated scene generation templates covering 3D heroes, product showcases,
 * physics playgrounds, ambient particle fields, portfolios, and kinetic storytelling.
 */

import type { AIScenePreset } from "./types.js";

export const AI_SCENE_PRESETS: readonly AIScenePreset[] = [
  {
    id: "scene-preset-hero",
    name: "Futuristic 3D Landing Hero",
    description: "Floating central geometry, glowing ambient particle field, and crisp headline entrance.",
    category: "hero",
    defaultDNA: "precise",
    defaultPalette: "Cobalt Classic",
    capabilities: ["3d_object", "particle_field", "dom_cards", "staggered_entrance"],
    defaultInput: {
      naturalLanguage: "Create a futuristic landing page hero with floating geometric objects and a glowing particle background.",
      paletteName: "Cobalt Classic",
      motionDNA: "precise",
    },
  },
  {
    id: "scene-preset-product",
    name: "Cinematic Product Showcase",
    description: "Pedestal product rotation, dramatic directional lighting, and feature callout badges.",
    category: "product-showcase",
    defaultDNA: "elegant",
    defaultPalette: "Sunset Glow",
    capabilities: ["3d_product", "camera_arc", "lighting_pedestal", "ambient_rotate"],
    defaultInput: {
      naturalLanguage: "Generate a cinematic product showcase with a rotating 3D object and staggered text reveal.",
      paletteName: "Sunset Glow",
      motionDNA: "elegant",
    },
  },
  {
    id: "scene-preset-physics",
    name: "Interactive Physics Playground",
    description: "Draggable rigid bodies, boundary collision floors, and collision impulse feedback.",
    category: "physics-playground",
    defaultDNA: "playful",
    defaultPalette: "Neo Neon",
    capabilities: ["rigid_bodies", "draggable", "collision_response", "gravity_simulation"],
    defaultInput: {
      naturalLanguage: "Create an interactive physics playground with draggable objects and collision-triggered particle bursts.",
      paletteName: "Neo Neon",
      motionDNA: "playful",
    },
  },
  {
    id: "scene-preset-particles",
    name: "Dark Ambient Particle Field",
    description: "Atmospheric depth fog, floating cosmic glow orbs, and gentle camera drift.",
    category: "particle-environment",
    defaultDNA: "elegant",
    defaultPalette: "Cyberpunk High-Contrast",
    capabilities: ["gpu_particles", "depth_fog", "camera_drift", "glow_orbs"],
    defaultInput: {
      naturalLanguage: "Build a dark ambient scene with flowing particles and smooth camera movement.",
      paletteName: "Cyberpunk High-Contrast",
      motionDNA: "elegant",
    },
  },
  {
    id: "scene-preset-portfolio",
    name: "Spatial Portfolio Gallery",
    description: "Card matrix arranged in 3D perspective with magnetic hover responsiveness.",
    category: "portfolio",
    defaultDNA: "editorial-flow",
    defaultPalette: "Nordic Frost",
    capabilities: ["3d_cards", "perspective_depth", "magnetic_hover", "staggered_reveal"],
    defaultInput: {
      naturalLanguage: "Spatial 3D portfolio gallery with staggered project cards and magnetic cursor responses.",
      paletteName: "Nordic Frost",
      motionDNA: "editorial-flow",
    },
  },
  {
    id: "scene-preset-saas",
    name: "High-Conversion SaaS Hero",
    description: "Clean SaaS product preview card with crisp entrance and interactive CTA pulse.",
    category: "hero",
    defaultDNA: "precise",
    defaultPalette: "Tokyo Midnight",
    capabilities: ["hero_card", "subtle_particles", "cta_pulse", "precise_timing"],
    defaultInput: {
      naturalLanguage: "Clean high-converting SaaS hero with product preview surface and snappy action button.",
      paletteName: "Tokyo Midnight",
      motionDNA: "precise",
    },
  },
  {
    id: "scene-preset-dashboard",
    name: "Cyberpunk Interactive Dashboard",
    description: "Telemetry KPI metric cards with neon borders, staggered entrances, and tactile toggles.",
    category: "interactive-interface",
    defaultDNA: "energetic",
    defaultPalette: "Neo Neon",
    capabilities: ["kpi_widgets", "tactile_feedback", "high_velocity_entrance"],
    defaultInput: {
      naturalLanguage: "Energetic cyberpunk dashboard scene with staggered telemetry cards and responsive buttons.",
      paletteName: "Neo Neon",
      motionDNA: "energetic",
    },
  },
  {
    id: "scene-preset-scroll",
    name: "Scroll-Driven Storytelling Odyssey",
    description: "Multi-section camera pathing with parallax spatial layers and scroll-synced reveals.",
    category: "scroll-storytelling",
    defaultDNA: "editorial-flow",
    defaultPalette: "Monochrome Minimal",
    capabilities: ["scroll_timeline", "camera_path", "parallax_layers", "narrative_reveal"],
    defaultInput: {
      naturalLanguage: "Scroll-driven storytelling journey with sequential camera movement and section reveals.",
      paletteName: "Monochrome Minimal",
      motionDNA: "editorial-flow",
    },
  },
  {
    id: "scene-preset-fluid",
    name: "Organic Fluid Particle Simulation",
    description: "Viscous particle flow simulation with pointer force interaction and smooth blending.",
    category: "particle-environment",
    defaultDNA: "playful",
    defaultPalette: "Purple Haze",
    capabilities: ["fluid_particles", "pointer_attractor", "smooth_damping"],
    defaultInput: {
      naturalLanguage: "Organic fluid simulation with interactive particle flow and soft color blending.",
      paletteName: "Purple Haze",
      motionDNA: "playful",
    },
  },
  {
    id: "scene-preset-kinetic",
    name: "Minimal Kinetic Typography Scene",
    description: "Large bold typography reveals with precise mechanical spring motion and zero distractions.",
    category: "hero",
    defaultDNA: "precise",
    defaultPalette: "Deep Emerald",
    capabilities: ["kinetic_typography", "mechanical_spring", "minimalist_surface"],
    defaultInput: {
      naturalLanguage: "Minimalist kinetic typography scene with precise headline emergence and crisp layout.",
      paletteName: "Deep Emerald",
      motionDNA: "precise",
    },
  },
];

export function listAIScenePresets(): readonly AIScenePreset[] {
  return AI_SCENE_PRESETS;
}

export function getAIScenePreset(id: string): AIScenePreset | undefined {
  return AI_SCENE_PRESETS.find((p) => p.id === id);
}
