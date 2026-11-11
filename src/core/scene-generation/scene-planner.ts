/**
 * AF Motion AI Scene Planning Engine (Prompt 143)
 *
 * Coordinates spatial layout, layer depth, lighting, particles, camera framing,
 * and choreographed animation sequences influenced by Motion DNA personalities.
 */

import type { NormalizedSceneInput } from "./input-parser.js";
import type {
  SceneUnderstandingResult,
  ScenePlan,
  StructuredSceneSpecification,
  SceneObjectDefinition,
  SceneCameraDefinition,
  SceneLightingDefinition,
  SceneEnvironmentDefinition,
} from "./types.js";
import { queryPatternKnowledgeBase } from "../ai-motion-intelligence/knowledge-base.js";

export function planSceneExecution(
  understanding: SceneUnderstandingResult,
  normalized: NormalizedSceneInput
): { plan: ScenePlan; spec: StructuredSceneSpecification } {
  const { category, requiredSystems } = understanding;
  const { motionDNA, paletteName, paletteColors, timingMultiplier, reducedMotion } = normalized;

  // 1. Matched Pattern Discovery
  const patterns = queryPatternKnowledgeBase(understanding.inferredIntent);
  const matchedPatternIds = patterns.map((p) => p.id);

  // 2. Camera Planning
  const camera: SceneCameraDefinition = {
    type: "perspective",
    fov: category === "cinematic-sequence" ? 45 : 55,
    position: category === "product-showcase" ? [0, 1.2, 3.5] : [0, 0, 5],
    target: [0, 0, 0],
    interactive: requiredSystems.hasInteractions,
  };

  // 3. Lighting Planning
  const lighting: SceneLightingDefinition = {
    ambientColor: paletteColors.secondary,
    ambientIntensity: category === "cinematic-sequence" ? 0.2 : 0.45,
    directionalColor: paletteColors.primary,
    directionalIntensity: 1.2,
    directionalPosition: [5, 8, 5],
    pointLightColor: paletteColors.accent,
    pointLightPosition: [-4, 2, -2],
  };

  // 4. Environment Planning
  const environment: SceneEnvironmentDefinition = {
    backgroundType: requiredSystems.hasParticles ? "particles" : "gradient",
    backgroundColor: paletteColors.background,
    fogColor: paletteColors.background,
    fogDensity: category === "cinematic-sequence" || category === "particle-environment" ? 0.03 : 0.01,
    particleField: requiredSystems.hasParticles
      ? {
          count: reducedMotion ? 25 : 120,
          speed: 0.6 * timingMultiplier,
          color: paletteColors.accent,
          size: 2.5,
          spread: 14,
          shape: "glow-orbs",
        }
      : undefined,
  };

  // 5. Generate Scene Objects across Layers
  const objects = buildSceneObjects(understanding, normalized);

  const durationMs = Math.round(1200 * timingMultiplier);

  const plan: ScenePlan = {
    id: `plan-scene-${Date.now()}`,
    name: `${category.replace(/-/g, " ").toUpperCase()} Scene Plan`,
    summary: `Complete orchestrated scene plan with ${objects.length} elements across DOM, 3D, particle, and physics systems.`,
    category,
    layers: ["background", "middleground", "foreground", "overlay"],
    durationMs,
    matchedPatternIds,
    objectCount: objects.length,
    systemParticipation: {
      animation: requiredSystems.hasDOM,
      background: true,
      scene3d: requiredSystems.has3D,
      physics: requiredSystems.hasPhysics,
      interactions: requiredSystems.hasInteractions,
      simulations: requiredSystems.hasParticles,
    },
  };

  const spec: StructuredSceneSpecification = {
    id: `scene-${Date.now()}`,
    name: plan.name,
    version: "1.0.0",
    category,
    canvasDimensions: { width: 1280, height: 720, isResponsive: true },
    camera,
    lighting,
    environment,
    objects,
    motionDNA,
    paletteName,
    timingMultiplier,
    reducedMotion,
    metadata: {
      primarySubject: understanding.primarySubject,
      spatialComplexity: understanding.spatialComplexity,
    },
  };

  return { plan, spec };
}

