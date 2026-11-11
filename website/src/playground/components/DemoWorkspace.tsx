import React, { useState } from "react";
import { Sliders, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/utils/cn";

export interface DemoWorkspaceProps {
  readonly stage: React.ReactNode;
  readonly controls: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly controlsTitle?: string;
}

export const DemoWorkspace: React.FC<DemoWorkspaceProps> = ({
  stage,
  controls,
  footer,
  controlsTitle = "Parameters",
}) => {
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch [&>*]:min-w-0">
        {/* Center Interactive Preview Stage (Always first on mobile & desktop) */}
        <div className="xl:col-span-8 flex flex-col rounded-2xl bg-[#07090f] border border-white/[0.08] overflow-hidden relative min-h-[340px] sm:min-h-[390px]">
          <div className="absolute inset-0 bg-cyber-grid opacity-35 pointer-events-none" />
          <div className="relative z-10 flex-1 flex flex-col p-5 sm:p-6">
            {stage}
          </div>
          {footer && (
            <div className="relative z-10 px-5 py-3 bg-[#0b0e16]/90 border-t border-white/[0.06]">
              {footer}
            </div>
          )}
        </div>

        {/* Right Configuration Controls Panel (Collapsible on mobile/tablet) */}
        <div className="xl:col-span-4 rounded-2xl bg-[#0c0f18]/90 border border-white/[0.08] flex flex-col">
          <button
            type="button"
            onClick={() => setMobileControlsOpen((o) => !o)}
            className="xl:hidden flex items-center justify-between w-full px-4 py-3 text-xs font-semibold text-white border-b border-white/[0.06] cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              {controlsTitle}
            </span>
            {mobileControlsOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <div className="hidden xl:flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-slate-300 font-semibold">
              {controlsTitle}
            </h3>
          </div>

          <div
            className={cn(
              "p-4 space-y-4 overflow-y-auto xl:max-h-[420px]",
              mobileControlsOpen ? "block" : "hidden xl:block"
            )}
          >
            {controls}
          </div>
        </div>
      </div>
    </div>
  );
};
