"use client";

import { useLoader } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Box3, Group, Mesh, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ReadyCar } from "../../data/cars";

export function Car({ car, onLoaded }: { car: ReadyCar; onLoaded: () => void }) {
  const gltf = useLoader(GLTFLoader, car.modelPath);
  const [scene] = useState(() => gltf.scene.clone(true));
  const group = useRef<Group>(null);

  useLayoutEffect(() => {
    if (!group.current) return;
    const bounds = new Box3().setFromObject(scene);
    const center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    const fit = (5.8 / Math.max(size.x, size.z, 0.001)) * car.scale;
    group.current.scale.setScalar(fit);
    group.current.position.set(-center.x * fit, -bounds.min.y * fit, -center.z * fit);
    scene.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }, [car.scale, scene]);

  useEffect(() => onLoaded(), [onLoaded]);
  return <group rotation={car.rotation}><group ref={group}><primitive object={scene} /></group></group>;
}
