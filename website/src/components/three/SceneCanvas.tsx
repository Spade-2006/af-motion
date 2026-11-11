import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import type * as THREE from "three";
import { cn } from "@/utils/cn";
import { detectWebGLSupport } from "@/utils/webgl";
import { ThreeErrorBoundary } from "./ThreeErrorBoundary";
import { FallbackScene } from "./FallbackScene";
import { SceneEnvironment } from "./SceneEnvironment";

export interface SceneCanvasProps {
  readonly children?: React.ReactNode;
  readonly className?: string;
  readonly cameraPosition?: [number, number, number];
  readonly fov?: number;
  readonly dpr?: [number, number];
  readonly frameloop?: "always" | "demand" | "never";
  readonly framed?: boolean;
  readonly fallback?: React.ReactNode;
  readonly ariaLabel?: string;
}

export const SceneCanvas: React.FC<SceneCanvasProps> = ({
  children,
  className,
  cameraPosition = [0, 0, 5.6],
  fov = 45,
  dpr = [1, 1.75],
  frameloop = "always",
  framed = true,
  fallback,
  ariaLabel = "Interactive 3D AF Motion sculpture",
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const cleanupGlRef = useRef<(() => void) | null>(null);
  const webgl = useMemo(() => detectWebGLSupport(), []);
  const [isReady, setIsReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [isInViewport, setIsInViewport] = useState(true);
  const [isPageVisible, setIsPageVisible] = useState(() =>
    typeof document === "undefined" ? true : !document.hidden
  );

  // Pause 3D render loop when browser tab is backgrounded
  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleVisibility = () => {
      setIsPageVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Pause 3D render loop when scrolled outside viewport
  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsInViewport(entry.isIntersecting);
        }
      },
      { threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Ensure WebGL context listeners & renderer dispose on unmount
  useEffect(() => {
    return () => {
      cleanupGlRef.current?.();
      cleanupGlRef.current = null;
    };
  }, []);

  if (!webgl.supported || contextLost) {
    return <>{fallback || <FallbackScene />}</>;
  }

  const effectiveFrameloop =
    frameloop === "never"
      ? "never"
      : !isPageVisible || !isInViewport
      ? "demand"
      : frameloop;

  const handleCanvasCreated = ({ gl }: { gl: THREE.WebGLRenderer }) => {
    setIsReady(true);
    const canvasEl = gl?.domElement;
    if (!canvasEl || typeof canvasEl.addEventListener !== "function") return;

    const onLost = (ev: Event) => {
      ev.preventDefault();
      cleanupGlRef.current?.();
      cleanupGlRef.current = null;
      setContextLost(true);
    };
    const onRestored = () => {
      setContextLost(false);
    };

    canvasEl.addEventListener("webglcontextlost", onLost);
    canvasEl.addEventListener("webglcontextrestored", onRestored);

    cleanupGlRef.current = () => {
      canvasEl.removeEventListener("webglcontextlost", onLost);
      canvasEl.removeEventListener("webglcontextrestored", onRestored);
      if (typeof gl.dispose === "function") {
        gl.dispose();
      }
    };
  };

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={ariaLabel}
      className={cn(
        "relative w-full h-[360px] sm:h-[480px] overflow-hidden",
        framed &&
          "rounded-2xl bg-[#07080b] border border-white/[0.08] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.8)]",
        !framed && "bg-transparent",
        className
      )}
    >
      {!isReady && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-24 h-24 rounded-full border border-indigo-500/20 border-t-cyan-400/60 animate-spin" />
        </div>
      )}

      <ThreeErrorBoundary fallback={fallback}>
        <Canvas
          camera={{ position: cameraPosition, fov }}
          dpr={dpr}
          frameloop={effectiveFrameloop}
          onCreated={handleCanvasCreated}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          className={cn(
            "w-full h-full transition-opacity duration-700",
            isReady ? "opacity-100" : "opacity-0"
          )}
        >
          {children || <SceneEnvironment />}
        </Canvas>
      </ThreeErrorBoundary>
    </div>
  );
};
