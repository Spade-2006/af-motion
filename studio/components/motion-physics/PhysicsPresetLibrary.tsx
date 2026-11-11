import React, { useState, useMemo } from "react";
import type { MotionPhysicsStudioState } from "../../types/motion-physics.js";
import {
  listAvailableSpringPresets,
  listAvailableInertiaPresets,
  listAvailableRecipes,
  loadSpringPreset,
  loadInertiaPreset,
} from "../../engine/motion-physics-engine.js";
import { getPhysicsRecipe } from "../../../src/core/physics/composition-recipes.js";

interface PhysicsPresetLibraryProps {
  state: MotionPhysicsStudioState;
  onUpdateState: (updater: (prev: MotionPhysicsStudioState) => MotionPhysicsStudioState) => void;
}

type PresetCategory = "all" | "springs" | "inertia" | "recipes";

export const PhysicsPresetLibrary: React.FC<PhysicsPresetLibraryProps> = ({
  state,
  onUpdateState,
}) => {
  const [category, setCategory] = useState<PresetCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const springPresets = useMemo(() => listAvailableSpringPresets(), []);
  const inertiaPresets = useMemo(() => listAvailableInertiaPresets(), []);
  const recipes = useMemo(() => listAvailableRecipes(), []);

  // Filtered preset list
  const allItems = useMemo(() => {
    const list: {
      id: string;
      name: string;
      category: "springs" | "inertia" | "recipes";
      description: string;
      details: string;
      apply: () => void;
    }[] = [];

    // Springs
    for (const sp of springPresets) {
      list.push({
        id: `sp-${sp.id}`,
        name: sp.name,
        category: "springs",
        description: sp.description,
        details: `k=${sp.config.stiffness}, c=${sp.config.damping}, m=${sp.config.mass}`,
        apply: () => {
          const loaded = loadSpringPreset(sp.id as any);
          onUpdateState((prev) => ({
            ...prev,
            springConfig: loaded,
            selectedSpringPreset: sp.id as any,
            viewMode: "spring",
          }));
        },
      });
    }

    // Inertia
    for (const ip of inertiaPresets) {
      list.push({
        id: `ip-${ip.id}`,
        name: ip.name,
        category: "inertia",
        description: ip.description,
        details: `μ=${ip.config.friction}, m=${ip.config.mass}, drag=${ip.config.drag ?? 0}`,
        apply: () => {
          const loaded = loadInertiaPreset(ip.id as any);
          onUpdateState((prev) => ({
            ...prev,
            inertiaConfig: loaded,
            selectedInertiaPreset: ip.id as any,
            viewMode: "inertia",
          }));
        },
      });
    }

    // Recipes
    for (const r of recipes) {
      list.push({
        id: `rc-${r.id}`,
        name: r.name,
        category: "recipes",
        description: r.description,
        details: "Full Multi-Body Simulation Recipe",
        apply: () => {
          const loadedRecipe = getPhysicsRecipe(r.id);
          if (loadedRecipe) {
            onUpdateState((prev) => ({
              ...prev,
              compositionConfig: loadedRecipe.create(),
              selectedRecipeId: r.id,
              viewMode: "composition",
            }));
          }
        },
      });
    }

    return list;
  }, [springPresets, inertiaPresets, recipes, onUpdateState]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchCat = category === "all" || item.category === category;
      const matchQuery =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [allItems, category, searchQuery]);

  return (
    <div className="mp-presets-library-container">
      {/* Search & Filter Header */}
      <div className="mp-library-filter-bar">
        <input
          type="search"
          className="mp-search-input"
          placeholder="Search physics presets (e.g., bouncy, natural, gentle)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="mp-category-tabs">
          <button
            type="button"
            className={`mp-cat-btn ${category === "all" ? "active" : ""}`}
            onClick={() => setCategory("all")}
          >
            All ({allItems.length})
          </button>
          <button
            type="button"
            className={`mp-cat-btn ${category === "springs" ? "active" : ""}`}
            onClick={() => setCategory("springs")}
          >
            Springs ({springPresets.length})
          </button>
          <button
            type="button"
            className={`mp-cat-btn ${category === "inertia" ? "active" : ""}`}
            onClick={() => setCategory("inertia")}
          >
            Inertia ({inertiaPresets.length})
          </button>
          <button
            type="button"
            className={`mp-cat-btn ${category === "recipes" ? "active" : ""}`}
            onClick={() => setCategory("recipes")}
          >
            Recipes ({recipes.length})
          </button>
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="mp-preset-library-grid">
        {filteredItems.map((item) => (
          <div key={item.id} className="mp-library-card">
            <div className="mp-card-top">
              <span className="mp-library-title">{item.name}</span>
              <span className={`mp-cat-pill ${item.category}`}>{item.category.toUpperCase()}</span>
            </div>
            <p className="mp-library-desc">{item.description}</p>
            <div className="mp-library-footer">
              <span className="mp-library-details">{item.details}</span>
              <button type="button" className="mp-btn-apply" onClick={item.apply}>
                Apply Preset →
              </button>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="mp-no-results">
            <p>No physics presets found matching "{searchQuery}".</p>
          </div>
        )}
      </div>
    </div>
  );
};
