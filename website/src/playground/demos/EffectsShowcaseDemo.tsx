import React, { useEffect, useRef, useState } from "react";
import {
  animate,
  easings,
  magnetic,
  parallax,
  stagger,
  tilt,
} from "af-motion";
import { DemoWorkspace } from "../components/DemoWorkspace";
import {
  ControlSection,
  SelectControl,
  SliderControl,
} from "../components/ControlPanel";
import type { DemoComponentProps } from "../types";
import { Sparkles, Compass, Layers } from "lucide-react";

export type EffectTabId = "stagger" | "reveal" | "magnetic" | "tilt" | "parallax";

export interface EffectsShowcaseProps extends DemoComponentProps {
  readonly initialTab?: EffectTabId;
}

export const EffectsShowcaseDemo: React.FC<EffectsShowcaseProps> = ({
  initialTab = "stagger",
  playNonce,
  resetNonce,
  isPaused,
  onCodeChange,
  onStatusChange,
}) => {
  const [activeTab, setActiveTab] = useState<EffectTabId>(initialTab);

  // Stagger state
  const [staggerCount, setStaggerCount] = useState(6);
  const [staggerInterval, setStaggerInterval] = useState(75);
  const [staggerFrom, setStaggerFrom] = useState<"first" | "last">("first");

  // Reveal state
  const [revealDirection, setRevealDirection] = useState<"up" | "down" | "left" | "right">("up");
  const [revealDistance, setRevealDistance] = useState(28);
  const [revealDuration, setRevealDuration] = useState(550);

  // Magnetic state
  const [magStrength, setMagStrength] = useState(0.4);
  const [magRadius, setMagRadius] = useState(140);
  const [magMaxTranslate, setMagMaxTranslate] = useState(24);

  // Tilt state
  const [tiltMax, setTiltMax] = useState(16);
  const [tiltPerspective, setTiltPerspective] = useState(800);
  const [tiltScale, setTiltScale] = useState(1.04);

  // Parallax state
  const [parallaxSpeed, setParallaxSpeed] = useState(0.35);
  const [parallaxAxis, setParallaxAxis] = useState<"y" | "x">("y");
  const [parallaxMaxOffset, setParallaxMaxOffset] = useState(64);
  const [simulatedScroll, setSimulatedScroll] = useState(0);

  const staggerContainerRef = useRef<HTMLDivElement>(null);
  const revealTargetRef = useRef<HTMLDivElement>(null);
  const magneticTargetRef = useRef<HTMLButtonElement>(null);
  const tiltTargetRef = useRef<HTMLDivElement>(null);
  const parallaxTargetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (resetNonce === 0) return;
    setStaggerCount(6);
    setStaggerInterval(75);
    setStaggerFrom("first");
    setRevealDirection("up");
    setRevealDistance(28);
    setRevealDuration(550);
    setMagStrength(0.4);
    setMagRadius(140);
    setMagMaxTranslate(24);
    setTiltMax(16);
    setTiltPerspective(800);
    setTiltScale(1.04);
    setParallaxSpeed(0.35);
    setParallaxAxis("y");
    setParallaxMaxOffset(64);
    setSimulatedScroll(0);
  }, [resetNonce]);

  // Run Stagger Effect
  useEffect(() => {
    if (activeTab !== "stagger" || isPaused) return;
    const container = staggerContainerRef.current;
    if (!container) return;

    const controls = stagger("[data-stagger-item]", {
      properties: {
        opacity: [0, 1],
        transform: ["translate3d(0, 22px, 0) scale(0.9)", "translate3d(0, 0, 0) scale(1)"],
      },
      duration: 480,
      stagger: staggerInterval,
      from: staggerFrom,
      easing: easings.easeOutExpo,
    });

    return () => {
      controls.cancel();
    };
  }, [activeTab, staggerCount, staggerInterval, staggerFrom, playNonce, isPaused]);

  // Run Reveal Effect preview
  useEffect(() => {
    if (activeTab !== "reveal" || isPaused) return;
    const el = revealTargetRef.current;
    if (!el) return;

    const fromTransform =
      revealDirection === "up"
        ? `translate3d(0, ${revealDistance}px, 0)`
        : revealDirection === "down"
        ? `translate3d(0, -${revealDistance}px, 0)`
        : revealDirection === "left"
        ? `translate3d(${revealDistance}px, 0, 0)`
        : `translate3d(-${revealDistance}px, 0, 0)`;

    const controls = animate(
      el,
      {
        opacity: [0, 1],
        transform: [fromTransform, "translate3d(0, 0, 0)"],
      },
      {
        duration: revealDuration,
        easing: easings.easeOutExpo,
      }
    );

    return () => {
      controls.cancel();
    };
  }, [activeTab, revealDirection, revealDistance, revealDuration, playNonce, isPaused]);

  // Attach Magnetic Effect
  useEffect(() => {
    if (activeTab !== "magnetic") return;
    const el = magneticTargetRef.current;
    if (!el) return;

    const controls = magnetic(el, {
      strength: magStrength,
      distance: magRadius,
      maxTranslate: magMaxTranslate,
      duration: 200,
    });

    return () => {
      controls.destroy();
    };
  }, [activeTab, magStrength, magRadius, magMaxTranslate, playNonce]);

  // Attach 3D Tilt Effect
  useEffect(() => {
    if (activeTab !== "tilt") return;
    const el = tiltTargetRef.current;
    if (!el) return;

    const controls = tilt(el, {
      maxTilt: tiltMax,
      perspective: tiltPerspective,
      scale: tiltScale,
      speed: 280,
    });

    return () => {
      controls.destroy();
    };
  }, [activeTab, tiltMax, tiltPerspective, tiltScale, playNonce]);

  // Attach Real Parallax Effect + Interactive Scroll Offset Preview
  useEffect(() => {
    if (activeTab !== "parallax") return;
    const el = parallaxTargetRef.current;
    if (!el) return;

    const controls = parallax(el, {
      speed: parallaxSpeed,
      axis: parallaxAxis,
      maxOffset: parallaxMaxOffset,
    });

    return () => {
      controls.destroy();
    };
  }, [activeTab, parallaxSpeed, parallaxAxis, parallaxMaxOffset, playNonce]);

  // Update code inspector dynamically per active effect tab
  useEffect(() => {
    let code = "";
    if (activeTab === "stagger") {
      code = `import { stagger, easings } from "af-motion";

const controls = stagger(".stagger-card", {
  properties: {
    opacity: [0, 1],
    transform: ["translate3d(0, 22px, 0) scale(0.9)", "translate3d(0, 0, 0) scale(1)"],
  },
  duration: 480,
  stagger: ${staggerInterval},
  from: "${staggerFrom}",
  easing: easings.easeOutExpo,
});`;
      onStatusChange?.(`stagger() · ${staggerCount} items · ${staggerInterval}ms interval`);
    } else if (activeTab === "reveal") {
      code = `import { reveal } from "af-motion";

const controls = reveal(".reveal-target", {
  direction: "${revealDirection}",
  distance: ${revealDistance},
  duration: ${revealDuration},
  threshold: 0.15,
  once: true,
});`;
      onStatusChange?.(`reveal() · ${revealDirection} · ${revealDistance}px`);
    } else if (activeTab === "magnetic") {
      code = `import { magnetic } from "af-motion";

const controls = magnetic(".magnetic-btn", {
  strength: ${magStrength},
  distance: ${magRadius},
  maxTranslate: ${magMaxTranslate},
  duration: 200,
});`;
      onStatusChange?.(`magnetic() · strength ${magStrength} · radius ${magRadius}px`);
    } else if (activeTab === "tilt") {
      code = `import { tilt } from "af-motion";

const controls = tilt(".tilt-card", {
  maxTilt: ${tiltMax},
  perspective: ${tiltPerspective},
  scale: ${tiltScale},
  speed: 280,
});`;
      onStatusChange?.(`tilt() · max ${tiltMax}° · scale ${tiltScale}`);
    } else {
      code = `import { parallax } from "af-motion";

const controls = parallax(".parallax-layer", {
  speed: ${parallaxSpeed},
  axis: "${parallaxAxis}",
  maxOffset: ${parallaxMaxOffset},
});`;
      onStatusChange?.(`parallax() · speed ${parallaxSpeed} · axis ${parallaxAxis}`);
    }

    onCodeChange(code);
  }, [
    activeTab,
    staggerCount,
    staggerInterval,
    staggerFrom,
    revealDirection,
    revealDistance,
    revealDuration,
    magStrength,
    magRadius,
    magMaxTranslate,
    tiltMax,
    tiltPerspective,
    tiltScale,
    parallaxSpeed,
    parallaxAxis,
    parallaxMaxOffset,
    onCodeChange,
    onStatusChange,
  ]);

  const computedParallaxShift = Math.max(
    -parallaxMaxOffset,
    Math.min(parallaxMaxOffset, simulatedScroll * parallaxSpeed)
  );

  return (
    <DemoWorkspace
      controlsTitle="Effect Parameters"
      stage={
        <div className="flex-1 flex flex-col gap-5">
          {/* Sub-Tabs Selector */}
          <div className="flex flex-wrap gap-1.5 border-b border-white/[0.06] pb-3">
            {(
              [
                { id: "stagger", label: "Stagger" },
                { id: "reveal", label: "Reveal" },
                { id: "magnetic", label: "Magnetic" },
                { id: "tilt", label: "3D Tilt" },
                { id: "parallax", label: "Parallax" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-white/[0.04] text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Interactive Stage Area */}
          <div className="flex-1 flex items-center justify-center min-h-[240px]">
            {activeTab === "stagger" && (
              <div
                ref={staggerContainerRef}
                className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md"
              >
                {Array.from({ length: staggerCount }).map((_, idx) => (
                  <div
                    key={`${staggerCount}-${idx}`}
                    data-stagger-item
                    className="h-20 rounded-xl bg-[#111522] border border-indigo-500/30 flex flex-col items-center justify-center gap-1 shadow-md"
                  >
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      0{idx + 1}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      Item #{idx}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "reveal" && (
              <div
                ref={revealTargetRef}
                className="p-6 rounded-2xl bg-gradient-to-tr from-indigo-600/20 to-cyan-500/15 border border-cyan-400/30 max-w-xs text-center shadow-[0_0_28px_rgba(56,189,248,0.15)]"
              >
                <Sparkles className="w-6 h-6 text-cyan-300 mx-auto mb-3" />
                <h4 className="font-bold text-white text-sm mb-1">
                  Directional Reveal
                </h4>
                <p className="text-xs text-slate-400">
                  Enters smoothly along {revealDirection} axis by {revealDistance}px.
                </p>
              </div>
            )}

            {activeTab === "magnetic" && (
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-xs text-slate-400">
                  Move cursor near or over the magnetic button below.
                </p>
                <button
                  ref={magneticTargetRef}
                  type="button"
                  className="px-7 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold text-sm shadow-[0_0_28px_rgba(99,102,241,0.4)] cursor-pointer flex items-center gap-2"
                >
                  <Compass className="w-4 h-4" />
                  <span>Magnetic Pull Target</span>
                </button>
              </div>
            )}

            {activeTab === "tilt" && (
              <div
                ref={tiltTargetRef}
                className="w-64 h-44 rounded-2xl bg-gradient-to-br from-[#161b2c] to-[#0b0e18] border border-indigo-400/30 p-6 flex flex-col justify-between shadow-[0_20px_45px_rgba(0,0,0,0.75)] cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <span className="font-mono text-[10px] text-indigo-300 uppercase">
                    Perspective {tiltPerspective}px
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">3D Perspective Card</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Move cursor across card surface to tilt up to {tiltMax}°.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "parallax" && (
              <div className="w-full max-w-md flex flex-col items-center gap-4">
                <div className="w-full h-44 rounded-xl bg-[#090c14] border border-white/[0.08] overflow-hidden relative flex items-center justify-center">
                  <div
                    ref={parallaxTargetRef}
                    style={{
                      transform:
                        parallaxAxis === "y"
                          ? `translate3d(0, ${computedParallaxShift}px, 0)`
                          : `translate3d(${computedParallaxShift}px, 0, 0)`,
                    }}
                    className="px-6 py-4 rounded-xl bg-indigo-600/25 border border-cyan-400/40 text-center shadow-[0_0_24px_rgba(56,189,248,0.2)] transition-transform duration-75"
                  >
                    <span className="font-mono text-xs text-cyan-300 block">
                      Parallax Layer ({parallaxAxis.toUpperCase()})
                    </span>
                    <span className="font-mono text-[11px] text-slate-300">
                      Offset: {computedParallaxShift.toFixed(1)}px
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Real <code className="text-cyan-300">parallax()</code> listens to page scroll, or drag Simulated Scroll slider.
                </p>
              </div>
            )}
          </div>
        </div>
      }
      controls={
        <>
          {activeTab === "stagger" && (
            <ControlSection title="Stagger Options">
              <SliderControl
                id="stag-count"
                label="Element Count"
                value={staggerCount}
                min={2}
                max={9}
                onChange={setStaggerCount}
              />
              <SliderControl
                id="stag-interval"
                label="Interval"
                value={staggerInterval}
                min={20}
                max={200}
                step={5}
                unit="ms"
                onChange={setStaggerInterval}
              />
              <SelectControl
                id="stag-from"
                label="Sequence Origin"
                value={staggerFrom}
                options={[
                  { value: "first", label: "From First" },
                  { value: "last", label: "From Last" },
                ]}
                onChange={(v) => setStaggerFrom(v as "first" | "last")}
              />
            </ControlSection>
          )}

          {activeTab === "reveal" && (
            <ControlSection title="Reveal Options">
              <SelectControl
                id="rev-dir"
                label="Direction"
                value={revealDirection}
                options={[
                  { value: "up", label: "Up" },
                  { value: "down", label: "Down" },
                  { value: "left", label: "Left" },
                  { value: "right", label: "Right" },
                ]}
                onChange={(v) => setRevealDirection(v as any)}
              />
              <SliderControl
                id="rev-dist"
                label="Distance"
                value={revealDistance}
                min={8}
                max={72}
                unit="px"
                onChange={setRevealDistance}
              />
              <SliderControl
                id="rev-dur"
                label="Duration"
                value={revealDuration}
                min={200}
                max={1200}
                step={50}
                unit="ms"
                onChange={setRevealDuration}
              />
            </ControlSection>
          )}

          {activeTab === "magnetic" && (
            <ControlSection title="Magnetic Options">
              <SliderControl
                id="mag-str"
                label="Strength"
                value={magStrength}
                min={0.1}
                max={0.8}
                step={0.05}
                onChange={setMagStrength}
              />
              <SliderControl
                id="mag-rad"
                label="Activation Distance"
                value={magRadius}
                min={60}
                max={260}
                step={10}
                unit="px"
                onChange={setMagRadius}
              />
              <SliderControl
                id="mag-max"
                label="Max Translate"
                value={magMaxTranslate}
                min={6}
                max={48}
                unit="px"
                onChange={setMagMaxTranslate}
              />
            </ControlSection>
          )}

          {activeTab === "tilt" && (
            <ControlSection title="Tilt Options">
              <SliderControl
                id="tilt-max"
                label="Max Rotation"
                value={tiltMax}
                min={4}
                max={30}
                unit="deg"
                onChange={setTiltMax}
              />
              <SliderControl
                id="tilt-persp"
                label="Perspective"
                value={tiltPerspective}
                min={400}
                max={1600}
                step={50}
                unit="px"
                onChange={setTiltPerspective}
              />
              <SliderControl
                id="tilt-scale"
                label="Hover Scale"
                value={tiltScale}
                min={1}
                max={1.15}
                step={0.01}
                unit="x"
                onChange={setTiltScale}
              />
            </ControlSection>
          )}

          {activeTab === "parallax" && (
            <ControlSection title="Parallax Options">
              <SliderControl
                id="par-speed"
                label="Speed Ratio"
                value={parallaxSpeed}
                min={-0.6}
                max={0.8}
                step={0.05}
                onChange={setParallaxSpeed}
              />
              <SelectControl
                id="par-axis"
                label="Axis"
                value={parallaxAxis}
                options={[
                  { value: "y", label: "Vertical (Y)" },
                  { value: "x", label: "Horizontal (X)" },
                ]}
                onChange={(v) => setParallaxAxis(v as "y" | "x")}
              />
              <SliderControl
                id="par-max"
                label="Max Offset Clamp"
                value={parallaxMaxOffset}
                min={20}
                max={120}
                unit="px"
                onChange={setParallaxMaxOffset}
              />
              <SliderControl
                id="par-sim"
                label="Simulated Scroll Delta"
                value={simulatedScroll}
                min={-150}
                max={150}
                step={5}
                unit="px"
                onChange={setSimulatedScroll}
              />
            </ControlSection>
          )}
        </>
      }
    />
  );
};

export default EffectsShowcaseDemo;
