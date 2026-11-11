import React, { useState } from "react";
import type { StudioExportBundle } from "../types/index.js";

interface CodeExportPanelProps {
  bundle: StudioExportBundle;
}

export const CodeExportPanel: React.FC<CodeExportPanelProps> = ({ bundle }) => {
  const [activeTab, setActiveTab] = useState<"react" | "json" | "css">("react");
  const [copied, setCopied] = useState(false);

  const getActiveCode = () => {
    switch (activeTab) {
      case "json":
        return bundle.configJson;
      case "css":
        return Object.entries(bundle.cssVariables)
          .map(([k, v]) => `  ${k}: ${v};`)
          .join("\n");
      case "react":
      default:
        return bundle.reactCode;
    }
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(getActiveCode());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onDownload = () => {
    const code = getActiveCode();
    const filename =
      activeTab === "react"
        ? "StudioComponent.tsx"
        : activeTab === "json"
          ? "af-motion-config.json"
          : "studio-styles.css";

    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="code-export-panel">
      <div className="export-panel-header">
        <div className="export-tabs">
          <button
            type="button"
            className={`export-tab-btn ${activeTab === "react" ? "active" : ""}`}
            onClick={() => setActiveTab("react")}
          >
            ⚛️ React (.tsx)
          </button>
          <button
            type="button"
            className={`export-tab-btn ${activeTab === "json" ? "active" : ""}`}
            onClick={() => setActiveTab("json")}
          >
            📄 JSON Config
          </button>
          <button
            type="button"
            className={`export-tab-btn ${activeTab === "css" ? "active" : ""}`}
            onClick={() => setActiveTab("css")}
          >
            🎨 CSS Variables
          </button>
        </div>

        <div className="export-actions">
          <button
            type="button"
            className={`btn-action ${copied ? "copied" : ""}`}
            onClick={onCopy}
          >
            {copied ? "✓ Copied!" : "📋 Copy Code"}
          </button>
          <button
            type="button"
            className="btn-action btn-download"
            onClick={onDownload}
          >
            ⬇️ Download
          </button>
        </div>
      </div>

      <div className="export-code-view">
        <pre className="code-block">
          <code>{getActiveCode()}</code>
        </pre>
      </div>

      <div className="export-footer-info">
        <span>Verified imports from official subpaths:</span>
        <div className="import-tags">
          {bundle.imports.map((imp) => (
            <span key={imp.subpath} className="import-badge">
              {imp.subpath}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
