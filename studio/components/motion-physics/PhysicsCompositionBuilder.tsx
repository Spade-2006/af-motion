import React, { useMemo } from "react";
import type { MotionPhysicsStudioState } from "../../types/motion-physics.js";
import {
  listAvailableRecipes,
  createDefaultMotionPhysicsState,
} from "../../engine/motion-physics-engine.js";
import { getPhysicsRecipe } from "../../../src/core/physics/composition-recipes.js";

interface PhysicsCompositionBuilderProps {
  state: MotionPhysicsStudioState;
  onUpdateState: (updater: (prev: MotionPhysicsStudioState) => MotionPhysicsStudioState) => void;
}

export const PhysicsCompositionBuilder: React.FC<PhysicsCompositionBuilderProps> = ({
  state,
  onUpdateState,
}) => {
  const { compositionConfig, selectedRecipeId, bodies } = state;
  const availableRecipes = useMemo(() => listAvailableRecipes(), []);

  const handleSelectRecipe = (recipeId: string) => {
    const recipe = getPhysicsRecipe(recipeId);
    if (!recipe) return;
    const config = recipe.create();
    onUpdateState((prev) => ({
      ...prev,
      compositionConfig: config,
      selectedRecipeId: recipeId,
    }));
  };

  return (
    <div className="mp-composition-layout">
      {/* Recipe Selection Column */}
      <section className="mp-spring-controls-card">
        <div className="mp-panel-header">
          <h3 className="mp-panel-title">Multi-System Physics Recipes</h3>
        </div>

        <div className="mp-recipes-grid">
          {availableRecipes.map((r) => (
            <div
              key={r.id}
              className={`mp-recipe-card ${selectedRecipeId === r.id ? "active" : ""}`}
              onClick={() => handleSelectRecipe(r.id)}
            >
              <div className="mp-recipe-card-header">
                <span className="mp-recipe-name">{r.name}</span>
                <span className="mp-recipe-pill">COMPOSITION</span>
              </div>
              <p className="mp-recipe-desc">{r.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Composition Inspector & Serialization */}
      <section className="mp-spring-preview-card">
        <h4 className="mp-graph-title">Active Composition Plan</h4>

        <div className="mp-composition-details">
          <div className="mp-composition-summary-card">
            <div className="mp-metric-item">
              <span className="mp-metric-label">Composition ID</span>
              <span className="mp-metric-val">{compositionConfig.id}</span>
            </div>
            <div className="mp-metric-item">
              <span className="mp-metric-label">Timestep (dt)</span>
              <span className="mp-metric-val">{compositionConfig.timestep ? `${(compositionConfig.timestep * 1000).toFixed(1)}ms` : "16.7ms"}</span>
            </div>
            <div className="mp-metric-item">
              <span className="mp-metric-label">Participating Bodies</span>
              <span className="mp-metric-val">{compositionConfig.bodies?.length ?? bodies.length}</span>
            </div>
          </div>

          <h5 className="mp-sub-heading" style={{ marginTop: "16px" }}>
            Serialized Behavior Graph
          </h5>
          <div className="mp-composition-json-viewer">
            <pre>
              {JSON.stringify(
                {
                  id: compositionConfig.id,
                  timestep: compositionConfig.timestep,
                  gravity: compositionConfig.gravity,
                  bounds: compositionConfig.bounds,
                  bodiesCount: compositionConfig.bodies?.length ?? bodies.length,
                  behaviors: compositionConfig.behaviors?.map((b) => b.type) ?? [
                    "gravity",
                    "bounds",
                    "collision",
                  ],
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
};
