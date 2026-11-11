import React, { useState } from "react";
import type { MotionPhysicsStudioState } from "../../types/motion-physics.js";
import { generatePhysicsExportBundle } from "../../engine/motion-physics-engine.js";

interface PhysicsCodeExportProps {
  state: MotionPhysicsStudioState;
}

type ExportTab = "react" | "vanilla" | "composition" | "json";

export const PhysicsCodeExport: React.FC<PhysicsCodeExportProps> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<ExportTab>("react");
  const [copied, setCopied] = useState(false);

  const bundle = generatePhysicsExportBundle(state);

  const currentSnippet =
    activeTab === "react"
      ? bundle.reactCode
      : activeTab === "vanilla"
      ? bundle.vanillaCode
      : activeTab === "composition"
      ? bundle.compositionCode
      : bundle.jsonConfig;

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(currentSnippet);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="mp-export-container">
      {/* Export Toolbar */}
      <div className="mp-export-toolbar">
        <div className="mp-export-tabs">
          <button
            type="button"
            className={`mp-export-tab ${activeTab === "react" ? "active" : ""}`}
            onClick={() => setActiveTab("react")}
          >
            ⚛️ React Component
          </button>
          <button
            type="button"
            className={`mp-export-tab ${activeTab === "vanilla" ? "active" : ""}`}
            onClick={() => setActiveTab("vanilla")}
          >
            🚀 Core Engine API
          </button>
          <button
            type="button"
            className={`mp-export-tab ${activeTab === "composition" ? "active" : ""}`}
            onClick={() => setActiveTab("composition")}
          >
            🧩 Physics Composition
          </button>
          <button
            type="button"
            className={`mp-export-tab ${activeTab === "json" ? "active" : ""}`}
            onClick={() => setActiveTab("json")}
          >
            📋 JSON Schema
          </button>
        </div>

        <button type="button" className="mp-btn-copy" onClick={handleCopy}>
          {copied ? "✓ Copied to Clipboard!" : "Copy Code"}
        </button>
      </div>

      {/* Code Display */}
      <div className="mp-code-display-block">
        <pre>
          <code>{currentSnippet}</code>
        </pre>
      </div>

      <div className="mp-export-footer">
        <span>Verified for AF Motion Core &amp; React Integration • Zero Dependencies</span>
      </div>
    </div>
  );
};
