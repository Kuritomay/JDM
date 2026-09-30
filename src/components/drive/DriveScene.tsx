"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Color, DirectionalLight, FogExp2, Group, MeshStandardMaterial, Object3D, PerspectiveCamera, PMREMGenerator, Quaternion, RectAreaLight, SpotLight, Vector3 } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import type { CarId, DriveSign } from "../../lib/drives";
import { DynamicSky } from "./DynamicSky";
import { RoadWorld, type RoadRuntime } from "./RoadWorld";
import { Vehicle } from "./Vehicle";

export type NarrativeStage = "garage" | "cockpit" | "ignition" | "departure" | "drive" | "arrival" | "destination";
export type CameraMode = "driver" | "chase";
type Quality = "high" | "medium" | "low";

function GarageLighting({ stage, openness }: { stage: NarrativeStage; openness: MutableRefObject<number> }) {
  const key = useRef<RectAreaLight>(null); const rim = useRef<RectAreaLight>(null); const keySpot = useRef<SpotLight>(null); const outsideSpot = useRef<SpotLight>(null); const keyTarget = useRef<Object3D>(null); const outsideTarget = useRef<Object3D>(null);
  useEffect(() => { RectAreaLightUniformsLib.init(); if (keySpot.current && keyTarget.current) keySpot.current.target = keyTarget.current; if (outsideSpot.current && outsideTarget.current) outsideSpot.current.target = outsideTarget.current; }, []);
  useFrame(() => { const open = openness.current; if (key.current) key.current.intensity = 6.5 + open * 2; if (rim.current) rim.current.intensity = 4 + open * 5; if (outsideSpot.current) outsideSpot.current.intensity = 12 + open * 90; });
  return <group>
    <ambientLight intensity={.48} color="#9daaa2" />
    <rectAreaLight ref={key} position={[-3.6, 4.8, -1.5]} rotation={[-Math.PI / 2.4, 0, -.32]} width={5.8} height={1.5} intensity={7} color="#d7e5df" />
    <rectAreaLight ref={rim} position={[2.8, 2.2, 2.8]} rotation={[0, Math.PI, 0]} width={3.5} height={2.8} intensity={4} color="#6d8fba" />
    <object3D ref={keyTarget} position={[0,.5,0]} /><object3D ref={outsideTarget} position={[0,.4,0]} />
    <spotLight ref={keySpot} position={[3.8, 5.8, -2.4]} angle={.52} penumbra={.72} intensity={75} color="#dce8e2" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
    <pointLight position={[-5, 2.1, 1.6]} intensity={18} distance={8} decay={2} color="#e89a59" />
    <spotLight ref={outsideSpot} position={[0, 1.4, -5]} intensity={12} distance={18} angle={.8} penumbra={.8} color="#ffad68" />
    {stage === "ignition" && <pointLight position={[0, .8, -1.8]} intensity={8} distance={4} color="#fff0d0" />}
  </group>;
}

