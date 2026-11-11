import React, { useEffect, useRef, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { aurora, particleField } from "af-motion";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { DemoWorkspace } from "../components/DemoWorkspace";
import {
  ControlSection,
  SelectControl,
  SliderControl,
  ToggleControl,
} from "../components/ControlPanel";
import { useWebsiteMotion } from "@/app/providers/MotionProvider";
import type { DemoComponentProps } from "../types";

type GpuShowcaseMode = "webgl-3d" | "aurora" | "particles";
type GeoKind = "icosahedron" | "torusKnot" | "octahedron" | "dodecahedron";

interface DynamicMeshProps {
  readonly geoKind: GeoKind;
  readonly metalness: number;
  readonly roughness: number;
  readonly wireframe: boolean;
  readonly rotationSpeed: number;
  readonly isPaused: boolean;
  readonly prefersReducedMotion: boolean;
}

const DynamicShowcaseMesh: React.FC<DynamicMeshProps> = ({
  geoKind,
  metalness,
  roughness,
  wireframe,
  rotationSpeed,
  isPaused,
  prefersReducedMotion,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current || isPaused || prefersReducedMotion) return;
    const dt = Math.min(delta, 0.05);
    meshRef.current.rotation.y += dt * rotationSpeed * 0.7;
    meshRef.current.rotation.x += dt * rotationSpeed * 0.35;
  });

  return (
    <mesh ref={meshRef}>
      {geoKind === "icosahedron" && <icosahedronGeometry args={[1.45, 2]} />}
      {geoKind === "torusKnot" && <torusKnotGeometry args={[0.95, 0.3, 110, 16]} />}
      {geoKind === "octahedron" && <octahedronGeometry args={[1.55, 0]} />}
      {geoKind === "dodecahedron" && <dodecahedronGeometry args={[1.45, 0]} />}
      <meshStandardMaterial
        color="#6366f1"
        metalness={metalness}
        roughness={roughness}
        wireframe={wireframe}
        emissive="#0ea5e9"
        emissiveIntensity={0.22}
      />
    </mesh>
  );
};

