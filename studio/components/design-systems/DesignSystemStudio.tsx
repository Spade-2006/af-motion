import React, { useState, useMemo } from "react";
import type {
  DesignStudioViewMode,
  CustomDesignSystemTokens,
  CustomMotionDNAValues,
} from "../../types/design-systems.js";
import {
  listAllDesignSystems,
  getDesignSystemById,
  listAllMotionDNA,
  getMotionDNAById,
  getDefaultDesignSystemTokens,
  getDefaultMotionDNAValues,
  evaluateSystemCompatibility,
} from "../../engine/design-system-dna-engine.js";
import { DesignSystemPaletteSelector } from "./DesignSystemPaletteSelector.js";
import { DesignSystemTokenEditor } from "./DesignSystemTokenEditor.js";
import { MotionDNAEditor } from "./MotionDNAEditor.js";
import { DesignSystemLivePreview } from "./DesignSystemLivePreview.js";
import { DesignSystemCompatibilityPanel } from "./DesignSystemCompatibilityPanel.js";
import { DesignSystemCodeExport } from "./DesignSystemCodeExport.js";
import type { SemanticColorTokens } from "../../../src/core/palettes.js";

export const DesignSystemStudio: React.FC = () => {
  const allSystems = useMemo(() => listAllDesignSystems(), []);
  const allDNA = useMemo(() => listAllMotionDNA(), []);

  // Selected entities
  const [selectedSystemId, setSelectedSystemId] = useState<string>(
    allSystems[0]?.id ?? "default"
  );
  const [selectedDNAId, setSelectedDNAId] = useState<string>(
    allDNA[0]?.id ?? "dna-snappy"
  );

  // Active view tab
  const [viewMode, setViewMode] = useState<DesignStudioViewMode>("palettes");

  // Reduced motion
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Active entities
  const activeSystem = useMemo(
    () => getDesignSystemById(selectedSystemId),
    [selectedSystemId]
  );
  const activeDNA = useMemo(
    () => getMotionDNAById(selectedDNAId),
    [selectedDNAId]
  );

  // Active palette name
  const [activePaletteName, setActivePaletteName] = useState<string>(() => {
    if (typeof activeSystem.palette === "string") return activeSystem.palette;
    if ((activeSystem.palette as any)?.name) return (activeSystem.palette as any).name;
    return "Platinum Mocha";
  });

  // Customization state
  const [tokens, setTokens] = useState<CustomDesignSystemTokens>(() =>
    getDefaultDesignSystemTokens(activeSystem)
  );

  const [dnaValues, setDnaValues] = useState<CustomMotionDNAValues>(() =>
    getDefaultMotionDNAValues(activeDNA)
  );

  // Handle system switch
  const handleSelectSystem = (id: string) => {
    setSelectedSystemId(id);
    const newSys = getDesignSystemById(id);
    setTokens(getDefaultDesignSystemTokens(newSys));
    if (typeof newSys.palette === "string") {
      setActivePaletteName(newSys.palette);
    }
  };

  // Handle DNA switch
  const handleSelectDNA = (idOrName: string) => {
    setSelectedDNAId(idOrName);
    const newDNA = getMotionDNAById(idOrName);
    setDnaValues(getDefaultMotionDNAValues(newDNA));
  };

  // Handle palette switch
  const handleSelectPalette = (paletteName: string) => {
    setActivePaletteName(paletteName);
    setTokens((prev) => {
      const palTokens = getDefaultDesignSystemTokens({
        ...activeSystem,
        palette: paletteName,
      }).colors;
      return {
        ...prev,
        colors: {
          ...palTokens,
        },
      };
    });
  };

  // Handle individual color override
  const handleColorChange = (key: keyof SemanticColorTokens, value: string) => {
    setTokens((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: value,
      },
    }));
  };

  const handleResetColors = () => {
    const palTokens = getDefaultDesignSystemTokens({
      ...activeSystem,
      palette: activePaletteName,
    }).colors;
    setTokens((prev) => ({
      ...prev,
      colors: { ...palTokens },
    }));
  };

  // Compatibility report
  const compatibilityReport = useMemo(
    () => evaluateSystemCompatibility(activeSystem, activeDNA),
    [activeSystem, activeDNA]
  );

  return (
    <div className="ds-studio-container">
      {/* Top Header */}
      <header className="ds-studio-header">
        <div className="ds-studio-header-info">
          <h2 className="ds-studio-title">Design System & Motion DNA</h2>

          {/* System Switcher */}
          <div className="ds-header-select-wrap">
            <label className="ds-header-label">System:</label>
            <select
              className="ds-header-select"
              value={selectedSystemId}
              onChange={(e) => handleSelectSystem(e.target.value)}
            >
              {allSystems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* DNA Switcher */}
          <div className="ds-header-select-wrap">
            <label className="ds-header-label">DNA:</label>
            <select
              className="ds-header-select"
              value={selectedDNAId}
              onChange={(e) => handleSelectDNA(e.target.value)}
            >
              {allDNA.map((d) => (
                <option key={d.id ?? d.name} value={d.id ?? d.name}>
                  {d.name ?? d.id} ({d.personality})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="ds-studio-nav-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "palettes"}
            className={`ds-nav-tab ${viewMode === "palettes" ? "active" : ""}`}
            onClick={() => setViewMode("palettes")}
          >
            🎨 Colors & Palettes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "system"}
            className={`ds-nav-tab ${viewMode === "system" ? "active" : ""}`}
            onClick={() => setViewMode("system")}
          >
            📐 Design Tokens
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "dna"}
            className={`ds-nav-tab ${viewMode === "dna" ? "active" : ""}`}
            onClick={() => setViewMode("dna")}
          >
            🧬 Motion DNA
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "compatibility"}
            className={`ds-nav-tab ${viewMode === "compatibility" ? "active" : ""}`}
            onClick={() => setViewMode("compatibility")}
          >
            🧠 Compatibility
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "export"}
            className={`ds-nav-tab ${viewMode === "export" ? "active" : ""}`}
            onClick={() => setViewMode("export")}
          >
            💻 Export Code
          </button>
        </div>

        {/* Actions */}
        <div className="ds-studio-header-actions">
          <label className="ds-reduced-motion-toggle">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
            />
            <span>Reduced Motion</span>
          </label>
        </div>
      </header>

      {/* Main Dual-Column Content */}
      <div className="ds-studio-body">
        {/* Left Column: Active Editor Panel */}
        <aside className="ds-studio-sidebar">
          {viewMode === "palettes" && (
            <DesignSystemPaletteSelector
              activePaletteName={activePaletteName}
              onSelectPalette={handleSelectPalette}
              colorOverrides={tokens.colors}
              onColorChange={handleColorChange}
              onResetColors={handleResetColors}
            />
          )}

          {viewMode === "system" && (
            <DesignSystemTokenEditor
              tokens={tokens}
              onChange={setTokens}
              onReset={() => setTokens(getDefaultDesignSystemTokens(activeSystem))}
            />
          )}

          {viewMode === "dna" && (
            <MotionDNAEditor
              dnaValues={dnaValues}
              onChange={setDnaValues}
              onReset={() => setDnaValues(getDefaultMotionDNAValues(activeDNA))}
            />
          )}

          {viewMode === "compatibility" && (
            <DesignSystemCompatibilityPanel
              report={compatibilityReport}
              systemName={activeSystem.name}
              onSelectDNA={handleSelectDNA}
            />
          )}

          {viewMode === "export" && (
            <DesignSystemCodeExport
              system={activeSystem}
              dna={activeDNA}
              tokens={tokens}
              dnaValues={dnaValues}
            />
          )}
        </aside>

        {/* Right Column: Always-Live Synchronized Preview */}
        <main className="ds-studio-main">
          <DesignSystemLivePreview
            systemName={activeSystem.name}
            tokens={tokens}
            dnaValues={dnaValues}
            reducedMotion={reducedMotion}
          />
        </main>
      </div>
    </div>
  );
};
