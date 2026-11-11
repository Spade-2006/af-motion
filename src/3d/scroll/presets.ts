/**
 * AF Motion 3D Scroll Timeline Presets
 *
 * Composable presets for exploded product views, camera flythroughs,
 * and multi-chapter storytelling.
 */

import type { ScrollSceneTimeline } from "./types.js";

export const SCROLL_TIMELINE_PRESETS: Record<string, ScrollSceneTimeline> = {
  "product-exploded-view": {
    id: "product-exploded-view",
    name: "Product Exploded View",
    sections: [
      { id: "assembled", start: 0, end: 0.25, name: "Assembled Product" },
      { id: "expanding", start: 0.25, end: 0.75, name: "Component Breakdown" },
      { id: "exploded", start: 0.75, end: 1.0, name: "Exploded Inspection" },
    ],
    keyframes: [
      {
        progress: 0,
        camera: { position: [0, 1, 5], target: [0, 0, 0], fov: 45 },
        objects: {
          chassis: { position: [0, 0, 0], scale: [1, 1, 1], opacity: 1, visible: true },
          core: { position: [0, 0, 0], scale: [1, 1, 1], opacity: 1, visible: true },
          casing: { position: [0, 0, 0], scale: [1, 1, 1], opacity: 1, visible: true },
        },
      },
      {
        progress: 0.5,
        camera: { position: [3, 2, 4], target: [0, 0, 0], fov: 40 },
        objects: {
          chassis: { position: [0, -1, 0], scale: [1, 1, 1], opacity: 1, visible: true },
          core: { position: [0, 0, 0], scale: [1, 1, 1], opacity: 1, visible: true },
          casing: { position: [0, 1.5, 0], scale: [1, 1, 1], opacity: 0.8, visible: true },
        },
        easing: "easeInOutCubic",
      },
      {
        progress: 1.0,
        camera: { position: [4, 3, 3], target: [0, 0, 0], fov: 35 },
        objects: {
          chassis: { position: [0, -2, 0], scale: [1, 1, 1], opacity: 1, visible: true },
          core: { position: [0, 0, 0], scale: [1.1, 1.1, 1.1], opacity: 1, visible: true },
          casing: { position: [0, 2.5, 0], scale: [1, 1, 1], opacity: 0.5, visible: true },
        },
        easing: "easeOutCubic",
      },
    ],
  },

  "camera-flythrough": {
    id: "camera-flythrough",
    name: "Cinematic Camera Flythrough",
    sections: [
      { id: "approach", start: 0, end: 0.33, name: "Approach" },
      { id: "orbit", start: 0.33, end: 0.66, name: "Side Orbit" },
      { id: "zenith", start: 0.66, end: 1.0, name: "Top-Down Overview" },
    ],
    keyframes: [
      {
        progress: 0,
        camera: { position: [0, 0, 8], target: [0, 0, 0], fov: 60 },
      },
      {
        progress: 0.33,
        camera: { position: [5, 2, 5], target: [0, 0.5, 0], fov: 50 },
        easing: "easeInOutCubic",
      },
      {
        progress: 0.66,
        camera: { position: [6, 1, -2], target: [0, 0, 0], fov: 45 },
        easing: "easeInOutCubic",
      },
      {
        progress: 1.0,
        camera: { position: [0, 8, 0.1], target: [0, 0, 0], fov: 40 },
        easing: "easeOutCubic",
      },
    ],
  },

  "narrative-chapters": {
    id: "narrative-chapters",
    name: "Narrative Chapters Staging",
    sections: [
      { id: "prologue", start: 0, end: 0.33, name: "Chapter 1: Genesis" },
      { id: "development", start: 0.33, end: 0.66, name: "Chapter 2: Evolution" },
      { id: "climax", start: 0.66, end: 1.0, name: "Chapter 3: Frontier" },
    ],
    keyframes: [
      {
        progress: 0,
        camera: { position: [-4, 1, 4], target: [-2, 0, 0], fov: 50 },
        objects: {
          chapter1Hero: { position: [-2, 0, 0], opacity: 1, visible: true },
          chapter2Hero: { position: [0, 0, 0], opacity: 0, visible: false },
          chapter3Hero: { position: [2, 0, 0], opacity: 0, visible: false },
        },
      },
      {
        progress: 0.5,
        camera: { position: [0, 2, 4], target: [0, 0, 0], fov: 45 },
        objects: {
          chapter1Hero: { position: [-2, 0, 0], opacity: 0, visible: false },
          chapter2Hero: { position: [0, 0, 0], opacity: 1, visible: true },
          chapter3Hero: { position: [2, 0, 0], opacity: 0, visible: false },
        },
        easing: "easeInOutCubic",
      },
      {
        progress: 1.0,
        camera: { position: [4, 1, 4], target: [2, 0, 0], fov: 40 },
        objects: {
          chapter1Hero: { position: [-2, 0, 0], opacity: 0, visible: false },
          chapter2Hero: { position: [0, 0, 0], opacity: 0, visible: false },
          chapter3Hero: { position: [2, 0, 0], opacity: 1, visible: true },
        },
        easing: "easeInOutCubic",
      },
    ],
  },
};

export function getScrollTimelinePreset(name: string): ScrollSceneTimeline {
  return SCROLL_TIMELINE_PRESETS[name] ?? SCROLL_TIMELINE_PRESETS["product-exploded-view"];
}