function Garage({ stage, car, onReady }: { stage: NarrativeStage; car: CarId; onReady: () => void }) {
  const shutter = useRef<Group>(null); const outside = useRef<MeshStandardMaterial>(null); const stageStart = useRef(0); const openness = useRef(0);
  useEffect(() => { stageStart.current = performance.now(); }, [stage]);
  useFrame(() => { const elapsed = (performance.now() - stageStart.current) / 1000; openness.current = stage === "departure" ? Math.min(1, elapsed / 3.7) : ["drive", "arrival", "destination"].includes(stage) ? 1 : 0; if (shutter.current) shutter.current.position.y = openness.current * 6.5; if (outside.current) outside.current.emissiveIntensity = 1.2 + openness.current * 5; });
  return <group name="JapaneseGarage">
    <GarageLighting stage={stage} openness={openness} />
    <mesh position={[0, 3.35, 3.3]} receiveShadow><boxGeometry args={[13, 6.7, .35]} /><meshStandardMaterial color="#50514d" roughness={.96} /></mesh>
    {[-6.35, 6.35].map((x) => <mesh key={x} position={[x, 3.35, -1]} receiveShadow><boxGeometry args={[.35, 6.7, 8.6]} /><meshStandardMaterial color="#454742" roughness={.98} /></mesh>)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[13, 13]} /><meshPhysicalMaterial color="#383a37" roughness={.34} metalness={.12} clearcoat={.45} clearcoatRoughness={.28} /></mesh>
    <group ref={shutter} position={[0, 3.3, -5.15]}>{Array.from({ length: 15 }, (_, index) => <mesh key={index} position={[0, index * .44 - 3.05, 0]} castShadow><boxGeometry args={[12.45, .4, .14]} /><meshStandardMaterial color="#5c5f5b" roughness={.7} metalness={.5} /></mesh>)}</group>
    <mesh position={[0, .045, -5]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[12, 2]} /><meshStandardMaterial ref={outside} color="#c67e4e" emissive="#ff9b58" emissiveIntensity={1.2} /></mesh>
    {[-3.4, 0, 3.4].map((x) => <group key={x} position={[x, 6.05, -.5]}><mesh><boxGeometry args={[2.7, .09, .3]} /><meshStandardMaterial color="#e6e9df" emissive="#dff3e8" emissiveIntensity={2.6} /></mesh><pointLight intensity={13} distance={6} color="#dceae2" /></group>)}
    <group position={[-5.35, 0, 1.7]}><mesh position={[0, 1.55, 0]}><boxGeometry args={[.75, 3.1, 2.4]} /><meshStandardMaterial color="#5b5a50" roughness={.85} /></mesh>{[0, .68, 1.36].map((y) => <mesh key={y} position={[.5, .48 + y, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[.48, .14, 12, 28]} /><meshStandardMaterial color="#131413" roughness={.88} /></mesh>)}</group>
    <group position={[5.7, 2.3, 1.7]}><mesh><boxGeometry args={[.1, 2.9, 3.4]} /><meshStandardMaterial color="#66665d" /></mesh>{[-.9, 0, .9].map((z) => <mesh key={z} position={[-.1, 0, z]} rotation={[0, 0, z * .13]}><boxGeometry args={[.09, 1.7, .09]} /><meshStandardMaterial color={z ? "#c4703f" : "#a5aca2"} metalness={.35} /></mesh>)}</group>
    <group position={[0, 3.5, 3.1]}><mesh><planeGeometry args={[2.5, 1.5]} /><meshStandardMaterial color="#ddd5bd" roughness={.86} /></mesh><Text position={[0, .2, .03]} fontSize={.28} color="#932e27">ROADSTER</Text><Text position={[0, -.24, .03]} fontSize={.16} color="#30322f">軽量 / 1989</Text></group>
    <group position={[-4.15, 2.85, 3.11]}><mesh><planeGeometry args={[1.6, .7]} /><meshStandardMaterial color="#285267" /></mesh><Text position={[0, 0, .03]} fontSize={.22} color="white">整備工場</Text></group>
    <Suspense fallback={null}><Vehicle car={car} engineOn={["ignition", "departure"].includes(stage)} headlights={["ignition", "departure"].includes(stage)} moving={stage === "departure"} onReady={onReady} /></Suspense>
  </group>;
}

function DashboardInstruments({ speed, currentKm, totalKm, engineOn }: { speed: number; currentKm: number; totalKm: number; engineOn: boolean }) {
  const needle = useRef<Group>(null); useFrame(() => { if (needle.current) needle.current.rotation.z += ((-2.15 + speed / 120 * 4.3) - needle.current.rotation.z) * .08; });
  return <group position={[-.47, 1.04, .02]} rotation={[-.12, 0, 0]} visible={engineOn}><mesh><circleGeometry args={[.245, 40]} /><meshStandardMaterial color="#090b0b" emissive="#17211c" emissiveIntensity={1.2} /></mesh><mesh><torusGeometry args={[.215, .01, 8, 40]} /><meshBasicMaterial color="#d4d8c9" /></mesh><group ref={needle}><mesh position={[0, .09, .02]}><boxGeometry args={[.014, .18, .012]} /><meshBasicMaterial color="#df5a38" /></mesh></group><Text position={[0, -.1, .03]} fontSize={.05} color="#dce2d5">{Math.round(speed)} KM/H</Text><Text position={[.56, -.02, .03]} fontSize={.06} color="#7ed096">{currentKm.toFixed(1)} / {totalKm}</Text></group>;
}

function EnvironmentReflections({ stage, progress }: { stage: NarrativeStage; progress: number }) {
  const { gl, scene } = useThree();
  useEffect(() => { const generator = new PMREMGenerator(gl); const room = new RoomEnvironment(); const environment = generator.fromScene(room, .04); scene.environment = environment.texture; room.dispose(); generator.dispose(); return () => { scene.environment = null; environment.dispose(); }; }, [gl, scene]);
  useFrame(() => { scene.environmentIntensity = stage === "garage" || stage === "cockpit" || stage === "ignition" || stage === "departure" ? .85 : Math.max(.32, .62 - progress * .22); });
  return null;
}

function RoadLighting({ runtime, progress, quality }: { runtime: MutableRefObject<RoadRuntime>; progress: number; quality: Quality }) {
  const sun = useRef<DirectionalLight>(null); const target = useRef<Object3D>(null); const fill = useRef<DirectionalLight>(null); const warm = useMemo(() => new Color(), []);
  useEffect(() => { if (sun.current && target.current) sun.current.target = target.current; if (fill.current && target.current) fill.current.target = target.current; }, []);
  useFrame(() => {
    const car = runtime.current.carPosition; if (target.current) target.current.position.copy(car); if (sun.current) { sun.current.position.copy(car).add(new Vector3(55 - progress * 100, 42 - progress * 24, -70)); sun.current.intensity = 2.25 - smoothstep(.48, 1, progress) * 1.25; warm.set("#fff0c4").lerp(new Color("#ff9b68"), smoothstep(.2, .62, progress)).lerp(new Color("#8ea7d5"), smoothstep(.7, 1, progress)); sun.current.color.copy(warm); } if (fill.current) { fill.current.position.copy(car).add(new Vector3(-35, 28, 20)); fill.current.intensity = .15 + smoothstep(.58, 1, progress) * .42; }
  });
  return <><object3D ref={target} /><directionalLight ref={sun} intensity={2.25} castShadow={quality === "high"} shadow-mapSize-width={quality === "high" ? 2048 : 1024} shadow-mapSize-height={quality === "high" ? 2048 : 1024} shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={24} shadow-camera-bottom={-24} /><directionalLight ref={fill} color="#89a8db" intensity={.15} /></>;
}

function smoothstep(min: number, max: number, value: number) { const t = Math.max(0, Math.min(1, (value - min) / (max - min))); return t * t * (3 - 2 * t); }

function Destination({ car }: { car: CarId }) {
  return <group><mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[14, 64]} /><meshStandardMaterial color="#303536" roughness={.84} /></mesh><Vehicle car={car} engineOn headlights moving={false} />{Array.from({ length: 35 }, (_, index) => { const x = (index % 7 - 3) * 4.6; const y = -1 + (index % 3) * .5; const z = -55 - Math.floor(index / 7) * 5; const color = index % 3 ? "#f2b66d" : "#c9ddff"; return <mesh key={index} position={[x, y, z]}><sphereGeometry args={[.12, 8, 6]} /><meshBasicMaterial color={color} /></mesh>; })}</group>;
}

