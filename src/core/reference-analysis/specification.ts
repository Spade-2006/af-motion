/**
 * AF Motion Reference-to-React Specification Engine
 *
 * Emits framework-independent React code generation specifications:
 * - Deterministic component blueprints
 * - Normalized AF Motion imports partitioned by official subpaths
 * - Global CSS custom properties
 * - Non-executable code templates for coding agents
 */

import type {
  PlannedComponentNode,
  ReactCodeSpecification,
  ReactComponentSpec,
  ReactImplementationPlan,
} from "./types.js";

/**
 * Derives component specifications from planned nodes.
 */
function deriveComponentSpecs(
  nodes: PlannedComponentNode[],
  plan: ReactImplementationPlan
): ReactComponentSpec[] {
  const specs: ReactComponentSpec[] = [];

  for (const node of nodes) {
    const isInteractive =
      node.category === "interactive" ||
      node.category === "canvas" ||
      node.category === "3d" ||
      Boolean(node.afMotionBinding);

    const imports: { name: string; subpath: string }[] = [];
    if (node.afMotionBinding?.component) {
      imports.push({
        name: node.afMotionBinding.component,
        subpath: node.afMotionBinding.subpath,
      });
    }
    if (node.afMotionBinding?.hook) {
      imports.push({
        name: node.afMotionBinding.hook,
        subpath: node.afMotionBinding.subpath,
      });
    }
    if (isInteractive) {
      imports.push({
        name: "useMotionAccessibility",
        subpath: "af-motion/react",
      });
    }

    const state: ReactComponentSpec["state"] = [];
    if (node.category === "interactive") {
      state.push({
        name: "isActive",
        type: "boolean",
        initialValue: "false",
      });
    }

    let jsxBlueprint = `<div className="${String(node.props.className ?? "")}">\n`;
    if (node.afMotionBinding?.component === "Reveal") {
      jsxBlueprint = `  <Reveal preset="fadeUp" duration={${plan.visualStyleConfig.motionDNA === "energetic" ? 350 : 500}}>\n    ${node.name} Content\n  </Reveal>\n`;
    } else if (node.afMotionBinding?.component === "Interactive") {
      jsxBlueprint = `  <Interactive hover={{ scale: 1.02 }} tap={{ scale: 0.98 }}>\n    <button className="px-4 py-2 font-medium">${node.name}</button>\n  </Interactive>\n`;
    } else if (node.category === "canvas") {
      jsxBlueprint = `  <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />\n`;
    } else {
      jsxBlueprint = `  <section id="${node.id}" className="w-full">\n    {/* ${node.name} */}\n  </section>\n`;
    }

    specs.push({
      name: node.name,
      fileHint: `components/${node.name}.tsx`,
      isClientComponent: isInteractive,
      responsibilities: [
        `Render ${node.name} with ${plan.visualStyleConfig.style} aesthetic`,
        `Apply Motion DNA '${plan.visualStyleConfig.motionDNA}' timing`,
        "Enforce prefers-reduced-motion fallback",
      ],
      props: [
        { name: "className", type: "string", optional: true },
        { name: "children", type: "React.ReactNode", optional: true },
      ],
      state,
      afMotionImports: imports,
      jsxBlueprint,
    });

    if (node.children && node.children.length > 0) {
      specs.push(...deriveComponentSpecs(node.children, plan));
    }
  }

  return specs;
}

/**
 * Aggregates all imports by subpath without duplicates.
 */
function aggregateImports(
  componentSpecs: ReactComponentSpec[],
  plan: ReactImplementationPlan
): { subpath: string; namedImports: string[] }[] {
  const map = new Map<string, Set<string>>();

  for (const comp of componentSpecs) {
    for (const imp of comp.afMotionImports) {
      if (!map.has(imp.subpath)) {
        map.set(imp.subpath, new Set());
      }
      map.get(imp.subpath)!.add(imp.name);
    }
  }

  // Ensure core recommendations if needed
  if (!map.has("af-motion/react")) {
    map.set("af-motion/react", new Set(["useMotionAccessibility"]));
  } else {
    map.get("af-motion/react")!.add("useMotionAccessibility");
  }

  if (plan.graphicsAnd3D.backgroundCanvas) {
    if (!map.has("af-motion")) {
      map.set("af-motion", new Set([plan.graphicsAnd3D.backgroundCanvas.effect]));
    } else {
      map.get("af-motion")!.add(plan.graphicsAnd3D.backgroundCanvas.effect);
    }
  }

  return Array.from(map.entries()).map(([subpath, names]) => ({
    subpath,
    namedImports: Array.from(names).sort(),
  }));
}

/**
 * Builds CSS custom properties block.
 */
function buildCSSVariables(plan: ReactImplementationPlan): Record<string, string> {
  return {
    "--af-style": plan.visualStyleConfig.style,
    "--af-palette": plan.visualStyleConfig.palette,
    "--af-motion-dna": plan.visualStyleConfig.motionDNA,
    "--af-transition-duration": plan.visualStyleConfig.motionDNA === "energetic" ? "200ms" : "350ms",
    "--af-transition-timing": "cubic-bezier(0.16, 1, 0.3, 1)",
  };
}

/**
 * Emits a deterministic, non-executable code template for consumption by AI agents or developers.
 */
function buildCodeTemplate(
  plan: ReactImplementationPlan,
  requiredImports: { subpath: string; namedImports: string[] }[]
): string {
  const importLines = requiredImports
    .map(
      (imp) =>
        `import { ${imp.namedImports.join(", ")} } from "${imp.subpath}";`
    )
    .join("\n");

  return `"use client";

import React, { useEffect, useRef } from "${"react"}";
${importLines}

/**
 * ${plan.title}
 * Style: ${plan.visualStyleConfig.style} | Palette: ${plan.visualStyleConfig.palette} | DNA: ${plan.visualStyleConfig.motionDNA}
 */
export default function ReferenceExperience() {
  const { prefersReducedMotion } = useMotionAccessibility();

  return (
    <main className="min-h-screen w-full relative flex flex-col items-center justify-center p-8">
      <Reveal preset="fadeUp" duration={prefersReducedMotion ? 0 : 500}>
        <div className="max-w-2xl text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight">
            ${plan.title}
          </h1>
          <p className="text-lg opacity-80">
            Crafted with AF Motion (${plan.visualStyleConfig.style} style).
          </p>
          <div className="flex justify-center gap-4">
            <Interactive hover={{ scale: 1.03 }} tap={{ scale: 0.97 }}>
              <button className="px-6 py-3 rounded-lg font-semibold bg-white text-black shadow-lg">
                Explore Motion
              </button>
            </Interactive>
          </div>
        </div>
      </Reveal>
    </main>
  );
}
`;
}

/**
 * Generates an end-to-end React code generation specification from an implementation plan.
 */
export function generateReactSpecification(
  plan: ReactImplementationPlan
): ReactCodeSpecification {
  const components = deriveComponentSpecs(plan.componentHierarchy, plan);
  const requiredImports = aggregateImports(components, plan);
  const globalCSSVariables = buildCSSVariables(plan);

  const accessibilityNotes = [
    "Always check prefersReducedMotion using useMotionAccessibility()",
    "Keep layout static; only animate transform and opacity",
    "Provide high contrast focus outlines on interactive components",
  ];

  const codeTemplate = buildCodeTemplate(plan, requiredImports);

  return {
    planId: plan.id,
    title: plan.title,
    components,
    requiredImports,
    globalCSSVariables,
    accessibilityNotes,
    codeTemplate,
  };
}
