"use client";

import { Line, Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { BufferAttribute, BufferGeometry, Color, Group, InstancedMesh, MathUtils, Matrix4, MeshStandardMaterial, Object3D, Quaternion, Vector3 } from "three";
import type { VehicleMotion } from "./Vehicle";

export type BiomeName = "OPEN_HILLS" | "FOREST" | "MOUNTAIN" | "VALLEY" | "RURAL_JAPAN";

export interface RoadRuntime extends VehicleMotion {
  distance: number;
  heading: number;
  elevation: number;
  carPosition: Vector3;
  carQuaternion: Quaternion;
  lookAheadPosition: Vector3;
  cameraTarget: Vector3;
  fogDensity: number;
  biome: BiomeName;
}

interface BiomeProfile {
  name: BiomeName;
  treeDensity: number;
  terrainAmplitude: number;
  roadsideDensity: number;
  fogDensity: number;
  mountainVisibility: number;
  buildingProbability: number;
  valleyWalls: number;
}

const CONTROL_SPACING = 52;
const CONTROL_COUNT = 170;
const CHUNK_LENGTH = 64;
const CHUNK_SLOTS = 12;
const ROAD_HALF_WIDTH = 4.3;
const TERRAIN_LATERALS = [-260, -210, -165, -128, -96, -70, -51, -38, -28, -20, -14, -10, -7, -5.4, -4.55, 0, 4.55, 5.4, 7, 10, 14, 20, 28, 38, 51, 70, 96, 128, 165, 210, 260];
const BIOME_LENGTH = 560;

const BIOMES: Record<BiomeName, BiomeProfile> = {
  OPEN_HILLS: { name: "OPEN_HILLS", treeDensity: .2, terrainAmplitude: 6, roadsideDensity: .12, fogDensity: .0019, mountainVisibility: .9, buildingProbability: .02, valleyWalls: .08 },
  FOREST: { name: "FOREST", treeDensity: .92, terrainAmplitude: 9, roadsideDensity: .48, fogDensity: .00245, mountainVisibility: .55, buildingProbability: .01, valleyWalls: .18 },
  MOUNTAIN: { name: "MOUNTAIN", treeDensity: .64, terrainAmplitude: 16, roadsideDensity: .32, fogDensity: .0028, mountainVisibility: .76, buildingProbability: 0, valleyWalls: .45 },
  VALLEY: { name: "VALLEY", treeDensity: .3, terrainAmplitude: 7, roadsideDensity: .16, fogDensity: .00225, mountainVisibility: 1, buildingProbability: .01, valleyWalls: 1 },
  RURAL_JAPAN: { name: "RURAL_JAPAN", treeDensity: .38, terrainAmplitude: 4.5, roadsideDensity: .3, fogDensity: .00205, mountainVisibility: .84, buildingProbability: .16, valleyWalls: .12 },
};
const BIOME_SEQUENCE: BiomeName[] = ["RURAL_JAPAN", "OPEN_HILLS", "FOREST", "MOUNTAIN", "VALLEY", "FOREST", "OPEN_HILLS", "RURAL_JAPAN", "MOUNTAIN", "VALLEY"];

function fract(value: number) { return value - Math.floor(value); }
function hash(value: number, seed = 0) { return fract(Math.sin(value * 127.1 + seed * 311.7) * 43758.5453123); }
function smoothstep(min: number, max: number, value: number) { const t = MathUtils.clamp((value - min) / (max - min), 0, 1); return t * t * (3 - 2 * t); }
function catmull(p0: number, p1: number, p2: number, p3: number, t: number) { const t2 = t * t; const t3 = t2 * t; return .5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3); }
function catmullDerivative(p0: number, p1: number, p2: number, p3: number, t: number) { const t2 = t * t; return .5 * ((-p0 + p2) + 2 * (2 * p0 - 5 * p1 + 4 * p2 - p3) * t + 3 * (-p0 + 3 * p1 - 3 * p2 + p3) * t2); }

