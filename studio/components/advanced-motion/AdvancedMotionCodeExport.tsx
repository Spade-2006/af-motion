import React, { useState } from "react";
import type { AdvancedMotionStudioState } from "../../types/advanced-motion.js";
import { generateAdvancedMotionExportBundle } from "../../engine/advanced-motion-engine.js";

interface AdvancedMotionCodeExportProps {
  state: AdvancedMotionStudioState;
  onClose: () => void;
}

export const AdvancedMotionCodeExport: React.FC<AdvancedMotionCodeExportProps> = ({
  state,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    "react-hooks" | "react-components" | "vanilla" | "composition" | "json"
  >("react-hooks");
  const [copied, setCopied] = useState(false);

  const bundle = generateAdvancedMotionExportBundle(state);

  const getCodeSnippet = () => {
    switch (activeTab) {
      case "react-hooks":
        return bundle.reactHookCode;
      case "react-components":
        return bundle.reactComponentCode;
      case "vanilla":
        return bundle.vanillaCode;
      case "composition":
        return bundle.compositionCode;
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
    <div className="am-modal-overlay" onClick={onClose}>
      <div className="am-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="am-modal-header">
          <div className="am-modal-title-group">
            <h3 className="am-modal-title">Export Advanced Motion Configuration</h3>
            <span className="am-modal-subtitle">
              Production-ready snippets for Layout FLIP, SVG Morph, Motion Paths, and Composition
            </span>
          </div>
          <button type="button" className="studio-btn studio-btn-xs" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="am-modal-tabs">
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
            className={`studio-tab-btn ${activeTab === "composition" ? "active" : ""}`}
            onClick={() => setActiveTab("composition")}
          >
            Composition Pipeline
          </button>
          <button
            type="button"
            className={`studio-tab-btn ${activeTab === "json" ? "active" : ""}`}
            onClick={() => setActiveTab("json")}
          >
            JSON Schema
          </button>
        </div>

        {/* Code Content */}
        <div className="am-modal-body">
          <pre className="am-code-block">
            <code>{getCodeSnippet()}</code>
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="am-modal-footer">
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
