import React from "react";
import { HeroSection } from "@/sections/HeroSection";
import { ProductIntroSection } from "@/sections/ProductIntroSection";
import { CapabilityShowcaseSection } from "@/sections/CapabilityShowcaseSection";
import { MotionPhilosophySection } from "@/sections/MotionPhilosophySection";
import { CodeIntroductionSection } from "@/sections/CodeIntroductionSection";
import { DeveloperCtaSection } from "@/sections/DeveloperCtaSection";
import { SectionDivider } from "@/components/effects/SectionDivider";

export const HomePage: React.FC = () => {
  return (
    <main className="w-full flex flex-col">
      <HeroSection />
      <SectionDivider showDot />
      <ProductIntroSection />
      <SectionDivider showDot />
      <CapabilityShowcaseSection />
      <SectionDivider showDot />
      <MotionPhilosophySection />
      <SectionDivider showDot />
      <CodeIntroductionSection />
      <SectionDivider showDot />
      <DeveloperCtaSection />
    </main>
  );
};
