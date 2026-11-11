import React from "react";
import type { ChoreographyTemplate } from "../../types/choreography.js";

interface ChoreographyTemplateSelectorProps {
  templates: ChoreographyTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  onDuplicateTemplate: () => void;
  onResetTemplate: () => void;
}

export const ChoreographyTemplateSelector: React.FC<ChoreographyTemplateSelectorProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onDuplicateTemplate,
  onResetTemplate,
}) => {
  return (
    <div className="ch-template-selector-panel">
      <div className="ch-section-header">
        <h3 className="ch-section-title">📂 Choreography Templates</h3>
        <div className="ch-header-actions">
          <button
            type="button"
            className="ch-action-btn"
            onClick={onDuplicateTemplate}
            title="Duplicate selected template"
          >
            📋 Duplicate
          </button>
          <button
            type="button"
            className="ch-action-btn secondary"
            onClick={onResetTemplate}
            title="Reset template to factory defaults"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      <p className="ch-section-subtitle">
        Select, customize, and orchestrate verified production recipes dynamically discovered from the library.
      </p>

      <div className="ch-templates-list" role="list">
        {templates.map((tpl) => {
          const isSelected = tpl.id === selectedTemplateId;
          return (
            <button
              key={tpl.id}
              type="button"
              role="listitem"
              className={`ch-template-card ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectTemplate(tpl.id)}
            >
              <div className="ch-template-card-header">
                <span className="ch-template-name">{tpl.name}</span>
                <span className="ch-pattern-tag">{tpl.pattern}</span>
              </div>

              <p className="ch-template-desc">{tpl.description}</p>

              <div className="ch-template-meta-row">
                <span className="ch-template-duration">⏱️ {tpl.totalDurationMs}ms</span>
                <span className="ch-template-tracks">
                  🎬 {tpl.tracks.length} tracks
                </span>
                {tpl.isCustom && <span className="ch-custom-badge">Custom</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
