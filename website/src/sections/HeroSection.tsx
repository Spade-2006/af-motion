import React, { Suspense, useEffect, useRef, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { CodeLabel } from "@/components/ui/CodeLabel";
import { MotionReveal } from "@/components/motion/MotionReveal";
import { MagneticElement } from "@/components/motion/MagneticElement";
import { GradientSurface } from "@/components/effects/GradientSurface";
import { GlowEffect } from "@/components/effects/GlowEffect";
import { GridBackground } from "@/components/effects/GridBackground";
import { useWebsiteMotion } from "@/app/providers/MotionProvider";
import { useAdaptiveQuality } from "@/hooks/useAdaptiveQuality";
import { useScrollProgress } from "af-motion/react";
import { SITE_CONFIG } from "@/config/site";
import { ArrowRight, Play, ChevronDown, Cpu } from "lucide-react";
import { GitHubIcon } from "@/components/ui/GitHubIcon";

const LazyHero3DStage = React.lazy(
  () => import("@/components/three/Hero3DStage")
);

export const HeroSection: React.FC = () => {
  const heroRef = useRef<HTMLElement>(null);
  const { prefersReducedMotion } = useWebsiteMotion();
  const { qualityTier, dpr, isMobile } = useAdaptiveQuality();
  const { progress: docProgress } = useScrollProgress();

  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [is3DHovered, setIs3DHovered] = useState(false);
  const [heroScrollRatio, setHeroScrollRatio] = useState(0);

  // Derive normalized scroll progress across the hero section (0 -> 1)
  useEffect(() => {
    const updateHeroScroll = () => {
      const height = heroRef.current?.offsetHeight || 820;
      const ratio = Math.min(Math.max(window.scrollY / (height * 0.85), 0), 1);
      setHeroScrollRatio(ratio);
    };

    updateHeroScroll();
    window.addEventListener("scroll", updateHeroScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateHeroScroll);
  }, [docProgress]);

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (prefersReducedMotion || isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    setPointer({ x: nx, y: ny });
  };

  const handlePointerLeave = () => {
    setPointer({ x: 0, y: 0 });
  };

  const scrollToGetStarted = () => {
    const el = document.getElementById("get-started");
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToIntro = () => {
    const el = document.getElementById("introduction");
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ behavior: "smooth" });
  };

  // Smooth scroll-driven transform (disabled when reduced-motion is preferred)
  const heroContentStyle = prefersReducedMotion
    ? undefined
    : {
        transform: `translate3d(0, ${heroScrollRatio * 24}px, 0)`,
        opacity: Math.max(1 - heroScrollRatio * 0.65, 0.35),
      };

  return (
    <section
      ref={heroRef}
      id="overview"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full min-h-[min(92vh,880px)] flex flex-col justify-center pt-28 pb-16 sm:pt-32 sm:pb-20 overflow-hidden"
    >
      {/* Layered Cinematic Hero Atmosphere */}
      <GridBackground variant="grid" fadeEdges />
      <GradientSurface variant="indigo" position="top" className="opacity-70" />
      <GradientSurface
        variant="cyan"
        position="center"
        className="translate-x-1/4 opacity-40 hidden lg:block"
      />

      <PageContainer maxWidth="xl" className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* ===============================================================
              Left Column: Editorial Typography, Positioning & Primary CTAs
              =============================================================== */}
          <div
            style={heroContentStyle}
            className="lg:col-span-7 min-w-0 flex flex-col items-start text-left will-change-transform"
          >
            {/* Status Indicator */}
            <MotionReveal trigger="mount" direction="down" duration={400}>
              <div className="inline-flex max-w-full items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] backdrop-blur-md mb-6 sm:mb-7 shadow-[0_0_24px_rgba(99,102,241,0.16)]">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
                </span>
                <span className="font-mono text-[10px] sm:text-[11px] font-medium tracking-wider sm:tracking-widest text-slate-300 uppercase truncate">
                  AF Motion v{SITE_CONFIG.version} · Pure ESM Motion Ecosystem
                </span>
              </div>
            </MotionReveal>

            {/* Large Editorial Display Headline */}
            <MotionReveal trigger="mount" direction="up" duration={500} delay={40}>
              <h1 className="text-[2.1rem] sm:text-5xl xl:text-[4.4rem] font-extrabold tracking-[-0.03em] text-white leading-[1.08] mb-5 sm:mb-6 break-words">
                Motion is not an effect.
                <br />
                It&apos;s{" "}
                <span className="text-gradient-electric">an experience.</span>
              </h1>
            </MotionReveal>

            {/* Product Positioning Copy */}
            <MotionReveal trigger="mount" direction="up" duration={500} delay={90}>
              <p className="text-sm sm:text-lg xl:text-xl text-slate-400 max-w-2xl leading-relaxed font-normal mb-8 sm:mb-9">
                A framework-independent JavaScript animation engine combining
                deterministic choreography, spring physics, React bindings, 3D WebGL
                scenes, and AI Motion Intelligence—engineered for GPU-only performance.
              </p>
            </MotionReveal>

            {/* Primary & Secondary CTA Hierarchy */}
            <MotionReveal trigger="mount" direction="up" duration={500} delay={130}>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8 w-full">
                <MagneticElement strength={0.22}>
                  <Button
                    variant="primary"
                    size="lg"
                    iconTrailing={<ArrowRight className="w-4 h-4" />}
                    onClick={scrollToGetStarted}
                  >
                    Get Started
                  </Button>
                </MagneticElement>

                <Button
                  variant="secondary"
                  size="lg"
                  iconLeading={<Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />}
                  onClick={() => {
                    window.location.hash = "#playground";
                  }}
                >
                  Explore Playground
                </Button>

                <a
                  href={SITE_CONFIG.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="AF Motion GitHub Repository"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.16] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  <GitHubIcon className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              </div>
            </MotionReveal>

            {/* Install Command + Verified Technical Metadata */}
            <MotionReveal trigger="mount" direction="up" duration={500} delay={170}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-6 border-t border-white/[0.07] w-full">
                <CodeLabel code="npm install af-motion" prefix="$" />

                <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1.5 font-mono text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    Zero Core Deps
                  </span>
                  <span className="text-slate-600">·</span>
                  <span>{SITE_CONFIG.stats.coreEasings} Core Easings + Springs</span>
                  <span className="text-slate-600">·</span>
                  <span>{SITE_CONFIG.stats.visualStyles} Styles</span>
                </div>
              </div>
            </MotionReveal>
          </div>

          {/* ===============================================================
              Right Column: Signature 3D Hero Object ("Kinetic Chrono-Core")
              =============================================================== */}
          <div
            onMouseEnter={() => setIs3DHovered(true)}
            onMouseLeave={() => setIs3DHovered(false)}
            className="lg:col-span-5 min-w-0 relative flex items-center justify-center w-full"
          >
            {/* Atmospheric Halo behind 3D Sculpture */}
            <GlowEffect
              color="indigo"
              size="lg"
              className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-55"
            />
            <GlowEffect
              color="cyan"
              size="md"
              className="top-1/3 left-2/3 -translate-x-1/2 -translate-y-1/2 opacity-40"
            />

            <div className="relative w-full h-[320px] sm:h-[400px] lg:h-[520px] flex items-center justify-center">
              <Suspense
                fallback={
                  <div
                    aria-label="Initializing 3D Chrono-Core environment"
                    className="w-full h-full flex items-center justify-center"
                  >
                    <div className="w-24 h-24 rounded-full border border-indigo-500/20 border-t-cyan-400/70 animate-spin" />
                  </div>
                }
              >
                <LazyHero3DStage
                  pointer={pointer}
                  scrollProgress={heroScrollRatio}
                  isHovered={is3DHovered}
                  qualityTier={qualityTier}
                  dpr={dpr}
                  isMobile={isMobile}
                  prefersReducedMotion={prefersReducedMotion}
                />
              </Suspense>

              {/* Subtle Interactive HUD Caption */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0a0d14]/80 border border-white/[0.08] backdrop-blur-md whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span className="font-mono text-[10px] tracking-wider uppercase text-slate-400">
                  {prefersReducedMotion
                    ? "Static Reduced-Motion Pose"
                    : is3DHovered
                    ? "Chrono-Core · Spring Engaged"
                    : "Move Pointer to Tilt · Scroll to Evolve"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Bottom Scroll Discovery Cue */}
      <div className="hidden lg:flex justify-center absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={scrollToIntro}
          aria-label="Scroll to product introduction"
          className="inline-flex flex-col items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 rounded-lg px-2 py-1"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest">
            Scroll to explore
          </span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </button>
      </div>
    </section>
  );
};
