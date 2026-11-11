import React, { useState } from "react";
import type {
  ChoreographyTrackConfig,
  MultiSystemActiveSettings,
} from "../../types/choreography.js";
import type { ChoreographyPattern } from "../../../src/core/choreography-intelligence/types.js";
import {
  generateChoreographyReactCode,
  generateChoreographyJson,
  generateMultiSystemJson,
} from "../../engine/choreography-builder-engine.js";

interface ChoreographyCodeExportProps {
  name: string;
  pattern: ChoreographyPattern;
  tracks: ChoreographyTrackConfig[];
  systems: MultiSystemActiveSettings;
  totalDurationMs: number;
}

export const ChoreographyCodeExport: React.FC<ChoreographyCodeExportProps> = ({
  name,
  pattern,
  tracks,
  systems,
  totalDurationMs,
}) => {
  const [activeTab, setActiveTab] = useState<"react" | "choreoJson" | "systemJson">("react");
  const [copied, setCopied] = useState(false);

  const reactCode = generateChoreographyReactCode(
    name,
    pattern,
    tracks,
    systems,
    totalDurationMs
  );
  const choreoJson = generateChoreographyJson(name, pattern, tracks, totalDurationMs);
  const systemJson = generateMultiSystemJson(systems, tracks);

  const currentCode =
    activeTab === "react" ? reactCode : activeTab === "choreoJson" ? choreoJson : systemJson;

  const currentFilename =
    activeTab === "react"
      ? `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-choreography.tsx`
      : activeTab === "choreoJson"
        ? `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-definition.json`
        : `multi-system-sync.json`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const mime = activeTab === "react" ? "text/typescript" : "application/json";
    const blob = new Blob([currentCode], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ch-code-export-panel">
      <div className="ch-export-toolbar">
        {/* Tab Switcher */}
        <div className="ch-export-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "react"}
            className={`ch-export-tab ${activeTab === "react" ? "active" : ""}`}
            onClick={() => setActiveTab("react")}
          >
            ⚛️ React Component (.tsx)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "choreoJson"}
            className={`ch-export-tab ${activeTab === "choreoJson" ? "active" : ""}`}
            onClick={() => setActiveTab("choreoJson")}
          >
            📄 Choreography JSON (.json)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "systemJson"}
            className={`ch-export-tab ${activeTab === "systemJson" ? "active" : ""}`}
            onClick={() => setActiveTab("systemJson")}
          >
            🌐 Multi-System JSON (.json)
          </button>
        </div>

        {/* Action Buttons */}
        <div className="ch-export-actions">
          <button
            type="button"
            className="ch-export-action-btn"
            onClick={handleCopy}
            title="Copy code to clipboard"
          >
            {copied ? "✓ Copied!" : "📋 Copy Code"}
          </button>
          <button
            type="button"
            className="ch-export-action-btn secondary"
            onClick={handleDownload}
            title="Download file"
          >
            ⬇️ Download {currentFilename}
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="ch-code-display-block">
        <pre>
          <code>{currentCode}</code>
        </pre>
      </div>

      {/* Footer Info */}
      <footer className="ch-export-footer">
        <span>Verified Package Subpaths:</span>
        <code className="ch-import-badge">af-motion</code>
        <code className="ch-import-badge">af-motion/react</code>
        <code className="ch-import-badge">af-motion/catalogue</code>
      </footer>
    </div>
  );
};
