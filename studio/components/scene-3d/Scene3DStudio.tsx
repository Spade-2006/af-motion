import React, { useState, useEffect, useMemo, useCallback } from "react";
import type {
  Scene3DSpecification,
  SceneObjectSpec,
  Camera3DConfig,
  Lighting3DConfig,
  Environment3DConfig,
} from "../../../src/3d/schemas/types.js";
import type {
  Scene3DStudioViewMode,
  QualityPreset,
} from "../../types/scene-3d.js";
import type {
  Advanced3DStudioState,
  Advanced3DViewMode,
  Studio3DNavSection,
} from "../../types/advanced-3d.js";
import {
  createDefaultSceneSpecification,
  listAvailableSceneTemplates,
  getSceneTemplateByName,
  evaluateSceneIntelligence,
} from "../../engine/scene-3d-studio-engine.js";
import { createDefaultAdvanced3DState } from "../../engine/advanced-3d-engine.js";
import { Scene3DHierarchyPanel } from "./Scene3DHierarchyPanel.js";
import { Scene3DGeometryEditor } from "./Scene3DGeometryEditor.js";
import { Scene3DCameraLightingEditor } from "./Scene3DCameraLightingEditor.js";
import { Scene3DMaterialEditor } from "./Scene3DMaterialEditor.js";
import { Scene3DLiveViewport } from "./Scene3DLiveViewport.js";
import { Scene3DIntelligencePanel } from "./Scene3DIntelligencePanel.js";
import { Scene3DTemplateSelector } from "./Scene3DTemplateSelector.js";
import { Scene3DCodeExport } from "./Scene3DCodeExport.js";

// Prompt 139: Advanced 3D & World Subsystems
import { Physics3DPlayground } from "./Physics3DPlayground.js";
import { RigidBodyConstraintEditor } from "./RigidBodyConstraintEditor.js";
import { SoftBodyClothPlayground } from "./SoftBodyClothPlayground.js";
import { ProceduralTerrainEditor } from "./ProceduralTerrainEditor.js";
import { WorldGeneratorEditor } from "./WorldGeneratorEditor.js";
import { ModelIntelligencePanel } from "./ModelIntelligencePanel.js";
import { Morphing3DPlayground } from "./Morphing3DPlayground.js";
import { UnifiedSceneCompositionEditor } from "./UnifiedSceneCompositionEditor.js";
import { Advanced3DDiagnostics } from "./Advanced3DDiagnostics.js";
import { Advanced3DPresetLibrary } from "./Advanced3DPresetLibrary.js";
import { Advanced3DCodeExport } from "./Advanced3DCodeExport.js";

