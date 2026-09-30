import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

for (const path of ["public/models/miata/car.glb", "public/models/ae86.glb"]) {
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
  console.log(path, { bytes: buffer.length, meshes: model.meshes.length, extensions: model.extensionsUsed ?? [], materials: model.materials?.map((m) => m.name) });
}
