import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { MotionReveal } from "@/components/motion/MotionReveal";
import { SITE_CONFIG } from "@/config/site";
import {
  Activity,
  Sliders,
  MousePointerClick,
  Atom,
  Box,
  Cpu,
  Terminal,
} from "lucide-react";

interface CapabilityItem {
  readonly id: string;
  readonly title: string;
  readonly subpath: string;
  readonly summary: string;
  readonly metrics: string;
  readonly icon: React.ReactNode;
  readonly spanTwo?: boolean;
}

const CAPABILITIES: readonly CapabilityItem[] = [
  {
    id: "core",
    title: "Core Animation Engine",
    subpath: "af-motion",
    summary:
      "Declarative DOM animation primitives, timeline sequencing, parallel playback, and recipe execution backed by an acyclic choreography DAG.",
    metrics: "animate · createTimeline · createMotionChoreography",
    icon: <Activity className="w-5 h-5 text-cyan-400" />,
  },
  {
    id: "physics",
    title: "Easing Curves & Spring Physics",
    subpath: "af-motion",
    summary: `${SITE_CONFIG.stats.coreEasings} mathematically verified easing functions with extensible easingRegistry, damped spring solvers, and momentum inertia physics.`,
    metrics: "animateSpring · animateInertia · registerEasing",
    icon: <Sliders className="w-5 h-5 text-indigo-400" />,
  },
  {
    id: "effects",
    title: "Interactive Effects & Gestures",
    subpath: "af-motion",
    summary:
      "Tactile pointer and scroll choreography including 3D tilt, magnetic pull, cursor trails, drag, pinch, swipe, parallax, and SVG morphing.",
    metrics: "tilt · magnetic · drawSVG · morphSVG · scrollTrigger",
    icon: <MousePointerClick className="w-5 h-5 text-purple-400" />,
  },
  {
    id: "react",
    title: "React 18 & 19 Bindings",
    subpath: "af-motion/react",
    summary:
      "Optional peer bindings designed for Next.js App Router, Strict Mode cleanup safety, and intersection triggers with zero SSR window crashes.",
    metrics: "useAnimate · Reveal · Interactive · useMicrointeraction",
    icon: <Atom className="w-5 h-5 text-sky-400" />,
  },
  {
    id: "3d-gpu",
    title: "3D Scenes & GPU Shaders",
    subpath: "af-motion/catalogue",
    summary:
      "Procedural 3D geometries, PBR and transmission materials, R3F bridges, aurora & particle fields, and automatic hardware tier degradation.",
    metrics: "createScene3D · 11 Geometries · aurora · particleField",
    icon: <Box className="w-5 h-5 text-cyan-300" />,
  },
  {
    id: "intelligence",
    title: "Deterministic Motion Intelligence",
    subpath: "af-motion/catalogue",
    summary: `Offline-capable AI planning across ${SITE_CONFIG.stats.aiCapabilities} registered capabilities, ${SITE_CONFIG.stats.visualStyles} visual styles, ${SITE_CONFIG.stats.builtInPalettes} palettes, and automated validation.`,
    metrics: "aiMotionRegistry · recommendAnimation · validateMotionConfig",
    icon: <Cpu className="w-5 h-5 text-emerald-400" />,
  },
  {
    id: "tooling",
    title: "CLI & Model Context Protocol (MCP)",
    subpath: "bin/af-motion",
    summary:
      "Built-in developer CLI (init, doctor, validate, presets, info, example) paired with an isolated MCP stdio server for AI coding agents.",
    metrics: "af-motion doctor · af-motion-mcp · Pure ESM",
    icon: <Terminal className="w-5 h-5 text-indigo-300" />,
    spanTwo: true,
  },
];

export const CapabilityShowcaseSection: React.FC = () => {
  return (
    <SectionContainer id="capabilities" spacing="normal">
      <PageContainer maxWidth="xl">
        <MotionReveal direction="up" duration={550}>
          <SectionHeading
            tag="Capabilities"
            title="Seven Integrated Systems. One Unified SDK."
            description={`Four official ESM subpaths exposing ${SITE_CONFIG.stats.publicExports.toLocaleString()} typed exports—from zero-dependency keyframes to deterministic 3D scene planning.`}
            align="center"
          />
        </MotionReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 [&>*]:min-w-0">
          {CAPABILITIES.map((cap, index) => (
            <MotionReveal
              key={cap.id}
              direction="up"
              duration={360}
              delay={index * 25}
              className={cap.spanTwo ? "md:col-span-2 lg:col-span-3" : undefined}
            >
              <Card
                variant="interactive"
                interactive
                className="h-full flex flex-col justify-between p-6 sm:p-7"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[#161a27] border border-white/[0.08] flex items-center justify-center">
                      {cap.icon}
                    </div>
                    <Tag>{cap.subpath}</Tag>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mb-2.5">
                    {cap.title}
                  </h3>

                  <p className="text-sm text-slate-400 leading-relaxed mb-5">
                    {cap.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.06] font-mono text-[11px] text-slate-500 truncate">
                  {cap.metrics}
                </div>
              </Card>
            </MotionReveal>
          ))}
        </div>
      </PageContainer>
    </SectionContainer>
  );
};
