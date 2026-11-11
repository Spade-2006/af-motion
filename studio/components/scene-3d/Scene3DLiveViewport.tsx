import React, { useRef, useEffect, useState, useCallback } from "react";
import type {
  Scene3DSpecification,
  SceneObjectSpec,
  PrimitiveObjectSpec,
  MaterialSpec,
} from "../../../src/3d/schemas/types.js";
import type { QualityPreset } from "../../types/scene-3d.js";
import type { ViewportPreset } from "../../types/index.js";
import type { Advanced3DStudioState } from "../../types/advanced-3d.js";

interface Scene3DLiveViewportProps {
  scene: Scene3DSpecification;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  reducedMotion: boolean;
  quality: QualityPreset;
  onQualityChange: (q: QualityPreset) => void;
  advancedState?: Advanced3DStudioState;
}

export const Scene3DLiveViewport: React.FC<Scene3DLiveViewportProps> = ({
  scene,
  selectedObjectId,
  onSelectObject,
  reducedMotion,
  quality,
  onQualityChange,
  advancedState,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Viewport mode
  const [viewportSize, setViewportSize] = useState<ViewportPreset>("desktop");
  const [showWireframe, setShowWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // Camera Orbit State
  const [orbitAngleX, setOrbitAngleX] = useState<number>(0.4); // elevation
  const [orbitAngleY, setOrbitAngleY] = useState<number>(0.6); // azimuth
  const [cameraDistance, setCameraDistance] = useState<number>(7.0);
  const [cameraPan, setCameraPan] = useState<[number, number]>([0, 0]);

  // Pointer drag tracking
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastPointerPosRef = useRef<[number, number]>([0, 0]);

  // Handle Camera Presets
  const setCameraView = (type: "front" | "top" | "side" | "iso" | "reset") => {
    switch (type) {
      case "front":
        setOrbitAngleX(0);
        setOrbitAngleY(0);
        setCameraPan([0, 0]);
        break;
      case "top":
        setOrbitAngleX(Math.PI / 2 - 0.05);
        setOrbitAngleY(0);
        setCameraPan([0, 0]);
        break;
      case "side":
        setOrbitAngleX(0);
        setOrbitAngleY(Math.PI / 2);
        setCameraPan([0, 0]);
        break;
      case "iso":
      case "reset":
      default:
        setOrbitAngleX(0.45);
        setOrbitAngleY(0.65);
        setCameraDistance(7.0);
        setCameraPan([0, 0]);
        break;
    }
  };

  // Pointer event handlers for Orbit / Pan / Zoom
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    isPanningRef.current = e.shiftKey || e.button === 2;
    lastPointerPosRef.current = [e.clientX, e.clientY];
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const [lastX, lastY] = lastPointerPosRef.current;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastPointerPosRef.current = [e.clientX, e.clientY];

    if (isPanningRef.current) {
      setCameraPan(([px, py]) => [px + dx * 0.01, py - dy * 0.01]);
    } else {
      setOrbitAngleY((prev) => prev + dx * 0.008);
      setOrbitAngleX((prev) => {
        const next = prev + dy * 0.008;
        return Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, next));
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    isPanningRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture was already released
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setCameraDistance((prev) => {
      const next = prev + e.deltaY * 0.008;
      return Math.max(2.0, Math.min(25.0, next));
    });
  };

  // Main Canvas 3D Perspective Projection Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number | null = null;
    let autoRotation = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2 + cameraPan[0] * 50;
      const centerY = height / 2 + cameraPan[1] * 50;
      const scale = (450 / cameraDistance) * (quality === "high" ? 1.0 : quality === "low" ? 0.9 : 0.95);

      // Background clear
      ctx.fillStyle = scene.environment?.background ?? "#0a0d14";
      ctx.fillRect(0, 0, width, height);

      // Trigonometric angles
      const currentAngleY = orbitAngleY + (reducedMotion ? 0 : autoRotation);
      const cosY = Math.cos(currentAngleY);
      const sinY = Math.sin(currentAngleY);
      const cosX = Math.cos(orbitAngleX);
      const sinX = Math.sin(orbitAngleX);

      // 3D to 2D projection function
      const project = (x: number, y: number, z: number): [number, number, number] => {
        // Rotate Y (azimuth)
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        // Rotate X (elevation)
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        const screenX = centerX + x1 * scale;
        const screenY = centerY - y2 * scale;
        return [screenX, screenY, z2];
      };

      // Draw Ground Grid if enabled
      if (showGrid && scene.environment?.ground?.enabled !== false) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        const gridSize = 4;
        const step = 1;

        for (let i = -gridSize; i <= gridSize; i += step) {
          const [p1x, p1y] = project(i, 0, -gridSize);
          const [p2x, p2y] = project(i, 0, gridSize);
          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.stroke();

          const [p3x, p3y] = project(-gridSize, 0, i);
          const [p4x, p4y] = project(gridSize, 0, i);
          ctx.beginPath();
          ctx.moveTo(p3x, p3y);
          ctx.lineTo(p4x, p4y);
          ctx.stroke();
        }
      }

      // Draw Procedural Terrain Contours when active
      if (advancedState && (advancedState.advancedView === "terrain" || advancedState.composition.subsystems.terrain)) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
        ctx.lineWidth = 1;
        for (let tx = -3; tx <= 3; tx += 0.8) {
          ctx.beginPath();
          for (let tz = -3; tz <= 3; tz += 0.4) {
            const elev = Math.sin(tx * 1.5) * Math.cos(tz * 1.5) * 0.6;
            const [sx, sy] = project(tx, elev - 0.2, tz);
            if (tz === -3) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        }
      }

      // Render Scene Objects sorted by depth
      const objects = scene.objects ?? [];
      const projectedObjects = objects
        .filter((obj) => obj.visible !== false)
        .map((obj) => {
          const pos = obj.transform?.position ?? [0, 0, 0];
          const scl = obj.transform?.scale ?? [1, 1, 1];
          const [sx, sy, depth] = project(pos[0], pos[1], pos[2]);
          return { obj, sx, sy, depth, scl };
        })
        .sort((a, b) => b.depth - a.depth); // depth sort

      for (const item of projectedObjects) {
        const { obj, sx, sy, scl } = item;
        const isSelected = obj.id === selectedObjectId;

        if (obj.type === "light") {
          // Render light gizmo
          ctx.beginPath();
          ctx.arc(sx, sy, 8, 0, Math.PI * 2);
          ctx.fillStyle = obj.color ?? "#ffd700";
          ctx.fill();
          ctx.strokeStyle = isSelected ? "#38bdf8" : "rgba(255, 255, 255, 0.5)";
          ctx.lineWidth = isSelected ? 3 : 1;
          ctx.stroke();
          continue;
        }

        const prim = obj as PrimitiveObjectSpec;
        const mat: MaterialSpec = prim.material ?? { type: "physical", color: "#9a7aff", roughness: 0.3 };
        const radius = 28 * Math.max(scl[0], scl[1]);

        ctx.save();
        ctx.translate(sx, sy);

        if (showWireframe || mat.wireframe) {
          ctx.strokeStyle = isSelected ? "#38bdf8" : mat.color ?? "#9a7aff";
          ctx.lineWidth = isSelected ? 2.5 : 1.5;
          ctx.strokeRect(-radius / 2, -radius / 2, radius, radius);
        } else {
          // Shaded primitive sphere / card projection
          const grad = ctx.createRadialGradient(-radius * 0.25, -radius * 0.25, 2, 0, 0, radius);
          grad.addColorStop(0, "#ffffff");
          grad.addColorStop(0.3, mat.color ?? "#9a7aff");
          grad.addColorStop(1, "#050508");

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fill();

          if (isSelected) {
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        }

        // Object Label Tag
        ctx.fillStyle = isSelected ? "#38bdf8" : "rgba(255, 255, 255, 0.75)";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(obj.name ?? obj.id, 0, radius + 14);

        ctx.restore();
      }

      // Draw Advanced 3D Rigid Bodies & Physics Gizmos when active
      if (advancedState && (advancedState.section === "advanced" || advancedState.composition.subsystems.physics)) {
        for (const body of advancedState.rigidBodies.bodies) {
          const [bx, by, bz] = body.position;
          const [bsx, bsy] = project(bx, by, bz);
          const bRadius = 14 * Math.max(0.6, body.dimensions[0]);

          ctx.save();
          ctx.translate(bsx, bsy);

          if (body.shape === "box") {
            ctx.fillStyle = "rgba(56, 189, 248, 0.4)";
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 1.5;
            ctx.fillRect(-bRadius, -bRadius, bRadius * 2, bRadius * 2);
            ctx.strokeRect(-bRadius, -bRadius, bRadius * 2, bRadius * 2);
          } else if (body.shape === "sphere") {
            ctx.fillStyle = "rgba(168, 85, 247, 0.4)";
            ctx.strokeStyle = "#a855f7";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, bRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else {
            // Capsule / convex
            ctx.fillStyle = "rgba(34, 197, 94, 0.4)";
            ctx.strokeStyle = "#22c55e";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, bRadius * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          ctx.fillStyle = "#f1f5f9";
          ctx.font = "9px monospace";
          ctx.textAlign = "center";
          ctx.fillText(body.name, 0, bRadius + 11);
          ctx.restore();
        }

        // Draw Constraint Connection Lines
        for (const constraint of advancedState.rigidBodies.constraints) {
          if (!constraint.enabled) continue;
          const bodyA = advancedState.rigidBodies.bodies.find((b) => b.id === constraint.bodyAId);
          const bodyB = advancedState.rigidBodies.bodies.find((b) => b.id === constraint.bodyBId);
          if (bodyA && bodyB) {
            const [p1x, p1y] = project(
              bodyA.position[0] + constraint.pivotA[0],
              bodyA.position[1] + constraint.pivotA[1],
              bodyA.position[2] + constraint.pivotA[2]
            );
            const [p2x, p2y] = project(
              bodyB.position[0] + constraint.pivotB[0],
              bodyB.position[1] + constraint.pivotB[1],
              bodyB.position[2] + constraint.pivotB[2]
            );

            ctx.strokeStyle = "#eab308";
            ctx.lineWidth = 2;
            if (typeof ctx.setLineDash === "function") {
              ctx.setLineDash([4, 2]);
            }
            ctx.beginPath();
            ctx.moveTo(p1x, p1y);
            ctx.lineTo(p2x, p2y);
            ctx.stroke();
            if (typeof ctx.setLineDash === "function") {
              ctx.setLineDash([]);
            }
          }
        }
      }

      // Continuous gentle orbit when not dragging and reduced motion is off
      if (!reducedMotion && !isDraggingRef.current) {
        autoRotation += 0.001;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [
    scene,
    selectedObjectId,
    orbitAngleX,
    orbitAngleY,
    cameraDistance,
    cameraPan,
    quality,
    showWireframe,
    showGrid,
    reducedMotion,
    advancedState,
  ]);

  // Adjust container width based on responsive preset
  const viewportWidthStyle =
    viewportSize === "mobile" ? "375px" : viewportSize === "tablet" ? "768px" : "100%";

  return (
    <div className="scene3d-viewport-container" ref={containerRef}>
      {/* Viewport Top Bar */}
      <div className="scene3d-viewport-toolbar">
        {/* Camera Views Shortcuts */}
        <div className="scene3d-toolbar-group">
          <span className="scene3d-toolbar-label">Camera Angle:</span>
          <button
            type="button"
            className="scene3d-tool-btn"
            onClick={() => setCameraView("front")}
            title="Front View"
          >
            Front
          </button>
          <button
            type="button"
            className="scene3d-tool-btn"
            onClick={() => setCameraView("top")}
            title="Top-Down View"
          >
            Top
          </button>
          <button
            type="button"
            className="scene3d-tool-btn"
            onClick={() => setCameraView("side")}
            title="Side Profile"
          >
            Side
          </button>
          <button
            type="button"
            className="scene3d-tool-btn active"
            onClick={() => setCameraView("iso")}
            title="Isometric Orbit"
          >
            Iso
          </button>
          <button
            type="button"
            className="scene3d-tool-btn"
            onClick={() => setCameraView("reset")}
            title="Reset Camera"
          >
            ↺ Reset
          </button>
        </div>

        {/* Viewport Mode & Quality */}
        <div className="scene3d-toolbar-group">
          <button
            type="button"
            className={`scene3d-tool-btn ${showWireframe ? "active" : ""}`}
            onClick={() => setShowWireframe(!showWireframe)}
            title="Toggle Wireframe Shading"
          >
            🕸️ Wireframe
          </button>
          <button
            type="button"
            className={`scene3d-tool-btn ${showGrid ? "active" : ""}`}
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Ground Grid"
          >
            🏁 Grid
          </button>

          {/* Quality Select */}
          <select
            className="scene3d-toolbar-select"
            value={quality}
            onChange={(e) => onQualityChange(e.target.value as QualityPreset)}
            aria-label="Viewport Quality"
          >
            <option value="low">Quality: Low (1x)</option>
            <option value="medium">Quality: Balanced</option>
            <option value="high">Quality: Ultra (2x)</option>
          </select>

          {/* Responsive Size Toggle */}
          <div className="scene3d-resp-toggles">
            <button
              type="button"
              className={`scene3d-tool-btn ${viewportSize === "desktop" ? "active" : ""}`}
              onClick={() => setViewportSize("desktop")}
              title="Desktop Viewport"
            >
              🖥️
            </button>
            <button
              type="button"
              className={`scene3d-tool-btn ${viewportSize === "tablet" ? "active" : ""}`}
              onClick={() => setViewportSize("tablet")}
              title="Tablet Viewport (768px)"
            >
              📱
            </button>
            <button
              type="button"
              className={`scene3d-tool-btn ${viewportSize === "mobile" ? "active" : ""}`}
              onClick={() => setViewportSize("mobile")}
              title="Mobile Viewport (375px)"
            >
              📲
            </button>
          </div>
        </div>
      </div>

      {/* Interactive 3D Canvas Stage */}
      <div className="scene3d-canvas-stage" style={{ width: viewportWidthStyle }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={520}
          className="scene3d-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* HUD Overlay Stats */}
        <div className="scene3d-hud-overlay">
          <span className="scene3d-hud-pill">
            Objects: {scene.objects?.length ?? 0}
          </span>
          <span className="scene3d-hud-pill">
            Dist: {cameraDistance.toFixed(1)}m
          </span>
          {advancedState && (
            <>
              <span className="scene3d-hud-pill">
                Bodies: {advancedState.rigidBodies.bodies.length}
              </span>
              <span className="scene3d-hud-pill">
                Terrain: {advancedState.terrain.resolution}²
              </span>
            </>
          )}
          <span className="scene3d-hud-pill">
            {reducedMotion ? "Reduced Motion: Fixed" : "Orbit: Active"}
          </span>
        </div>
      </div>
    </div>
  );
};
