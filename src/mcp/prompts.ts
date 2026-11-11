/**
 * AF Motion MCP Prompts
 *
 * Pre-engineered prompts guiding external AI coding agents to leverage AF Motion
 * capabilities rather than inventing custom, fragile animation code.
 */

import type { MCPPrompt, MCPPromptMessage } from "./types.js";

export const MCP_PROMPTS: readonly MCPPrompt[] = [
  {
    name: "react-animation-system",
    description: "Guide for scaffolding a unified, accessible animation system in a React application using AF Motion.",
    arguments: [
      {
        name: "visualStyle",
        description: "Desired visual style (e.g. 'editorial', 'brutalist', 'skeuomorphic', 'minimal').",
        required: false,
      },
      {
        name: "motionDNA",
        description: "Desired Motion DNA personality (e.g. 'snappy', 'calm', 'cinematic').",
        required: false,
      },
    ],
  },
  {
    name: "visual-style-page",
    description: "Instructions for building a web page adhering strictly to an AF Motion visual style.",
    arguments: [
      {
        name: "styleName",
        description: "Name of the visual style (e.g. 'neomorphic', 'liquid-chrome', 'grunge', 'ukiyo-e').",
        required: true,
      },
    ],
  },
  {
    name: "scroll-storytelling",
    description: "Instructions for building scroll-driven storytelling, parallax, and sticky sections.",
    arguments: [
      {
        name: "sections",
        description: "Comma-separated list of section narrative beats.",
        required: false,
      },
    ],
  },
  {
    name: "interactive-components",
    description: "Instructions for implementing accessible tactile microinteractions on UI controls.",
    arguments: [
      {
        name: "componentTypes",
        description: "Target controls (e.g. 'button, card, input, toggle').",
        required: false,
      },
    ],
  },
  {
    name: "cross-system-choreography",
    description: "Instructions for coordinating DOM UI elements with 3D scenes and graphics shaders.",
    arguments: [
      {
        name: "systems",
        description: "Participating systems (e.g. 'dom, 3d, graphics').",
        required: false,
      },
    ],
  },
  {
    name: "validate-and-optimize",
    description: "Instructions for auditing, diagnosing layout thrashing, and optimizing animation code.",
    arguments: [
      {
        name: "level",
        description: "Optimization level ('safe', 'balanced', 'aggressive').",
        required: false,
      },
    ],
  },
];

export async function getMCPPromptMessages(
  name: string,
  args: Record<string, string> = {}
): Promise<readonly MCPPromptMessage[]> {
  switch (name) {
    case "react-animation-system": {
      const style = args.visualStyle ?? args.style ?? "editorial";
      const dna = args.motionDNA ?? args.dna ?? "editorial-flow";
      const componentType = args.componentType ? ` for component type '${args.componentType}'` : "";
      return [
        {
          role: "user",
          content: {
            type: "text",
            text: `You are an expert frontend engineer using AF Motion. Configure a comprehensive motion system using Visual Style '${style}' and Motion DNA '${dna}'${componentType}.
Use AF Motion's React hooks (useAnimate, useScrollIntelligence, useMicrointeraction, useChoreography) and components (<Interactive />, <ScrollReveal />, <Choreography />).
Ensure all animations respect reduced motion preferences and use GPU-accelerated transforms instead of layout-triggering properties.`,
          },
        },
      ];
    }

    case "visual-style-page": {
      const style = args.styleName ?? "brutalist";
      return [
        {
          role: "user",
          content: {
            type: "text",
            text: `Build a cohesive landing page using the '${style}' visual style from AF Motion.
Retrieve visual style tokens and specifications via tool 'list_visual_styles'. Apply consistent typography, borders, shadows, and hover microinteractions matching the aesthetic.`,
          },
        },
      ];
    }

    case "scroll-storytelling": {
      const sections = args.sections ?? "Hero, Narrative, Feature Showcase, Call to Action";
      return [
        {
          role: "user",
          content: {
            type: "text",
            text: `Create an immersive scroll-driven storytelling experience across the following sections: ${sections}.
Use 'generate_scroll_animation' with patterns 'reveal', 'parallax', and 'sticky-story'. Bind scroll progress cleanly without blocking the main browser thread.`,
          },
        },
      ];
    }

    case "interactive-components": {
      const types = args.componentTypes ?? "button, card, input, toggle";
      return [
        {
          role: "user",
          content: {
            type: "text",
            text: `Implement responsive, tactile microinteractions for: ${types}.
Use 'generate_microinteraction' tool for tactile press scaling, hover elevation, and focus rings. Support keyboard navigation and WCAG 2.3.1 seizure safety.`,
          },
        },
      ];
    }

    case "cross-system-choreography": {
      const systems = args.systems ?? "dom, 3d, graphics";
      return [
        {
          role: "user",
          content: {
            type: "text",
            text: `Build a synchronized cross-system choreography sequence coordinating ${systems}.
Use 'generate_choreography' and the CrossSystemSyncBridge to synchronize normalized progress across DOM elements and 3D scenes.`,
          },
        },
      ];
    }

    case "validate-and-optimize": {
      const level = args.level ?? "safe";
      return [
        {
          role: "user",
          content: {
            type: "text",
            text: `Audit the motion configurations using 'validate_motion'. Address all layout thrashing (convert top/left to transform), eliminate any flashing exceeding 3 flashes/sec, and optimize the configuration with 'optimize_motion' at level '${level}'.`,
          },
        },
      ];
    }

    default:
      throw new Error(`Prompt not found: '${name}'`);
  }
}
