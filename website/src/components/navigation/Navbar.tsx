import React, { useState, useEffect } from "react";
import { cn } from "@/utils/cn";
import { NavLinks } from "./NavLinks";
import { MobileNavigation } from "./MobileNavigation";
import { NavigationOverlay } from "./NavigationOverlay";
import { Button } from "@/components/ui/Button";
import { MagneticElement } from "@/components/motion/MagneticElement";
import { Sparkles, Menu, ArrowRight } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";

export interface NavbarProps {
  readonly activeHref?: string;
  readonly activeRoute?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeHref, activeRoute }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = () => {
    window.location.hash = "#onboarding";
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
          scrolled
            ? "bg-[#07080b]/85 backdrop-blur-xl border-b border-white/[0.08] py-3 shadow-[0_8px_32px_rgba(0,0,0,0.7)]"
            : "bg-transparent py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <a
            href="#overview"
            className="flex items-center gap-3 group select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 rounded-xl p-0.5 shrink-0"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-0.5 shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:shadow-[0_0_25px_rgba(56,189,248,0.65)] transition-all duration-300 shrink-0">
              <div className="w-full h-full bg-[#090b10] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                {SITE_CONFIG.name}
              </span>
              <span className="font-mono text-[10px] tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                v{SITE_CONFIG.version}
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center">
            <NavLinks activeHref={activeHref} activeRoute={activeRoute} />
          </div>

          {/* Right Action Area */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <MagneticElement strength={0.2}>
              <Button
                variant="primary"
                size="sm"
                iconTrailing={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={handleGetStarted}
              >
                Get Started
              </Button>
            </MagneticElement>
          </div>

          {/* Mobile & Tablet Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile & Tablet Drawer + Backdrop */}
      <NavigationOverlay
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <MobileNavigation
        isOpen={mobileMenuOpen}
        activeRoute={activeRoute}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
};
