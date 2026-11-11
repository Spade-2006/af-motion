import React, { useState } from "react";
import type {
  StyleCustomizationValues,
  StylePreviewComponentKind,
} from "../../types/style-explorer.js";
import {
  generateStyleReactCode,
  generateStyleExportJson,
  getVisualStyleById,
} from "../../engine/style-explorer-engine.js";

interface StyleCodeExportProps {
  styleId: string;
  componentKind: StylePreviewComponentKind;
  customization?: StyleCustomizationValues;
}

export const StyleCodeExport: React.FC<StyleCodeExportProps> = ({
  styleId,
  componentKind,
  customization,
}) => {
  const [activeTab, setActiveTab] = useState<"react" | "json">("react");
  const [copied, setCopied] = useState(false);

  const def = getVisualStyleById(styleId);
  const reactCode = generateStyleReactCode(styleId, componentKind, customization);
  const jsonCode = generateStyleExportJson(styleId, customization);

  const currentCode = activeTab === "react" ? reactCode : jsonCode;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onDownload = () => {
    const filename =
      activeTab === "react"
        ? `${def.name.replace(/[^a-zA-Z0-9]/g, "")}${componentKind.charAt(0).toUpperCase() + componentKind.slice(1)}.tsx`
        : `${styleId}-style-config.json`;

    const blob = new Blob([currentCode], { type: "text/plain;charset=utf-8" });
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
    <div className="style-code-export-panel">
      <div className="export-panel-header">
        <div className="export-tabs">
          <button
            type="button"
            className={`export-tab-btn ${activeTab === "react" ? "active" : ""}`}
            onClick={() => setActiveTab("react")}
          >
            ⚛️ React Component (.tsx)
          </button>
          <button
            type="button"
            className={`export-tab-btn ${activeTab === "json" ? "active" : ""}`}
            onClick={() => setActiveTab("json")}
          >
            📄 Style JSON Config
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
            ⬇️ Download File
          </button>
        </div>
      </div>

      <div className="export-code-view">
        <pre className="code-block">
          <code>{currentCode}</code>
        </pre>
      </div>

      <div className="export-footer-info">
        <span>Verified imports:</span>
        <div className="import-tags">
          <span className="import-badge">af-motion/catalogue</span>
          <span className="import-badge">af-motion/react</span>
        </div>
      </div>
    </div>
  );
};
