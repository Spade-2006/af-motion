import React, { useState } from "react";
import type { UnifiedCompositionState } from "../../types/unified-playground.js";
import { generateUnifiedExportBundle } from "../../engine/unified-playground-engine.js";

interface UnifiedCodeExportModalProps {
  state: UnifiedCompositionState;
  isOpen: boolean;
  onClose: () => void;
}

export const UnifiedCodeExportModal: React.FC<UnifiedCodeExportModalProps> = ({
  state,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"react" | "vanilla" | "json" | "css">("react");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const bundle = generateUnifiedExportBundle(state);

  const getCodeText = (): string => {
    switch (activeTab) {
      case "react":
        return bundle.reactCode;
      case "vanilla":
        return bundle.vanillaCode;
      case "json":
        return bundle.compositionJson;
      case "css":
        return Object.entries(bundle.cssTokens)
          .map(([k, v]) => `${k}: ${v};`)
          .join("\n");
      default:
        return "";
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(getCodeText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="unified-export-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="unified-export-modal-content"
        style={{
          width: "100%",
          maxWidth: "760px",
          maxHeight: "85vh",
          backgroundColor: "#0F172A",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#F8FAFC" }}>
              Export Unified Experience
            </h3>
            <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
              Production-ready snippets for React, Vanilla JS, Composition Spec & Tokens
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#94A3B8",
              fontSize: "1.2rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            padding: "8px 20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          }}
        >
          <button
            type="button"
            className={`unified-export-tab ${activeTab === "react" ? "active" : ""}`}
            onClick={() => setActiveTab("react")}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: activeTab === "react" ? "1px solid #38BDF8" : "none",
              background: activeTab === "react" ? "rgba(56, 189, 248, 0.15)" : "transparent",
              color: activeTab === "react" ? "#38BDF8" : "#94A3B8",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            React (af-motion/react)
          </button>
          <button
            type="button"
            className={`unified-export-tab ${activeTab === "vanilla" ? "active" : ""}`}
            onClick={() => setActiveTab("vanilla")}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: activeTab === "vanilla" ? "1px solid #38BDF8" : "none",
              background: activeTab === "vanilla" ? "rgba(56, 189, 248, 0.15)" : "transparent",
              color: activeTab === "vanilla" ? "#38BDF8" : "#94A3B8",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Vanilla TypeScript
          </button>
          <button
            type="button"
            className={`unified-export-tab ${activeTab === "json" ? "active" : ""}`}
            onClick={() => setActiveTab("json")}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: activeTab === "json" ? "1px solid #38BDF8" : "none",
              background: activeTab === "json" ? "rgba(56, 189, 248, 0.15)" : "transparent",
              color: activeTab === "json" ? "#38BDF8" : "#94A3B8",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Composition JSON (Spec 1.0)
          </button>
          <button
            type="button"
            className={`unified-export-tab ${activeTab === "css" ? "active" : ""}`}
            onClick={() => setActiveTab("css")}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: activeTab === "css" ? "1px solid #38BDF8" : "none",
              background: activeTab === "css" ? "rgba(56, 189, 248, 0.15)" : "transparent",
              color: activeTab === "css" ? "#38BDF8" : "#94A3B8",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            CSS Tokens
          </button>
        </div>

        {/* Code Content */}
        <div style={{ position: "relative", flex: 1, overflow: "hidden", display: "flex" }}>
          <pre
            style={{
              margin: 0,
              padding: "16px 20px",
              flex: 1,
              overflow: "auto",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "0.8rem",
              lineHeight: 1.5,
              color: "#E2E8F0",
              backgroundColor: "#090D16",
            }}
          >
            <code>{getCodeText()}</code>
          </pre>

          <button
            type="button"
            onClick={handleCopy}
            style={{
              position: "absolute",
              top: "12px",
              right: "20px",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              background: copied ? "#10B981" : "rgba(255, 255, 255, 0.1)",
              color: copied ? "#FFFFFF" : "#F8FAFC",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {copied ? "✓ Copied!" : "📋 Copy Code"}
          </button>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            fontSize: "0.75rem",
            color: "#64748B",
          }}
        >
          <span>Valid imports verified: af-motion, af-motion/react, af-motion/catalogue</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              background: "transparent",
              color: "#F8FAFC",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
