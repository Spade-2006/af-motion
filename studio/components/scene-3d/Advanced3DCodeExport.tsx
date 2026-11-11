import React, { useState } from "react";
import type { Advanced3DStudioState } from "../../types/advanced-3d.js";
import { generateAdvanced3DExportBundle } from "../../engine/advanced-3d-engine.js";

interface Advanced3DCodeExportProps {
  state: Advanced3DStudioState;
  onClose: () => void;
}

export const Advanced3DCodeExport: React.FC<Advanced3DCodeExportProps> = ({
  state,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"react-r3f" | "vanilla-ts" | "scene-json">(
    state.exportFormat
  );
  const [copied, setCopied] = useState(false);

  const bundle = generateAdvanced3DExportBundle(state);

  const getCode = () => {
    switch (activeTab) {
      case "react-r3f":
        return bundle.reactR3fCode;
      case "vanilla-ts":
        return bundle.vanillajsCode;
      case "scene-json":
        return bundle.sceneJson;
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
    { id: "react-r3f", label: "React Three Fiber (R3F)" },
    { id: "vanilla-ts", label: "Vanilla TypeScript" },
    { id: "scene-json", label: "Complete Scene JSON" },
  ];

  return (
    <div className="adv3d-modal-overlay" role="dialog" aria-modal="true" aria-label="Export 3D Scene Code">
      <div className="adv3d-modal-container">
        <div className="adv3d-modal-header">
          <div className="adv3d-modal-title-group">
            <h3 className="adv3d-modal-title">Export 3D Scene &amp; World Code</h3>
            <span className="adv3d-badge adv3d-badge-accent">Production Ready</span>
          </div>
          <button
            type="button"
            className="adv3d-modal-close"
            onClick={onClose}
            aria-label="Close Export Dialog"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="adv3d-modal-tabs">
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
        <div className="adv3d-code-preview-wrapper">
          <pre className="adv3d-code-preview">
            <code>{getCode()}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="adv3d-modal-footer">
          <span className="adv3d-footer-note">
            Uses official AF Motion 3D public APIs and exports.
          </span>
          <div className="adv3d-modal-actions">
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