function buildSceneObjects(
  understanding: SceneUnderstandingResult,
  normalized: NormalizedSceneInput
): SceneObjectDefinition[] {
  const { category, requiredSystems } = understanding;
  const { paletteColors, timingMultiplier, reducedMotion } = normalized;
  const objects: SceneObjectDefinition[] = [];

  // A. Background Layer
  if (requiredSystems.hasParticles) {
    objects.push({
      id: "obj-bg-particles",
      name: "Ambient Particle Field",
      type: "particle-system",
      layer: "background",
      transform: { position: [0, 0, -8] },
      particles: {
        count: reducedMotion ? 20 : 150,
        speed: 0.5 * timingMultiplier,
        color: paletteColors.accent,
        size: 2,
        spread: 16,
      },
      animation: {
        ambient: { type: "drift", speed: 0.2 },
      },
    });
  }

  // B. Middleground Layer (3D Objects / Central Geometry / Physics)
  if (requiredSystems.has3D || category === "product-showcase" || category === "hero") {
    objects.push({
      id: "obj-hero-focal",
      name: "Hero Central Geometry",
      type: "3d-object",
      layer: "middleground",
      transform: { position: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
      visuals: {
        geometryType: category === "product-showcase" ? "cylinder" : "torus",
        color: paletteColors.primary,
        metalness: 0.7,
        roughness: 0.2,
      },
      animation: {
        entrance: {
          properties: ["opacity", "scale"],
          from: { opacity: 0, scale: 0.8 },
          to: { opacity: 1, scale: 1 },
          durationMs: Math.round(600 * timingMultiplier),
          delayMs: 100,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        },
        ambient: {
          type: "rotate",
          speed: 0.4,
          axis: "y",
        },
      },
      interaction: {
        hover: { scale: 1.08, elevateZ: 0.2 },
        draggable: true,
      },
    });
  }

  if (requiredSystems.hasPhysics) {
    objects.push(
      {
        id: "obj-physics-ground",
        name: "Physics Boundary Floor",
        type: "physics-body",
        layer: "middleground",
        transform: { position: [0, -2.5, 0], scale: [10, 0.2, 10] },
        visuals: { geometryType: "plane", color: paletteColors.secondary, opacity: 0.4 },
        physics: { mass: 0, restitution: 0.2, friction: 0.8, isStatic: true, colliderType: "box" },
      },
      {
        id: "obj-physics-dynamic-1",
        name: "Interactive Gravity Orb",
        type: "physics-body",
        layer: "middleground",
        transform: { position: [0, 2, 0] },
        visuals: { geometryType: "sphere", color: paletteColors.accent },
        physics: { mass: 1.5, restitution: 0.75, friction: 0.3, isStatic: false, colliderType: "sphere" },
        interaction: { draggable: true },
      }
    );
  }

  // C. Foreground Layer (DOM Cards / UI Elements)
  if (requiredSystems.hasDOM) {
    objects.push({
      id: "obj-card-headline",
      name: "Headline Presentation Card",
      type: "card",
      layer: "foreground",
      transform: { position: [0, 0.5, 1] },
      visuals: { color: paletteColors.primary },
      animation: {
        entrance: {
          properties: ["opacity", "transform"],
          from: { opacity: 0, transform: "translateY(24px)" },
          to: { opacity: 1, transform: "translateY(0px)" },
          durationMs: Math.round(500 * timingMultiplier),
          delayMs: 200,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        },
      },
      interaction: {
        hover: { scale: 1.02 },
      },
    });

    objects.push({
      id: "obj-btn-action",
      name: "Primary Action Trigger",
      type: "dom-element",
      layer: "overlay",
      transform: { position: [0, -1.2, 1.2] },
      visuals: { color: paletteColors.accent },
      animation: {
        entrance: {
          properties: ["opacity", "scale"],
          from: { opacity: 0, scale: 0.9 },
          to: { opacity: 1, scale: 1 },
          durationMs: Math.round(400 * timingMultiplier),
          delayMs: 350,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        },
      },
      interaction: {
        hover: { scale: 1.05 },
        clickOrPress: { triggerEffect: "pulse" },
        magnetic: { radius: 60, strength: 0.3 },
      },
    });
  }

  return objects;
}
