"use client";

import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { Suspense, type MutableRefObject, useEffect, useRef } from "react";
import { Color, Group, PMREMGenerator, Vector3 } from "three";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import type { ReadyCar } from "../../data/cars";
import { Car as CarModel } from "./Car";

extend({ ThreeOrbitControls });

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

function Studio({ car, revealed, cinematic, onLoaded }: { car: ReadyCar; revealed: boolean; cinematic: boolean; onLoaded: () => void }) {
  const rig = useRef<Group>(null);
  const controls = useRef<ThreeOrbitControls | null>(null);
  const { camera, gl, scene } = useThree();
  const desired = useRef(new Vector3(...car.cameraPosition));

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

  useEffect(() => { desired.current.set(...car.cameraPosition); }, [car.cameraPosition]);
  useEffect(() => {
    const reset = () => controls.current?.reset();
    const canvas = document.querySelector(".garage-canvas");
    canvas?.addEventListener("dblclick", reset);
    return () => canvas?.removeEventListener("dblclick", reset);
  }, []);
  useFrame(({ clock }, delta) => {
    if (!rig.current) return;
    if (cinematic) {
      const angle = clock.getElapsedTime() * 0.12;
      desired.current.set(Math.sin(angle) * 8, 2.8 + Math.sin(angle * 0.5) * 0.25, Math.cos(angle) * 8);
    }
    if (cinematic) camera.position.lerp(desired.current, 1 - Math.exp(-delta * 1.8));
    if (controls.current) controls.current.target.lerp(new Vector3(...car.cameraTarget), 1 - Math.exp(-delta * 2));
  });

  return <>
    <color attach="background" args={["#030405"]} />
    <fog attach="fog" args={["#030405", 10, 28]} />
    <ambientLight intensity={revealed ? 0.22 : 0.01} />
    <spotLight position={[5, 7, 3]} angle={0.45} penumbra={0.8} intensity={revealed ? 820 : 0} color="#d6e2ff" castShadow />
    <spotLight position={[-6, 3, -4]} angle={0.5} penumbra={1} intensity={revealed ? 540 : 0} color="#ff5538" />
    <rectAreaLight position={[0, 7, -1]} width={8} height={4} intensity={revealed ? 4 : 0} color="#b8ccff" rotation={[-Math.PI / 2, 0, 0]} />
    <group ref={rig} scale={revealed ? 1 : 0.94}>
      <Suspense fallback={null}><CarModel car={car} onLoaded={onLoaded} /></Suspense>
    </group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[60, 60]} /><meshStandardMaterial color="#101216" roughness={0.5} metalness={0.35} /></mesh>
    <Controls target={car.cameraTarget} enabled={revealed && !cinematic} controlsRef={controls} />
  </>;
}

export function GarageScene(props: { car: ReadyCar; revealed: boolean; cinematic: boolean; onLoaded: () => void }) {
  return <Canvas className="garage-canvas" shadows dpr={[1, 1.75]} camera={{ position: props.car.cameraPosition, fov: 42 }} gl={{ antialias: true, toneMappingExposure: 1.15 }} onCreated={({ gl }) => { gl.setClearColor(new Color("#030405")); }}>
    <Studio {...props} />
  </Canvas>;
}
