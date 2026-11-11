import React from "react";
import { SceneCanvas } from "./SceneCanvas";
import {
  SignatureHeroSculpture,
  type QualityTier,
} from "./SignatureHeroSculpture";
import { FallbackScene } from "./FallbackScene";

export interface Hero3DStageProps {
  readonly pointer: { readonly x: number; readonly y: number };
  readonly scrollProgress: number;
  readonly isHovered: boolean;
  readonly qualityTier: QualityTier;
  readonly dpr: [number, number];
  readonly isMobile: boolean;
  readonly prefersReducedMotion: boolean;
}

export const Hero3DStage: React.FC<Hero3DStageProps> = ({
  pointer,
  scrollProgress,
  isHovered,
  qualityTier,
  dpr,
  isMobile,
  prefersReducedMotion,
}) => {
  return (
    <SceneCanvas
      framed={false}
      dpr={dpr}
      cameraPosition={isMobile ? [0, 0, 6.9] : [0, 0, 6.2]}
      fov={44}
      frameloop={prefersReducedMotion ? "demand" : "always"}
      className="w-full h-full"
      fallback={<FallbackScene className="w-full h-full bg-[#090c14]/70" />}
      ariaLabel="Interactive 3D Kinetic Chrono-Core sculpture powered by AF Motion and Three.js"
    >
      <SignatureHeroSculpture
        pointer={pointer}
        scrollProgress={scrollProgress}
        isHovered={isHovered}
        qualityTier={qualityTier}
        prefersReducedMotion={prefersReducedMotion}
      />
    </SceneCanvas>
  );
};

export default Hero3DStage;