function createControlPoints() {
  const points = [new Vector3(0, 0, 0)]; let heading = 0; let elevation = 0;
  for (let index = 1; index < CONTROL_COUNT; index += 1) {
    const targetHeading = Math.sin(index * .185) * .3 + Math.sin(index * .051 + 1.4) * .19 + Math.sin(index * .017) * .1;
    heading += MathUtils.clamp((targetHeading - heading) * .16, -.045, .045);
    const targetElevation = Math.sin(index * .105) * 7 + Math.sin(index * .032 + .7) * 13;
    elevation += MathUtils.clamp((targetElevation - elevation) * .17, -1.8, 1.8);
    const previous = points[index - 1]; points.push(new Vector3(previous.x - Math.sin(heading) * CONTROL_SPACING, elevation, previous.z - Math.cos(heading) * CONTROL_SPACING));
  }
  return points;
}

export const ROAD_CONTROL_POINTS = createControlPoints();
export const ROAD_LENGTH = (ROAD_CONTROL_POINTS.length - 1) * CONTROL_SPACING;

export function sampleRoad(distance: number) {
  const safeDistance = MathUtils.clamp(distance, 0, ROAD_LENGTH - .01); const raw = safeDistance / CONTROL_SPACING; const section = Math.min(ROAD_CONTROL_POINTS.length - 2, Math.floor(raw)); const t = raw - section;
  const point = (index: number) => ROAD_CONTROL_POINTS[MathUtils.clamp(index, 0, ROAD_CONTROL_POINTS.length - 1)]; const p0 = point(section - 1); const p1 = point(section); const p2 = point(section + 1); const p3 = point(section + 2);
  const position = new Vector3(catmull(p0.x, p1.x, p2.x, p3.x, t), catmull(p0.y, p1.y, p2.y, p3.y, t), catmull(p0.z, p1.z, p2.z, p3.z, t));
  const tangent = new Vector3(catmullDerivative(p0.x, p1.x, p2.x, p3.x, t), catmullDerivative(p0.y, p1.y, p2.y, p3.y, t), catmullDerivative(p0.z, p1.z, p2.z, p3.z, t)).normalize();
  const normal = new Vector3(-tangent.z, 0, tangent.x).normalize();
  return { position, tangent, normal, heading: Math.atan2(-tangent.x, -tangent.z) };
}

function biomeAt(distance: number) {
  const raw = Math.max(0, distance) / BIOME_LENGTH; const index = Math.floor(raw) % BIOME_SEQUENCE.length; const nextIndex = (index + 1) % BIOME_SEQUENCE.length; const local = raw - Math.floor(raw); const blend = smoothstep(.58, 1, local); const current = BIOMES[BIOME_SEQUENCE[index]]; const next = BIOMES[BIOME_SEQUENCE[nextIndex]];
  return {
    name: blend < .5 ? current.name : next.name,
    treeDensity: MathUtils.lerp(current.treeDensity, next.treeDensity, blend), terrainAmplitude: MathUtils.lerp(current.terrainAmplitude, next.terrainAmplitude, blend), roadsideDensity: MathUtils.lerp(current.roadsideDensity, next.roadsideDensity, blend), fogDensity: MathUtils.lerp(current.fogDensity, next.fogDensity, blend), mountainVisibility: MathUtils.lerp(current.mountainVisibility, next.mountainVisibility, blend), buildingProbability: MathUtils.lerp(current.buildingProbability, next.buildingProbability, blend), valleyWalls: MathUtils.lerp(current.valleyWalls, next.valleyWalls, blend),
  } satisfies BiomeProfile;
}

function landscapeNoise(x: number, z: number) {
  return Math.sin(x * .011 + Math.sin(z * .004) * 1.7) * .5 + Math.sin(z * .008 - x * .003) * .3 + Math.sin((x + z) * .0032 + 1.8) * .2;
}

function terrainPoint(distance: number, lateral: number) {
  const road = sampleRoad(distance); const profile = biomeAt(distance); const point = road.position.clone().addScaledVector(road.normal, lateral); const separation = Math.abs(lateral); const awayFromRoad = smoothstep(ROAD_HALF_WIDTH + 1.2, 28, separation); const broadLandform = landscapeNoise(point.x, point.z) * profile.terrainAmplitude; const valleySide = smoothstep(18, 100, separation) * profile.valleyWalls * 13; const shoulderCut = smoothstep(ROAD_HALF_WIDTH, ROAD_HALF_WIDTH + 6, separation) * .45;
  point.y = road.position.y - .16 - shoulderCut + awayFromRoad * (broadLandform + valleySide + shoulderCut); return point;
}

