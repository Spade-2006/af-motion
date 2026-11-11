import React, { useState } from "react";
import type { GpuSimulationStudioState } from "../../types/gpu-simulations.js";
import { generateSimulationExportBundle } from "../../engine/gpu-simulations-engine.js";

interface SimulationCodeExportProps {
  state: GpuSimulationStudioState;
  onClose: () => void;
}

export const SimulationCodeExport: React.FC<SimulationCodeExportProps> = ({
  state,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    "react-hooks" | "react-components" | "vanilla" | "composition-json"
  >(state.exportFormat);
  const [copied, setCopied] = useState(false);

  const bundle = generateSimulationExportBundle(state);

  const getCode = () => {
    switch (activeTab) {
      case "react-hooks":
        return bundle.reactHookCode;
      case "react-components":
        return bundle.reactComponentCode;
      case "vanilla":
        return bundle.vanillaCode;
      case "composition-json":
        return bundle.compositionJson;
    }
  };

  const handleCopy = async () => {
    const code = getCode();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: "react-hooks", label: "React Hooks" },
    { id: "react-components", label: "React Components" },
    { id: "vanilla", label: "Vanilla TypeScript" },
    { id: "composition-json", label: "Composition JSON" },
  ];

  return (
    <div className="sim-modal-overlay" role="dialog" aria-modal="true" aria-label="Export Simulation Code">
      <div className="sim-modal-container">
        <div className="sim-modal-header">
          <div className="sim-modal-title-group">
            <h3 className="sim-modal-title">Export Simulation Code</h3>
            <span className="sim-badge sim-badge-accent">
              {state.backend.activeBackend.toUpperCase()}
            </span>
          </div>
          <button
            type="button"
            className="sim-modal-close"
            onClick={onClose}
            aria-label="Close Export Dialog"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="sim-modal-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`studio-tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="sim-code-preview-wrapper">
          <pre className="sim-code-preview">
            <code>{getCode()}</code>
          </pre>
        </div>

        {/* Modal Actions */}
        <div className="sim-modal-footer">
          <span className="sim-footer-note">
            Ready to paste directly into your AF Motion application.
          </span>
          <div className="sim-modal-actions">
            <button
              type="button"
              className="studio-btn studio-btn-outline"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="studio-btn studio-btn-primary"
              onClick={handleCopy}
            >
              {copied ? "✓ Copied!" : "📋 Copy to Clipboard"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
