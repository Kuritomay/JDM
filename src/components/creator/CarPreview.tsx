"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { CarId } from "../../lib/drives";

function Roadster({ car }: { car: CarId }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => { if (group.current) group.current.rotation.y = -0.5 + Math.sin(clock.elapsedTime * 0.3) * 0.08; });
  const color = car === "miata-na" ? "#9b2325" : "#315d60";
  return <group ref={group} rotation={[0, -0.5, 0]} position={[0, -0.45, 0]}>
    <mesh castShadow position={[0, 0.45, 0]}><boxGeometry args={[2.7, 0.42, 1.2]} /><meshStandardMaterial color={color} roughness={0.24} metalness={0.45} /></mesh>
    <mesh castShadow position={[0.35, 0.78, 0]}><boxGeometry args={[1.15, 0.32, 1.02]} /><meshStandardMaterial color="#15191b" roughness={0.18} /></mesh>
    {[[-0.85, 0.25, -0.62], [0.85, 0.25, -0.62], [-0.85, 0.25, 0.62], [0.85, 0.25, 0.62]].map((position, i) => <mesh key={i} position={position as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.3, 0.3, 0.18, 20]} /><meshStandardMaterial color="#090a0b" /></mesh>)}
  </group>;
}

export function CarPreview({ car }: { car: CarId }) {
  return <Canvas camera={{ position: [4, 2.4, 4], fov: 35 }} dpr={[1, 1.4]}>
    <color attach="background" args={["#111416"]} />
    <ambientLight intensity={1.2} />
    <spotLight position={[3, 5, 2]} intensity={50} color="#ffd7b0" />
    <Roadster car={car} />
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[20, 20]} /><meshStandardMaterial color="#0d0f10" /></mesh>
  </Canvas>;
}
