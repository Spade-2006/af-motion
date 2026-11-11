import React, { useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientSurface } from "@/components/effects/GradientSurface";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ExampleCard } from "@/examples/components/ExampleCard";
import {
  CURATED_EXAMPLES,
  EXAMPLE_CATEGORIES,
  type ExampleCategory,
  type ExampleDifficulty,
} from "@/examples/data/examplesCatalog";
import { ArrowRight, Search, Sparkles } from "lucide-react";

export const ExamplesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ExampleCategory>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"All" | ExampleDifficulty>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredExamples = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CURATED_EXAMPLES.filter((ex) => {
      if (selectedCategory !== "All" && ex.category !== selectedCategory) return false;
      if (selectedDifficulty !== "All" && ex.difficulty !== selectedDifficulty) return false;
      if (!q) return true;
      return (
        ex.name.toLowerCase().includes(q) ||
        ex.description.toLowerCase().includes(q) ||
        ex.apis.some((a) => a.toLowerCase().includes(q)) ||
        ex.category.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  return (
    <main className="relative w-full min-h-screen overflow-hidden">
      <GridBackground variant="grid" fadeEdges />
      <GradientSurface variant="indigo" position="top" className="opacity-35" />

      <div className="pt-28 pb-20 sm:pt-32">
        <PageContainer maxWidth="2xl">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 pb-8 border-b border-white/[0.06]">
            <div className="max-w-3xl">
              <Badge variant="emerald" size="sm" className="mb-3">
                <Sparkles className="w-3 h-3 mr-1.5 inline" />
                Curated Recipe Gallery
              </Badge>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
                Verified Animation Examples
              </h1>
              <p className="text-base text-slate-400 leading-relaxed">
                Live, working examples built directly on AF Motion&apos;s public APIs across
                entrances, interactions, scroll depth, physics, 3D/GPU shaders, and AI
                choreography.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                variant="primary"
                size="sm"
                iconTrailing={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => {
                  window.location.hash = "#onboarding";
                }}
              >
                Onboarding Guide
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  window.location.hash = "#playground";
                }}
              >
                Open Playground
              </Button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="space-y-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search examples, APIs, or categories..."
                  aria-label="Search curated examples"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0a0d15] border border-white/[0.1] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50"
                />
              </div>

              {/* Difficulty Filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(["All", "Beginner", "Intermediate", "Advanced"] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition-colors cursor-pointer ${
                      selectedDifficulty === diff
                        ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-200"
                        : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Bar */}
            <div
              role="tablist"
              aria-label="Example categories"
              className="flex flex-wrap gap-2"
            >
              {EXAMPLE_CATEGORIES.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      active
                        ? "bg-indigo-600 text-white border-indigo-400/40"
                        : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gallery Grid */}
          {filteredExamples.length === 0 ? (
            <div className="p-12 rounded-2xl border border-white/[0.08] bg-[#0a0c12] text-center space-y-3">
              <p className="text-slate-300 text-sm">
                No examples match the current filter criteria.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedCategory("All");
                  setSelectedDifficulty("All");
                  setSearchQuery("");
                }}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExamples.map((example) => (
                <ExampleCard key={example.id} example={example} />
              ))}
            </div>
          )}
        </PageContainer>
      </div>
    </main>
  );
};
