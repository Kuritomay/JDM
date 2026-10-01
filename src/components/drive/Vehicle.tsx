"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Box3, Group, Material, Mesh, MeshStandardMaterial, Object3D, Quaternion, SpotLight, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { CarId } from "../../lib/drives";

const NOOP = () => undefined;

export interface VehicleMotion {
  wheelSpin: number;
  steeringAngle: number;
  carPosition?: Vector3;
  carQuaternion?: Quaternion;
}

interface WheelRoot {
  object: Object3D;
  base: Quaternion;
  front: boolean;
}

function HeadlightRig({ intensity = 58 }: { intensity?: number }) {
  const left = useRef<SpotLight>(null); const right = useRef<SpotLight>(null); const leftTarget = useRef<Object3D>(null); const rightTarget = useRef<Object3D>(null);
  useEffect(() => { if (left.current && leftTarget.current) left.current.target = leftTarget.current; if (right.current && rightTarget.current) right.current.target = rightTarget.current; }, []);
  return <group name="MiataHeadlights">
    <object3D ref={leftTarget} position={[-.58, -.15, -22]} /><object3D ref={rightTarget} position={[.58, -.15, -22]} />
    <spotLight ref={left} name="leftHeadlight" position={[-.58, .68, -1.35]} angle={.28} penumbra={.62} intensity={intensity} distance={42} color="#fff1cf" castShadow={false} />
    <spotLight ref={right} name="rightHeadlight" position={[.58, .68, -1.35]} angle={.28} penumbra={.62} intensity={intensity} distance={42} color="#fff1cf" castShadow={false} />
  </group>;
}

function LicensedMiata({ engineOn, headlights, moving, motion, onReady }: { engineOn: boolean; headlights: boolean; moving: boolean; motion?: MutableRefObject<VehicleMotion>; onReady: () => void }) {
  const gltf = useLoader(GLTFLoader, "/models/miata/car.glb");
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const carRoot = useRef<Group>(null); const normalized = useRef<Group>(null); const wheelRoots = useRef<WheelRoot[]>([]); const screenMaterial = useRef<MeshStandardMaterial | null>(null); const headlightMaterials = useRef<MeshStandardMaterial[]>([]);
  const localMotion = useRef<VehicleMotion>({ wheelSpin: 0, steeringAngle: 0 });
  const wheelAxis = useMemo(() => new Vector3(1, 0, 0), []); const steerAxis = useMemo(() => new Vector3(0, 1, 0), []);

  useLayoutEffect(() => {
    if (!normalized.current) return;
    wheelRoots.current = []; headlightMaterials.current = []; const clonedMaterials: Material[] = [];
    scene.traverse((object) => {
      const name = object.name.toLowerCase();
      if (/^(tire|rim)\d*$/.test(name)) wheelRoots.current.push({ object, base: object.quaternion.clone(), front: object.position.z > 0 });
      if (object instanceof Mesh) {
        object.castShadow = true; object.receiveShadow = true; object.material = (object.material as Material).clone(); clonedMaterials.push(object.material as Material);
        if (name.includes("radioscreen") && object.material instanceof MeshStandardMaterial) screenMaterial.current = object.material;
        if (/(flight_glass|lightin_material|flightin_material)/.test(name) && object.material instanceof MeshStandardMaterial) headlightMaterials.current.push(object.material);
      }
    });
    const box = new Box3().setFromObject(scene); const size = box.getSize(new Vector3()); const center = box.getCenter(new Vector3()); const scale = 4.35 / size.z;
    normalized.current.scale.setScalar(scale); normalized.current.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    onReady();
    return () => clonedMaterials.forEach((material) => material.dispose());
  }, [onReady, scene]);

  useEffect(() => {
    if (screenMaterial.current) { screenMaterial.current.emissive.set(engineOn ? "#68b58c" : "#000000"); screenMaterial.current.emissiveIntensity = engineOn ? 2.1 : 0; }
    headlightMaterials.current.forEach((material) => { material.emissive.set(headlights ? "#fff5dc" : "#000000"); material.emissiveIntensity = headlights ? 3.2 : 0; });
  }, [engineOn, headlights]);

  useFrame((_, delta) => {
    const state = motion?.current ?? localMotion.current;
    if (moving && !motion) state.wheelSpin -= delta * 7.5;
    if (carRoot.current && state.carPosition && state.carQuaternion) { carRoot.current.position.copy(state.carPosition); carRoot.current.quaternion.copy(state.carQuaternion); }
    const spin = new Quaternion().setFromAxisAngle(wheelAxis, state.wheelSpin);
    const steer = new Quaternion();
    wheelRoots.current.forEach((wheel) => {
      steer.setFromAxisAngle(steerAxis, wheel.front ? state.steeringAngle : 0);
      wheel.object.quaternion.copy(steer).multiply(spin).multiply(wheel.base);
    });
  });

  return <group ref={carRoot} name="CarRoot">
    {/* The source model faces +Z. One root-level half turn aligns it with road forward -Z. */}
    <group name="MiataModel" rotation={[0, Math.PI, 0]}><group ref={normalized}><primitive object={scene} /></group></group>
    {headlights && <HeadlightRig />}
  </group>;
}

function ProceduralKei({ engineOn, headlights, motion, onReady }: { engineOn: boolean; headlights: boolean; motion?: MutableRefObject<VehicleMotion>; onReady: () => void }) {
  const root = useRef<Group>(null);
  useEffect(onReady, [onReady]);
  useFrame(() => { const state = motion?.current; if (root.current && state?.carPosition && state.carQuaternion) { root.current.position.copy(state.carPosition); root.current.quaternion.copy(state.carQuaternion); } });
  return <group ref={root} name="CarRoot">
    <mesh castShadow position={[0, .55, 0]}><boxGeometry args={[1.55, .6, 3.4]} /><meshStandardMaterial color="#315d60" metalness={.55} roughness={.2} /></mesh>
    <mesh castShadow position={[0, 1.02, .15]}><boxGeometry args={[1.35, .48, 1.4]} /><meshStandardMaterial color="#12191b" metalness={.25} roughness={.2} /></mesh>
    {[-.78, .78].flatMap((x) => [-1.05, 1.05].map((z) => <mesh key={`${x}-${z}`} position={[x, .32, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.31, .31, .18, 24]} /><meshStandardMaterial color="#090b0c" roughness={.7} /></mesh>))}
    <mesh position={[0, .62, 1.72]}><boxGeometry args={[.75, .12, .06]} /><meshStandardMaterial color="#7d1714" emissive="#ff2f21" emissiveIntensity={engineOn ? 2 : 0} /></mesh>
    {headlights && <HeadlightRig intensity={45} />}
  </group>;
}

export function Vehicle({ car, engineOn, headlights = false, moving, motion, onReady = NOOP }: { car: CarId; engineOn: boolean; headlights?: boolean; moving: boolean; motion?: MutableRefObject<VehicleMotion>; onReady?: () => void }) {
  return car === "miata-na" ? <LicensedMiata engineOn={engineOn} headlights={headlights} moving={moving} motion={motion} onReady={onReady} /> : <ProceduralKei engineOn={engineOn} headlights={headlights} motion={motion} onReady={onReady} />;
}
