import React from "react";
import type {
  Scene3DSpecification,
  SceneObjectSpec,
  PrimitiveObjectSpec,
} from "../../../src/3d/schemas/types.js";
import {
  createPrimitiveSceneObject,
  createLightSceneObject,
  duplicateSceneObject,
} from "../../engine/scene-3d-studio-engine.js";

interface Scene3DHierarchyPanelProps {
  scene: Scene3DSpecification;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onUpdateObject: (updated: SceneObjectSpec) => void;
  onAddObject: (newObj: SceneObjectSpec) => void;
  onRemoveObject: (id: string) => void;
  onDuplicateObject: (obj: SceneObjectSpec) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const Scene3DHierarchyPanel: React.FC<Scene3DHierarchyPanelProps> = ({
  scene,
  selectedObjectId,
  onSelectObject,
  onUpdateObject,
  onAddObject,
  onRemoveObject,
  onDuplicateObject,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const selectedObject = scene.objects.find((o) => o.id === selectedObjectId);

  const handleTransformChange = (
    field: "position" | "rotation" | "scale",
    axisIndex: 0 | 1 | 2,
    val: number
  ) => {
    if (!selectedObject) return;
    const currentTransform = selectedObject.transform ?? {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    };

    const currentArray = [...(currentTransform[field] ?? (field === "scale" ? [1, 1, 1] : [0, 0, 0]))] as [
      number,
      number,
      number,
    ];
    currentArray[axisIndex] = val;

    onUpdateObject({
      ...selectedObject,
      transform: {
        ...currentTransform,
        [field]: currentArray,
      },
    });
  };

  const handleToggleVisibility = (obj: SceneObjectSpec, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateObject({
      ...obj,
      visible: obj.visible !== false ? false : true,
    });
  };

  return (
    <div className="scene3d-hierarchy-panel">
      {/* Header with Add & Undo/Redo */}
      <div className="scene3d-panel-header">
        <h3 className="scene3d-panel-title">🌳 Scene Hierarchy</h3>
        <div className="scene3d-header-btn-row">
          <button
            type="button"
            className="scene3d-icon-btn"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↩️
          </button>
          <button
            type="button"
            className="scene3d-icon-btn"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            ↪️
          </button>
          <button
            type="button"
            className="scene3d-primary-btn"
            onClick={() => onAddObject(createPrimitiveSceneObject("box"))}
            title="Add procedural cube"
          >
            + Cube
          </button>
          <button
            type="button"
            className="scene3d-primary-btn"
            onClick={() => onAddObject(createPrimitiveSceneObject("sphere"))}
            title="Add procedural sphere"
          >
            + Sphere
          </button>
          <button
            type="button"
            className="scene3d-secondary-btn"
            onClick={() => onAddObject(createLightSceneObject("directional"))}
            title="Add directional light"
          >
            + Light
          </button>
        </div>
      </div>

      <p className="scene3d-panel-subtitle">
        Manage objects, parent-child grouping, transforms, visibility, and shadow properties.
      </p>

      {/* Object List */}
      <div className="scene3d-tree-list" role="list">
        {scene.objects.map((obj) => {
          const isSelected = obj.id === selectedObjectId;
          const isVisible = obj.visible !== false;

          let icon = "📦";
          if (obj.type === "light") icon = "💡";
          if (obj.type === "camera") icon = "📷";
          if (obj.type === "group") icon = "📁";
          if (obj.type === "model") icon = "🗿";
          if (obj.type === "primitive") {
            const p = (obj as PrimitiveObjectSpec).geometry?.primitive;
            if (p === "sphere") icon = "🔮";
            else if (p === "torus") icon = "🍩";
            else if (p === "cylinder") icon = "🥫";
            else if (p === "plane") icon = "📄";
          }

          return (
            <div
              key={obj.id}
              role="listitem"
              className={`scene3d-tree-item ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectObject(obj.id)}
            >
              <div className="scene3d-tree-item-left">
                <span className="scene3d-item-icon">{icon}</span>
                <span className="scene3d-item-name">{obj.name ?? obj.id}</span>
                <span className="scene3d-item-type">{obj.type}</span>
              </div>

              <div className="scene3d-tree-item-actions">
                <button
                  type="button"
                  className="scene3d-item-btn"
                  onClick={(e) => handleToggleVisibility(obj, e)}
                  title={isVisible ? "Hide object" : "Show object"}
                >
                  {isVisible ? "👁️" : "🕶️"}
                </button>
                <button
                  type="button"
                  className="scene3d-item-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateObject(duplicateSceneObject(obj));
                  }}
                  title="Duplicate object"
                >
                  📋
                </button>
                <button
                  type="button"
                  className="scene3d-item-btn danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveObject(obj.id);
                  }}
                  title="Remove object"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Object Transform Editor */}
      {selectedObject && (
        <div className="scene3d-transform-card">
          <div className="scene3d-card-title-row">
            <h4 className="scene3d-card-title">
              📐 Transform: {selectedObject.name ?? selectedObject.id}
            </h4>
            <span className="scene3d-badge">{selectedObject.id}</span>
          </div>

          {/* Position */}
          <div className="scene3d-field-group">
            <label className="scene3d-field-label">Position [X, Y, Z]</label>
            <div className="scene3d-xyz-inputs">
              {(["X", "Y", "Z"] as const).map((axis, i) => (
                <div key={axis} className="scene3d-axis-col">
                  <span className={`scene3d-axis-tag axis-${axis.toLowerCase()}`}>{axis}</span>
                  <input
                    type="number"
                    step="0.1"
                    className="scene3d-num-input"
                    value={selectedObject.transform?.position?.[i] ?? 0}
                    onChange={(e) =>
                      handleTransformChange("position", i as 0 | 1 | 2, parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Rotation */}
          <div className="scene3d-field-group">
            <label className="scene3d-field-label">Rotation [X, Y, Z] (radians)</label>
            <div className="scene3d-xyz-inputs">
              {(["X", "Y", "Z"] as const).map((axis, i) => (
                <div key={axis} className="scene3d-axis-col">
                  <span className={`scene3d-axis-tag axis-${axis.toLowerCase()}`}>{axis}</span>
                  <input
                    type="number"
                    step="0.05"
                    className="scene3d-num-input"
                    value={selectedObject.transform?.rotation?.[i] ?? 0}
                    onChange={(e) =>
                      handleTransformChange("rotation", i as 0 | 1 | 2, parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Scale */}
          <div className="scene3d-field-group">
            <label className="scene3d-field-label">Scale [X, Y, Z]</label>
            <div className="scene3d-xyz-inputs">
              {(["X", "Y", "Z"] as const).map((axis, i) => (
                <div key={axis} className="scene3d-axis-col">
                  <span className={`scene3d-axis-tag axis-${axis.toLowerCase()}`}>{axis}</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.01"
                    className="scene3d-num-input"
                    value={selectedObject.transform?.scale?.[i] ?? 1}
                    onChange={(e) =>
                      handleTransformChange("scale", i as 0 | 1 | 2, parseFloat(e.target.value) || 1)
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Shadow Toggles */}
          <div className="scene3d-checkbox-row">
            <label className="scene3d-checkbox-label">
              <input
                type="checkbox"
                checked={selectedObject.castShadow !== false}
                onChange={(e) =>
                  onUpdateObject({ ...selectedObject, castShadow: e.target.checked })
                }
              />
              <span>Cast Shadow</span>
            </label>
            <label className="scene3d-checkbox-label">
              <input
                type="checkbox"
                checked={selectedObject.receiveShadow !== false}
                onChange={(e) =>
                  onUpdateObject({ ...selectedObject, receiveShadow: e.target.checked })
                }
              />
              <span>Receive Shadow</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