function createStripGeometry(rows: number) {
  const geometry = new BufferGeometry(); const positions = new Float32Array((rows + 1) * 2 * 3); const normals = new Float32Array(positions.length); const colors = new Float32Array(positions.length); const uvs = new Float32Array((rows + 1) * 2 * 2); const indices: number[] = [];
  for (let row = 0; row <= rows; row += 1) { uvs[row * 4] = 0; uvs[row * 4 + 1] = row / 4; uvs[row * 4 + 2] = 1; uvs[row * 4 + 3] = row / 4; if (row < rows) { const a = row * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  geometry.setAttribute("position", new BufferAttribute(positions, 3)); geometry.setAttribute("normal", new BufferAttribute(normals, 3)); geometry.setAttribute("color", new BufferAttribute(colors, 3)); geometry.setAttribute("uv", new BufferAttribute(uvs, 2)); geometry.setIndex(indices); return geometry;
}

function updateStrip(geometry: BufferGeometry, start: number, length: number, halfWidth: number, lateral: number, height: number, color: Color, variation = 0) {
  const positions = geometry.getAttribute("position") as BufferAttribute; const normals = geometry.getAttribute("normal") as BufferAttribute; const colors = geometry.getAttribute("color") as BufferAttribute; const rows = positions.count / 2 - 1; const shade = new Color(); const surfaceNormal = new Vector3();
  for (let row = 0; row <= rows; row += 1) {
    const distance = start + row / rows * length; const frame = sampleRoad(distance);
    surfaceNormal.copy(frame.normal).cross(frame.tangent).normalize(); for (let side = 0; side < 2; side += 1) { const offset = lateral + (side ? halfWidth : -halfWidth); const point = frame.position.clone().addScaledVector(frame.normal, offset); const vertex = row * 2 + side; positions.setXYZ(vertex, point.x, point.y + height, point.z); normals.setXYZ(vertex, surfaceNormal.x, surfaceNormal.y, surfaceNormal.z); shade.copy(color).multiplyScalar(1 + (hash(Math.floor(distance * .35), side + 3) - .5) * variation); colors.setXYZ(vertex, shade.r, shade.g, shade.b); }
  }
  positions.needsUpdate = true; normals.needsUpdate = true; colors.needsUpdate = true; geometry.computeBoundingSphere();
}

function createTerrainGeometry(rows: number) {
  const columns = TERRAIN_LATERALS.length; const geometry = new BufferGeometry(); const positions = new Float32Array((rows + 1) * columns * 3); const normals = new Float32Array(positions.length); const colors = new Float32Array(positions.length); const indices: number[] = [];
  for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns - 1; column += 1) { const a = row * columns + column; const b = a + columns; indices.push(a, a + 1, b, a + 1, b + 1, b); }
  geometry.setAttribute("position", new BufferAttribute(positions, 3)); geometry.setAttribute("normal", new BufferAttribute(normals, 3)); geometry.setAttribute("color", new BufferAttribute(colors, 3)); geometry.setIndex(indices); return geometry;
}

function terrainPalette(progress: number) { return new Color("#557052").lerp(new Color("#6d7150"), smoothstep(.2, .56, progress)).lerp(new Color("#172923"), smoothstep(.62, 1, progress)); }

function updateTerrainColors(geometry: BufferGeometry, start: number, length: number, progress: number) {
  const positions = geometry.getAttribute("position") as BufferAttribute; const colors = geometry.getAttribute("color") as BufferAttribute; const rows = positions.count / TERRAIN_LATERALS.length - 1; const base = terrainPalette(progress); const shade = new Color();
  for (let row = 0; row <= rows; row += 1) { const distance = start + row / rows * length; const roadHeight = sampleRoad(distance).position.y; TERRAIN_LATERALS.forEach((_, column) => { const vertex = row * TERRAIN_LATERALS.length + column; const heightShade = MathUtils.clamp((positions.getY(vertex) - roadHeight) / 28, -.2, .3); shade.copy(base).offsetHSL(0, -.03, heightShade * .16 + (hash(Math.floor(distance * .28), column + 8) - .5) * .025); colors.setXYZ(vertex, shade.r, shade.g, shade.b); }); }
  colors.needsUpdate = true;
}

function updateTerrain(geometry: BufferGeometry, start: number, length: number, progress: number) {
  const positions = geometry.getAttribute("position") as BufferAttribute; const normals = geometry.getAttribute("normal") as BufferAttribute; const rows = positions.count / TERRAIN_LATERALS.length - 1; const across = new Vector3(); const along = new Vector3(); const normal = new Vector3();
  for (let row = 0; row <= rows; row += 1) {
    const distance = start + row / rows * length;
    TERRAIN_LATERALS.forEach((lateral, column) => { const point = terrainPoint(distance, lateral); const vertex = row * TERRAIN_LATERALS.length + column; positions.setXYZ(vertex, point.x, point.y, point.z); across.copy(terrainPoint(distance, lateral + 1.5)).sub(terrainPoint(distance, lateral - 1.5)); along.copy(terrainPoint(distance + 1.5, lateral)).sub(terrainPoint(distance - 1.5, lateral)); normal.copy(across).cross(along).normalize(); normals.setXYZ(vertex, normal.x, normal.y, normal.z); });
  }
  positions.needsUpdate = true; normals.needsUpdate = true; updateTerrainColors(geometry, start, length, progress); geometry.computeBoundingSphere();
}

function WorldChunk({ slot, runtime, progress }: { slot: number; runtime: MutableRefObject<RoadRuntime>; progress: number }) {
  const group = useRef<Group>(null); const terrain = useMemo(() => createTerrainGeometry(18), []); const verge = useMemo(() => createStripGeometry(20), []); const shoulder = useMemo(() => createStripGeometry(20), []); const asphalt = useMemo(() => createStripGeometry(20), []); const leftLine = useMemo(() => createStripGeometry(20), []); const rightLine = useMemo(() => createStripGeometry(20), []); const centerLine = useMemo(() => createStripGeometry(20), []); const assigned = useRef(Number.NaN); const previousProgress = useRef(-1);
  useEffect(() => () => { terrain.dispose(); verge.dispose(); shoulder.dispose(); asphalt.dispose(); leftLine.dispose(); rightLine.dispose(); centerLine.dispose(); }, [asphalt, centerLine, leftLine, rightLine, shoulder, terrain, verge]);
  useFrame(() => {
    const chunk = Math.floor(runtime.current.distance / CHUNK_LENGTH) + slot - 2; if (group.current) group.current.visible = chunk >= 0; if (chunk < 0) return; const paletteChanged = Math.abs(progress - previousProgress.current) > .025; const chunkChanged = chunk !== assigned.current; if (!chunkChanged && !paletteChanged) return; const start = chunk * CHUNK_LENGTH; if (!chunkChanged) { previousProgress.current = progress; updateTerrainColors(terrain, start, CHUNK_LENGTH, progress); return; } assigned.current = chunk; previousProgress.current = progress;
    updateTerrain(terrain, start, CHUNK_LENGTH, progress); updateStrip(verge, start, CHUNK_LENGTH, 7.2, 0, -.09, new Color("#465c43")); updateStrip(shoulder, start, CHUNK_LENGTH, 5.15, 0, -.035, new Color("#77766d"), .04); updateStrip(asphalt, start, CHUNK_LENGTH, ROAD_HALF_WIDTH, 0, 0, new Color("#343a3b"), .055); updateStrip(leftLine, start, CHUNK_LENGTH, .055, -ROAD_HALF_WIDTH + .3, .028, new Color("#e7e3d5")); updateStrip(rightLine, start, CHUNK_LENGTH, .055, ROAD_HALF_WIDTH - .3, .028, new Color("#e7e3d5")); updateStrip(centerLine, start, CHUNK_LENGTH, .045, 0, .03, new Color("#d9cc96"));
  });
  return <group ref={group} name={`RoadChunk-${slot}`}>
    <mesh geometry={terrain} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>
    <mesh geometry={verge} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>
    <mesh geometry={shoulder} receiveShadow><meshStandardMaterial vertexColors roughness={.98} /></mesh>
    <mesh geometry={asphalt} receiveShadow><meshStandardMaterial vertexColors roughness={.93} metalness={.01} /></mesh>
    <mesh geometry={leftLine}><meshBasicMaterial vertexColors /></mesh><mesh geometry={rightLine}><meshBasicMaterial vertexColors /></mesh><mesh geometry={centerLine}><meshBasicMaterial vertexColors transparent opacity={.86} /></mesh>
  </group>;
}

interface ForestRefs { trunks: InstancedMesh | null; cedar: InstancedMesh | null; pine: InstancedMesh | null; broadleaf: InstancedMesh | null; }

function ForestMasses({ runtime, quality, progress }: { runtime: MutableRefObject<RoadRuntime>; quality: "high" | "medium" | "low"; progress: number }) {
  const maxCount = quality === "high" ? 620 : quality === "medium" ? 420 : 260; const refs = useRef<ForestRefs>({ trunks: null, cedar: null, pine: null, broadleaf: null }); const dummy = useMemo(() => new Object3D(), []); const baseChunk = useRef(Number.NaN); const materials = useRef<Array<MeshStandardMaterial | null>>([]);
  useFrame(() => {
    const currentChunk = Math.floor(runtime.current.distance / CHUNK_LENGTH);
    if (currentChunk !== baseChunk.current) {
      baseChunk.current = currentChunk; let count = 0;
      for (let chunkOffset = -2; chunkOffset < CHUNK_SLOTS - 2 && count < maxCount; chunkOffset += 1) {
        const chunk = currentChunk + chunkOffset; if (chunk < 0) continue; const maxClusters = quality === "low" ? 5 : 8;
        for (let cluster = 0; cluster < maxClusters && count < maxCount; cluster += 1) {
          const clusterDistance = chunk * CHUNK_LENGTH + hash(chunk * 29 + cluster, 2) * CHUNK_LENGTH; const profile = biomeAt(clusterDistance); if (hash(chunk * 43 + cluster, 21) > profile.treeDensity) continue;
          const members = 3 + Math.floor(hash(chunk * 17 + cluster, 4) * (quality === "high" ? 6 : 4)); const side = hash(chunk * 13 + cluster, 6) > .5 ? 1 : -1; const centerLateral = 15 + hash(chunk * 7 + cluster, 9) * 64;
          for (let member = 0; member < members && count < maxCount; member += 1) {
            const stableKey = chunk * 1000 + cluster * 20 + member; const distance = clusterDistance + (hash(member + cluster * 11, chunk) - .5) * 16; const lateral = side * (centerLateral + (hash(member + chunk * 5, cluster) - .5) * 15); const point = terrainPoint(distance, lateral); const species = Math.floor(hash(stableKey, 12) * 3); const height = MathUtils.lerp(4.8, species === 0 ? 10.5 : 8, hash(stableKey, 15)); const width = species === 0 ? height * .17 : species === 1 ? height * .27 : height * .31; const rotation = hash(stableKey, 18) * Math.PI * 2;
            dummy.position.set(point.x, point.y + height * .17, point.z); dummy.rotation.set(0, rotation, 0); dummy.scale.set(.16 + width * .05, height * .34, .16 + width * .05); dummy.updateMatrix(); refs.current.trunks?.setMatrixAt(count, dummy.matrix);
            dummy.position.set(point.x, point.y + height * .6, point.z); dummy.rotation.set(0, rotation, 0); dummy.scale.set(width, height * .72, width); dummy.updateMatrix(); const crown = species === 0 ? refs.current.cedar : species === 1 ? refs.current.pine : refs.current.broadleaf; crown?.setMatrixAt(count, dummy.matrix);
            [refs.current.cedar, refs.current.pine, refs.current.broadleaf].forEach((mesh) => { if (mesh && mesh !== crown) { dummy.scale.setScalar(0); dummy.updateMatrix(); mesh.setMatrixAt(count, dummy.matrix); } }); count += 1;
          }
        }
      }
      Object.values(refs.current).forEach((mesh) => { if (mesh) { mesh.count = count; mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); } });
    }
    const day = new Color("#31533c"); const gold = new Color("#4e5935"); const night = new Color("#0d201c"); const foliage = day.lerp(gold, smoothstep(.18, .58, progress)).lerp(night, smoothstep(.64, 1, progress)); materials.current.forEach((material, index) => { if (material) material.color.copy(foliage).offsetHSL(index * .018, index === 2 ? -.08 : 0, index * .018); });
  });
  return <group name="ForestMasses">
    <instancedMesh ref={(node) => { refs.current.trunks = node; }} args={[undefined, undefined, maxCount]} castShadow receiveShadow><cylinderGeometry args={[1, 1.25, 1, 6]} /><meshStandardMaterial color="#4a4033" roughness={1} /></instancedMesh>
    <instancedMesh ref={(node) => { refs.current.cedar = node; }} args={[undefined, undefined, maxCount]} castShadow receiveShadow><coneGeometry args={[1, 1, 7]} /><meshStandardMaterial ref={(node) => { materials.current[0] = node; }} color="#31533c" roughness={.96} /></instancedMesh>
    <instancedMesh ref={(node) => { refs.current.pine = node; }} args={[undefined, undefined, maxCount]} castShadow receiveShadow><coneGeometry args={[1, 1, 9, 2]} /><meshStandardMaterial ref={(node) => { materials.current[1] = node; }} color="#294b39" roughness={.96} /></instancedMesh>
    <instancedMesh ref={(node) => { refs.current.broadleaf = node; }} args={[undefined, undefined, maxCount]} castShadow receiveShadow><dodecahedronGeometry args={[.72, 0]} /><meshStandardMaterial ref={(node) => { materials.current[2] = node; }} color="#4c6544" roughness={1} /></instancedMesh>
  </group>;
}

