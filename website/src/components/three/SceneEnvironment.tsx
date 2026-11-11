import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";

export interface SceneEnvironmentProps {
  readonly wireframe?: boolean;
  readonly color?: string;
  readonly speed?: number;
}

export const SceneEnvironment: React.FC<SceneEnvironmentProps> = ({
  wireframe = true,
  color = "#6366f1",
  speed = 0.5,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * speed * 0.4;
      meshRef.current.rotation.y += delta * speed * 0.6;
    }
    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.x -= delta * speed * 0.5;
      innerMeshRef.current.rotation.z += delta * speed * 0.3;
    }
  });

  return (
    <>
      {/* Lighting Architecture */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-10, -10, -5]} intensity={0.8} color="#38bdf8" />
      <pointLight position={[0, 5, 0]} intensity={0.6} color="#a855f7" />

      {/* Outer Floating Crystalline Wireframe Structure */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial
          color={color}
          wireframe={wireframe}
          roughness={0.2}
          metalness={0.8}
          emissive="#4338ca"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Inner Glowing Core */}
      <mesh ref={innerMeshRef}>
        <octahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.1}
          metalness={0.9}
          emissive="#0284c7"
          emissiveIntensity={0.4}
        />
      </mesh>
    </>
  );
};
