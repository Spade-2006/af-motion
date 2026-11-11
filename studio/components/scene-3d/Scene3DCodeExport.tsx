import React, { useState } from "react";
import type { Scene3DSpecification } from "../../../src/3d/schemas/types.js";
import {
  generateSceneJson,
  generateSceneR3FCode,
  generateSceneVanillaJsCode,
} from "../../engine/scene-3d-studio-engine.js";

interface Scene3DCodeExportProps {
  scene: Scene3DSpecification;
}

export const Scene3DCodeExport: React.FC<Scene3DCodeExportProps> = ({ scene }) => {
  const [activeTab, setActiveTab] = useState<"react" | "json" | "vanilla">("react");
  const [copied, setCopied] = useState(false);

  const reactCode = generateSceneR3FCode(scene);
  const jsonCode = generateSceneJson(scene);
  const vanillaCode = generateSceneVanillaJsCode(scene);

  const currentCode =
    activeTab === "react" ? reactCode : activeTab === "json" ? jsonCode : vanillaCode;

  const currentFilename =
    activeTab === "react"
      ? `${scene.name?.toLowerCase().replace(/[^a-z0-9]/g, "-") ?? "scene-3d"}.tsx`
      : activeTab === "json"
      ? `${scene.name?.toLowerCase().replace(/[^a-z0-9]/g, "-") ?? "scene-3d"}.json`
      : `${scene.name?.toLowerCase().replace(/[^a-z0-9]/g, "-") ?? "scene-3d"}.js`;

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
    const mime =
      activeTab === "react"
        ? "text/typescript"
        : activeTab === "json"
        ? "application/json"
        : "text/javascript";
    const blob = new Blob([currentCode], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="scene3d-export-panel">
      <div className="scene3d-panel-header">
        <h3 className="scene3d-panel-title">💻 Code Generation & Export</h3>
      </div>

      <p className="scene3d-panel-subtitle">
        Export production-ready React TSX components, deterministic Scene JSON, or framework-independent scripts.
      </p>

      {/* Export Toolbar */}
      <div className="scene3d-export-toolbar">
        <div className="scene3d-export-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "react"}
            className={`scene3d-export-tab ${activeTab === "react" ? "active" : ""}`}
            onClick={() => setActiveTab("react")}
          >
            ⚛️ React Component (.tsx)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "json"}
            className={`scene3d-export-tab ${activeTab === "json" ? "active" : ""}`}
            onClick={() => setActiveTab("json")}
          >
            📄 Scene JSON (.json)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "vanilla"}
            className={`scene3d-export-tab ${activeTab === "vanilla" ? "active" : ""}`}
            onClick={() => setActiveTab("vanilla")}
          >
            🌐 Vanilla JS (.js)
          </button>
        </div>

        <div className="scene3d-export-actions">
          <button
            type="button"
            className="scene3d-primary-btn"
            onClick={handleCopy}
            title="Copy code to clipboard"
          >
            {copied ? "✓ Copied!" : "📋 Copy Code"}
          </button>
          <button
            type="button"
            className="scene3d-secondary-btn"
            onClick={handleDownload}
            title="Download file"
          >
            ⬇️ Download {currentFilename}
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="scene3d-code-display-block">
        <pre>
          <code>{currentCode}</code>
        </pre>
      </div>

      {/* Footer Verified Subpaths */}
      <footer className="scene3d-export-footer">
        <span>Verified Package Subpaths:</span>
        <code className="scene3d-import-badge">af-motion</code>
        <code className="scene3d-import-badge">af-motion/react</code>
        <code className="scene3d-import-badge">af-motion/catalogue</code>
      </footer>
    </div>
  );
};
