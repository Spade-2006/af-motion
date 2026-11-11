import React, { useState } from "react";

export interface DocsPlaygroundContainerProps {
  title: string;
  badge?: string;
  description?: string;
  preview: React.ReactNode;
  controls: React.ReactNode;
  code: string;
  language?: string;
  statusText?: string;
  onRun?: () => void;
  onReset?: () => void;
  isRunning?: boolean;
}

export const DocsPlaygroundContainer: React.FC<DocsPlaygroundContainerProps> = ({
  title,
  badge = "Live Interactive Demo",
  description,
  preview,
  controls,
  code,
  language = "typescript",
  statusText = "Ready",
  onRun,
  onReset,
  isRunning = false,
}) => {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="docs-playground-card" data-testid="playground-container">
      {/* Header */}
      <div className="docs-playground-header">
        <div className="docs-playground-title-group">
          <span className="docs-playground-badge">{badge}</span>
          <h3 className="docs-playground-title">{title}</h3>
        </div>

        <div className="docs-playground-actions">
          <div className="docs-tab-toggle">
            <button
              type="button"
              className={`docs-tab-btn ${activeTab === "preview" ? "active" : ""}`}
              onClick={() => setActiveTab("preview")}
            >
              Interactive Preview
            </button>
            <button
              type="button"
              className={`docs-tab-btn ${activeTab === "code" ? "active" : ""}`}
              onClick={() => setActiveTab("code")}
            >
              Code
            </button>
          </div>

          {onRun && (
            <button
              type="button"
              className="docs-run-btn"
              onClick={onRun}
              disabled={isRunning}
              data-testid="playground-run-btn"
            >
              {isRunning ? "Running..." : "▶ Run"}
            </button>
          )}

          {onReset && (
            <button
              type="button"
              className="docs-reset-btn"
              onClick={onReset}
              data-testid="playground-reset-btn"
            >
              ↺ Reset
            </button>
          )}

          <button
            type="button"
            className="docs-copy-code-btn"
            onClick={handleCopy}
            data-testid="playground-copy-btn"
          >
            {copied ? "✓ Copied" : "Copy Code"}
          </button>
        </div>
      </div>

      {description && <p className="docs-playground-desc">{description}</p>}

      {/* Main Body */}
      <div className="docs-playground-body">
        {activeTab === "preview" ? (
          <div className="docs-playground-grid">
            {/* Viewport Preview Area */}
            <div className="docs-playground-viewport" data-testid="playground-viewport">
              {preview}
              <div className="docs-playground-status">
                <span className="status-indicator" />
                <span className="status-text">{statusText}</span>
              </div>
            </div>

            {/* Controls Panel */}
            <div className="docs-playground-controls" data-testid="playground-controls">
              <h4 className="controls-heading">Parameters</h4>
              {controls}
            </div>
          </div>
        ) : (
          <div className="docs-playground-code-view">
            <div className="code-header">
              <span className="code-lang">{language}</span>
            </div>
            <pre className="code-content">
              <code>{code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