function createMountain(seed: number, radius: number, height: number) {
  const segments = 14; const rings = 4; const vertices: number[] = []; const indices: number[] = [];
  for (let ring = 0; ring <= rings; ring += 1) { const t = ring / rings; const ringRadius = radius * (1 - t) * (1 + Math.sin(seed + ring * 2.3) * .08); const y = height * Math.pow(t, .82); for (let segment = 0; segment < segments; segment += 1) { const angle = segment / segments * Math.PI * 2; const irregularity = 1 + Math.sin(segment * 2.7 + seed) * .08; vertices.push(Math.cos(angle) * ringRadius * irregularity, y + Math.sin(segment * 1.9 + seed) * radius * .025, Math.sin(angle) * ringRadius * irregularity); } }
  for (let ring = 0; ring < rings; ring += 1) for (let segment = 0; segment < segments; segment += 1) { const next = (segment + 1) % segments; const a = ring * segments + segment; const b = ring * segments + next; const c = (ring + 1) * segments + segment; const d = (ring + 1) * segments + next; indices.push(a, c, b, b, c, d); }
  const geometry = new BufferGeometry(); geometry.setAttribute("position", new BufferAttribute(new Float32Array(vertices), 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

function DistantMountains({ runtime, progress }: { runtime: MutableRefObject<RoadRuntime>; progress: number }) {
  const group = useRef<Group>(null); const geometries = useMemo(() => Array.from({ length: 12 }, (_, index) => createMountain(index * 3.7, 34 + index % 4 * 13, 28 + index % 5 * 12)), []);
  useEffect(() => () => geometries.forEach((geometry) => geometry.dispose()), [geometries]);
  useFrame((_, delta) => { if (!group.current) return; const destination = runtime.current.carPosition.clone(); destination.y -= 10; group.current.position.lerp(destination, 1 - Math.exp(-delta * .45)); const turn = Math.atan2(Math.sin(runtime.current.heading - group.current.rotation.y), Math.cos(runtime.current.heading - group.current.rotation.y)); group.current.rotation.y += turn * (1 - Math.exp(-delta * .5)); });
  const near = new Color("#3f554a").lerp(new Color("#142521"), progress); const mid = new Color("#68776f").lerp(new Color("#273548"), progress); const far = new Color("#929e9c").lerp(new Color("#46536a"), progress);
  return <group ref={group} name="DistantMountains">{geometries.map((geometry, index) => { const layer = index % 3; const row = Math.floor(index / 3); const z = -150 - layer * 70; const x = (row - 1.5) * 125 + (layer - 1) * 24; return <mesh key={index} geometry={geometry} position={[x, -8 + layer * 2, z]} scale={[1.25, 1, .82]}><meshBasicMaterial color={layer === 0 ? near : layer === 1 ? mid : far} fog /></mesh>; })}</group>;
}

function WorldDebug({ runtime }: { runtime: MutableRefObject<RoadRuntime> }) {
  const { camera } = useThree(); const group = useRef<Group>(null); const [fps, setFps] = useState(60); const frames = useRef(0); const elapsed = useRef(0); const splineStart = Math.max(0, runtime.current.distance - 100); const splinePoints = Array.from({ length: 70 }, (_, index) => sampleRoad(splineStart + index * 9).position); const nearbyControls = ROAD_CONTROL_POINTS.filter((_, index) => Math.abs(index * CONTROL_SPACING - runtime.current.distance) < 380);
  useFrame((_, delta) => { frames.current += 1; elapsed.current += delta; if (elapsed.current > .5) { setFps(Math.round(frames.current / elapsed.current)); frames.current = 0; elapsed.current = 0; } if (group.current) group.current.position.copy(runtime.current.carPosition).add(new Vector3(0, 5, 0)); });
  const car = runtime.current.carPosition; const forward = new Vector3(0, 0, -8).applyQuaternion(runtime.current.carQuaternion).add(car);
  return <group name="WorldDebug">
    <Line points={splinePoints} color="#ff4fd8" lineWidth={2} />
    {nearbyControls.map((point, index) => <mesh key={index} position={point}><sphereGeometry args={[.35, 6, 4]} /><meshBasicMaterial color="#ffdf57" /></mesh>)}
    <Line points={[car, forward]} color="#45ff75" lineWidth={4} /><Line points={[car, runtime.current.lookAheadPosition]} color="#38bdf8" lineWidth={3} /><Line points={[camera.position, runtime.current.cameraTarget]} color="#fb923c" lineWidth={2} />
    {Array.from({ length: CHUNK_SLOTS }, (_, index) => { const distance = Math.max(0, (Math.floor(runtime.current.distance / CHUNK_LENGTH) + index - 2) * CHUNK_LENGTH); const frame = sampleRoad(distance + CHUNK_LENGTH * .5); return <mesh key={index} position={frame.position} rotation={[0, frame.heading, 0]}><boxGeometry args={[220, 18, CHUNK_LENGTH]} /><meshBasicMaterial color="#65a30d" wireframe transparent opacity={.24} /></mesh>; })}
    <group ref={group}><Text fontSize={.8} color="white" outlineWidth={.04} outlineColor="black">{fps} FPS · {runtime.current.biome}</Text></group>
  </group>;
}

export function RoadWorld({ speed, progress, quality, runtime, debug = false }: { speed: number; progress: number; quality: "high" | "medium" | "low"; runtime: MutableRefObject<RoadRuntime>; debug?: boolean }) {
  const targetQuaternion = useMemo(() => new Quaternion(), []); const basis = useMemo(() => new Matrix4(), []); const back = useMemo(() => new Vector3(), []); const up = useMemo(() => new Vector3(), []);
  useFrame((_, delta) => {
    const state = runtime.current; state.distance = Math.min(ROAD_LENGTH - 80, state.distance + speed * delta); const road = sampleRoad(state.distance); const lookAhead = sampleRoad(state.distance + 30); state.carPosition.copy(road.position); back.copy(road.tangent).negate(); up.copy(back).cross(road.normal).normalize(); basis.makeBasis(road.normal, up, back); targetQuaternion.setFromRotationMatrix(basis); state.carQuaternion.slerp(targetQuaternion, 1 - Math.exp(-delta * 7.5)); state.lookAheadPosition.lerp(lookAhead.position, 1 - Math.exp(-delta * 9)); state.heading = road.heading; state.elevation = road.position.y; const futureHeading = sampleRoad(state.distance + 7).heading; const headingDelta = Math.atan2(Math.sin(futureHeading - road.heading), Math.cos(futureHeading - road.heading)); state.steeringAngle = MathUtils.clamp(headingDelta * 1.8, -.18, .18); state.wheelSpin -= speed * delta / .31; const biome = biomeAt(state.distance); state.biome = biome.name; state.fogDensity = MathUtils.damp(state.fogDensity, biome.fogDensity, 1.1, delta);
  });
  return <group name="RoadWorld">
    {Array.from({ length: CHUNK_SLOTS }, (_, slot) => <WorldChunk key={slot} slot={slot} runtime={runtime} progress={progress} />)}
    <ForestMasses runtime={runtime} quality={quality} progress={progress} />
    <DistantMountains runtime={runtime} progress={progress} />
    {debug && <WorldDebug runtime={runtime} />}
  </group>;
}
