import React from "react";
import type { DocInteractiveType } from "../../types/index.js";
import { CoreAnimationPlayground } from "./CoreAnimationPlayground.js";
import { EasingExplorer } from "./EasingExplorer.js";
import { SpringPhysicsPlayground } from "./SpringPhysicsPlayground.js";
import { EffectsPlayground } from "./EffectsPlayground.js";
import { MotionDNAPlayground } from "./MotionDNAPlayground.js";
import { PaletteExplorer } from "./PaletteExplorer.js";
import { AIDemonstrationPlayground } from "./AIDemonstrationPlayground.js";
import { ReactPlayground } from "./ReactPlayground.js";

interface DocsInteractiveHubProps {
  type: DocInteractiveType;
}

export const DocsInteractiveHub: React.FC<DocsInteractiveHubProps> = ({ type }) => {
  switch (type) {
    case "core-animation":
      return <CoreAnimationPlayground />;
    case "easing-explorer":
      return <EasingExplorer />;
    case "spring-physics":
      return <SpringPhysicsPlayground />;
    case "effects-interactions":
      return <EffectsPlayground />;
    case "motion-dna":
      return <MotionDNAPlayground />;
    case "palette-explorer":
      return <PaletteExplorer />;
    case "ai-demonstration":
      return <AIDemonstrationPlayground />;
    case "react-demo":
      return <ReactPlayground />;
    case "verified-recipes":
      return <CoreAnimationPlayground />;
    default:
      return null;
  }
};
