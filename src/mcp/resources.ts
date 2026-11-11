/**
 * AF Motion MCP Resources
 *
 * Exposes read-only source-of-truth datasets (capabilities, visual styles,
 * Motion DNA, palettes, and schemas) to external AI agents via standard MCP resource URIs.
 */

import {
  aiMotionRegistry,
  visualStyleRegistry,
  BUILT_IN_MOTION_DNA,
  BUILT_IN_DESIGN_SYSTEMS,
} from "../catalogue.js";
import { listPalettes } from "../core/palettes.js";
import type { MCPResource, MCPResourceContent } from "./types.js";

export const MCP_RESOURCES: readonly MCPResource[] = [
  {
    uri: "af-motion://catalogue",
    name: "Capability Catalogue",
    description: "Full machine-readable catalogue of all AF Motion public capabilities, signatures, and examples.",
    mimeType: "application/json",
  },
  {
    uri: "af-motion://categories",
    name: "Capability Categories",
    description: "List of all capability categories and their counts.",
    mimeType: "application/json",
  },
  {
    uri: "af-motion://visual-styles",
    name: "Visual Style Definitions",
    description: "Complete list of all 19 supported visual styles, token mappings, and design archetypes.",
    mimeType: "application/json",
  },
  {
    uri: "af-motion://motion-dna",
    name: "Motion DNA Profiles",
    description: "Built-in Motion DNA personality curves (snappy, calm, cinematic, energetic, editorial-flow).",
    mimeType: "application/json",
  },
  {
    uri: "af-motion://design-systems",
    name: "Design Systems",
    description: "Built-in Design System tokens and scale mappings.",
    mimeType: "application/json",
  },
  {
    uri: "af-motion://palettes",
    name: "Color Palettes",
    description: "Catalogue of all 33 built-in curated color palettes with semantic token mappings.",
    mimeType: "application/json",
  },
];

export async function readMCPResource(uri: string): Promise<MCPResourceContent> {
  switch (uri) {
    case "af-motion://catalogue": {
      const caps = aiMotionRegistry.listCapabilities();
      return {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(caps, null, 2),
      };
    }

    case "af-motion://categories": {
      const categories = aiMotionRegistry.getCategories();
      return {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(categories, null, 2),
      };
    }

    case "af-motion://visual-styles": {
      const styles = visualStyleRegistry.listVisualStyles();
      return {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(styles, null, 2),
      };
    }

    case "af-motion://motion-dna": {
      return {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(BUILT_IN_MOTION_DNA, null, 2),
      };
    }

    case "af-motion://design-systems": {
      return {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(BUILT_IN_DESIGN_SYSTEMS, null, 2),
      };
    }

    case "af-motion://palettes": {
      const palettes = listPalettes();
      return {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(palettes, null, 2),
      };
    }

    default:
      throw new Error(`Resource not found: '${uri}'`);
  }
}
