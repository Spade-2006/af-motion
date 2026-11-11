import React from "react";
import { Card } from "@/components/ui/Card";
import { CodeLabel } from "@/components/ui/CodeLabel";
import { ArrowRight, BookOpen, ShieldCheck, Terminal, Wrench } from "lucide-react";

export interface DocsQuickStartProps {
  readonly onSelectArticle: (slug: string) => void;
}

const QUICK_LINKS = [
  {
    slug: "installation",
    title: "Installation & Setup",
    desc: "npm, pnpm, yarn, bun setup and ESM subpath verification.",
    icon: <Terminal className="w-4 h-4 text-cyan-400" />,
  },
  {
    slug: "quickstart",
    title: "Quickstart Guide",
    desc: "Animate elements and React components cleanly on mount.",
    icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
  },
  {
    slug: "accessibility-guide",
    title: "Performance & Accessibility",
    desc: "Reduced-motion guarantees and GPU composite transform rules.",
    icon: <ShieldCheck className="w-4 h-4 text-indigo-400" />,
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting & FAQ",
    desc: "SSR hydration, Strict Mode cancellation, and Vite configuration.",
    icon: <Wrench className="w-4 h-4 text-amber-400" />,
  },
] as const;

export const DocsQuickStart: React.FC<DocsQuickStartProps> = ({
  onSelectArticle,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-white">Getting Started Shortcuts</h2>
        <div className="flex flex-wrap items-center gap-3">
          <CodeLabel code="npm install af-motion" prefix="$" />
          <a
            href="#onboarding"
            className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:underline"
          >
            Interactive 6-Step Onboarding <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICK_LINKS.map((item) => (
          <Card
            key={item.slug}
            variant="default"
            interactive
            className="p-4 flex flex-col justify-between gap-3 cursor-pointer"
            onClick={() => onSelectArticle(item.slug)}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                {item.icon}
                <span>{item.title}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
            <span className="font-mono text-[11px] text-cyan-300 inline-flex items-center gap-1">
              #docs/{item.slug} <ArrowRight className="w-3 h-3" />
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
};
