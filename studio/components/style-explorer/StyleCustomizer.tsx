import React from "react";
import type { StyleCustomizationValues } from "../../types/style-explorer.js";

interface StyleCustomizerProps {
  customization: StyleCustomizationValues;
  onChange: (val: StyleCustomizationValues) => void;
  onReset: () => void;
}

export const StyleCustomizer: React.FC<StyleCustomizerProps> = ({
  customization,
  onChange,
  onReset,
}) => {
  const update = (key: keyof StyleCustomizationValues, value: any) => {
    onChange({
      ...customization,
      [key]: value,
    });
  };

  return (
    <div className="style-customizer-panel">
      <div className="customizer-header">
        <h4 className="customizer-title">Style Customizer</h4>
        <button
          type="button"
          className="btn-reset-defaults"
          onClick={onReset}
          title="Restore baseline registry style"
        >
          Reset
        </button>
      </div>

      <div className="customizer-controls">
        <div className="control-row">
          <label>Corner Radius ({customization.borderRadius ?? "default"}px)</label>
          <input
            type="range"
            min="0"
            max="32"
            value={customization.borderRadius ?? 8}
            onChange={(e) => update("borderRadius", Number(e.target.value))}
          />
        </div>

        <div className="control-row">
          <label>Border Width ({customization.borderWidth ?? "default"}px)</label>
          <input
            type="range"
            min="0"
            max="6"
            value={customization.borderWidth ?? 1}
            onChange={(e) => update("borderWidth", Number(e.target.value))}
          />
        </div>

        <div className="control-row">
          <label>Elevation & Depth ({(customization.elevation ?? 1.0).toFixed(1)}x)</label>
          <input
            type="range"
            min="0.2"
            max="2.0"
            step="0.1"
            value={customization.elevation ?? 1.0}
            onChange={(e) => update("elevation", Number(e.target.value))}
          />
        </div>

        <div className="control-row">
          <label>Typography Scale ({(customization.fontScale ?? 1.0).toFixed(1)}x)</label>
          <input
            type="range"
            min="0.8"
            max="1.3"
            step="0.05"
            value={customization.fontScale ?? 1.0}
            onChange={(e) => update("fontScale", Number(e.target.value))}
          />
        </div>

        <div className="control-row">
          <label>Custom Surface Base Color</label>
          <div className="color-field">
            <span>Color</span>
            <input
              type="color"
              value={customization.backgroundColor?.slice(0, 7) ?? "#1e2230"}
              onChange={(e) => update("backgroundColor", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
