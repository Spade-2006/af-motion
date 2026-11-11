import React, { useState } from "react";
import type {
  CustomDesignSystemTokens,
  CustomMotionDNAValues,
} from "../../types/design-systems.js";
import type { DesignSystem } from "../../../src/core/design-system.js";
import type { MotionDNA } from "../../../src/core/motion-dna.js";
import {
  generateDesignSystemCssVariables,
  generateDesignSystemReactCode,
  generateCombinedExportJson,
} from "../../engine/design-system-dna-engine.js";

interface DesignSystemCodeExportProps {
  system: DesignSystem;
  dna: MotionDNA;
  tokens: CustomDesignSystemTokens;
  dnaValues: CustomMotionDNAValues;
}

export const DesignSystemCodeExport: React.FC<DesignSystemCodeExportProps> = ({
  system,
  dna,
  tokens,
  dnaValues,
}) => {
  const [activeTab, setActiveTab] = useState<"react" | "css" | "json">("react");
  const [copied, setCopied] = useState(false);

  const reactCode = generateDesignSystemReactCode(system.name, tokens, dnaValues);
  const cssCode = generateDesignSystemCssVariables(tokens, dnaValues);
  const jsonCode = generateCombinedExportJson(system, dna, tokens, dnaValues);

  const currentCode =
    activeTab === "react" ? reactCode : activeTab === "css" ? cssCode : jsonCode;

  const currentFilename =
    activeTab === "react"
      ? `${system.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-showcase.tsx`
      : activeTab === "css"
        ? `${system.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-tokens.css`
        : `${system.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-config.json`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const mime =
      activeTab === "react"
        ? "text/typescript"
        : activeTab === "css"
          ? "text/css"
          : "application/json";
    const blob = new Blob([currentCode], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ds-code-export-panel">
      <div className="ds-export-toolbar">
        {/* Tab Switcher */}
        <div className="ds-export-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "react"}
            className={`ds-export-tab ${activeTab === "react" ? "active" : ""}`}
            onClick={() => setActiveTab("react")}
          >
            ⚛️ React Component (.tsx)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "css"}
            className={`ds-export-tab ${activeTab === "css" ? "active" : ""}`}
            onClick={() => setActiveTab("css")}
          >
            🎨 CSS Variables (.css)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "json"}
            className={`ds-export-tab ${activeTab === "json" ? "active" : ""}`}
            onClick={() => setActiveTab("json")}
          >
            📄 JSON Config (.json)
          </button>
        </div>

        {/* Action Buttons */}
        <div className="ds-export-actions">
          <button
            type="button"
            className="ds-export-action-btn"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? "✓ Copied!" : "📋 Copy Code"}
          </button>
          <button
            type="button"
            className="ds-export-action-btn secondary"
            onClick={handleDownload}
            title="Download file"
          >
            ⬇️ Download {currentFilename}
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="ds-code-display-block">
        <pre>
          <code>{currentCode}</code>
        </pre>
      </div>

      {/* Footer Info */}
      <footer className="ds-export-footer">
        <span>Verified Package Subpaths:</span>
        <code className="ds-import-badge">af-motion/react</code>
        <code className="ds-import-badge">af-motion/catalogue</code>
      </footer>
    </div>
  );
};
