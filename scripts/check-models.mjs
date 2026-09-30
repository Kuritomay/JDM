import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { Box3, Matrix4, Quaternion, Vector3 } from "three";

for (const path of [
  "public/models/miata/car.glb",
  "public/models/ae86.glb",
  "public/models/environment/tree_pineTallA_detailed.glb",
  "public/models/environment/tree_oak.glb",
  "public/models/environment/tree_oak_fall.glb",
  "public/models/environment/plant_bushDetailed.glb",
  "public/models/environment/rock_largeA.glb",
]) {
  const buffer = readFileSync(path);
  assert.equal(buffer.toString("ascii", 0, 4), "glTF", `${path}: invalid GLB header`);
  assert.equal(buffer.readUInt32LE(4), 2);
  assert.equal(buffer.readUInt32LE(8), buffer.length);
  const jsonLength = buffer.readUInt32LE(12);
  const model = JSON.parse(buffer.toString("utf8", 20, 20 + jsonLength));
  assert.ok(model.meshes?.length > 0, `${path}: no meshes`);
  for (const resource of [...(model.buffers ?? []), ...(model.images ?? [])]) {
    assert.ok(!resource.uri || resource.uri.startsWith("data:"), `${path}: external resource ${resource.uri}`);
  }
  const parents = new Map();
  for (const [index, node] of (model.nodes ?? []).entries()) for (const child of node.children ?? []) parents.set(child, index);
  const localMatrix = (node) => node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(new Vector3(...(node.translation ?? [0, 0, 0])), new Quaternion(...(node.rotation ?? [0, 0, 0, 1])), new Vector3(...(node.scale ?? [1, 1, 1])));
  const worldMatrix = (index) => {
    const chain = []; let cursor = index;
    while (typeof cursor === "number") { chain.unshift(cursor); cursor = parents.get(cursor); }
    return chain.reduce((matrix, nodeIndex) => matrix.multiply(localMatrix(model.nodes[nodeIndex])), new Matrix4());
  };
  const bounds = new Box3();
  for (const [nodeIndex, node] of (model.nodes ?? []).entries()) {
    if (typeof node.mesh !== "number") continue;
    for (const primitive of model.meshes[node.mesh].primitives ?? []) {
      const accessor = model.accessors?.[primitive.attributes?.POSITION];
      if (!accessor?.min || !accessor?.max) continue;
      const box = new Box3(new Vector3(...accessor.min), new Vector3(...accessor.max)).applyMatrix4(worldMatrix(nodeIndex));
      bounds.union(box);
    }
  }
  const candidates = (model.nodes ?? []).map((node, index) => ({ name: node.name, parent: model.nodes[parents.get(index)]?.name ?? null, position: new Vector3().setFromMatrixPosition(worldMatrix(index)).toArray().map((value) => Number(value.toFixed(3))), rotation: node.rotation?.map((value) => Number(value.toFixed(3))) ?? null })).filter(({ name }) => name && /wheel|tire|tyre|rim|brake|disk|disc|steer|front|rear|light/i.test(name));
  console.log(path, {
    bytes: buffer.length,
    meshes: model.meshes.length,
    extensions: model.extensionsUsed ?? [],
    bounds: { min: bounds.min.toArray().map((value) => Number(value.toFixed(3))), max: bounds.max.toArray().map((value) => Number(value.toFixed(3))), size: bounds.getSize(new Vector3()).toArray().map((value) => Number(value.toFixed(3))) },
    axisCandidates: candidates,
    cockpitNodes: (model.nodes ?? []).map((node) => node.name).filter((name) => name && /wheel|dash|stereo|radio|seat|speed|steer|mirror|interior|indoor|console/i.test(name)),
    materials: model.materials?.map((m) => m.name),
  });
  console.dir({ path, axisCandidates: candidates }, { depth: null });
}