function SceneDirector({ stage, cameraMode, progress, currentKm, totalKm, signs, car, quality, letterOpen, onProgress, onReady, worldDebug }: { stage: NarrativeStage; cameraMode: CameraMode; progress: number; currentKm: number; totalKm: number; signs: DriveSign[]; car: CarId; quality: Quality; letterOpen: boolean; onProgress: (value: number) => void; onReady: () => void; worldDebug: boolean }) {
  const { camera, scene, gl } = useThree(); const stageStart = useRef(0); const internalProgress = useRef(progress); const lastReport = useRef(0); const roadRuntime = useRef<RoadRuntime>({ distance: 0, heading: 0, elevation: 0, wheelSpin: 0, steeringAngle: 0, carPosition: new Vector3(), carQuaternion: new Quaternion(), lookAheadPosition: new Vector3(0, 0, -30), cameraTarget: new Vector3(0, 1, -18), fogDensity: .0021, biome: "RURAL_JAPAN" }); const cameraLookTarget = useRef(new Vector3(0, .8, -12));
  const chaseOffset = useMemo(() => new Vector3(0, 2.95, 8.9), []); const driverOffset = useMemo(() => new Vector3(-.42, 1.47, .82), []); const driverLookOffset = useMemo(() => new Vector3(0, 1.12, -8), []); const tempOffset = useMemo(() => new Vector3(), []);
  useEffect(() => { stageStart.current = performance.now(); }, [stage]);
  useEffect(() => { camera.near = .04; camera.far = 520; camera.updateProjectionMatrix(); }, [camera]);
  useFrame(({ clock, pointer }, delta) => {
    const elapsed = (performance.now() - stageStart.current) / 1000;
    if (stage === "drive") internalProgress.current = Math.min(1, internalProgress.current + delta / 165);
    if (clock.elapsedTime - lastReport.current > .15) { lastReport.current = clock.elapsedTime; onProgress(internalProgress.current); }
    const p = stage === "destination" ? 1 : internalProgress.current;
    const exposure = ["garage", "cockpit", "ignition"].includes(stage) ? 1.24 : stage === "departure" ? 1.12 : p < .4 ? 1.02 : p < .75 ? .94 : 1.12;
    gl.toneMappingExposure += (exposure - gl.toneMappingExposure) * Math.min(1, delta * 1.8);
    let position = new Vector3(0, 2, 6); let target = new Vector3(0, .8, 0); let targetFov = 53;
    if (stage === "garage") {
      const shots: Array<[number, number, number]> = [[2.9, 1.15, -4.6], [2.4, .72, -1.3], [4.3, 1.25, .4], [2.6, 1.35, 4.1], [-.42, 1.24, .42]];
      position.set(...shots[Math.min(shots.length - 1, Math.floor(elapsed / 2.1))]); target.set(0, .72, 0);
    } else if (["cockpit", "ignition"].includes(stage) || (stage === "drive" && cameraMode === "driver")) {
      if (stage === "drive") { position.copy(driverOffset).applyQuaternion(roadRuntime.current.carQuaternion).add(roadRuntime.current.carPosition); target.copy(driverLookOffset).applyQuaternion(roadRuntime.current.carQuaternion).add(roadRuntime.current.carPosition); }
      else { position.copy(driverOffset); target.copy(driverLookOffset); }
      position.x += pointer.x * .045; position.y += pointer.y * .035; target.x += pointer.x * .18; target.y = letterOpen ? 6 : target.y + pointer.y * .1; targetFov = 62;
    } else if (stage === "departure") { position.set(0, 2.15, 6.4 - Math.min(elapsed, 4) * .55); target.set(0, .7, -4); }
    else if (stage === "arrival") { position.set(4.9, 2.65, 7).applyQuaternion(roadRuntime.current.carQuaternion).add(roadRuntime.current.carPosition); target.copy(roadRuntime.current.carPosition).add(new Vector3(0, .7, 0)); }
    else if (stage === "destination") { position.set(4.9, 2.65, 7); target.set(0, .62, -.3); }
    else {
      position.copy(chaseOffset).applyQuaternion(roadRuntime.current.carQuaternion).add(roadRuntime.current.carPosition); tempOffset.copy(roadRuntime.current.carPosition).lerp(roadRuntime.current.lookAheadPosition, .72); target.copy(tempOffset); target.y += .9; targetFov = 49;
    }
    roadRuntime.current.cameraTarget.copy(target);
    const chase = stage === "drive" && cameraMode === "chase"; camera.position.lerp(position, 1 - Math.exp(-delta * (chase ? 2.7 : stage === "garage" ? 1.25 : 4.5))); cameraLookTarget.current.lerp(target, 1 - Math.exp(-delta * (chase ? 2.5 : 5.5))); camera.up.set(0, 1, 0); camera.lookAt(cameraLookTarget.current); if (camera instanceof PerspectiveCamera) { camera.fov += (targetFov - camera.fov) * (1 - Math.exp(-delta * 1.4)); camera.updateProjectionMatrix(); }
    const fogColor = new Color("#b8c1b8").lerp(new Color("#d19a89"), smoothstep(.2, .58, p)).lerp(new Color("#101b31"), smoothstep(.62, 1, p)); scene.fog?.color.copy(fogColor); if (scene.fog instanceof FogExp2) scene.fog.density = roadRuntime.current.fogDensity * (1 + smoothstep(.72, 1, p) * .2);
  });

  const moving = ["departure", "drive", "arrival"].includes(stage); const engineOn = !["garage", "cockpit"].includes(stage); const speed = stage === "departure" ? 5 : stage === "arrival" ? 3 : stage === "drive" ? 15 : 0; const headlights = stage === "ignition" || stage === "departure" || progress > .6;
  if (["garage", "cockpit", "ignition", "departure"].includes(stage)) return <><EnvironmentReflections stage={stage} progress={progress} /><Garage stage={stage} car={car} onReady={onReady} />{stage !== "garage" && <DashboardInstruments speed={stage === "ignition" ? 86 : stage === "departure" ? 24 : 0} currentKm={0} totalKm={totalKm} engineOn={engineOn} />}</>;
  if (stage === "destination") return <><EnvironmentReflections stage={stage} progress={1} /><fogExp2 attach="fog" args={["#06101b", .003]} /><DynamicSky progress={1} quality={quality} /><hemisphereLight intensity={.48} color="#7186aa" groundColor="#07100f" /><Destination car={car} /></>;
  return <><EnvironmentReflections stage={stage} progress={progress} /><fogExp2 attach="fog" args={["#b8c1b8", .0021]} /><DynamicSky progress={progress} quality={quality} /><hemisphereLight intensity={.9 - progress * .35} color={new Color("#c9dbea").lerp(new Color("#7186ae"), progress)} groundColor={new Color("#40513d").lerp(new Color("#101b19"), progress)} /><RoadLighting runtime={roadRuntime} progress={progress} quality={quality} /><RoadWorld speed={speed} progress={progress} quality={quality} runtime={roadRuntime} debug={worldDebug} />{cameraMode === "chase" && <Vehicle car={car} engineOn={engineOn} headlights={headlights} moving={moving} motion={roadRuntime} />}{cameraMode === "driver" && <><Vehicle car={car} engineOn={engineOn} headlights={headlights} moving={moving} motion={roadRuntime} /><DashboardInstruments speed={70 + Math.sin(currentKm * 1.7) * 4} currentKm={currentKm} totalKm={totalKm} engineOn /></>}</>;
}

export function DriveScene(props: { stage: NarrativeStage; cameraMode: CameraMode; quality: Quality; progress: number; currentKm: number; totalKm: number; signs: DriveSign[]; letterOpen: boolean; onProgress: (value: number) => void; onReady: () => void; car: CarId }) {
  const dpr: [number, number] = props.quality === "high" ? [1, 1.65] : props.quality === "medium" ? [1, 1.3] : [.75, 1]; const destinationKm = Math.max(1, props.totalKm - 5); const signs = props.signs.some((sign) => Math.abs(sign.kilometer - destinationKm) < 1.1) ? props.signs : [...props.signs, { kilometer: destinationKm, message: "5 KM · DESTINATION", style: "road" as const }];
  const [worldDebug, setWorldDebug] = useState(false); useEffect(() => { setWorldDebug(new URLSearchParams(window.location.search).get("worldDebug") === "true"); }, []);
  return <Canvas className="drive-canvas" dpr={dpr} shadows={props.quality !== "low"} camera={{ position: [3, 1.5, -5], fov: 53, near: .04, far: 520 }} gl={{ antialias: props.quality !== "low", powerPreference: "high-performance" }}><SceneDirector {...props} signs={signs} worldDebug={worldDebug} /></Canvas>;
}
