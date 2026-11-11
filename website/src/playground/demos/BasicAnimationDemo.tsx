import React, { useEffect, useRef, useState } from "react";
import { animate, easings, type AnimationControls } from "af-motion";
import { DemoWorkspace } from "../components/DemoWorkspace";
import {
  ControlSection,
  SelectControl,
  SliderControl,
  ToggleControl,
} from "../components/ControlPanel";
import type { DemoComponentProps } from "../types";
import { Sparkles } from "lucide-react";

const EASING_NAMES = Object.keys(easings) as Array<keyof typeof easings>;

interface BasicConfig {
  scale: number;
  translateX: number;
  translateY: number;
  rotate: number;
  opacity: number;
  duration: number;
  delay: number;
  easing: keyof typeof easings;
  reverse: boolean;
  yoyo: boolean;
  repeat: number;
}

const DEFAULT_CONFIG: BasicConfig = {
  scale: 1.15,
  translateX: 40,
  translateY: -12,
  rotate: 12,
  opacity: 1,
  duration: 600,
  delay: 0,
  easing: "easeOutExpo",
  reverse: false,
  yoyo: false,
  repeat: 0,
};

export const BasicAnimationDemo: React.FC<DemoComponentProps> = ({
  playNonce,
  resetNonce,
  isPaused,
  onCodeChange,
  onStatusChange,
}) => {
  const [config, setConfig] = useState<BasicConfig>(DEFAULT_CONFIG);
  const targetRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<AnimationControls | null>(null);

  // Handle Reset signal
  useEffect(() => {
    if (resetNonce === 0) return;
    setConfig(DEFAULT_CONFIG);
    controlsRef.current?.cancel();
    if (targetRef.current) {
      targetRef.current.style.transform = "translate3d(0px, 0px, 0) scale(1) rotate(0deg)";
      targetRef.current.style.opacity = "1";
    }
  }, [resetNonce]);

  // Emit live code snippet
  useEffect(() => {
    const startTransform = "translate3d(0px, 0px, 0) scale(1) rotate(0deg)";
    const endTransform = `translate3d(${config.translateX}px, ${config.translateY}px, 0) scale(${config.scale}) rotate(${config.rotate}deg)`;
    const fromTransform = config.reverse ? endTransform : startTransform;
    const toTransform = config.reverse ? startTransform : endTransform;

    const code = `import { animate, easings } from "af-motion";

const element = document.querySelector<HTMLElement>(".target-box");

if (element) {
  const controls = animate(
    element,
    {
      opacity: [${config.reverse ? config.opacity : 0.2}, ${config.reverse ? 0.2 : config.opacity}],
      transform: [
        "${fromTransform}",
        "${toTransform}",
      ],
    },
    {
      duration: ${config.duration},
      delay: ${config.delay},
      easing: easings.${config.easing},
      repeat: ${config.repeat},
      yoyo: ${config.yoyo},
    }
  );
}`;
    onCodeChange(code);
    onStatusChange?.(`animate() · ${config.duration}ms · ${config.easing}`);
  }, [config, onCodeChange, onStatusChange]);

  // Execute real AF Motion animate() call
  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    controlsRef.current?.cancel();

    const startTransform = "translate3d(0px, 0px, 0) scale(1) rotate(0deg)";
    const endTransform = `translate3d(${config.translateX}px, ${config.translateY}px, 0) scale(${config.scale}) rotate(${config.rotate}deg)`;

    const controls = animate(
      el,
      {
        opacity: [
          config.reverse ? config.opacity : 0.25,
          config.reverse ? 0.25 : config.opacity,
        ],
        transform: [
          config.reverse ? endTransform : startTransform,
          config.reverse ? startTransform : endTransform,
        ],
      },
      {
        duration: config.duration,
        delay: config.delay,
        easing: easings[config.easing],
        repeat: config.repeat,
        yoyo: config.yoyo,
      }
    );

    if (isPaused) {
      controls.pause();
    }

    controlsRef.current = controls;
    return () => {
      controls.cancel();
    };
  }, [config, playNonce]);

  // Handle pause/resume cleanly without restarting
  useEffect(() => {
    if (!controlsRef.current) return;
    if (isPaused) {
      controlsRef.current.pause();
    } else {
      controlsRef.current.resume();
    }
  }, [isPaused]);

  const update = <K extends keyof BasicConfig>(key: K, value: BasicConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <DemoWorkspace
      stage={
        <div className="flex-1 flex flex-col items-center justify-center min-h-[260px]">
          <div
            ref={targetRef}
            data-testid="basic-animation-target"
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-tr from-cyan-500/25 via-indigo-600/35 to-purple-600/25 border border-cyan-400/40 shadow-[0_0_32px_rgba(99,102,241,0.35)] flex flex-col items-center justify-center gap-2 will-change-transform select-none"
          >
            <Sparkles className="w-6 h-6 text-cyan-300" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-200">
              AF Target
            </span>
          </div>
        </div>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-slate-400">
          <span>Engine: af-motion animate()</span>
          <span>
            Target: tx={config.translateX}px · ty={config.translateY}px · scale={config.scale} ·{" "}
            {config.rotate}deg
          </span>
        </div>
      }
      controls={
        <>
          <ControlSection title="Transform & Opacity">
            <SliderControl
              id="basic-tx"
              label="Translate X"
              value={config.translateX}
              min={-120}
              max={120}
              unit="px"
              onChange={(v) => update("translateX", v)}
            />
            <SliderControl
              id="basic-ty"
              label="Translate Y"
              value={config.translateY}
              min={-80}
              max={80}
              unit="px"
              onChange={(v) => update("translateY", v)}
            />
            <SliderControl
              id="basic-scale"
              label="Scale"
              value={config.scale}
              min={0.5}
              max={1.6}
              step={0.05}
              unit="x"
              onChange={(v) => update("scale", v)}
            />
            <SliderControl
              id="basic-rotate"
              label="Rotate"
              value={config.rotate}
              min={-180}
              max={180}
              unit="deg"
              onChange={(v) => update("rotate", v)}
            />
            <SliderControl
              id="basic-opacity"
              label="Opacity"
              value={config.opacity}
              min={0.1}
              max={1}
              step={0.05}
              onChange={(v) => update("opacity", v)}
            />
          </ControlSection>

          <ControlSection title="Timing & Easing">
            <SelectControl
              id="basic-easing"
              label="Easing Function"
              value={config.easing}
              options={EASING_NAMES.map((name) => ({ value: name, label: name }))}
              onChange={(v) => update("easing", v as keyof typeof easings)}
            />
            <SliderControl
              id="basic-duration"
              label="Duration"
              value={config.duration}
              min={150}
              max={1500}
              step={50}
              unit="ms"
              onChange={(v) => update("duration", v)}
            />
            <SliderControl
              id="basic-delay"
              label="Delay"
              value={config.delay}
              min={0}
              max={600}
              step={50}
              unit="ms"
              onChange={(v) => update("delay", v)}
            />
            <SliderControl
              id="basic-repeat"
              label="Repeat Count"
              value={config.repeat}
              min={0}
              max={3}
              onChange={(v) => update("repeat", v)}
            />
            <ToggleControl
              id="basic-reverse"
              label="Reverse Direction"
              checked={config.reverse}
              onChange={(v) => update("reverse", v)}
            />
            <ToggleControl
              id="basic-yoyo"
              label="Yoyo Alternate"
              checked={config.yoyo}
              onChange={(v) => update("yoyo", v)}
            />
          </ControlSection>
        </>
      }
    />
  );
};

export default BasicAnimationDemo;
