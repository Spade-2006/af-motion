import React from "react";
import type {
  SceneObjectSpec,
  PrimitiveObjectSpec,
  GeometryPrimitiveType,
  ModelObjectSpec,
} from "../../../src/3d/schemas/types.js";
import {
  listAvailableProceduralGeometries,
} from "../../engine/scene-3d-studio-engine.js";

interface Scene3DGeometryEditorProps {
  selectedObject: SceneObjectSpec | null;
  onUpdateObject: (updated: SceneObjectSpec) => void;
}

export const Scene3DGeometryEditor: React.FC<Scene3DGeometryEditorProps> = ({
  selectedObject,
  onUpdateObject,
}) => {
  const proceduralGeometries = listAvailableProceduralGeometries();

  if (!selectedObject) {
    return (
      <div className="scene3d-geometry-panel empty">
        <div className="scene3d-empty-prompt">
          <span className="scene3d-empty-icon">📐</span>
          <h4>No Object Selected</h4>
          <p>Select a 3D object from the hierarchy to view and edit its geometry parameters.</p>
        </div>
      </div>
    );
  }

  const isPrimitive = selectedObject.type === "primitive";
  const isModel = selectedObject.type === "model";

  const primitiveObj = isPrimitive ? (selectedObject as PrimitiveObjectSpec) : null;
  const currentPrimitive = primitiveObj?.geometry?.primitive ?? "box";
  const parameters = primitiveObj?.geometry?.parameters ?? {};

  const handlePrimitiveChange = (newPrim: GeometryPrimitiveType) => {
    if (!isPrimitive || !primitiveObj) return;
    const desc = proceduralGeometries.find((g) => g.type === newPrim);
    onUpdateObject({
      ...primitiveObj,
      geometry: {
        type: "primitive",
        primitive: newPrim,
        parameters: desc ? { ...desc.defaultParameters } : {},
      },
    });
  };

  const handleParamChange = (paramKey: string, val: number) => {
    if (!isPrimitive || !primitiveObj) return;
    onUpdateObject({
      ...primitiveObj,
      geometry: {
        ...primitiveObj.geometry,
        parameters: {
          ...primitiveObj.geometry.parameters,
          [paramKey]: val,
        },
      },
    });
  };

  return (
    <div className="scene3d-geometry-panel">
      <div className="scene3d-panel-header">
        <h3 className="scene3d-panel-title">📐 Geometry & Mesh Parameters</h3>
        <span className="scene3d-badge">{selectedObject.name ?? selectedObject.id}</span>
      </div>

      <p className="scene3d-panel-subtitle">
        Procedural geometry mathematical parameters and 3D asset model references.
      </p>

      {/* Primitive Type Selector */}
      {isPrimitive && (
        <div className="scene3d-section-block">
          <label className="scene3d-field-label">Procedural Geometry Type</label>
          <div className="scene3d-geom-grid">
            {proceduralGeometries.map((geom) => {
              const active = geom.type === currentPrimitive;
              return (
                <button
                  key={geom.type}
                  type="button"
                  className={`scene3d-geom-card ${active ? "active" : ""}`}
                  onClick={() => handlePrimitiveChange(geom.type)}
                >
                  <span className="scene3d-geom-card-name">{geom.name}</span>
                  <span className="scene3d-geom-card-desc">{geom.description}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Geometry Parameters */}
          <div className="scene3d-params-block">
            <h4 className="scene3d-subhead">Parameters: {currentPrimitive.toUpperCase()}</h4>
            <div className="scene3d-params-grid">
              {Object.entries(parameters).map(([key, val]) => (
                <div key={key} className="scene3d-param-field">
                  <label className="scene3d-param-label">
                    <span>{key}</span>
                    <span className="scene3d-param-val">{val}</span>
                  </label>
                  <input
                    type="range"
                    min={key.toLowerCase().includes("segment") ? "3" : "0.1"}
                    max={key.toLowerCase().includes("segment") ? "64" : "10"}
                    step={key.toLowerCase().includes("segment") ? "1" : "0.1"}
                    className="scene3d-param-slider"
                    value={val}
                    onChange={(e) => handleParamChange(key, parseFloat(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Model Asset Reference */}
      {isModel && (
        <div className="scene3d-section-block">
          <label className="scene3d-field-label">3D Model URL (GLTF / GLB / OBJ)</label>
          <input
            type="text"
            className="scene3d-text-input"
            value={(selectedObject as ModelObjectSpec).model?.url ?? ""}
            placeholder="https://assets.example.com/models/hero.glb"
            onChange={(e) =>
              onUpdateObject({
                ...selectedObject,
                model: {
                  type: "model",
                  format: "glb",
                  url: e.target.value,
                },
              } as ModelObjectSpec)
            }
          />
          <p className="scene3d-hint">
            Assets are cached and inspected automatically via AF Motion&apos;s 3D Asset Manager.
          </p>
        </div>
      )}

      {!isPrimitive && !isModel && (
        <div className="scene3d-info-box">
          <p>
            This object is a <strong>{selectedObject.type}</strong> and does not use procedural
            geometry vertices.
          </p>
        </div>
      )}
    </div>
  );
};
