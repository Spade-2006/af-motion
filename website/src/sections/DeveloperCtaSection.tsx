import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CodeLabel } from "@/components/ui/CodeLabel";
import { MotionReveal } from "@/components/motion/MotionReveal";
import { MagneticElement } from "@/components/motion/MagneticElement";
import { GradientSurface } from "@/components/effects/GradientSurface";
import { SITE_CONFIG } from "@/config/site";
import { BookOpen, Play, Code2 } from "lucide-react";
import { GitHubIcon } from "@/components/ui/GitHubIcon";

export const DeveloperCtaSection: React.FC = () => {
  return (
    <SectionContainer id="developer-cta" surface="elevated" spacing="spacious">
      <GradientSurface variant="cyan" position="bottom" className="opacity-35" />

      <PageContainer maxWidth="lg">
        <MotionReveal direction="up" duration={600}>
          <Card variant="glow" className="p-8 sm:p-14 text-center relative overflow-hidden">
            <Badge variant="cyan" size="sm" className="mb-5">
              Developer Ecosystem
            </Badge>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-5 leading-tight">
              Start Building with{" "}
              <span className="text-gradient-electric">AF Motion</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
              Explore the documentation, test interactive presets in the playground,
              or inspect verified production examples engineered for React and TypeScript.
            </p>

            <div className="flex justify-center mb-9">
              <CodeLabel code="npm install af-motion" prefix="$" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
              <MagneticElement strength={0.2}>
                <Button
                  variant="primary"
                  size="lg"
                  iconLeading={<BookOpen className="w-4 h-4" />}
                  onClick={() => {
                    window.location.hash = "#docs";
                  }}
                >
                  Read Documentation
                </Button>
              </MagneticElement>

              <Button
                variant="secondary"
                size="lg"
                iconLeading={<Play className="w-4 h-4 text-cyan-400" />}
                onClick={() => {
                  window.location.hash = "#playground";
                }}
              >
                Open Playground
              </Button>

              <Button
                variant="outline"
                size="lg"
                iconLeading={<Code2 className="w-4 h-4" />}
                onClick={() => {
                  window.location.hash = "#examples";
                }}
              >
                Browse Examples
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  window.location.hash = "#onboarding";
                }}
              >
                Onboarding Guide
              </Button>

              <a
                href={SITE_CONFIG.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.12] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
              >
                <GitHubIcon className="w-4 h-4" />
                <span>GitHub</span>
              </a>
            </div>
          </Card>
        </MotionReveal>
      </PageContainer>
    </SectionContainer>
  );
};
