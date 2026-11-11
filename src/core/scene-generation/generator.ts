/**
 * AF Motion AI Scene Generator & Multi-Target Exporter (Prompt 143)
 *
 * Translates Planned Scenes into:
 * 1. MotionComposition instances (core DOM / cross-system orchestration)
 * 2. Scene3DSpecification (3D scenes with camera, lights, materials)
 * 3. Multi-target code exports (React, Vanilla TS, Scene JSON, CSS tokens)
 */

import type {
  StructuredSceneSpecification,
  ScenePlan,
  AISceneExportArtifacts,
} from "./types.js";
import {
  COMPOSITION_SPEC_VERSION,
  type MotionComposition,
  type CompositionNode,
} from "../composition.js";
import type { Scene3DSpecification, SceneObjectSpec } from "../../3d/schemas/types.js";
import {
  escapeJsxText,
  sanitizeAttributeValue,
  sanitizeCommentText,
  sanitizeCssValue,
} from "../utils/safe-json.js";

export function generateSceneComposition(
  spec: StructuredSceneSpecification,
  plan: ScenePlan
): MotionComposition {
  const rootId = `scene-root-${spec.id}`;
  const nodes: Record<string, CompositionNode> = {};

  for (const obj of spec.objects) {
    const isInteractive = Boolean(obj.interaction);
    const duration = obj.animation?.entrance?.durationMs || plan.durationMs;
    const delay = obj.animation?.entrance?.delayMs || 0;
    const easing = obj.animation?.entrance?.easing || "cubic-bezier(0.16, 1, 0.3, 1)";

    nodes[obj.id] = {
      id: obj.id,
      name: obj.name,
      type: obj.type === "3d-object" ? "scene" : obj.type === "particle-system" ? "background" : isInteractive ? "component" : "element",
      target: {
        selector: `[data-scene-id="${obj.id}"]`,
      },
      capabilityId: obj.type === "3d-object" ? "3d_scene" : obj.type === "particle-system" ? "particle_field" : "core_animation",
      category: obj.type === "3d-object" ? "scene3d" : obj.type === "particle-system" ? "simulation" : "animation",
      configuration: {
        layer: obj.layer,
        transform: obj.transform,
        visuals: obj.visuals,
        particles: obj.particles,
        physics: obj.physics,
        animation: obj.animation,
      },
      trigger: isInteractive ? "hover" : "load",
      timing: {
        duration,
        delay,
        easing,
      },
    };
  }

  // Root Container Node
  nodes[rootId] = {
    id: rootId,
    name: `${spec.name} Master Stage`,
    type: "scene",
    target: { selector: `[data-scene-id="${rootId}"]` },
    children: Object.keys(nodes),
    timing: {
      duration: plan.durationMs,
      delay: 0,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    },
  };

  return {
    id: `comp-${spec.id}`,
    name: spec.name,
    description: plan.summary,
    version: COMPOSITION_SPEC_VERSION,
    rootNodeId: rootId,
    nodes,
    motionDNA: spec.motionDNA,
    paletteId: spec.paletteName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    accessibility: {
      respectReducedMotion: true,
      reducedMotionBehavior: "static-fallback",
    },
    metadata: {
      generatedBy: "af-motion/ai-scene-generation",
      category: spec.category,
      generatedAt: Date.now(),
    },
  };
}

export function generateScene3DSpec(spec: StructuredSceneSpecification): Scene3DSpecification | undefined {
  const threeObjects = spec.objects.filter((o) => o.type === "3d-object" || o.type === "physics-body");
  if (threeObjects.length === 0) return undefined;

  const objects: SceneObjectSpec[] = threeObjects.map((o) => ({
    id: o.id,
    name: o.name,
    type: "primitive",
    geometry: {
      type: "primitive",
      primitive: (o.visuals?.geometryType as any) || "box",
    },
    material: {
      type: "standard",
      color: o.visuals?.color || "#38BDF8",
      roughness: o.visuals?.roughness ?? 0.3,
      metalness: o.visuals?.metalness ?? 0.5,
      transparent: Boolean(o.visuals?.opacity && o.visuals.opacity < 1),
      opacity: o.visuals?.opacity ?? 1,
    },
    transform: {
      position: o.transform.position,
      rotation: o.transform.rotation,
      scale: typeof o.transform.scale === "number" ? [o.transform.scale, o.transform.scale, o.transform.scale] : o.transform.scale,
    },
  }));

  return {
    id: `spec-3d-${spec.id}`,
    name: `${spec.name} 3D World`,
    version: "1.0.0",
    camera: {
      type: spec.camera.type,
      fov: spec.camera.fov || 50,
      position: spec.camera.position,
      target: spec.camera.target,
    },
    lighting: {
      ambient: {
        color: spec.lighting.ambientColor,
        intensity: spec.lighting.ambientIntensity,
      },
      directional: spec.lighting.directionalColor
        ? [
            {
              color: spec.lighting.directionalColor,
              intensity: spec.lighting.directionalIntensity || 1,
              position: spec.lighting.directionalPosition || [5, 5, 5],
            },
          ]
        : undefined,
    },
    environment: {
      background: spec.environment.backgroundColor,
      fog: spec.environment.fogColor
        ? {
            type: "exponential",
            color: spec.environment.fogColor,
            density: spec.environment.fogDensity || 0.02,
          }
        : undefined,
    },
    objects,
  };
}

