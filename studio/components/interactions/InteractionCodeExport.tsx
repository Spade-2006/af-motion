import React, { useState } from "react";
import type { InteractionStudioState } from "../../types/interactions.js";
import { generateInteractionExportBundle } from "../../engine/interactions-engine.js";

interface InteractionCodeExportProps {
  state: InteractionStudioState;
  onClose: () => void;
}

export const InteractionCodeExport: React.FC<InteractionCodeExportProps> = ({
  state,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    "react-hooks" | "react-components" | "vanilla" | "gesture-sequence" | "json"
  >("react-hooks");
  const [copied, setCopied] = useState(false);

  const bundle = generateInteractionExportBundle(state);

  const getCodeSnippet = () => {
    switch (activeTab) {
      case "react-hooks":
        return bundle.reactHookCode;
      case "react-components":
        return bundle.reactComponentCode;
      case "vanilla":
        return bundle.vanillaCode;
      case "gesture-sequence":
        return bundle.gestureClassifierCode;
      case "json":
        return bundle.jsonSchema;
    }
  };

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(getCodeSnippet());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // In SSR or non-secure contexts
    }
  };

  return (
    <div className="ip-modal-overlay" onClick={onClose}>
      <div className="ip-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ip-modal-header">
          <div className="ip-modal-title-group">
            <h3 className="ip-modal-title">Export Interaction Configuration</h3>
            <span className="ip-modal-subtitle">
              Ready-to-use production code for React, Vanilla DOM, and JSON Schemas
            </span>
          </div>
          <button type="button" className="studio-btn studio-btn-xs" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="ip-modal-tabs">
          <button
            type="button"
            className={`studio-tab-btn ${activeTab === "react-hooks" ? "active" : ""}`}
            onClick={() => setActiveTab("react-hooks")}
          >
            React Hooks
          </button>
          <button
            type="button"
            className={`studio-tab-btn ${activeTab === "react-components" ? "active" : ""}`}
            onClick={() => setActiveTab("react-components")}
          >
            React Components
          </button>
          <button
            type="button"
            className={`studio-tab-btn ${activeTab === "vanilla" ? "active" : ""}`}
            onClick={() => setActiveTab("vanilla")}
          >
            Vanilla Controllers
          </button>
          <button
            type="button"
            className={`studio-tab-btn ${activeTab === "gesture-sequence" ? "active" : ""}`}
            onClick={() => setActiveTab("gesture-sequence")}
          >
            Gesture Sequence
          </button>
          <button
            type="button"
            className={`studio-tab-btn ${activeTab === "json" ? "active" : ""}`}
            onClick={() => setActiveTab("json")}
          >
            JSON Schema
          </button>
        </div>

        {/* Code Preview Stage */}
        <div className="ip-modal-body">
          <pre className="ip-code-block">
            <code>{getCodeSnippet()}</code>
          </pre>
        </div>

        {/* Actions Footer */}
        <div className="ip-modal-footer">
          <button
            type="button"
            className="studio-btn studio-btn-primary"
            onClick={handleCopy}
          >
            {copied ? "✓ Copied to Clipboard!" : "📋 Copy Code"}
          </button>
          <button type="button" className="studio-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
