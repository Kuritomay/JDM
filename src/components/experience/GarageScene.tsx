"use client";

import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { Suspense, type MutableRefObject, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { BufferGeometry, Color, DataTexture, DoubleSide, Float32BufferAttribute, Group, InstancedMesh, MathUtils, Object3D, PMREMGenerator, RGBAFormat, SRGBColorSpace, Vector3 } from "three";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import type { ReadyCar } from "../../data/cars";
import { Car as CarModel } from "./Car";

extend({ ThreeOrbitControls });

function mountainRingGeometry(seed: number, radius: number, height: number, baseY: number) {
  const segments = 320;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const angle = index / segments * Math.PI * 2;
    const broad = .5 + .5 * Math.sin(angle * 2 + seed * 1.71);
    const secondary = .5 + .5 * Math.sin(angle * 5 - seed * 2.13);
    const shoulder = .5 + .5 * Math.sin(angle * 9 + seed * .83);
    const detail = Math.sin(angle * 17 + seed * 3.1) * .035 + Math.sin(angle * 29 - seed) * .018;
    const profile = Math.max(.08, Math.min(1, Math.pow(broad, 1.35) * .52 + Math.pow(secondary, 1.7) * .3 + shoulder * .14 + detail));
    const localRadius = radius * (1 + Math.sin(angle * 3 + seed) * .018 + Math.sin(angle * 8 - seed * .4) * .008);
    const x = Math.sin(angle) * localRadius;
    const z = Math.cos(angle) * localRadius;
    positions.push(x, -8, z, x, baseY + profile * height, z);
    if (index < segments) {
      const bottom = index * 2;
      indices.push(bottom, bottom + 1, bottom + 2, bottom + 1, bottom + 3, bottom + 2);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  return geometry;
}

function NightBackdrop() {
  const stars = useMemo(() => {
    const geometry = new BufferGeometry();
    const positions: number[] = [];
    for (let index = 0; index < 420; index += 1) {
      const seed = Math.sin(index * 91.733) * 43758.5453;
      const next = Math.sin(index * 47.221 + 3.7) * 21734.17;
      const horizontal = seed - Math.floor(seed);
      const vertical = next - Math.floor(next);
      const angle = horizontal * Math.PI * 2;
      const radius = 105 + (index % 5) * 2;
      positions.push(Math.sin(angle) * radius, 4 + vertical * 18, Math.cos(angle) * radius);
    }
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geometry;
  }, []);
  const ridges = useMemo(() => {
    return {
      near: mountainRingGeometry(1.4, 45, 6.4, -.9),
      middleNear: mountainRingGeometry(3.2, 54, 8.2, -.55),
      middle: mountainRingGeometry(4.8, 64, 11.2, -.1),
      middleFar: mountainRingGeometry(6.7, 71, 13.3, .18),
      far: mountainRingGeometry(8.1, 78, 15.2, .45),
      farthest: mountainRingGeometry(11.7, 92, 18.5, 1.1),
      horizon: mountainRingGeometry(14.6, 108, 21.5, 1.7),
    };
  }, []);
  useEffect(() => () => { stars.dispose(); Object.values(ridges).forEach((ridge) => ridge.dispose()); }, [ridges, stars]);
  return <group name="NightBackdrop">
    <points geometry={stars}><pointsMaterial color="#d8e7fa" size={.3} sizeAttenuation transparent opacity={.86} fog={false} /></points>
    <points geometry={stars}><pointsMaterial color="#7da9dc" size={.68} sizeAttenuation transparent opacity={.11} fog={false} /></points>
    <mesh geometry={ridges.horizon}><meshBasicMaterial color="#18375e" side={DoubleSide} fog={false} /></mesh>
    <mesh geometry={ridges.farthest}><meshBasicMaterial color="#142d51" side={DoubleSide} fog={false} /></mesh>
    <mesh geometry={ridges.far}><meshBasicMaterial color="#102342" side={DoubleSide} fog={false} /></mesh>
    <mesh geometry={ridges.middleFar}><meshBasicMaterial color="#0b1932" side={DoubleSide} fog={false} /></mesh>
    <mesh geometry={ridges.middle}><meshBasicMaterial color="#071124" side={DoubleSide} fog={false} /></mesh>
    <mesh geometry={ridges.middleNear}><meshBasicMaterial color="#040a16" side={DoubleSide} fog={false} /></mesh>
    <mesh geometry={ridges.near}><meshBasicMaterial color="#01040a" side={DoubleSide} fog={false} /></mesh>
    <TreeLine />
  </group>;
}

function TreeLine() {
  const trunks = useRef<InstancedMesh>(null);
  const foliage = useRef<InstancedMesh>(null);
  useEffect(() => {
    if (!trunks.current || !foliage.current) return;
    const object = new Object3D();
    const count = 76;
    for (let index = 0; index < count; index += 1) {
      const seed = Math.sin(index * 73.17 + 4.2) * 43758.5453;
      const variation = seed - Math.floor(seed);
      const angle = index / count * Math.PI * 2 + (variation - .5) * .07;
      const radius = 31 + variation * 8;
      const scale = .75 + ((index * 29) % 17) / 17 * 1.55;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      object.position.set(x, scale * .48, z);
      object.scale.set(scale * .12, scale * .96, scale * .12);
      object.rotation.set(0, angle, 0);
      object.updateMatrix();
      trunks.current.setMatrixAt(index, object.matrix);
      for (let level = 0; level < 3; level += 1) {
        object.position.set(x, scale * (.78 + level * .48), z);
        object.scale.set(scale * (.62 - level * .1), scale * .58, scale * (.62 - level * .1));
        object.rotation.set(0, angle + level * .35, 0);
        object.updateMatrix();
        foliage.current.setMatrixAt(index * 3 + level, object.matrix);
      }
    }
    trunks.current.instanceMatrix.needsUpdate = true;
    foliage.current.instanceMatrix.needsUpdate = true;
  }, []);
  return <group name="PineSilhouettes">
    <instancedMesh ref={trunks} args={[undefined, undefined, 76]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#000103" fog={false} /></instancedMesh>
    <instancedMesh ref={foliage} args={[undefined, undefined, 228]}><coneGeometry args={[1, 2, 7]} /><meshBasicMaterial color="#000205" fog={false} /></instancedMesh>
  </group>;
}

function Ground({ night }: { night: boolean }) {
  const gradient = useMemo(() => {
    const size = 128;
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      const nx = x / (size - 1) * 2 - 1;
      const ny = y / (size - 1) * 2 - 1;
      const distance = Math.sqrt(nx * nx + ny * ny);
      const raw = Math.max(0, Math.min(1, (distance - .22) / .78));
      const fade = raw * raw * (3 - 2 * raw);
      const offset = (y * size + x) * 4;
      const sample = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const grain = ((sample - Math.floor(sample)) - .5) * 5 * (1 - fade);
      data[offset] = Math.round(19 + (2 - 19) * fade + grain);
      data[offset + 1] = Math.round(21 + (3 - 21) * fade + grain);
      data[offset + 2] = Math.round(24 + (5 - 24) * fade + grain);
      data[offset + 3] = Math.round(220 * (1 - fade));
    }
    const texture = new DataTexture(data, size, size, RGBAFormat);
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, []);
  useEffect(() => () => gradient.dispose(), [gradient]);
  if (!night) return <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[60, 60]} /><meshStandardMaterial color="#101216" roughness={.5} metalness={.35} /></mesh>;
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[200, 200]} /><meshBasicMaterial color="#000000" /></mesh>
    <mesh position={[0, .008, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[4, 96]} /><meshStandardMaterial map={gradient} roughness={.9} metalness={.03} transparent depthWrite={false} /></mesh>
  </>;
}

function Controls({ target, enabled, controlsRef }: { target: [number, number, number]; enabled: boolean; controlsRef: MutableRefObject<ThreeOrbitControls | null> }) {
  const { camera, gl } = useThree();
  useEffect(() => {
    const controls = new ThreeOrbitControls(camera, gl.domElement);
    controls.target.set(...target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 5;
    controls.maxDistance = 12;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.enabled = enabled;
    controls.saveState();
    controlsRef.current = controls;
    return () => controls.dispose();
  }, [camera, controlsRef, gl.domElement, target]);
  useEffect(() => { if (controlsRef.current) controlsRef.current.enabled = enabled; }, [enabled, controlsRef]);
  useFrame(() => controlsRef.current?.update());
  return null;
}

function Studio({ car, revealed, cinematic, onLoaded, transparent }: { car: ReadyCar; revealed: boolean; cinematic: boolean; onLoaded: () => void; transparent: boolean }) {
  const rig = useRef<Group>(null);
  const controls = useRef<ThreeOrbitControls | null>(null);
  const { camera, gl, scene } = useThree();
  const desired = useRef(new Vector3(...car.cameraPosition));
  const focus = useRef(new Vector3(...car.cameraTarget));
  const cinematicAngle = useRef(0);
  const wasCinematic = useRef(false);

  useEffect(() => {
    RectAreaLightUniformsLib.init();
    const generator = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const environment = generator.fromScene(room);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.55;
    room.dispose();
    generator.dispose();
    return () => { scene.environment = null; environment.dispose(); };
  }, [gl, scene]);

  useEffect(() => { desired.current.set(...car.cameraPosition); focus.current.set(...car.cameraTarget); }, [car.cameraPosition, car.cameraTarget]);
  useLayoutEffect(() => {
    if (!rig.current) return;
    rig.current.position.set(0, -.5, -1.1);
    rig.current.scale.setScalar(.93);
  }, [car.id]);
  useEffect(() => {
    const reset = () => controls.current?.reset();
    const canvas = document.querySelector(".garage-canvas");
    canvas?.addEventListener("dblclick", reset);
    return () => canvas?.removeEventListener("dblclick", reset);
  }, []);

  useFrame((_, rawDelta) => {
    if (!rig.current) return;
    const delta = Math.min(rawDelta, .1);
    const lambda = 1.9;
    rig.current.position.x = MathUtils.damp(rig.current.position.x, 0, lambda, delta);
    rig.current.position.y = MathUtils.damp(rig.current.position.y, revealed ? 0 : -.5, lambda, delta);
    rig.current.position.z = MathUtils.damp(rig.current.position.z, revealed ? 0 : -1.1, lambda, delta);
    rig.current.scale.setScalar(MathUtils.damp(rig.current.scale.x, revealed ? 1 : .93, lambda, delta));
    if (cinematic) {
      if (!wasCinematic.current) cinematicAngle.current = Math.atan2(camera.position.x - focus.current.x, camera.position.z - focus.current.z);
      cinematicAngle.current += delta * .05;
      const angle = cinematicAngle.current;
      desired.current.set(focus.current.x + Math.sin(angle) * 8.2, 2.7 + Math.sin(angle * .65) * .2, focus.current.z + Math.cos(angle) * 8.2);
      camera.position.lerp(desired.current, 1 - Math.exp(-delta * .5));
    }
    if (controls.current) controls.current.target.lerp(focus.current, 1 - Math.exp(-delta * 1.6));
    wasCinematic.current = cinematic;
  });

  return <>
    {!transparent && <color attach="background" args={["#030405"]} />}
    {transparent && <NightBackdrop />}
    <fog attach="fog" args={["#030405", 10, 28]} />
    <ambientLight intensity={revealed ? 0.22 : 0.01} />
    <spotLight position={[5, 7, 3]} angle={0.45} penumbra={0.8} intensity={revealed ? 820 : 0} color="#d6e2ff" castShadow />
    <spotLight position={[-6, 3, -4]} angle={0.5} penumbra={1} intensity={revealed ? 540 : 0} color="#ff5538" />
    <rectAreaLight position={[0, 7, -1]} width={8} height={4} intensity={revealed ? 4 : 0} color="#b8ccff" rotation={[-Math.PI / 2, 0, 0]} />
    <group ref={rig}>
      <Suspense fallback={null}><CarModel car={car} onLoaded={onLoaded} /></Suspense>
    </group>
    <Ground night={transparent} />
    <Controls target={car.cameraTarget} enabled={revealed && !cinematic} controlsRef={controls} />
  </>;
}

export function GarageScene(props: { car: ReadyCar; revealed: boolean; cinematic: boolean; onLoaded: () => void; transparent?: boolean }) {
  const transparent = props.transparent ?? false;
  return <Canvas className="garage-canvas" shadows dpr={[1, 1.75]} camera={{ position: props.car.cameraPosition, fov: 42 }} gl={{ antialias: true, alpha: transparent, toneMappingExposure: 1.15 }} onCreated={({ gl }) => { gl.setClearColor(new Color("#030405"), transparent ? 0 : 1); }}>
    <Studio {...props} transparent={transparent} />
  </Canvas>;
}
