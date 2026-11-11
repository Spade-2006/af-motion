import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CodeInspector } from "@/playground/components/CodeInspector";
import {
  OFFICIAL_SUBPATHS,
  PUBLIC_API_INVENTORY,
  type OfficialSubpath,
} from "../data/docsBridge";
import { ArrowRight, Search } from "lucide-react";

export interface DocsApiExplorerProps {
  readonly onSelectArticle: (slug: string) => void;
}

export const DocsApiExplorer: React.FC<DocsApiExplorerProps> = ({
  onSelectArticle,
}) => {
  const [selectedSubpath, setSelectedSubpath] = useState<OfficialSubpath>("af-motion");
  const [symbolFilter, setSymbolFilter] = useState("");

  const activeMeta =
    OFFICIAL_SUBPATHS.find((sp) => sp.id === selectedSubpath) ?? OFFICIAL_SUBPATHS[0];
  const entry = PUBLIC_API_INVENTORY.subpaths[selectedSubpath];

  const matchingSymbols = useMemo(() => {
    const q = symbolFilter.trim().toLowerCase();
    const list = q
      ? entry.namedExports.filter((sym) => sym.toLowerCase().includes(q))
      : entry.namedExports;
    return list.slice(0, 48);
  }, [entry, symbolFilter]);

  return (
    <section
      id="docs-api-reference"
      aria-label="Public API Inventory Reference"
      className="space-y-5 scroll-mt-24"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="glow" size="sm" className="mb-2">
            Source of Truth · public-api-inventory.json
          </Badge>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Public API Reference ({PUBLIC_API_INVENTORY.totalExports.toLocaleString()} Exports)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Inspect verified public symbols exported across all four official AF Motion
            subpaths without duplicating or hand-editing export lists.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectArticle("api-reference")}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
        >
          <span>Read Full API &amp; Types Guide</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <Card variant="elevated" className="p-6 space-y-6">
        {/* Subpath Selector Tabs */}
        <div
          role="tablist"
          aria-label="AF Motion Package Subpaths"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {OFFICIAL_SUBPATHS.map((sp) => {
            const count = PUBLIC_API_INVENTORY.subpaths[sp.id].exportCount;
            const active = sp.id === selectedSubpath;
            return (
              <button
                key={sp.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setSelectedSubpath(sp.id);
                  setSymbolFilter("");
                }}
                className={`p-3.5 rounded-xl text-left border transition-colors cursor-pointer ${
                  active
                    ? "bg-indigo-600/20 border-cyan-400/50 text-white"
                    : "bg-[#07090f] border-white/[0.08] text-slate-300 hover:border-white/[0.2]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <code className="font-mono text-xs text-cyan-300 font-semibold">
                    {sp.id}
                  </code>
                  <span className="font-mono text-[11px] text-slate-400">
                    {count.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs font-medium text-white">{sp.title}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Subpath Summary + Import Snippet */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-5 space-y-3">
            <div className="text-sm text-slate-300 leading-relaxed">
              {activeMeta.summary}
            </div>
            <CodeInspector tsCode={activeMeta.exampleImport} subpath={selectedSubpath} />
            <button
              type="button"
              onClick={() => onSelectArticle(activeMeta.guideSlug)}
              className="inline-flex items-center gap-1 font-mono text-xs text-cyan-400 hover:underline cursor-pointer"
            >
              <span>Open related guide (#docs/{activeMeta.guideSlug})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={symbolFilter}
                  aria-label={`Filter exports in ${selectedSubpath}`}
                  placeholder={`Filter ${entry.exportCount} exports in ${selectedSubpath}...`}
                  onChange={(e) => setSymbolFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#07090f] border border-white/[0.1] text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50"
                />
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                Showing {matchingSymbols.length} of {entry.exportCount}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#07090f] border border-white/[0.08] max-h-56 overflow-y-auto flex flex-wrap gap-1.5">
              {matchingSymbols.length === 0 ? (
                <span className="text-xs text-slate-500 font-mono">
                  No exports matched &quot;{symbolFilter}&quot;.
                </span>
              ) : (
                matchingSymbols.map((sym) => (
                  <code
                    key={sym}
                    className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] font-mono text-[11px] text-slate-200"
                  >
                    {sym}
                  </code>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
};
