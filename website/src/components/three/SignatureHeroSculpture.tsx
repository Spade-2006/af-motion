import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { animateProgress, animateSpring, easings } from "af-motion";

export type QualityTier = "high" | "medium" | "low";

export interface SignatureHeroSculptureProps {
  readonly pointer?: { readonly x: number; readonly y: number };
  readonly scrollProgress?: number;
  readonly isHovered?: boolean;
  readonly qualityTier?: QualityTier;
  readonly prefersReducedMotion?: boolean;
}

/**
 * Signature 3D Hero Object: "The Kinetic Chrono-Core"
 *
 * A cohesive multi-layered sculpture combining:
 * 1. Morphing obsidian metallic core with harmonic surface wave modulation
 * 2. Wireframe geodesic lattice shell catching cyan & indigo key lighting
 * 3. Nested precision gyroscopic orbital rings driven by scroll and hover state
 * 4. Suspended micro-particle orbit calibrated by device quality tier
 *
 * Entrance reveal and hover intensity are orchestrated by AF Motion's actual
 * `animateProgress` and `animateSpring` APIs.
 */
export const SignatureHeroSculpture: React.FC<SignatureHeroSculptureProps> = ({
  pointer = { x: 0, y: 0 },
  scrollProgress = 0,
  isHovered = false,
  qualityTier = "high",
  prefersReducedMotion = false,
}) => {
  const rootGroupRef = useRef<THREE.Group>(null);
  const coreMeshRef = useRef<THREE.Mesh>(null);
  const cageMeshRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // AF Motion driven animation values (stored in refs to avoid React re-renders at 60fps)
  const revealScaleRef = useRef(prefersReducedMotion ? 1 : 0.65);
  const revealOpacityRef = useRef(prefersReducedMotion ? 1 : 0);
  const hoverSpringRef = useRef(0);
  const elapsedRef = useRef(0);

  // Adaptive geometry complexity by device tier
  const coreDetail = qualityTier === "high" ? 3 : qualityTier === "medium" ? 2 : 1;
  const particleCount = qualityTier === "high" ? 160 : qualityTier === "medium" ? 84 : 36;

  // Build morphable core geometry + immutable base vertex cache
  const { coreGeometry, basePositions, baseNormals } = useMemo(() => {
    const geom = new THREE.IcosahedronGeometry(1.18, coreDetail);
    const posAttr = geom.attributes.position;
    const normAttr = geom.attributes.normal;
    return {
      coreGeometry: geom,
      basePositions: new Float32Array(posAttr.array as Float32Array),
      baseNormals: new Float32Array(normAttr.array as Float32Array),
    };
  }, [coreDetail]);

  // Outer geodesic cage geometry
  const cageGeometry = useMemo(() => new THREE.IcosahedronGeometry(1.54, 1), []);

  // Precision orbital rings
  const { ring1Geo, ring2Geo, ring3Geo } = useMemo(() => {
    const seg = qualityTier === "low" ? 48 : 84;
    return {
      ring1Geo: new THREE.TorusGeometry(1.88, 0.014, 12, seg),
      ring2Geo: new THREE.TorusGeometry(2.14, 0.011, 12, seg),
      ring3Geo: new THREE.TorusGeometry(2.42, 0.008, 12, seg),
    };
  }, [qualityTier]);

  // Orbital micro-particles distributed along spherical shells
  const particleGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const cyan = new THREE.Color("#38bdf8");
    const indigo = new THREE.Color("#818cf8");

    for (let i = 0; i < particleCount; i++) {
      // Deterministic Fibonacci sphere distribution with slight radius variation
      const phi = Math.acos(1 - (2 * (i + 0.5)) / particleCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const radius = 2.0 + ((i % 7) / 7) * 1.15;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const mixFactor = (i % 5) / 4;
      const c = cyan.clone().lerp(indigo, mixFactor);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geom;
  }, [particleCount]);

  // Dispose GPU geometries cleanly on unmount or tier change
  useEffect(() => {
    return () => {
      coreGeometry.dispose();
      cageGeometry.dispose();
      ring1Geo.dispose();
      ring2Geo.dispose();
      ring3Geo.dispose();
      particleGeometry.dispose();
    };
  }, [coreGeometry, cageGeometry, ring1Geo, ring2Geo, ring3Geo, particleGeometry]);

  // AF Motion: Orchestrate initial entrance reveal
  useEffect(() => {
    if (prefersReducedMotion) {
      revealScaleRef.current = 1;
      revealOpacityRef.current = 1;
      return;
    }

    const controls = animateProgress({
      duration: 1150,
      easing: easings.easeOutExpo,
      respectReducedMotion: true,
      onUpdate: (progress) => {
        revealScaleRef.current = 0.65 + 0.35 * progress;
        revealOpacityRef.current = progress;
      },
    });

    return () => {
      controls.cancel();
    };
  }, [prefersReducedMotion]);

  // AF Motion: Spring transition on pointer hover state change
  useEffect(() => {
    if (prefersReducedMotion) {
      hoverSpringRef.current = isHovered ? 1 : 0;
      return;
    }

    const springControls = animateSpring({
      from: hoverSpringRef.current,
      to: isHovered ? 1 : 0,
      config: { stiffness: 190, damping: 22, mass: 1 },
      respectReducedMotion: true,
      onUpdate: ({ position }) => {
        hoverSpringRef.current = position;
      },
    });

    return () => {
      springControls.cancel();
    };
  }, [isHovered, prefersReducedMotion]);

  // Frame loop: apply pointer tilt, scroll evolution, ring orbits & subtle surface wave
  useFrame((_, delta) => {
    const root = rootGroupRef.current;
    if (!root) return;

    const clampedDelta = Math.min(delta, 0.05);
    const hover = hoverSpringRef.current;
    const clampedScroll = Math.min(Math.max(scrollProgress, 0), 1);

    // Apply entrance reveal & subtle scroll scale evolution
    const scrollScale = 1 - clampedScroll * 0.12;
    const finalScale = revealScaleRef.current * scrollScale;
    root.scale.setScalar(finalScale);

    // Interactive pointer tilt + scroll pitch
    const targetRotY = pointer.x * 0.42 + clampedScroll * 0.55;
    const targetRotX = -pointer.y * 0.3 + clampedScroll * 0.25;

    if (prefersReducedMotion) {
      root.rotation.set(0.22, -0.35, 0.08);
      return;
    }

    const lerpFactor = 1 - Math.exp(-clampedDelta * 5.5);
    root.rotation.y += (targetRotY - root.rotation.y) * lerpFactor;
    root.rotation.x += (targetRotX - root.rotation.x) * lerpFactor;

    elapsedRef.current += clampedDelta * (1 + hover * 0.45);
    const t = elapsedRef.current;

    // Harmonic vertex breathing on obsidian nucleus (skip on low quality to save CPU)
    if (coreMeshRef.current && qualityTier !== "low") {
      const posAttr = coreGeometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const amp = 0.045 + hover * 0.03;

      for (let i = 0; i < arr.length; i += 3) {
        const bx = basePositions[i];
        const by = basePositions[i + 1];
        const bz = basePositions[i + 2];

        const wave =
          Math.sin(bx * 2.4 + t * 1.4) *
          Math.cos(by * 2.4 - t * 1.1) *
          Math.sin(bz * 2.1 + t * 0.9);
        const displacement = wave * amp;

        arr[i] = bx + baseNormals[i] * displacement;
        arr[i + 1] = by + baseNormals[i + 1] * displacement;
        arr[i + 2] = bz + baseNormals[i + 2] * displacement;
      }
      posAttr.needsUpdate = true;

      coreMeshRef.current.rotation.y = t * 0.18;
      coreMeshRef.current.rotation.z = t * 0.1;

      const coreMat = coreMeshRef.current.material as THREE.MeshStandardMaterial;
      coreMat.emissiveIntensity = 0.25 + hover * 0.35 + clampedScroll * 0.15;
    } else if (coreMeshRef.current) {
      coreMeshRef.current.rotation.y = t * 0.18;
    }

    // Counter-rotating geodesic cage
    if (cageMeshRef.current) {
      cageMeshRef.current.rotation.x = -t * 0.14;
      cageMeshRef.current.rotation.y = t * 0.22;
      const cageScale = 1 + hover * 0.05 + clampedScroll * 0.08;
      cageMeshRef.current.scale.setScalar(cageScale);
    }

    // Gyroscopic orbital rings expand subtly on scroll and hover
    const ringSpread = 1 + hover * 0.06 + clampedScroll * 0.16;
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = 0.72 + t * 0.28;
      ring1Ref.current.rotation.y = 0.35 + t * 0.16;
      ring1Ref.current.scale.setScalar(ringSpread);
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -0.64 - t * 0.2;
      ring2Ref.current.rotation.z = 0.85 + t * 0.24;
      ring2Ref.current.scale.setScalar(ringSpread * 1.02);
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = 1.1 - t * 0.15;
      ring3Ref.current.rotation.z = -0.45 + t * 0.18;
      ring3Ref.current.scale.setScalar(ringSpread * 1.04);
    }

    // Particle drift
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.06;
      particlesRef.current.rotation.x = Math.sin(t * 0.12) * 0.08;
    }
  });

  return (
    <>
      {/* Balanced Studio Cinematic Lighting */}
      <ambientLight intensity={0.45} color="#cbd5e1" />
      <directionalLight position={[6, 8, 5]} intensity={1.8} color="#ffffff" />
      <directionalLight position={[-6, -4, -3]} intensity={0.9} color="#38bdf8" />
      <pointLight position={[2.5, 2.5, 3]} intensity={2.2} distance={10} color="#6366f1" />
      <pointLight position={[-2.5, -2.0, 2]} intensity={1.6} distance={9} color="#38bdf8" />

      <group ref={rootGroupRef}>
        {/* 1. Central Morphing Obsidian Core */}
        <mesh ref={coreMeshRef} geometry={coreGeometry}>
          <meshStandardMaterial
            color="#0b0e18"
            metalness={0.88}
            roughness={0.18}
            emissive="#4f46e5"
            emissiveIntensity={0.28}
            flatShading={qualityTier === "low"}
          />
        </mesh>

        {/* 2. Electric Cyan Geodesic Lattice Cage */}
        <mesh ref={cageMeshRef} geometry={cageGeometry}>
          <meshStandardMaterial
            color="#38bdf8"
            wireframe
            transparent
            opacity={0.38}
            emissive="#0ea5e9"
            emissiveIntensity={0.45}
          />
        </mesh>

        {/* 3. Precision Gyroscopic Orbital Rings */}
        <mesh ref={ring1Ref} geometry={ring1Geo}>
          <meshStandardMaterial
            color="#818cf8"
            metalness={0.85}
            roughness={0.2}
            emissive="#6366f1"
            emissiveIntensity={0.4}
          />
        </mesh>

        <mesh ref={ring2Ref} geometry={ring2Geo}>
          <meshStandardMaterial
            color="#38bdf8"
            metalness={0.85}
            roughness={0.2}
            emissive="#0284c7"
            emissiveIntensity={0.35}
          />
        </mesh>

        <mesh ref={ring3Ref} geometry={ring3Geo}>
          <meshStandardMaterial
            color="#a855f7"
            metalness={0.8}
            roughness={0.25}
            emissive="#9333ea"
            emissiveIntensity={0.25}
            transparent
            opacity={0.75}
          />
        </mesh>

        {/* 4. Orbital Kinetic Particle Cloud */}
        <points ref={particlesRef} geometry={particleGeometry}>
          <pointsMaterial
            size={qualityTier === "low" ? 0.045 : 0.036}
            vertexColors
            transparent
            opacity={0.78}
            sizeAttenuation
            depthWrite={false}
          />
        </points>
      </group>
    </>
  );
};
