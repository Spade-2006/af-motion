import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { GridLayout } from "@/components/layout/GridLayout";
import { Card } from "@/components/ui/Card";
import { MotionReveal } from "@/components/motion/MotionReveal";
import { Tag } from "@/components/ui/Tag";
import { Layers, Zap, ShieldCheck } from "lucide-react";

const PILLARS = [
  {
    icon: <Layers className="w-5 h-5 text-cyan-400" />,
    tag: "af-motion",
    title: "Framework-Independent Core",
    description:
      "Built on a zero-dependency Directed Acyclic Graph (DAG) execution core. Run identical motion primitives across Vanilla TypeScript, React, WebGL canvases, or headless Node verification suites.",
  },
  {
    icon: <Zap className="w-5 h-5 text-indigo-400" />,
    tag: "GPU-First",
    title: "Zero Layout Thrashing",
    description:
      "AF Motion isolates composited properties—transform (matrix3d) and opacity—while its Motion Validation engine flags reflow triggers like width, top, or margin before shipping.",
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    tag: "Accessible",
    title: "Deterministic & Reduced-Motion Native",
    description:
      "Every spring, progress loop, and scroll trigger honors OS prefers-reduced-motion out of the box and pairs with deterministic local intelligence—zero hidden external network calls.",
  },
] as const;

export const ProductIntroSection: React.FC = () => {
  return (
    <SectionContainer id="introduction" surface="subtle" spacing="normal">
      <PageContainer maxWidth="xl">
        <MotionReveal direction="up" duration={550}>
          <SectionHeading
            tag="Product Introduction"
            title="Engineered for Creative Precision"
            description="Most animation wrappers trade predictability for magic. AF Motion treats UI motion, spring physics, and 3D choreography as one coherent, type-safe engineering system."
            align="center"
          />
        </MotionReveal>

        <GridLayout columns={3} gap="lg">
          {PILLARS.map((pillar, idx) => (
            <MotionReveal
              key={pillar.title}
              direction="up"
              duration={550}
              delay={idx * 40}
            >
              <Card variant="elevated" className="h-full flex flex-col justify-between p-7">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                      {pillar.icon}
                    </div>
                    <Tag>{pillar.tag}</Tag>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight mb-3">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </Card>
            </MotionReveal>
          ))}
        </GridLayout>
      </PageContainer>
    </SectionContainer>
  );
};
