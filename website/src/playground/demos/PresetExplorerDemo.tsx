import React, { useEffect, useMemo, useRef, useState } from "react";
import { applyPreset, listPresets, MOTION_PRESET_CATEGORIES } from "af-motion/presets";
import { DemoWorkspace } from "../components/DemoWorkspace";
import { ControlSection, SelectControl } from "../components/ControlPanel";
import { Badge } from "@/components/ui/Badge";
import type { DemoComponentProps } from "../types";
import { Search, Sparkles } from "lucide-react";

export const PresetExplorerDemo: React.FC<DemoComponentProps> = ({
  playNonce,
  resetNonce,
  isPaused,
  onCodeChange,
  onStatusChange,
}) => {
  const allPresets = useMemo(() => listPresets(), []);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedPresetName, setSelectedPresetName] = useState<string>(
    allPresets[0]?.name ?? "fadeIn"
  );
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resetNonce === 0) return;
    setSearchQuery("");
    setCategoryFilter("all");
    setSelectedPresetName(allPresets[0]?.name ?? "fadeIn");
  }, [resetNonce, allPresets]);

  const filteredPresets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allPresets.filter((p) => {
      const catMatch = categoryFilter === "all" || p.category === categoryFilter;
      const textMatch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      return catMatch && textMatch;
    });
  }, [allPresets, searchQuery, categoryFilter]);

  const activePreset = useMemo(
    () =>
      allPresets.find((p) => p.name === selectedPresetName) ??
      filteredPresets[0] ??
      allPresets[0],
    [allPresets, filteredPresets, selectedPresetName]
  );

  // Execute selected preset live on preview card
  useEffect(() => {
    if (isPaused || !activePreset) return;
    const el = previewRef.current;
    if (!el) return;

    try {
      const controls = applyPreset(el, activePreset.name);
      return () => {
        controls.cancel();
      };
    } catch {
      // Non-DOM or sequence preset gracefully displays configuration spec
    }
  }, [activePreset, playNonce, isPaused]);

  // Emit Code Inspector output
  useEffect(() => {
    if (!activePreset) return;
    const code = `import { applyPreset, getPreset } from "af-motion/presets";

// Preset ID: ${activePreset.id} (${activePreset.category})
const definition = getPreset("${activePreset.name}");

const controls = applyPreset(".target-element", "${activePreset.name}", {
  duration: ${activePreset.animation?.duration ?? 400},
});`;
    onCodeChange(code);
    onStatusChange?.(
      `${allPresets.length} Built-in Presets · ${activePreset.name} (${activePreset.category})`
    );
  }, [activePreset, allPresets.length, onCodeChange, onStatusChange]);

  return (
    <DemoWorkspace
      controlsTitle="Preset Registry"
      stage={
        <div className="flex-1 flex flex-col justify-between gap-4">
          {/* Interactive Preview Box */}
          <div className="flex-1 flex items-center justify-center py-4 min-h-[170px]">
            <div
              ref={previewRef}
              className="w-60 p-5 rounded-2xl bg-gradient-to-tr from-[#131829] to-[#0b0e18] border border-cyan-400/35 shadow-[0_0_32px_rgba(56,189,248,0.2)] text-center"
            >
              <Sparkles className="w-6 h-6 text-cyan-300 mx-auto mb-2" />
              <div className="text-sm font-bold text-white">{activePreset?.name}</div>
              <div className="font-mono text-[10px] text-indigo-300 uppercase mt-1">
                {activePreset?.category}
              </div>
            </div>
          </div>

          {/* Preset Metadata & JSON Config */}
          {activePreset && (
            <div className="rounded-xl bg-[#090b12] border border-white/[0.08] p-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="cyan" size="sm">
                  {activePreset.id}
                </Badge>
                <span className="font-mono text-[10px] text-slate-400">
                  Reduced Motion: {activePreset.reducedMotion}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activePreset.description}
              </p>
              <pre className="p-3 rounded-lg bg-[#06080d] border border-white/[0.06] font-mono text-[11px] text-cyan-200 overflow-x-auto max-h-32">
                {JSON.stringify(activePreset.animation, null, 2)}
              </pre>
            </div>
          )}
        </div>
      }
      footer={
        <div className="flex justify-between font-mono text-[11px] text-slate-400">
          <span>Source: af-motion/presets listPresets()</span>
          <span>{filteredPresets.length} / {allPresets.length} matching presets</span>
        </div>
      }
      controls={
        <>
          <ControlSection title="Discover Presets">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 39 presets..."
                aria-label="Search presets"
                className="w-full rounded-lg bg-[#0d1018] border border-white/[0.1] pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              />
            </div>

            <SelectControl
              id="preset-category"
              label="Category Filter"
              value={categoryFilter}
              options={[
                { value: "all", label: `All Categories (${allPresets.length})` },
                ...MOTION_PRESET_CATEGORIES.map((c) => ({ value: c, label: c })),
              ]}
              onChange={setCategoryFilter}
            />
          </ControlSection>

          <ControlSection title="Preset List">
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {filteredPresets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPresetName(p.name)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg font-mono text-xs transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    activePreset?.name === p.name
                      ? "bg-indigo-600/25 text-cyan-200 border border-indigo-500/40"
                      : "bg-white/[0.03] text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  <span className="text-[10px] text-slate-500 shrink-0">{p.category}</span>
                </button>
              ))}
            </div>
          </ControlSection>
        </>
      }
    />
  );
};

export default PresetExplorerDemo;
