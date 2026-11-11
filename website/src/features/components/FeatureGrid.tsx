import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FEATURE_CATEGORIES } from "../data/featureCatalog";
import type { FeatureCategoryId } from "../types";
import { ArrowUpRight } from "lucide-react";

export interface FeatureGridProps {
  readonly activeCategoryId?: FeatureCategoryId;
  readonly onSelectCategory: (id: FeatureCategoryId) => void;
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({
  activeCategoryId,
  onSelectCategory,
}) => {
  return (
    <section aria-label="Feature Overview Grid" className="py-12 sm:py-16">
      <PageContainer maxWidth="2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURE_CATEGORIES.map((category) => {
            const isSelected = activeCategoryId === category.id;
            return (
              <Card
                key={category.id}
                variant={isSelected ? "glow" : "elevated"}
                interactive
                className="p-6 flex flex-col justify-between gap-5 cursor-pointer"
                onClick={() => onSelectCategory(category.id)}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs text-cyan-400">
                      {category.indexLabel} · {category.subpath}
                    </span>
                    <Badge variant="default" size="sm">
                      {category.badge}
                    </Badge>
                  </div>

                  <h2 className="text-xl font-bold text-white mb-2">{category.title}</h2>
                  <p className="text-sm text-slate-400 leading-relaxed">{category.summary}</p>
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">
                    {category.capabilities.length} Capabilities
                  </span>
                  <span className="inline-flex items-center gap-1 text-cyan-300">
                    Inspect Section
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </PageContainer>
    </section>
  );
};
