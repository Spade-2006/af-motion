import React from "react";
import {
  listAvailableSceneTemplates,
  getSceneTemplateByName,
} from "../../engine/scene-3d-studio-engine.js";
import type { Scene3DRecipeName } from "../../../src/3d/composition/recipes.js";
import type { Scene3DSpecification } from "../../../src/3d/schemas/types.js";

interface Scene3DTemplateSelectorProps {
  currentSceneName?: string;
  onLoadTemplate: (spec: Scene3DSpecification) => void;
  onDuplicateScene: () => void;
  onResetScene: () => void;
}

export const Scene3DTemplateSelector: React.FC<Scene3DTemplateSelectorProps> = ({
  currentSceneName,
  onLoadTemplate,
  onDuplicateScene,
  onResetScene,
}) => {
  const templates = listAvailableSceneTemplates();

  const handleSelect = (name: Scene3DRecipeName) => {
    const spec = getSceneTemplateByName(name);
    onLoadTemplate(spec);
  };

  return (
    <div className="scene3d-template-panel">
      <div className="scene3d-panel-header">
        <h3 className="scene3d-panel-title">📂 3D Scene Recipes & Templates</h3>
        <div className="scene3d-header-btn-row">
          <button
            type="button"
            className="scene3d-secondary-btn"
            onClick={onDuplicateScene}
            title="Duplicate active scene"
          >
            📋 Duplicate
          </button>
          <button
            type="button"
            className="scene3d-secondary-btn danger"
            onClick={onResetScene}
            title="Reset to default Product Showcase"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      <p className="scene3d-panel-subtitle">
        Production-grade 3D compositions dynamically discovered from AF Motion&apos;s verified recipe library.
      </p>

      <div className="scene3d-templates-grid" role="list">
        {templates.map((tpl) => {
          const isSelected = currentSceneName?.toLowerCase() === tpl.title.toLowerCase();

          return (
            <button
              key={tpl.name}
              type="button"
              role="listitem"
              className={`scene3d-template-card ${isSelected ? "selected" : ""}`}
              onClick={() => handleSelect(tpl.name)}
            >
              <div className="scene3d-template-card-top">
                <span className="scene3d-template-title">{tpl.title}</span>
                <span className="scene3d-template-badge">{tpl.name}</span>
              </div>
              <p className="scene3d-template-desc">{tpl.description}</p>
              <div className="scene3d-template-meta">
                <span>📷 {tpl.defaultCamera}</span>
                <span>💡 {tpl.defaultLighting}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
