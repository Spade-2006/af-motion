/**
 * AF Motion CLI — `af-motion info`
 *
 * Inspects AF Motion capabilities, version, subpath mappings, and AI capability registry.
 */

import type { AFMotionCapabilityInfo, GlobalCLIOptions } from "../types.js";
import { BUILT_IN_PALETTE_INPUTS } from "../../core/built-in-palettes.js";
import { listPresets } from "../../presets.js";
import { term } from "../utils/terminal.js";

export function getCapabilityInfo(): AFMotionCapabilityInfo {
  const isNoColor = typeof process !== "undefined" && Boolean(process.env.NO_COLOR);
  const isTTY = typeof process !== "undefined" && Boolean(process.stdout?.isTTY);
  const isCI = typeof process !== "undefined" && Boolean(process.env.CI);

  return {
    version: "0.1.0",
    subpaths: {
      core: "af-motion",
      react: "af-motion/react",
      catalogue: "af-motion/catalogue",
      presets: "af-motion/presets",
    },
    coreFeatures: [
      "Web Animations API (WAAPI) Hardware-accelerated Core",
      "Damped Physical Springs (animateSpring)",
      "Timeline Choreography & Sequencing (createTimeline)",
      "Tactile Microinteractions & Magnetic UI",
      "Directional Reveal & Cascading Stagger",
      "Interactive 3D Tilt & Perspective",
    ],
    easingsCount: 56,
    palettesCount: BUILT_IN_PALETTE_INPUTS.length,
    visualStylesCount: 19,
    motionDNAPersonalities: [
      "precise",
      "playful",
      "elegant",
      "energetic",
      "editorial-flow",
      "snappy",
      "calm",
      "cinematic",
      "minimal",
    ],
    presetsCount: listPresets().length,
    aiCapabilities: [
      "Deterministic Motion Intent Classification",
      "Multi-dimensional Motion Quality Evaluator",
      "Evidence-based Heuristic Recommendations",
      "Design-to-Motion Generation Pipeline",
      "AI Scene Generation & Composition",
      "Intelligent Agent Workflow System",
      "Multi-agent Choreography & Orchestration",
    ],
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      isCI,
      supportsColor: !isNoColor && (isTTY || isCI),
    },
  };
}

export async function executeInfo(options: GlobalCLIOptions = {}): Promise<AFMotionCapabilityInfo> {
  const info = getCapabilityInfo();

  if (!options.quiet) {
    if (options.json) {
      console.log(JSON.stringify(info, null, 2));
    } else {
      console.log(term.banner("AF Motion System & Capability Info", `v${info.version}`));
      console.log("");
      console.log(`${term.bold("Installed Version:")} v${info.version}`);
      console.log(`${term.bold("Runtime:")}           Node ${info.environment.nodeVersion} (${info.environment.platform} ${info.environment.arch})`);
      console.log("");

      console.log(term.bold("Official Package Subpaths:"));
      console.log(`  ${term.cyan("af-motion")}           - Core WAAPI animations, springs, backgrounds & physics`);
      console.log(`  ${term.cyan("af-motion/react")}     - React 18/19 hooks (useAnimate, useMicrointeraction, Reveal)`);
      console.log(`  ${term.cyan("af-motion/catalogue")} - Motion intelligence, 3D engines & AI ecosystem`);
      console.log(`  ${term.cyan("af-motion/presets")}   - Standardized recipes and animation presets`);
      console.log("");

      console.log(term.bold("Design & Kinetic Registries:"));
      console.log(`  Visual Styles:      ${term.bold(String(info.visualStylesCount))} verified visual design styles`);
      console.log(`  Built-in Palettes:  ${term.bold(String(info.palettesCount))} immutable color palettes`);
      console.log(`  Mathematical Curves:${term.bold(String(info.easingsCount))} easing curves + cubic-bezier engine`);
      console.log(`  Standard Presets:   ${term.bold(String(info.presetsCount))} verified recipes`);
      console.log(`  Motion DNA Curves:  ${info.motionDNAPersonalities.slice(0, 5).join(", ")}`);
      console.log("");

      console.log(term.bold("Deterministic AI Capabilities (Zero Cloud APIs):"));
      for (const cap of info.aiCapabilities) {
        console.log(`  ${term.green("✓")} ${cap}`);
      }
    }
  }

  return info;
}
