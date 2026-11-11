import React, { useCallback, useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientSurface } from "@/components/effects/GradientSurface";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SITE_CONFIG } from "@/config/site";
import { InstallSelector } from "@/onboarding/components/InstallSelector";
import { FirstAnimationStep } from "@/onboarding/components/FirstAnimationStep";
import { ReactIntegrationStep } from "@/onboarding/components/ReactIntegrationStep";
import { OnboardingChecklist } from "@/onboarding/components/OnboardingChecklist";
import {
  ONBOARDING_ADVANCED_CAPABILITIES,
  ONBOARDING_EFFECTS,
} from "@/onboarding/data/onboardingData";
import {
  ArrowRight,
  BookOpen,
  Code2,
  ExternalLink,
  Layers,
  Play,
  Sparkles,
} from "lucide-react";

const STORAGE_KEY = "af-motion-onboarding-checklist-v1";

function loadCompletedMilestones(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

export const OnboardingPage: React.FC = () => {
  const [completedIds, setCompletedIds] = useState<string[]>(() =>
    loadCompletedMilestones()
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completedIds));
    } catch {
      // Storage unavailable
    }
  }, [completedIds]);

  const markCompleted = useCallback((id: string) => {
    setCompletedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const toggleMilestone = useCallback((id: string) => {
    setCompletedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const resetProgress = useCallback(() => {
    setCompletedIds([]);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Storage unavailable
      }
    }
  }, []);

  return (
    <main className="relative w-full min-h-screen overflow-hidden">
      <GridBackground variant="grid" fadeEdges />
      <GradientSurface variant="cyan" position="top" className="opacity-35" />

      <div className="pt-28 pb-20 sm:pt-32">
        <PageContainer maxWidth="2xl">
          {/* Onboarding Hero */}
          <div className="max-w-3xl mb-12">
            <Badge variant="glow" size="sm" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1.5 inline" />
              Developer Onboarding Guide
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.1] mb-4">
              Get Started with AF Motion in Minutes
            </h1>
            <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
              Follow six practical steps from package installation to your first GPU
              animation, React 18/19 Strict Mode bindings, interactive effects, and
              deterministic AI workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main 6-Step Journey */}
            <div className="lg:col-span-8 space-y-8">
              <section id="onboarding-step-1" className="scroll-mt-24">
                <InstallSelector onInstallCopy={() => markCompleted("installed")} />
              </section>

              <section id="onboarding-step-2" className="scroll-mt-24">
                <FirstAnimationStep
                  onRunFirstAnimation={() => markCompleted("first-animation")}
                />
              </section>

              <section id="onboarding-step-3" className="scroll-mt-24">
                <ReactIntegrationStep
                  onExploreReact={() => markCompleted("react-integration")}
                />
              </section>

              {/* Step 4: Explore Effects */}
              <section id="onboarding-step-4" className="scroll-mt-24">
                <Card variant="elevated" className="p-6 sm:p-8 space-y-5">
                  <div>
                    <Badge variant="violet" size="sm" className="mb-2">
                      Step 4 · Explore Effects
                    </Badge>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Interactive Effects &amp; Pointer Choreography
                    </h2>
                    <p className="text-sm text-slate-400 mt-1.5">
                      Layer high-level spatial, pointer, and scroll behaviors onto elements
                      without boilerplate event cleanup.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {ONBOARDING_EFFECTS.map((effect) => (
                      <a
                        key={effect.id}
                        href={`#playground/${effect.playgroundDemoId}`}
                        onClick={() => markCompleted("tried-effect")}
                        className="group p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-cyan-400/40 transition-all flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="font-mono text-xs text-cyan-300 mb-1">
                            {effect.apiName}
                          </div>
                          <div className="text-sm font-bold text-white mb-1">
                            {effect.title}
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {effect.description}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-indigo-300 group-hover:text-cyan-300">
                          Try in Playground <ArrowRight className="w-3 h-3" />
                        </span>
                      </a>
                    ))}
                  </div>
                </Card>
              </section>

              {/* Step 5: Explore Advanced Capabilities */}
              <section id="onboarding-step-5" className="scroll-mt-24">
                <Card variant="elevated" className="p-6 sm:p-8 space-y-5">
                  <div>
                    <Badge variant="glow" size="sm" className="mb-2">
                      Step 5 · Advanced Capabilities
                    </Badge>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Scale Up to Physics, Timelines, DNA &amp; AI
                    </h2>
                    <p className="text-sm text-slate-400 mt-1.5">
                      Know when to reach for each specialized AF Motion subsystem.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ONBOARDING_ADVANCED_CAPABILITIES.map((adv) => (
                      <div
                        key={adv.id}
                        className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-sm font-bold text-white">
                              {adv.title}
                            </span>
                            <code className="font-mono text-[10px] text-slate-400">
                              {adv.subpath}
                            </code>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {adv.whenToUse}
                          </p>
                        </div>

                        <a
                          href={`#playground/${adv.playgroundDemoId}`}
                          onClick={() =>
                            adv.id === "springs"
                              ? markCompleted("explored-easing")
                              : undefined
                          }
                          className="inline-flex items-center gap-1 font-mono text-xs text-cyan-400 hover:underline"
                        >
                          Open Lab <Play className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </Card>
              </section>

              {/* Step 6: Continue Learning */}
              <section id="onboarding-step-6" className="scroll-mt-24">
                <Card variant="glow" className="p-6 sm:p-8 space-y-5">
                  <div>
                    <Badge variant="emerald" size="sm" className="mb-2">
                      Step 6 · Continue Learning
                    </Badge>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Explore Verified Ecosystem Destinations
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Button
                      variant="primary"
                      size="md"
                      iconLeading={<Play className="w-4 h-4" />}
                      onClick={() => {
                        window.location.hash = "#playground";
                      }}
                    >
                      Interactive Playground
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      iconLeading={<BookOpen className="w-4 h-4 text-cyan-400" />}
                      onClick={() => {
                        window.location.hash = "#docs";
                      }}
                    >
                      Documentation &amp; API
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      iconLeading={<Code2 className="w-4 h-4" />}
                      onClick={() => {
                        window.location.hash = "#examples";
                      }}
                    >
                      Examples Gallery
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      iconLeading={<Layers className="w-4 h-4" />}
                      onClick={() => {
                        window.location.hash = "#features";
                      }}
                    >
                      Feature Reference
                    </Button>
                    <a
                      href={SITE_CONFIG.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.12] text-sm font-medium text-slate-200 hover:text-white transition-colors"
                    >
                      <span>GitHub Repository</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                    <a
                      href={SITE_CONFIG.links.npm}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.12] text-sm font-medium text-slate-200 hover:text-white transition-colors"
                    >
                      <span>npm Package</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  </div>
                </Card>
              </section>
            </div>

            {/* Right Sidebar: Optional Local Checklist */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24">
              <OnboardingChecklist
                completedIds={completedIds}
                onToggle={toggleMilestone}
                onReset={resetProgress}
              />
            </aside>
          </div>
        </PageContainer>
      </div>
    </main>
  );
};
