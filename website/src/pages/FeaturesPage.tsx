import React, { useEffect, useState } from "react";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientSurface } from "@/components/effects/GradientSurface";
import { PageContainer } from "@/components/layout/PageContainer";
import { FeatureHero } from "@/features/components/FeatureHero";
import { FeatureGrid } from "@/features/components/FeatureGrid";
import { FeatureDetailSection } from "@/features/components/FeatureDetailSection";
import { FeatureComparison } from "@/features/components/FeatureComparison";
import { FeatureCTA } from "@/features/components/FeatureCTA";
import { FEATURE_CATEGORIES, getFeatureCategoryById } from "@/features/data/featureCatalog";
import type { FeatureCategoryId } from "@/features/types";

export interface FeaturesPageProps {
  readonly initialCategoryId?: string;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({
  initialCategoryId,
}) => {
  const validInitial = initialCategoryId
    ? getFeatureCategoryById(initialCategoryId)?.id
    : undefined;

  const [activeCategoryId, setActiveCategoryId] = useState<FeatureCategoryId | undefined>(
    validInitial
  );

  useEffect(() => {
    const next = initialCategoryId
      ? getFeatureCategoryById(initialCategoryId)?.id
      : undefined;
    setActiveCategoryId(next);

    if (next) {
      requestAnimationFrame(() => {
        const el = document.getElementById(`feature-${next}`);
        if (el && typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  }, [initialCategoryId]);

  const handleSelectCategory = (id: FeatureCategoryId) => {
    setActiveCategoryId(id);
    window.location.hash = `#features/${id}`;
    requestAnimationFrame(() => {
      const el = document.getElementById(`feature-${id}`);
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };

  return (
    <main className="relative w-full min-h-screen overflow-hidden">
      <GridBackground variant="grid" fadeEdges />
      <GradientSurface variant="indigo" position="top" className="opacity-45" />

      <FeatureHero
        activeCategoryId={activeCategoryId}
        onSelectCategory={handleSelectCategory}
      />

      <FeatureGrid
        activeCategoryId={activeCategoryId}
        onSelectCategory={handleSelectCategory}
      />

      <section aria-label="Feature Category Details">
        <PageContainer maxWidth="2xl">
          {FEATURE_CATEGORIES.map((category) => (
            <FeatureDetailSection
              key={category.id}
              category={category}
              isHighlighted={activeCategoryId === category.id}
              onSelectRelated={handleSelectCategory}
            />
          ))}
        </PageContainer>
      </section>

      <FeatureComparison />
      <FeatureCTA />
    </main>
  );
};
