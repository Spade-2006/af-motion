import React from "react";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/Badge";

export interface FallbackSceneProps {
  readonly error?: Error;
  readonly className?: string;
}

export const FallbackScene: React.FC<FallbackSceneProps> = ({
  error,
  className,
}) => {
  return (
    <div
      className={cn(
        "relative w-full h-full min-h-[300px] flex flex-col items-center justify-center p-8 rounded-2xl bg-[#090b10] border border-white/[0.08] overflow-hidden text-center",
        className
      )}
    >
      {/* Procedural Atmospheric Glow */}
      <div className="absolute w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      <div className="absolute w-48 h-48 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-cyber-grid opacity-30 pointer-events-none" />

      <Badge variant="cyan" size="sm" className="mb-3">
        2D Canvas Fallback
      </Badge>

      <h4 className="text-base font-semibold text-white mb-1">
        High-Performance 2D Environment
      </h4>
      <p className="text-xs text-slate-400 max-w-sm mb-4">
        {error
          ? "WebGL context was interrupted or unavailable. Seamlessly degraded to lightweight 2D rendering."
          : "Hardware acceleration degraded safely to ensure optimal framerate and power efficiency."}
      </p>

      {/* Simulated 2D Geometric Prism */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        <div className="absolute w-20 h-20 border border-cyan-400/30 rounded-2xl rotate-45 animate-[spin_12s_linear_infinite]" />
        <div className="absolute w-14 h-14 border border-indigo-400/40 rounded-xl -rotate-12 animate-[spin_8s_linear_infinite_reverse]" />
        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 shadow-[0_0_16px_rgba(56,189,248,0.8)]" />
      </div>
    </div>
  );
};
