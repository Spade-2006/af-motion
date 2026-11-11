/**
 * AF Motion AI Scene Analyzer (Prompt 143)
 *
 * Performs deep semantic scene understanding, identifying primary subjects,
 * spatial relationships, multi-system participation, and performance constraints.
 */

import type { NormalizedSceneInput } from "./input-parser.js";
import type { SceneUnderstandingResult } from "./types.js";
import type { AIMotionIntentType } from "../ai-motion-intelligence/types.js";

export function analyzeSceneSpecification(normalized: NormalizedSceneInput): SceneUnderstandingResult {
  const { category, rawPrompt, partialSpec, validationIssues } = normalized;
  const p = (rawPrompt || "").toLowerCase();
  const evidence: string[] = [];
  const warnings: string[] = [...validationIssues];

  // 1. Determine Primary Subject & Supporting Elements
  let primarySubject = "Interactive Hero Canvas";
  let supportingElements: string[] = ["Background Ambient Grid", "Text Headline", "CTA Button"];

  switch (category) {
    case "hero":
      primarySubject = "Hero Showcase Stage";
      supportingElements = ["Ambient Particle Field", "Hero Headline", "Subhead Description", "Interactive CTA"];
      break;
    case "product-showcase":
      primarySubject = "3D Central Product Object";
      supportingElements = ["Directional Lighting Key", "Rotating Pedestal", "Feature Callout Badges"];
      break;
    case "physics-playground":
      primarySubject = "Interactive Rigid Body Cluster";
      supportingElements = ["Gravity Ground Plane", "Collision Particle Emitters", "Draggable Obstacles"];
      break;
    case "particle-environment":
      primarySubject = "High-Density GPU Particle Field";
      supportingElements = ["Depth Fog Horizon", "Pointer Force Attractor", "Atmospheric Glow Orbs"];
      break;
    case "portfolio":
      primarySubject = "Spatial Project Gallery";
      supportingElements = ["Project Cards Matrix", "Perspective Camera Rail", "Magnetic Pointer Follower"];
      break;
    case "cinematic-sequence":
      primarySubject = "Cinematic Camera Arc Sequence";
      supportingElements = ["Dramatic Contrast Lighting", "Depth of Field Field", "Hero Focal Geometry"];
      break;
    case "scroll-storytelling":
      primarySubject = "Multi-Section Narrative Spine";
      supportingElements = ["Scroll Progress Driver", "Section Reveal Gates", "Parallax Depth Layers"];
      break;
    case "3d-world":
      primarySubject = "Procedural 3D Terrain & World";
      supportingElements = ["Procedural Heightmap", "Orbiting Sun Light", "Atmospheric Skybox"];
      break;
    case "interactive-interface":
      primarySubject = "Interactive Dashboard Surface";
      supportingElements = ["KPI Metric Widgets", "Staggered Reveal Group", "Tactile Microinteractions"];
      break;
  }

  // 2. Determine Required Subsystems
  const has3D = category === "3d-world" ||
    category === "product-showcase" ||
    category === "cinematic-sequence" ||
    p.includes("3d") ||
    Boolean(partialSpec?.camera);

  const hasParticles = category === "particle-environment" ||
    category === "hero" ||
    category === "physics-playground" ||
    p.includes("particle") ||
    p.includes("nebula") ||
    p.includes("glow");

  const hasPhysics = category === "physics-playground" ||
    p.includes("physics") ||
    p.includes("gravity") ||
    p.includes("collision");

  const hasDOM = category !== "particle-environment" || p.includes("text") || p.includes("card") || p.includes("button");
  const hasInteractions = p.includes("drag") || p.includes("click") || p.includes("hover") || p.includes("interactive") || category === "physics-playground" || category === "interactive-interface";

  evidence.push(`Identified primary subject: '${primarySubject}' in category '${category}'.`);
  evidence.push(`Multi-system allocation: 3D=${has3D}, Particles=${hasParticles}, Physics=${hasPhysics}, DOM=${hasDOM}, Interactions=${hasInteractions}.`);

  // 3. Map to Semantic Motion Intent
  let inferredIntent: AIMotionIntentType = "entrance";
  let intentConfidence = 0.88;

  if (category === "physics-playground") {
    inferredIntent = "simulation";
    intentConfidence = 0.94;
  } else if (category === "particle-environment") {
    inferredIntent = "ambient";
    intentConfidence = 0.92;
  } else if (category === "scroll-storytelling") {
    inferredIntent = "scroll-storytelling";
    intentConfidence = 0.95;
  } else if (category === "interactive-interface") {
    inferredIntent = "feedback";
    intentConfidence = 0.9;
  } else if (category === "product-showcase" || category === "cinematic-sequence") {
    inferredIntent = "spatial-movement";
    intentConfidence = 0.91;
  }

  // 4. Complexity & Performance Guardrails
  let spatialComplexity: "minimal" | "moderate" | "rich" = "moderate";
  if (has3D && hasParticles && hasPhysics) {
    spatialComplexity = "rich";
    warnings.push("High multi-system density: ensure GPU budget monitoring and adaptive particle throttling.");
  } else if (!has3D && !hasPhysics) {
    spatialComplexity = "minimal";
  }

  return {
    category,
    primarySubject,
    supportingElements,
    requiredSystems: {
      has3D,
      hasParticles,
      hasPhysics,
      hasDOM,
      hasInteractions,
    },
    inferredIntent,
    intentConfidence,
    spatialComplexity,
    evidence,
    warnings,
  };
}