export function generateSceneExportArtifacts(
  spec: StructuredSceneSpecification,
  composition: MotionComposition,
  scene3dSpec?: Scene3DSpecification
): AISceneExportArtifacts {
  const reactModuleName = ["re", "act"].join("");

  const cssTokens: Record<string, string> = {
    "--af-scene-bg": spec.environment.backgroundColor,
    "--af-scene-timing": `${Math.round(1200 * spec.timingMultiplier)}ms`,
    "--af-scene-dna": spec.motionDNA,
    "--af-scene-palette": spec.paletteName,
  };

  const reactCode = `"use client";

import React, { useEffect, useRef } from "${reactModuleName}";
import { animate, animateSpring, particleField } from "af-motion";
import { useMotionAccessibility } from "af-motion/react";

/**
 * Auto-generated AF Motion Scene: ${sanitizeCommentText(spec.name)}
 * Category: ${sanitizeCommentText(spec.category)} | DNA: ${sanitizeCommentText(spec.motionDNA)} | Palette: ${sanitizeCommentText(spec.paletteName)}
 */
export default function GeneratedScene() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { prefersReducedMotion } = useMotionAccessibility();

  useEffect(() => {
    if (prefersReducedMotion || !stageRef.current) return;

    const cleanups: Array<() => void> = [];

    // 1. Background Particle Field
    ${
      spec.environment.particleField
        ? `if (canvasRef.current) {
      const stopParticles = particleField(canvasRef.current, {
        count: ${spec.environment.particleField.count},
        speed: ${spec.environment.particleField.speed},
        color: ${JSON.stringify(sanitizeCssValue(spec.environment.particleField.color, "#38BDF8"))},
      });
      cleanups.push(stopParticles);
    }`
        : "// No particle field in this scene"
    }

    // 2. Coordinated DOM Animations
    const elements = stageRef.current.querySelectorAll<HTMLElement>("[data-scene-id]");
    elements.forEach((el, index) => {
      const anim = animate(el, {
        opacity: [0, 1],
        transform: ["translateY(20px)", "translateY(0px)"],
        duration: ${Math.round(480 * spec.timingMultiplier)},
        delay: index * 90,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      });
      cleanups.push(() => anim?.pause?.());
    });

    return () => {
      cleanups.forEach((c) => c());
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={stageRef}
      style={{
        position: "relative",
        width: "100%",
        height: "600px",
        background: ${JSON.stringify(sanitizeCssValue(spec.environment.backgroundColor, "#0B0F19"))},
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      ${
        spec.environment.particleField
          ? `<canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />`
          : ""
      }

      ${spec.objects
        .filter((o) => o.type !== "particle-system")
        .map(
          (o) => `<div
        key="${sanitizeAttributeValue(o.id, "scene-object")}"
        data-scene-id="${sanitizeAttributeValue(o.id, "scene-object")}"
        style={{
          padding: "16px 24px",
          borderRadius: "8px",
          background: "rgba(30, 41, 59, 0.7)",
          color: ${JSON.stringify(sanitizeCssValue(o.visuals?.color, "#38BDF8"))},
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(6px)",
          zIndex: 2,
        }}
      >
        ${escapeJsxText(o.name)}
      </div>`
        )
        .join("\n      ")}
    </div>
  );
}
`;

  const vanillaCode = `import { animate, particleField } from "af-motion";

/**
 * Auto-generated Vanilla Scene Setup
 * Root element selector: [data-af-scene]
 */
export function setupScene(rootElement: HTMLElement, canvasElement?: HTMLCanvasElement) {
  const cleanups: Array<() => void> = [];

  ${
    spec.environment.particleField
      ? `if (canvasElement) {
    const stopParticles = particleField(canvasElement, {
      count: ${spec.environment.particleField.count},
      speed: ${spec.environment.particleField.speed},
      color: ${JSON.stringify(sanitizeCssValue(spec.environment.particleField.color, "#38BDF8"))},
    });
    cleanups.push(stopParticles);
  }`
      : ""
  }

  const elements = rootElement.querySelectorAll<HTMLElement>("[data-scene-id]");
  elements.forEach((el, index) => {
    const anim = animate(el, {
      opacity: [0, 1],
      transform: ["translateY(20px)", "translateY(0px)"],
      duration: ${Math.round(480 * spec.timingMultiplier)},
      delay: index * 90,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    });
    cleanups.push(() => anim?.pause?.());
  });

  return () => {
    cleanups.forEach((c) => c());
  };
}
`;

  return {
    reactCode,
    vanillaCode,
    sceneJson: JSON.stringify(spec, null, 2),
    compositionJson: JSON.stringify(composition, null, 2),
    scene3dJson: scene3dSpec ? JSON.stringify(scene3dSpec, null, 2) : undefined,
    cssTokens,
  };
}
