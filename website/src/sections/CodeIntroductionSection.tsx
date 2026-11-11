import React, { useRef, useState } from "react";
import { animate, easings } from "af-motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MotionReveal } from "@/components/motion/MotionReveal";
import { useWebsiteMotion } from "@/app/providers/MotionProvider";
import { Check, Copy, Play, Sparkles } from "lucide-react";

type CodeTabId = "core" | "react" | "intelligence";

interface CodeExampleSpec {
  readonly id: CodeTabId;
  readonly label: string;
  readonly subpath: string;
  readonly code: string;
  readonly tokens: ReadonlyArray<{
    readonly line: ReadonlyArray<{ readonly text: string; readonly cls?: string }>;
  }>;
}

const CODE_EXAMPLES: readonly CodeExampleSpec[] = [
  {
    id: "core",
    label: "Core Primitive",
    subpath: "af-motion",
    code: `import { animate, easings } from "af-motion";

const controls = animate(
  cardElement,
  {
    opacity: [0, 1],
    transform: ["translate3d(0, 24px, 0)", "translate3d(0, 0, 0)"],
  },
  {
    duration: 550,
    easing: easings.easeOutExpo,
  }
);`,
    tokens: [
      {
        line: [
          { text: "import", cls: "text-purple-400" },
          { text: " { animate, easings } ", cls: "text-slate-200" },
          { text: "from", cls: "text-purple-400" },
          { text: ' "af-motion"', cls: "text-emerald-400" },
          { text: ";", cls: "text-slate-400" },
        ],
      },
      { line: [{ text: "", cls: "" }] },
      {
        line: [
          { text: "const", cls: "text-purple-400" },
          { text: " controls = ", cls: "text-slate-200" },
          { text: "animate", cls: "text-cyan-400" },
          { text: "(", cls: "text-slate-400" },
        ],
      },
      { line: [{ text: "  cardElement,", cls: "text-slate-200" }] },
      { line: [{ text: "  {", cls: "text-slate-400" }] },
      {
        line: [
          { text: "    opacity: ", cls: "text-indigo-300" },
          { text: "[0, 1],", cls: "text-amber-300" },
        ],
      },
      {
        line: [
          { text: "    transform: ", cls: "text-indigo-300" },
          { text: '["translate3d(0, 24px, 0)", "translate3d(0, 0, 0)"]', cls: "text-emerald-400" },
          { text: ",", cls: "text-slate-400" },
        ],
      },
      { line: [{ text: "  },", cls: "text-slate-400" }] },
      { line: [{ text: "  {", cls: "text-slate-400" }] },
      {
        line: [
          { text: "    duration: ", cls: "text-indigo-300" },
          { text: "550,", cls: "text-amber-300" },
        ],
      },
      {
        line: [
          { text: "    easing: ", cls: "text-indigo-300" },
          { text: "easings.easeOutExpo,", cls: "text-cyan-300" },
        ],
      },
      { line: [{ text: "  }", cls: "text-slate-400" }] },
      { line: [{ text: ");", cls: "text-slate-400" }] },
    ],
  },
  {
    id: "react",
    label: "React Bindings",
    subpath: "af-motion/react",
    code: `"use client";
import { Reveal, Interactive } from "af-motion/react";

export function MotionCard() {
  return (
    <Reveal direction="up" duration={600}>
      <Interactive category="card" className="panel">
        <h3>Kinetic Surface</h3>
      </Interactive>
    </Reveal>
  );
}`,
    tokens: [
      { line: [{ text: '"use client";', cls: "text-amber-300" }] },
      {
        line: [
          { text: "import", cls: "text-purple-400" },
          { text: " { Reveal, Interactive } ", cls: "text-slate-200" },
          { text: "from", cls: "text-purple-400" },
          { text: ' "af-motion/react"', cls: "text-emerald-400" },
          { text: ";", cls: "text-slate-400" },
        ],
      },
      { line: [{ text: "", cls: "" }] },
      {
        line: [
          { text: "export function ", cls: "text-purple-400" },
          { text: "MotionCard", cls: "text-cyan-400" },
          { text: "() {", cls: "text-slate-400" },
        ],
      },
      {
        line: [
          { text: "  return (", cls: "text-purple-400" },
        ],
      },
      {
        line: [
          { text: "    <Reveal ", cls: "text-indigo-300" },
          { text: 'direction="up" duration={600}', cls: "text-emerald-400" },
          { text: ">", cls: "text-indigo-300" },
        ],
      },
      {
        line: [
          { text: "      <Interactive ", cls: "text-cyan-300" },
          { text: 'category="card"', cls: "text-emerald-400" },
          { text: ">", cls: "text-cyan-300" },
        ],
      },
      { line: [{ text: "        <h3>Kinetic Surface</h3>", cls: "text-slate-200" }] },
      { line: [{ text: "      </Interactive>", cls: "text-cyan-300" }] },
      { line: [{ text: "    </Reveal>", cls: "text-indigo-300" }] },
      { line: [{ text: "  );", cls: "text-slate-400" }] },
      { line: [{ text: "}", cls: "text-slate-400" }] },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence & Audit",
    subpath: "af-motion/catalogue",
    code: `import { recommendAnimation, validateMotionConfig } from "af-motion/catalogue";

const plan = recommendAnimation({
  intent: "entrance",
  visualStyle: "cyberpunk",
  motionDNA: "energetic",
});

const audit = validateMotionConfig(plan.recommendedConfig);`,
    tokens: [
      {
        line: [
          { text: "import", cls: "text-purple-400" },
          { text: " { recommendAnimation, validateMotionConfig } ", cls: "text-slate-200" },
          { text: "from", cls: "text-purple-400" },
          { text: ' "af-motion/catalogue"', cls: "text-emerald-400" },
          { text: ";", cls: "text-slate-400" },
        ],
      },
      { line: [{ text: "", cls: "" }] },
      {
        line: [
          { text: "const", cls: "text-purple-400" },
          { text: " plan = ", cls: "text-slate-200" },
          { text: "recommendAnimation", cls: "text-cyan-400" },
          { text: "({", cls: "text-slate-400" },
        ],
      },
      { line: [{ text: '  intent: "entrance",', cls: "text-emerald-400" }] },
      { line: [{ text: '  visualStyle: "cyberpunk",', cls: "text-emerald-400" }] },
      { line: [{ text: '  motionDNA: "energetic",', cls: "text-emerald-400" }] },
      { line: [{ text: "});", cls: "text-slate-400" }] },
      { line: [{ text: "", cls: "" }] },
      {
        line: [
          { text: "const", cls: "text-purple-400" },
          { text: " audit = ", cls: "text-slate-200" },
          { text: "validateMotionConfig", cls: "text-cyan-400" },
          { text: "(plan.recommendedConfig);", cls: "text-slate-300" },
        ],
      },
    ],
  },
];

export const CodeIntroductionSection: React.FC = () => {
  const { prefersReducedMotion } = useWebsiteMotion();
  const [activeTab, setActiveTab] = useState<CodeTabId>("core");
  const [copied, setCopied] = useState(false);
  const [runCount, setRunCount] = useState(0);
  const demoCardRef = useRef<HTMLDivElement>(null);

  const currentExample =
    CODE_EXAMPLES.find((ex) => ex.id === activeTab) || CODE_EXAMPLES[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentExample.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored cleanly
    }
  };

  const handleRunDemo = () => {
    setRunCount((c) => c + 1);
    const el = demoCardRef.current;
    if (!el || prefersReducedMotion) return;

    animate(
      el,
      {
        opacity: [0.15, 1],
        transform: ["translate3d(0, 22px, 0) scale(0.95)", "translate3d(0, 0, 0) scale(1)"],
      },
      {
        duration: 550,
        easing: easings.easeOutExpo,
      }
    );
  };

  return (
    <SectionContainer id="get-started" spacing="normal">
      <PageContainer maxWidth="xl">
        <MotionReveal direction="up" duration={550}>
          <SectionHeading
            tag="Quick Integration"
            title="Write Clean, Typed Motion"
            description="Official subpath entry points keep bundles lean and types explicit. Explore real examples that compile cleanly in TypeScript."
            align="center"
          />
        </MotionReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Code Window */}
          <div className="lg:col-span-7 min-w-0">
            <Card variant="elevated" className="h-full p-0 flex flex-col overflow-hidden bg-[#0a0c12]">
              {/* Window Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-white/[0.08] bg-[#0e111a]">
                <div className="flex items-center gap-1.5">
                  {CODE_EXAMPLES.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => setActiveTab(ex.id)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
                        activeTab === ex.id
                          ? "bg-indigo-600/20 text-cyan-300 border border-indigo-500/40"
                          : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="Copy example code"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] font-mono text-xs text-slate-300 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tokenized Syntax Highlighted Content */}
              <div className="p-5 sm:p-6 overflow-x-auto flex-1 font-mono text-xs sm:text-[13px] leading-6">
                <pre className="m-0">
                  <code>
                    {currentExample.tokens.map((lineObj, lineIdx) => (
                      <div key={lineIdx} className="min-h-[1.5rem] flex">
                        <span className="w-7 shrink-0 select-none text-slate-600 text-right pr-3">
                          {lineIdx + 1}
                        </span>
                        <span>
                          {lineObj.line.map((tok, tokIdx) => (
                            <span key={tokIdx} className={tok.cls}>
                              {tok.text}
                            </span>
                          ))}
                        </span>
                      </div>
                    ))}
                  </code>
                </pre>
              </div>

              {/* Footer Subpath Tag */}
              <div className="px-4 py-2.5 border-t border-white/[0.06] bg-[#0d1018] flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Subpath: {currentExample.subpath}</span>
                <span>TypeScript 5+ · Pure ESM</span>
              </div>
            </Card>
          </div>

          {/* Live Demonstration Stage */}
          <div className="lg:col-span-5 min-w-0">
            <Card variant="glow" className="h-full p-6 sm:p-8 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <Badge variant="glow" size="sm">
                  Live Stage Preview
                </Badge>
                <Button
                  variant="cyan"
                  size="sm"
                  iconLeading={<Play className="w-3.5 h-3.5" />}
                  onClick={handleRunDemo}
                >
                  Run Example
                </Button>
              </div>

              <div className="flex-1 flex items-center justify-center py-6">
                <div
                  ref={demoCardRef}
                  className="w-full max-w-xs p-6 rounded-2xl bg-[#0b0e17] border border-white/[0.12] shadow-[0_12px_32px_rgba(0,0,0,0.6)] will-change-transform"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/30 border border-cyan-400/30 flex items-center justify-center mb-4">
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                  </div>
                  <h4 className="font-bold text-white text-base mb-1">
                    Kinetic Surface
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Animated directly via AF Motion&apos;s GPU transform pipeline.
                  </p>
                  <span className="font-mono text-[10px] text-indigo-300 uppercase tracking-wider">
                    Runs executed: {runCount}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 text-center pt-4 border-t border-white/[0.06]">
                Click <strong className="text-white">Run Example</strong> to execute{" "}
                <code className="text-cyan-300">animate()</code> live on this element.
              </p>
            </Card>
          </div>
        </div>
      </PageContainer>
    </SectionContainer>
  );
};
