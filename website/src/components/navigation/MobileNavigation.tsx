import React, { useEffect } from "react";
import { cn } from "@/utils/cn";
import { NavLinks } from "./NavLinks";
import { Button } from "@/components/ui/Button";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";

export interface MobileNavigationProps {
  readonly isOpen: boolean;
  readonly activeRoute?: string;
  readonly onClose: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  activeRoute,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleGetStarted = () => {
    onClose();
    window.location.hash = "#onboarding";
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Drawer"
      className={cn(
        "fixed top-0 right-0 bottom-0 z-50 w-full max-w-xs bg-[#0b0d14]/95 backdrop-blur-xl border-l border-white/[0.08] p-6 shadow-2xl transition-transform duration-300 lg:hidden flex flex-col justify-between overflow-y-auto",
        isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
      )}
    >
      <div>
        <div className="flex items-center justify-between pb-6 border-b border-white/[0.06] mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.5)]">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">{SITE_CONFIG.name}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <NavLinks vertical activeRoute={activeRoute} onItemClick={onClose} />
      </div>

      <div className="pt-6 border-t border-white/[0.06]">
        <Button
          variant="primary"
          size="md"
          iconTrailing={<ArrowRight className="w-4 h-4" />}
          className="w-full"
          onClick={handleGetStarted}
        >
          Get Started
        </Button>
        <p className="mt-3 text-center font-mono text-[11px] text-slate-500">
          v{SITE_CONFIG.version} · Pure ESM Motion Engine
        </p>
      </div>
    </div>
  );
};