export const ThreeAndGPUDemo: React.FC<DemoComponentProps> = ({
  resetNonce,
  isPaused,
  onCodeChange,
  onStatusChange,
}) => {
  const { prefersReducedMotion } = useWebsiteMotion();
  const [mode, setMode] = useState<GpuShowcaseMode>("webgl-3d");

  // 3D PBR & Lighting State
  const [geoKind, setGeoKind] = useState<GeoKind>("torusKnot");
  const [metalness, setMetalness] = useState(0.82);
  const [roughness, setRoughness] = useState(0.2);
  const [wireframe, setWireframe] = useState(false);
  const [lightIntensity, setLightIntensity] = useState(1.4);
  const [rotationSpeed, setRotationSpeed] = useState(0.7);
  const [cameraNonce, setCameraNonce] = useState(0);

  // Canvas / Aurora Background State
  const [auroraSpeed, setAuroraSpeed] = useState(10);
  const [particleCount, setParticleCount] = useState(55);

  const bgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resetNonce === 0) return;
    setGeoKind("torusKnot");
    setMetalness(0.82);
    setRoughness(0.2);
    setWireframe(false);
    setLightIntensity(1.4);
    setRotationSpeed(0.7);
    setAuroraSpeed(10);
    setParticleCount(55);
    setCameraNonce((n) => n + 1);
  }, [resetNonce]);

  // Mount AF Motion aurora() / particleField() cleanly on mode switch
  useEffect(() => {
    const el = bgContainerRef.current;
    if (!el) return;

    if (mode === "aurora") {
      const ctrl = aurora(el, {
        colors: ["#38bdf8", "#6366f1", "#a855f7"],
        speed: auroraSpeed,
        opacity: 0.75,
      });
      return () => ctrl.destroy();
    }

    if (mode === "particles") {
      const ctrl = particleField(el, {
        count: prefersReducedMotion ? 20 : particleCount,
        colors: ["#38bdf8", "#818cf8", "#c084fc"],
        speed: isPaused || prefersReducedMotion ? 0 : 0.75,
      });
      return () => ctrl.destroy();
    }
  }, [mode, auroraSpeed, particleCount, isPaused, prefersReducedMotion]);

  // Update Code Inspector
  useEffect(() => {
    let code = "";
    if (mode === "webgl-3d") {
      code = `import { createScene3D } from "af-motion/catalogue";

const scene = createScene3D({
  id: "showcase-scene",
  camera: { type: "perspective", fov: 45, position: [0, 0, 5] },
  lighting: {
    ambient: { color: "#ffffff", intensity: 0.4 },
    directional: [{ color: "#ffffff", intensity: ${lightIntensity}, position: [5, 6, 4] }],
  },
  objects: [
    {
      id: "hero-mesh",
      geometry: { kind: "${geoKind}" },
      material: { kind: "standard", metalness: ${metalness}, roughness: ${roughness}, wireframe: ${wireframe} },
    },
  ],
});`;
      onStatusChange?.(`WebGL 3D · ${geoKind} · Drag to Orbit`);
    } else if (mode === "aurora") {
      code = `import { aurora } from "af-motion";

const controls = aurora(".gpu-backdrop", {
  colors: ["#38bdf8", "#6366f1", "#a855f7"],
  speed: ${auroraSpeed},
  opacity: 0.75,
});

// Cleanup on unmount
controls.destroy();`;
      onStatusChange?.(`aurora() · speed ${auroraSpeed}s`);
    } else {
      code = `import { particleField } from "af-motion";

const controls = particleField(".particle-stage", {
  count: ${particleCount},
  colors: ["#38bdf8", "#818cf8", "#c084fc"],
  speed: 0.75,
});

controls.destroy();`;
      onStatusChange?.(`particleField() · ${particleCount} particles`);
    }
    onCodeChange(code);
  }, [mode, geoKind, metalness, roughness, wireframe, lightIntensity, auroraSpeed, particleCount, onCodeChange, onStatusChange]);

  return (
    <DemoWorkspace
      controlsTitle="3D & GPU Rendering"
      stage={
        <div className="flex-1 flex flex-col gap-4">
          {/* Sub-mode switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "webgl-3d", label: "3D Geometry & PBR" },
                  { id: "aurora", label: "Aurora Shader" },
                  { id: "particles", label: "Particle Field" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    mode === m.id
                      ? "bg-indigo-600 text-white"
                      : "bg-white/[0.04] text-slate-400 hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {mode === "webgl-3d" && (
              <button
                type="button"
                onClick={() => setCameraNonce((c) => c + 1)}
                className="px-2.5 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] font-mono text-[10px] text-cyan-300 cursor-pointer"
              >
                Reset Camera
              </button>
            )}
          </div>

          {/* Active Visual Stage */}
          {mode === "webgl-3d" ? (
            <SceneCanvas
              key={`canvas-${cameraNonce}`}
              className="h-[290px] sm:h-[320px]"
              cameraPosition={[0, 0, 4.6]}
              frameloop={isPaused || prefersReducedMotion ? "demand" : "always"}
            >
              <ambientLight intensity={0.45} />
              <directionalLight position={[6, 8, 5]} intensity={lightIntensity} color="#ffffff" />
              <pointLight position={[-5, -4, 3]} intensity={1.4} color="#38bdf8" />
              <DynamicShowcaseMesh
                geoKind={geoKind}
                metalness={metalness}
                roughness={roughness}
                wireframe={wireframe}
                rotationSpeed={rotationSpeed}
                isPaused={isPaused}
                prefersReducedMotion={prefersReducedMotion}
              />
              <OrbitControls enableZoom={false} enablePan={false} />
            </SceneCanvas>
          ) : (
            <div
              ref={bgContainerRef}
              className="relative w-full h-[290px] sm:h-[320px] rounded-xl bg-[#070910] border border-white/[0.08] overflow-hidden flex items-center justify-center"
            >
              <div className="relative z-10 px-5 py-3 rounded-xl bg-black/50 backdrop-blur-md border border-white/[0.1] text-center pointer-events-none">
                <span className="font-mono text-xs text-cyan-300 block">
                  {mode === "aurora" ? "AF Motion aurora()" : "AF Motion particleField()"}
                </span>
                <span className="text-[11px] text-slate-300">
                  Hardware-accelerated canvas & procedural glow active
                </span>
              </div>
            </div>
          )}
        </div>
      }
      controls={
        <>
          {mode === "webgl-3d" && (
            <>
              <ControlSection title="Geometry & Material">
                <SelectControl
                  id="gpu-geo"
                  label="Procedural Geometry"
                  value={geoKind}
                  options={[
                    { value: "torusKnot", label: "Torus Knot" },
                    { value: "icosahedron", label: "Icosahedron" },
                    { value: "octahedron", label: "Octahedron" },
                    { value: "dodecahedron", label: "Dodecahedron" },
                  ]}
                  onChange={(v) => setGeoKind(v as GeoKind)}
                />
                <SliderControl
                  id="gpu-metal"
                  label="Metalness"
                  value={metalness}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={setMetalness}
                />
                <SliderControl
                  id="gpu-rough"
                  label="Roughness"
                  value={roughness}
                  min={0.05}
                  max={1}
                  step={0.05}
                  onChange={setRoughness}
                />
                <ToggleControl
                  id="gpu-wire"
                  label="Wireframe Cage"
                  checked={wireframe}
                  onChange={setWireframe}
                />
              </ControlSection>

              <ControlSection title="Lighting & Orbit">
                <SliderControl
                  id="gpu-light"
                  label="Key Light Intensity"
                  value={lightIntensity}
                  min={0.2}
                  max={3.0}
                  step={0.1}
                  onChange={setLightIntensity}
                />
                <SliderControl
                  id="gpu-rot"
                  label="Rotation Speed"
                  value={rotationSpeed}
                  min={0}
                  max={2}
                  step={0.1}
                  onChange={setRotationSpeed}
                />
              </ControlSection>
            </>
          )}

          {mode === "aurora" && (
            <ControlSection title="Aurora Options">
              <SliderControl
                id="aur-speed"
                label="Cycle Duration"
                value={auroraSpeed}
                min={3}
                max={20}
                step={1}
                unit="s"
                onChange={setAuroraSpeed}
              />
            </ControlSection>
          )}

          {mode === "particles" && (
            <ControlSection title="Particle Field Options">
              <SliderControl
                id="part-count"
                label="Particle Count"
                value={particleCount}
                min={15}
                max={120}
                step={5}
                onChange={setParticleCount}
              />
            </ControlSection>
          )}
        </>
      }
    />
  );
};

export default ThreeAndGPUDemo;
