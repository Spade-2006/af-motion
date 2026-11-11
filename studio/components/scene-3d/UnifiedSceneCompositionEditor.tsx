import React from "react";
import type { Advanced3DStudioState } from "../../types/advanced-3d.js";

interface UnifiedSceneCompositionEditorProps {
  state: Advanced3DStudioState;
  onChange: (updater: (prev: Advanced3DStudioState) => Advanced3DStudioState) => void;
}

export const UnifiedSceneCompositionEditor: React.FC<UnifiedSceneCompositionEditorProps> = ({
  state,
  onChange,
}) => {
  const { composition } = state;
  const { subsystems, coupling, activeLayers } = composition;

  const updateComposition = (updates: Partial<typeof composition>) => {
    onChange((prev) => ({
      ...prev,
      composition: {
        ...prev.composition,
        ...updates,
      },
    }));
  };

  const updateSubsystems = (updates: Partial<typeof subsystems>) => {
    updateComposition({
      subsystems: { ...subsystems, ...updates },
    });
  };

  const updateCoupling = (updates: Partial<typeof coupling>) => {
    updateComposition({
      coupling: { ...coupling, ...updates },
    });
  };

  const handleUpdateLayer = (id: string, updates: Partial<(typeof activeLayers)[0]>) => {
    updateComposition({
      activeLayers: activeLayers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    });
  };

  return (
    <div className="scene3d-editor-panel adv3d-panel" role="region" aria-label="Unified 3D Scene Composition">
      <div className="adv3d-panel-header">
        <h3 className="adv3d-section-title">🎬 Unified Scene Composition</h3>
        <p className="adv3d-section-desc">
          Orchestrate simultaneous terrain, procedural world chunks, rigid bodies, soft bodies,
          3D morphing objects, atmospheric lighting, and physical cross-system coupling.
        </p>
      </div>

      {/* Subsystem Activation Toggles */}
      <div className="adv3d-panel-section">
        <h4 className="adv3d-subsection-title">Subsystem Participation</h4>
        <div className="adv3d-coupling-grid">
          <label className="adv3d-checkbox-label">
            <input
              type="checkbox"
              checked={subsystems.physics}
              onChange={(e) => updateSubsystems({ physics: e.target.checked })}
              className="adv3d-checkbox"
            />
            <span>3D Rigid Body Physics World</span>
          </label>

          <label className="adv3d-checkbox-label">
            <input
              type="checkbox"
              checked={subsystems.softBodies}
              onChange={(e) => updateSubsystems({ softBodies: e.target.checked })}
              className="adv3d-checkbox"
            />
            <span>XPBD Soft Bodies &amp; Cloth Simulation</span>
          </label>

          <label className="adv3d-checkbox-label">
            <input
              type="checkbox"
              checked={subsystems.terrain}
              onChange={(e) => updateSubsystems({ terrain: e.target.checked })}
              className="adv3d-checkbox"
            />
            <span>Eroded Heightfield Terrain Engine</span>
          </label>

          <label className="adv3d-checkbox-label">
            <input
              type="checkbox"
              checked={subsystems.world}
              onChange={(e) => updateSubsystems({ world: e.target.checked })}
              className="adv3d-checkbox"
            />
            <span>Multi-Chunk Procedural World Streaming</span>
          </label>

          <label className="adv3d-checkbox-label">
            <input
              type="checkbox"
              checked={subsystems.morphing}
              onChange={(e) => updateSubsystems({ morphing: e.target.checked })}
              className="adv3d-checkbox"
            />
            <span>3D Geometric Morphing Object</span>
          </label>
        </div>
      </div>

      {/* Cross-System Physics Coupling */}
      <div className="adv3d-panel-section">
        <h4 className="adv3d-subsection-title">Cross-System Physical Coupling</h4>
        <div className="adv3d-coupling-grid">
          <label className="adv3d-checkbox-label">
            <input
              type="checkbox"
              checked={coupling.rigidTerrainCollisions}
              onChange={(e) => updateCoupling({ rigidTerrainCollisions: e.target.checked })}
              className="adv3d-checkbox"
            />
            <span>Rigid Bodies Collide with Terrain Heightfield</span>
          </label>

          <label className="adv3d-checkbox-label">
            <input
              type="checkbox"
              checked={coupling.softRigidCollisions}
              onChange={(e) => updateCoupling({ softRigidCollisions: e.target.checked })}
              className="adv3d-checkbox"
            />
            <span>Soft Bodies Collide with Scene Rigid Bodies</span>
          </label>

          <label className="adv3d-checkbox-label">
            <input
              type="checkbox"
              checked={coupling.worldHydrologyCoupled}
              onChange={(e) => updateCoupling({ worldHydrologyCoupled: e.target.checked })}
              className="adv3d-checkbox"
            />
            <span>World Hydrology &amp; Water Surfaces Align to Terrain</span>
          </label>

          <label className="adv3d-checkbox-label">
            <input
              type="checkbox"
              checked={coupling.morphingPhysicsCoupled}
              onChange={(e) => updateCoupling({ morphingPhysicsCoupled: e.target.checked })}
              className="adv3d-checkbox"
            />
            <span>Morphing Objects Dynamically Update Physics Colliders</span>
          </label>
        </div>
      </div>

      {/* Composition Layers */}
      <div className="adv3d-panel-section">
        <h4 className="adv3d-subsection-title">Composition Layers Stack</h4>
        <div className="adv3d-items-stack">
          {activeLayers.map((layer) => (
            <div key={layer.id} className="adv3d-card">
              <div className="adv3d-card-header">
                <label className="adv3d-checkbox-label">
                  <input
                    type="checkbox"
                    checked={layer.enabled}
                    onChange={(e) => handleUpdateLayer(layer.id, { enabled: e.target.checked })}
                    className="adv3d-checkbox"
                  />
                  <span className="adv3d-card-title">{layer.name}</span>
                </label>
                <span className="adv3d-badge adv3d-badge-accent">
                  {layer.type.toUpperCase()}
                </span>
              </div>

              <div className="studio-form-group">
                <div className="studio-field-header">
                  <label className="studio-label">Layer Opacity</label>
                  <span className="studio-value-display">{(layer.opacity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={layer.opacity}
                  onChange={(e) => handleUpdateLayer(layer.id, { opacity: Number(e.target.value) })}
                  className="studio-slider"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
