import React, { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { GridLayout } from "@/components/layout/GridLayout";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Badge } from "@/components/ui/Badge";
import { Tag } from "@/components/ui/Tag";
import { Card } from "@/components/ui/Card";
import { Tooltip } from "@/components/ui/Tooltip";
import { Divider } from "@/components/ui/Divider";
import { CodeLabel } from "@/components/ui/CodeLabel";
import { MotionReveal } from "@/components/motion/MotionReveal";
import { MotionStagger } from "@/components/motion/MotionStagger";
import { MagneticElement } from "@/components/motion/MagneticElement";
import { MotionText } from "@/components/motion/MotionText";
import { GradientSurface } from "@/components/effects/GradientSurface";
import { GlowEffect } from "@/components/effects/GlowEffect";
import { GridBackground } from "@/components/effects/GridBackground";
import { SectionDivider } from "@/components/effects/SectionDivider";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import {
  Sparkles,
  Layers,
  Cpu,
  Palette,
  Box,
  ArrowRight,
  Terminal,
  Activity,
  CheckCircle2,
  Code2,
} from "lucide-react";

export const DesignSystemPreviewSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"tokens" | "ui" | "motion" | "3d">("tokens");

  return (
    <div className="relative w-full">
      {/* Background Ambience */}
      <GridBackground variant="grid" />
      <GradientSurface variant="indigo" position="top" />

      {/* =====================================================================
          1. Hero / Overview Anchor
          ===================================================================== */}
      <SectionContainer id="overview" spacing="spacious" className="pt-32 pb-20">
        <PageContainer maxWidth="xl">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <MotionReveal direction="down" duration={500}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.25)] mb-6">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono text-xs font-medium text-indigo-300 uppercase tracking-wider">
                  Phase 20 · Standalone Architecture & Design System
                </span>
              </div>
            </MotionReveal>

            <MotionReveal direction="up" duration={650} delay={100}>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-white mb-6 leading-[1.08]">
                Kinetic <span className="text-gradient-electric">Architecture</span>
                <br />
                for Modern Web.
              </h1>
            </MotionReveal>

            <MotionReveal direction="up" duration={600} delay={200}>
              <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
                A high-performance, framework-independent motion engine with first-class React bindings,
                19 visual styles, 33 palettes, 3D WebGL scenes, and an AI-native intelligence layer.
              </p>
            </MotionReveal>

            <MotionReveal direction="up" duration={600} delay={300}>
              <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                <MagneticElement strength={0.25}>
                  <Button
                    variant="primary"
                    size="lg"
                    iconTrailing={<ArrowRight className="w-4 h-4" />}
                    onClick={() => {
                      const el = document.getElementById("tokens");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Inspect Design System
                  </Button>
                </MagneticElement>

                <CodeLabel code="npm install af-motion" prefix="$" />
              </div>
            </MotionReveal>

            {/* Architectural Stats Pills */}
            <MotionStagger staggerMs={90} baseDuration={550}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-3xl mt-4">
                {[
                  { label: "Public Named Exports", value: "1,940", icon: <Terminal className="w-4 h-4 text-cyan-400" /> },
                  { label: "Visual Design Styles", value: "19 Styles", icon: <Palette className="w-4 h-4 text-indigo-400" /> },
                  { label: "Built-in Palettes", value: "33 Palettes", icon: <Layers className="w-4 h-4 text-purple-400" /> },
                  { label: "Motion Engine DAG", value: "Zero Deps", icon: <Cpu className="w-4 h-4 text-emerald-400" /> },
                ].map((stat, i) => (
                  <Card key={i} variant="default" className="p-4 text-left">
                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                      {stat.icon}
                      <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                        {stat.label}
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {stat.value}
                    </div>
                  </Card>
                ))}
              </div>
            </MotionStagger>
          </div>
        </PageContainer>
      </SectionContainer>

      <SectionDivider showDot />

      {/* =====================================================================
          2. Design System Navigation Tabs
          ===================================================================== */}
      <SectionContainer spacing="compact">
        <PageContainer maxWidth="lg">
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1.5 rounded-xl bg-[#0e111a] border border-white/[0.08] shadow-lg">
              {[
                { id: "tokens", label: "Colour & Tokens", icon: <Palette className="w-3.5 h-3.5" /> },
                { id: "ui", label: "UI Components", icon: <Layers className="w-3.5 h-3.5" /> },
                { id: "motion", label: "Motion Primitives", icon: <Activity className="w-3.5 h-3.5" /> },
                { id: "3d", label: "3D Canvas Environment", icon: <Box className="w-3.5 h-3.5" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </PageContainer>
      </SectionContainer>

      {/* =====================================================================
          3. Colour Tokens & Typography Section
          ===================================================================== */}
      <SectionContainer id="tokens" surface="subtle" spacing="normal">
        <PageContainer maxWidth="xl">
          <SectionHeading
            tag="Foundation"
            title="Design Tokens & Colour Architecture"
            description="A cohesive, cinematic dark palette built on deep obsidian tones, charcoal surfaces, and restrained electric accents."
          />

          <div className="mb-12">
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-6 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Primary Surface & Accent Tokens
            </h3>

            <GridLayout columns={3} gap="md">
              {[
                {
                  name: "Obsidian Deep",
                  hex: "#07080a",
                  variable: "--bg-primary",
                  role: "Root canvas background",
                  textColor: "text-white",
                  bgClass: "bg-[#07080a] border border-white/[0.12]",
                },
                {
                  name: "Charcoal Card",
                  hex: "#131620",
                  variable: "--surface-card",
                  role: "Component & container surface",
                  textColor: "text-white",
                  bgClass: "bg-[#131620] border border-white/[0.15]",
                },
                {
                  name: "Elevated Surface",
                  hex: "#1d2232",
                  variable: "--surface-elevated",
                  role: "Modals, popovers & floating bars",
                  textColor: "text-white",
                  bgClass: "bg-[#1d2232] border border-white/[0.18]",
                },
                {
                  name: "Electric Cyan",
                  hex: "#38bdf8",
                  variable: "--accent-cyan",
                  role: "Primary technical accent & glow",
                  textColor: "text-slate-900 font-bold",
                  bgClass: "bg-[#38bdf8] shadow-[0_0_24px_rgba(56,189,248,0.35)]",
                },
                {
                  name: "Neon Indigo",
                  hex: "#6366f1",
                  variable: "--accent-indigo",
                  role: "Interactive brand primary button",
                  textColor: "text-white font-bold",
                  bgClass: "bg-[#6366f1] shadow-[0_0_24px_rgba(99,102,241,0.35)]",
                },
                {
                  name: "Violet Atmosphere",
                  hex: "#a855f7",
                  variable: "--accent-violet",
                  role: "Secondary ambient gradient glow",
                  textColor: "text-white font-bold",
                  bgClass: "bg-[#a855f7] shadow-[0_0_24px_rgba(168,85,247,0.35)]",
                },
              ].map((swatch) => (
                <Card key={swatch.name} variant="elevated" className="p-5 flex flex-col justify-between">
                  <div className={`w-full h-20 rounded-xl mb-4 p-3 flex flex-col justify-between ${swatch.bgClass}`}>
                    <span className={`text-xs font-mono font-semibold ${swatch.textColor}`}>
                      {swatch.hex}
                    </span>
                    <span className={`text-[10px] font-mono tracking-wider uppercase opacity-80 ${swatch.textColor}`}>
                      {swatch.variable}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base tracking-tight mb-1">
                      {swatch.name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {swatch.role}
                    </p>
                  </div>
                </Card>
              ))}
            </GridLayout>
          </div>

          {/* Typography Scale Showcase */}
          <div className="pt-8">
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-6 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              Editorial Typography Hierarchy
            </h3>

            <Card variant="elevated" className="space-y-6 p-8">
              <div className="pb-6 border-b border-white/[0.06]">
                <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-400 block mb-1">
                  Hero Display · 72px / 800 Weight
                </span>
                <p className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  High-Performance Motion Engine
                </p>
              </div>

              <div className="pb-6 border-b border-white/[0.06]">
                <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-400 block mb-1">
                  Section Headline · 36px / 700 Weight
                </span>
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Deterministic Choreography & Physics
                </p>
              </div>

              <div className="pb-6 border-b border-white/[0.06]">
                <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-400 block mb-1">
                  Body Prose · 16px / 400 Weight
                </span>
                <p className="text-base text-slate-400 max-w-2xl leading-relaxed">
                  Engineered with an acyclic DAG execution graph that isolates layout thrashing,
                  enforcing hardware acceleration by animating exclusively matrix3d and opacity.
                </p>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-400 block mb-1">
                  Monospace Technical Label · 12px / 500 Weight
                </span>
                <p className="font-mono text-xs text-cyan-300 tracking-wider uppercase">
                  const controls = animate(element, {"{ opacity: [0, 1] }"}, {"{ duration: 400 }" });
                </p>
              </div>
            </Card>
          </div>
        </PageContainer>
      </SectionContainer>

      <SectionDivider showDot />

      {/* =====================================================================
          4. UI Component Library Showcase
          ===================================================================== */}
      <SectionContainer id="components" spacing="normal">
        <PageContainer maxWidth="xl">
          <SectionHeading
            tag="Components"
            title="Reusable Component Library"
            description="Production-ready building blocks crafted for dark futuristic interfaces, featuring microinteractions and tactile spring feedback."
          />

          <GridLayout columns={2} gap="lg">
            {/* Button Variations */}
            <Card variant="elevated">
              <h4 className="font-bold text-white text-base mb-2 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                Button System & States
              </h4>
              <p className="text-xs text-slate-400 mb-6">
                Interactive buttons powered by AF Motion tactile microinteractions with scale physics.
              </p>

              <div className="flex flex-wrap gap-3 items-center mb-6">
                <Button variant="primary" size="md">
                  Primary Action
                </Button>
                <Button variant="cyan" size="md">
                  Cyan Glow
                </Button>
                <Button variant="secondary" size="md">
                  Secondary
                </Button>
                <Button variant="outline" size="md">
                  Outline
                </Button>
                <Button variant="ghost" size="md">
                  Ghost
                </Button>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="primary" size="sm" iconLeading={<Sparkles className="w-3.5 h-3.5" />}>
                  With Icon
                </Button>
                <Button variant="primary" size="sm" isLoading>
                  Loading
                </Button>
                <IconButton icon={<Sparkles className="w-4 h-4 text-cyan-400" />} label="Icon button" />
                <Tooltip content="Tooltip explains context">
                  <Button variant="outline" size="sm">
                    Hover For Tooltip
                  </Button>
                </Tooltip>
              </div>
            </Card>

            {/* Badges, Tags & Code Labels */}
            <Card variant="elevated">
              <h4 className="font-bold text-white text-base mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Badges, Tags & Technical Labels
              </h4>
              <p className="text-xs text-slate-400 mb-6">
                Metadata indicators and one-click copyable technical code labels.
              </p>

              <div className="flex flex-wrap gap-2.5 items-center mb-6">
                <Badge variant="glow">Glow Pill</Badge>
                <Badge variant="cyan">Cyan Accent</Badge>
                <Badge variant="violet">Violet</Badge>
                <Badge variant="emerald">Emerald</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="default">Default</Badge>
              </div>

              <div className="flex flex-wrap gap-2 items-center mb-6">
                <Tag active>useAnimate()</Tag>
                <Tag>useInView()</Tag>
                <Tag>animateSpring()</Tag>
                <Tag>createTimeline()</Tag>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <CodeLabel code="npx af-motion doctor" />
                <CodeLabel code="npm run website" prefix=">" />
              </div>
            </Card>
          </GridLayout>

          {/* Interactive Cards Showcase */}
          <div className="mt-8">
            <h4 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-4 font-semibold">
              Interactive Charcoal Cards
            </h4>
            <GridLayout columns={3} gap="md">
              <Card variant="default">
                <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center mb-4">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
                <h5 className="font-bold text-white text-base mb-1">Standard Card</h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Default charcoal surface with fine border and subtle ambient shadow.
                </p>
              </Card>

              <Card variant="interactive" interactive>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-4">
                  <Activity className="w-4 h-4 text-indigo-400" />
                </div>
                <h5 className="font-bold text-white text-base mb-1">Interactive Card</h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Hover to observe smooth scale elevation and vibrant electric border glow.
                </p>
              </Card>

              <Card variant="glow">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <h5 className="font-bold text-white text-base mb-1">Atmospheric Card</h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Elevated card with permanent subtle violet glow for highlighted feature callouts.
                </p>
              </Card>
            </GridLayout>
          </div>
        </PageContainer>
      </SectionContainer>

      <SectionDivider showDot />

      {/* =====================================================================
          5. Motion Primitives Showcase
          ===================================================================== */}
      <SectionContainer id="motion" surface="subtle" spacing="normal">
        <PageContainer maxWidth="xl">
          <SectionHeading
            tag="Motion Engine"
            title="Integrated AF Motion Primitives"
            description="The website consumes the actual AF Motion library directly, honoring reduced-motion preferences and strict GPU acceleration."
          />

          <GridLayout columns={2} gap="lg">
            {/* Magnetic Pull Effect */}
            <Card variant="elevated" className="flex flex-col items-center justify-center text-center p-8">
              <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 mb-2 font-semibold">
                Magnetic Pointer Interaction
              </span>
              <h4 className="text-lg font-bold text-white mb-2">Magnetic Element</h4>
              <p className="text-xs text-slate-400 max-w-sm mb-6">
                Move your cursor around the target to experience the spring-based cursor tracking pull.
              </p>

              <MagneticElement strength={0.35}>
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-tr from-cyan-600/30 via-indigo-600/30 to-purple-600/30 border border-white/[0.15] flex flex-col items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] cursor-pointer group hover:border-cyan-400/50 transition-colors">
                  <Sparkles className="w-6 h-6 text-cyan-300 group-hover:scale-110 transition-transform" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-300 mt-2">
                    Hover Me
                  </span>
                </div>
              </MagneticElement>
            </Card>

            {/* Kinetic Text & Stagger */}
            <Card variant="elevated" className="p-8 flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-400 mb-2 font-semibold block">
                  Kinetic Text Reveal
                </span>
                <h4 className="text-lg font-bold text-white mb-4">MotionText Component</h4>
                <div className="p-4 rounded-xl bg-[#0a0c12] border border-white/[0.08] mb-4">
                  <MotionText
                    text="AF Motion unlocks cinematic web animation with zero layout thrashing."
                    as="div"
                    split="words"
                    staggerMs={60}
                    className="text-base text-white font-medium leading-relaxed"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  GPU Transform Matrix3D
                </span>
                <span className="font-mono text-[11px] text-indigo-400">
                  af-motion/react
                </span>
              </div>
            </Card>
          </GridLayout>
        </PageContainer>
      </SectionContainer>

      <SectionDivider showDot />

      {/* =====================================================================
          6. 3D Canvas Environment Foundation
          ===================================================================== */}
      <SectionContainer id="canvas-3d" spacing="normal">
        <PageContainer maxWidth="xl">
          <SectionHeading
            tag="WebGL Infrastructure"
            title="Reusable 3D Scene Environment"
            description="Foundation for cinematic 3D scenes (Prompt 152) built on Three.js, React Three Fiber, device pixel ratio limits, and graceful 2D degradation."
          />

          <div className="relative w-full max-w-4xl mx-auto">
            <GlowEffect color="indigo" size="lg" className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40" />

            {/* Interactive 3D Canvas Foundation */}
            <SceneCanvas className="h-[420px] sm:h-[520px]" />

            {/* 3D Capabilities Metadata Bar */}
            <div className="mt-4 p-4 rounded-xl bg-[#0b0e16]/80 border border-white/[0.08] backdrop-blur-md flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="font-medium text-white">Interactive Crystalline Mesh</span>
                <span className="text-slate-500">·</span>
                <span className="font-mono text-[11px]">R3F v9 + Three.js v0.187</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-[11px] text-slate-400">DPR: [1, 2]</span>
                <span className="font-mono text-[11px] text-cyan-400">Power: High-Performance</span>
                <span className="font-mono text-[11px] text-indigo-300">Prompt 152 Foundation</span>
              </div>
            </div>
          </div>
        </PageContainer>
      </SectionContainer>

      <SectionDivider showDot />

      {/* =====================================================================
          7. Documentation & Next Steps
          ===================================================================== */}
      <SectionContainer id="docs" surface="elevated" spacing="normal">
        <PageContainer maxWidth="lg">
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="cyan" size="sm" className="mb-4">
              Developer Experience
            </Badge>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Ready to Explore AF Motion?
            </h3>
            <p className="text-base text-slate-400 leading-relaxed mb-8">
              The architecture, design tokens, and components established here form the foundation
              for Prompts 152–156 (Cinematic Hero, Feature Sections, Live Demos, and Interactive Showcase).
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  window.location.href = "https://github.com/Spade-2006/af-motion";
                }}
              >
                GitHub Repository
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  window.location.hash = "#overview";
                }}
              >
                Back to Top
              </Button>
            </div>
          </div>
        </PageContainer>
      </SectionContainer>
    </div>
  );
};
