import React from "react";
import { FOOTER_LINKS } from "@/config/navigation";
import { SITE_CONFIG } from "@/config/site";
import { Badge } from "@/components/ui/Badge";
import { Sparkles, ExternalLink, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#050608] border-t border-white/[0.08] pt-16 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/[0.06]">
          {/* Brand Info */}
          <div className="lg:col-span-2 flex flex-col items-start pr-0 lg:pr-8">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                {SITE_CONFIG.name}
              </span>
              <Badge variant="glow" size="sm" className="ml-2">
                Phase 20
              </Badge>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-sm">
              {SITE_CONFIG.description}
            </p>
            <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Engine Status: Production Ready v{SITE_CONFIG.version}</span>
            </div>
          </div>

          {/* Architecture Links */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-slate-200 mb-4 font-semibold">
              Architecture
            </h4>
            <ul className="space-y-2.5 text-sm">
              {FOOTER_LINKS.architecture.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="hover:text-white transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Ecosystem Links */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-slate-200 mb-4 font-semibold">
              Ecosystem
            </h4>
            <ul className="space-y-2.5 text-sm">
              {FOOTER_LINKS.ecosystem.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="hover:text-white transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resource Links */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-slate-200 mb-4 font-semibold">
              Resources
            </h4>
            <ul className="space-y-2.5 text-sm">
              {FOOTER_LINKS.resources.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target={item.isExternal ? "_blank" : undefined}
                    rel={item.isExternal ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <span>{item.label}</span>
                    {item.isExternal && <ExternalLink className="w-3 h-3 text-slate-500" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} AF Motion. High-performance, framework-independent motion engine.
          </p>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>for creative developers & AI agents.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
