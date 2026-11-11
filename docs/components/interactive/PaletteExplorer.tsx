import React, { useState } from "react";
import { BUILT_IN_PALETTE_INPUTS } from "../../../src/core/built-in-palettes.js";
import { activatePalette } from "../../../src/index.js";
import { DocsPlaygroundContainer } from "./DocsPlaygroundContainer.js";

export const PaletteExplorer: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const activePalette = BUILT_IN_PALETTE_INPUTS[selectedIdx] || BUILT_IN_PALETTE_INPUTS[0];

  const handleCopyColor = async (hex: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(hex);
        setCopiedHex(hex);
        setTimeout(() => setCopiedHex(null), 1500);
      }
    } catch {}
  };

  const handleApplyPalette = () => {
    try {
      const kebab = activePalette.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      activatePalette(kebab);
    } catch {}
  };

  const generatedCode = `import { activatePalette } from "af-motion";

// 1. Activate '${activePalette.name}' globally to inject CSS variables:
activatePalette("${activePalette.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}");

// Available Tokens:
// Primary:    ${activePalette.primary} (${activePalette.colorNames.primary})
// Secondary:  ${activePalette.secondary} (${activePalette.colorNames.secondary})
// Accent:     ${activePalette.accent} (${activePalette.colorNames.accent})`;

  return (
    <DocsPlaygroundContainer
      title="33 Built-in Color Palettes Explorer"
      badge="Color Tokens & Theming"
      description="Inspect all 33 immutable palettes, copy hex values, and test live UI component styling."
      code={generatedCode}
      preview={
        <div
          className="palette-preview-frame"
          style={{
            padding: "24px",
            borderRadius: "14px",
            background: "#090b0e",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            transition: "all 0.3s ease",
          }}
        >
          {/* Mock Component Preview */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              padding: "16px",
              borderRadius: "10px",
              marginBottom: "16px",
              border: `1px solid ${activePalette.accent}44`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <strong style={{ fontSize: "1rem" }}>{activePalette.name}</strong>
              <span
                style={{
                  background: activePalette.accent,
                  color: "#ffffff",
                  padding: "3px 8px",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                {activePalette.colorNames.accent}
              </span>
            </div>
            <p style={{ margin: "0 0 12px 0", fontSize: "0.85rem", opacity: 0.85 }}>
              Live UI component rendering with palette color tokens.
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                style={{
                  background: activePalette.accent,
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Primary Action
              </button>
              <button
                type="button"
                style={{
                  background: "transparent",
                  color: activePalette.secondary,
                  border: `1px solid ${activePalette.secondary}66`,
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Secondary
              </button>
            </div>
          </div>

          {/* Color Swatches Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {[
              { label: "Primary", hex: activePalette.primary, name: activePalette.colorNames.primary },
              { label: "Secondary", hex: activePalette.secondary, name: activePalette.colorNames.secondary },
              { label: "Accent", hex: activePalette.accent, name: activePalette.colorNames.accent },
            ].map((col) => (
              <div
                key={col.label}
                onClick={() => handleCopyColor(col.hex)}
                style={{
                  background: col.hex,
                  padding: "12px 8px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.2)",
                  textAlign: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
                title="Click to copy HEX"
              >
                <div style={{ fontSize: "0.7rem", fontWeight: 700, filter: "invert(1) grayscale(1) contrast(100)" }}>
                  {col.label}
                </div>
                <div style={{ fontSize: "0.75rem", fontFamily: "monospace", filter: "invert(1) grayscale(1) contrast(100)" }}>
                  {copiedHex === col.hex ? "✓ Copied" : col.hex}
                </div>
              </div>
            ))}
          </div>
        </div>
      }
      controls={
        <div className="controls-form">
          <div className="control-row">
            <label htmlFor="palette-select">Choose from 33 Palettes ({selectedIdx + 1}/33)</label>
            <select
              id="palette-select"
              value={selectedIdx}
              onChange={(e) => setSelectedIdx(Number(e.target.value))}
              className="docs-select-input"
            >
              {BUILT_IN_PALETTE_INPUTS.map((p: any, idx: number) => (
                <option key={p.name} value={idx}>
                  {idx + 1}. {p.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: "14px" }}>
            <button
              type="button"
              className="docs-run-btn"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handleApplyPalette}
            >
              Apply to Document Root
            </button>
          </div>
        </div>
      }
    />
  );
};
