import React, { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import type { DemoCategory, DemoDefinition } from "../types";
import { cn } from "@/utils/cn";

export interface PlaygroundSidebarProps {
  readonly demos: readonly DemoDefinition[];
  readonly activeDemoId: string;
  readonly onSelectDemo: (id: string) => void;
}

const CATEGORIES: readonly ("All" | DemoCategory)[] = [
  "All",
  "Core",
  "Timing & Physics",
  "Effects",
  "Choreography",
  "3D & GPU",
  "AI & Presets",
];

export const PlaygroundSidebar: React.FC<PlaygroundSidebarProps> = ({
  demos,
  activeDemoId,
  onSelectDemo,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | DemoCategory>("All");

  const filteredDemos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return demos.filter((demo) => {
      const catMatch = selectedCategory === "All" || demo.category === selectedCategory;
      const textMatch =
        !q ||
        demo.title.toLowerCase().includes(q) ||
        demo.shortLabel.toLowerCase().includes(q) ||
        demo.description.toLowerCase().includes(q) ||
        demo.category.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [demos, searchQuery, selectedCategory]);

  return (
    <aside
      aria-label="Playground Demonstrations"
      className="w-full lg:w-68 shrink-0 flex flex-col gap-3 rounded-2xl bg-[#0c0f17]/90 border border-white/[0.08] p-4"
    >
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter labs..."
          aria-label="Filter playground demonstrations"
          className="w-full rounded-xl bg-[#080a10] border border-white/[0.08] pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-white/[0.06]">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
              selectedCategory === cat
                ? "bg-indigo-600/25 text-cyan-300 border border-indigo-500/40"
                : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.05]"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Mobile Compact Select */}
      <div className="lg:hidden">
        <label htmlFor="mobile-demo-select" className="sr-only">
          Choose demonstration
        </label>
        <select
          id="mobile-demo-select"
          value={activeDemoId}
          onChange={(e) => onSelectDemo(e.target.value)}
          className="w-full rounded-xl bg-[#080a10] border border-white/[0.12] px-3 py-2.5 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          {filteredDemos.map((d) => (
            <option key={d.id} value={d.id}>
              [{d.category}] {d.title}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop Scrollable Demo List */}
      <div className="hidden lg:flex flex-col gap-1.5 overflow-y-auto max-h-[540px] pr-1">
        {filteredDemos.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">
            No matching demonstrations found.
          </p>
        ) : (
          filteredDemos.map((demo) => {
            const isActive = demo.id === activeDemoId;
            return (
              <button
                key={demo.id}
                type="button"
                onClick={() => onSelectDemo(demo.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "text-left p-3 rounded-xl border transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                  isActive
                    ? "bg-[#151929] border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.16)]"
                    : "bg-transparent border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={cn(
                      "text-xs font-semibold truncate",
                      isActive ? "text-white" : "text-slate-300"
                    )}
                  >
                    {demo.shortLabel}
                  </span>
                  {demo.isHeavy && (
                    <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                  )}
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                  <span>{demo.category}</span>
                  <span className="text-indigo-400/80">{demo.subpath}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