export const Scene3DStudio: React.FC = () => {
  // Active Scene State
  const [scene, setScene] = useState<Scene3DSpecification>(() =>
    createDefaultSceneSpecification()
  );

  // Undo / Redo Stacks
  const [undoStack, setUndoStack] = useState<Scene3DSpecification[]>([]);
  const [redoStack, setRedoStack] = useState<Scene3DSpecification[]>([]);

  // Selected Object
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
    () => scene.objects[0]?.id ?? null
  );

  // Foundations View Mode Tab
  const [viewMode, setViewMode] = useState<Scene3DStudioViewMode>("hierarchy");

  // Advanced 3D & World State (Prompt 139)
  const [advState, setAdvState] = useState<Advanced3DStudioState>(() =>
    createDefaultAdvanced3DState()
  );

  // Quality & Accessibility
  const [quality, setQuality] = useState<QualityPreset>("medium");
  const [reducedMotion, setReducedMotion] = useState(false);

  // Push to Undo Stack before state modification
  const commitSceneChange = useCallback(
    (newScene: Scene3DSpecification) => {
      setUndoStack((prev) => [...prev.slice(-20), scene]);
      setRedoStack([]);
      setScene(newScene);
    },
    [scene]
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, scene]);
    setScene(previous);
  }, [undoStack, scene]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, scene]);
    setScene(next);
  }, [redoStack, scene]);

  // Keyboard shortcut listener for Ctrl+Z and Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Object Operations
  const handleUpdateObject = (updated: SceneObjectSpec) => {
    const updatedObjects = scene.objects.map((o) => (o.id === updated.id ? updated : o));
    commitSceneChange({
      ...scene,
      objects: updatedObjects,
    });
  };

  const handleAddObject = (newObj: SceneObjectSpec) => {
    commitSceneChange({
      ...scene,
      objects: [...scene.objects, newObj],
    });
    setSelectedObjectId(newObj.id);
  };

  const handleRemoveObject = (id: string) => {
    const remaining = scene.objects.filter((o) => o.id !== id);
    commitSceneChange({
      ...scene,
      objects: remaining,
    });
    if (selectedObjectId === id) {
      setSelectedObjectId(remaining[0]?.id ?? null);
    }
  };

  const handleDuplicateObject = (obj: SceneObjectSpec) => {
    handleAddObject(obj);
  };

  // Camera, Lighting & Environment Updaters
  const handleUpdateCamera = (cam: Camera3DConfig) => {
    commitSceneChange({ ...scene, camera: cam });
  };

  const handleUpdateLighting = (light: Lighting3DConfig) => {
    commitSceneChange({ ...scene, lighting: light });
  };

  const handleUpdateEnvironment = (env: Environment3DConfig) => {
    commitSceneChange({ ...scene, environment: env });
  };

  // Templates
  const handleLoadTemplate = (spec: Scene3DSpecification) => {
    commitSceneChange(spec);
    setSelectedObjectId(spec.objects[0]?.id ?? null);
  };

  const handleDuplicateScene = () => {
    const duplicate: Scene3DSpecification = {
      ...JSON.parse(JSON.stringify(scene)),
      id: `${scene.id}-copy-${Date.now().toString().slice(-4)}`,
      name: `${scene.name ?? "Scene"} (Copy)`,
    };
    commitSceneChange(duplicate);
  };

  const handleResetScene = () => {
    const fresh = createDefaultSceneSpecification();
    commitSceneChange(fresh);
    setSelectedObjectId(fresh.objects[0]?.id ?? null);
  };

  // Selected Object lookup
  const selectedObject = useMemo(
    () => scene.objects.find((o) => o.id === selectedObjectId) ?? null,
    [scene.objects, selectedObjectId]
  );

  // Intelligence Report
  const intelligenceReport = useMemo(
    () => evaluateSceneIntelligence(scene, reducedMotion),
    [scene, reducedMotion]
  );

  const advancedNavItems: { id: Advanced3DViewMode; label: string }[] = [
    { id: "physics", label: "⚛️ 3D Physics" },
    { id: "rigid-bodies", label: "📦 Rigid Bodies" },
    { id: "soft-bodies", label: "🧶 Soft Bodies" },
    { id: "terrain", label: "🏔️ Terrain" },
    { id: "world", label: "🌍 Worlds" },
    { id: "model-intelligence", label: "🔬 Optimization" },
    { id: "morphing", label: "🌀 3D Morphing" },
    { id: "composition", label: "🎬 Composition" },
  ];

  return (
    <div className="scene3d-studio-container">
      {/* Top Header */}
      <header className="scene3d-studio-header">
        <div className="scene3d-studio-header-info">
          <h2 className="scene3d-studio-title">🧊 3D Scene Studio</h2>

          {/* Section Mode Switcher */}
          <div className="adv3d-mode-switcher" role="group" aria-label="3D Studio Section">
            <button
              type="button"
              className={`studio-btn studio-btn-sm ${
                advState.section === "foundations" ? "studio-btn-primary" : "studio-btn-outline"
              }`}
              onClick={() => setAdvState((prev) => ({ ...prev, section: "foundations" }))}
            >
              Foundations
            </button>
            <button
              type="button"
              className={`studio-btn studio-btn-sm ${
                advState.section === "advanced" ? "studio-btn-primary" : "studio-btn-outline"
              }`}
              onClick={() => setAdvState((prev) => ({ ...prev, section: "advanced" }))}
            >
              Advanced 3D &amp; Worlds
            </button>
            <button
              type="button"
              className={`studio-btn studio-btn-sm ${
                advState.section === "presets" ? "studio-btn-primary" : "studio-btn-outline"
              }`}
              onClick={() => setAdvState((prev) => ({ ...prev, section: "presets" }))}
            >
              📚 Presets
            </button>
          </div>

          {/* Quick Recipe Select (Foundations mode) */}
          {advState.section === "foundations" && (
            <div className="scene3d-header-select-wrap">
              <label className="scene3d-header-label">Recipe:</label>
              <select
                className="scene3d-header-select"
                value={scene.name ?? "Product Showcase"}
                onChange={(e) => {
                  const tpl = listAvailableSceneTemplates().find((t) => t.title === e.target.value);
                  if (tpl) {
                    handleLoadTemplate(getSceneTemplateByName(tpl.name));
                  }
                }}
              >
                {listAvailableSceneTemplates().map((t) => (
                  <option key={t.name} value={t.title}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* View Mode Navigation Tabs */}
        {advState.section === "foundations" ? (
          <div className="scene3d-studio-nav-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "hierarchy"}
              className={`scene3d-nav-tab ${viewMode === "hierarchy" ? "active" : ""}`}
              onClick={() => setViewMode("hierarchy")}
            >
              🌳 Hierarchy
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "geometry"}
              className={`scene3d-nav-tab ${viewMode === "geometry" ? "active" : ""}`}
              onClick={() => setViewMode("geometry")}
            >
              📐 Geometry
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "camera-lighting"}
              className={`scene3d-nav-tab ${viewMode === "camera-lighting" ? "active" : ""}`}
              onClick={() => setViewMode("camera-lighting")}
            >
              📷 Camera &amp; Light
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "materials"}
              className={`scene3d-nav-tab ${viewMode === "materials" ? "active" : ""}`}
              onClick={() => setViewMode("materials")}
            >
              🎨 Materials
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "intelligence"}
              className={`scene3d-nav-tab ${viewMode === "intelligence" ? "active" : ""}`}
              onClick={() => setViewMode("intelligence")}
            >
              🧠 Intelligence
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "templates"}
              className={`scene3d-nav-tab ${viewMode === "templates" ? "active" : ""}`}
              onClick={() => setViewMode("templates")}
            >
              📂 Templates
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "export"}
              className={`scene3d-nav-tab ${viewMode === "export" ? "active" : ""}`}
              onClick={() => setViewMode("export")}
            >
              💻 Export Code
            </button>
          </div>
        ) : advState.section === "advanced" ? (
          <div className="scene3d-studio-nav-tabs adv3d-nav-tabs" role="tablist">
            {advancedNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={advState.advancedView === item.id}
                className={`scene3d-nav-tab ${advState.advancedView === item.id ? "active" : ""}`}
                onClick={() => setAdvState((prev) => ({ ...prev, advancedView: item.id }))}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}

        {/* Header Actions */}
        <div className="scene3d-studio-header-actions">
          {advState.section !== "foundations" && (
            <button
              type="button"
              className="studio-btn studio-btn-sm studio-btn-primary"
              onClick={() => setAdvState((prev) => ({ ...prev, showExportModal: true }))}
            >
              📦 Export Code
            </button>
          )}

          <label className="scene3d-reduced-motion-toggle">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
            />
            <span>Reduced Motion</span>
          </label>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="scene3d-studio-body">
        {advState.section === "presets" ? (
          <div className="adv3d-full-panel">
            <Advanced3DPresetLibrary state={advState} onChange={setAdvState} />
          </div>
        ) : (
          <>
            {/* Left Column: Editor View */}
            <aside className="scene3d-studio-sidebar">
              {advState.section === "foundations" ? (
                <>
                  {viewMode === "hierarchy" && (
                    <Scene3DHierarchyPanel
                      scene={scene}
                      selectedObjectId={selectedObjectId}
                      onSelectObject={setSelectedObjectId}
                      onUpdateObject={handleUpdateObject}
                      onAddObject={handleAddObject}
                      onRemoveObject={handleRemoveObject}
                      onDuplicateObject={handleDuplicateObject}
                      canUndo={undoStack.length > 0}
                      canRedo={redoStack.length > 0}
                      onUndo={handleUndo}
                      onRedo={handleRedo}
                    />
                  )}

                  {viewMode === "geometry" && (
                    <Scene3DGeometryEditor
                      selectedObject={selectedObject}
                      onUpdateObject={handleUpdateObject}
                    />
                  )}

                  {viewMode === "camera-lighting" && (
                    <Scene3DCameraLightingEditor
                      camera={scene.camera}
                      lighting={scene.lighting}
                      environment={scene.environment}
                      onUpdateCamera={handleUpdateCamera}
                      onUpdateLighting={handleUpdateLighting}
                      onUpdateEnvironment={handleUpdateEnvironment}
                    />
                  )}

                  {viewMode === "materials" && (
                    <Scene3DMaterialEditor
                      selectedObject={selectedObject}
                      onUpdateObject={handleUpdateObject}
                    />
                  )}

                  {viewMode === "intelligence" && (
                    <Scene3DIntelligencePanel report={intelligenceReport} />
                  )}

                  {viewMode === "templates" && (
                    <Scene3DTemplateSelector
                      currentSceneName={scene.name}
                      onLoadTemplate={handleLoadTemplate}
                      onDuplicateScene={handleDuplicateScene}
                      onResetScene={handleResetScene}
                    />
                  )}

                  {viewMode === "export" && <Scene3DCodeExport scene={scene} />}
                </>
              ) : (
                <>
                  {advState.advancedView === "physics" && (
                    <Physics3DPlayground state={advState} onChange={setAdvState} />
                  )}
                  {advState.advancedView === "rigid-bodies" && (
                    <RigidBodyConstraintEditor state={advState} onChange={setAdvState} />
                  )}
                  {advState.advancedView === "soft-bodies" && (
                    <SoftBodyClothPlayground state={advState} onChange={setAdvState} />
                  )}
                  {advState.advancedView === "terrain" && (
                    <ProceduralTerrainEditor state={advState} onChange={setAdvState} />
                  )}
                  {advState.advancedView === "world" && (
                    <WorldGeneratorEditor state={advState} onChange={setAdvState} />
                  )}
                  {advState.advancedView === "model-intelligence" && (
                    <ModelIntelligencePanel state={advState} onChange={setAdvState} />
                  )}
                  {advState.advancedView === "morphing" && (
                    <Morphing3DPlayground state={advState} onChange={setAdvState} />
                  )}
                  {advState.advancedView === "composition" && (
                    <UnifiedSceneCompositionEditor state={advState} onChange={setAdvState} />
                  )}
                </>
              )}
            </aside>

            {/* Right Column: Interactive 3D Live Viewport Stage */}
            <main className="scene3d-studio-main">
              <Scene3DLiveViewport
                scene={scene}
                selectedObjectId={selectedObjectId}
                onSelectObject={setSelectedObjectId}
                reducedMotion={reducedMotion}
                quality={quality}
                onQualityChange={setQuality}
                advancedState={advState}
              />
            </main>
          </>
        )}
      </div>

      {/* Diagnostics Bar */}
      <footer className="adv3d-studio-footer">
        <Advanced3DDiagnostics state={advState} />
      </footer>

      {/* Advanced 3D Export Modal */}
      {advState.showExportModal && (
        <Advanced3DCodeExport
          state={advState}
          onClose={() => setAdvState((prev) => ({ ...prev, showExportModal: false }))}
        />
      )}
    </div>
  );
};
