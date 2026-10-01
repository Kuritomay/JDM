"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, Group, ShaderMaterial } from "three";

const skyVertex = `varying vec3 vDirection; void main(){ vDirection=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const skyFragment = `
uniform float uProgress; varying vec3 vDirection;
vec3 palette(float h){
  vec3 dayTop=vec3(.20,.48,.76), dayHorizon=vec3(.73,.82,.84);
  vec3 goldTop=vec3(.24,.43,.69), goldHorizon=vec3(1.0,.48,.20);
  vec3 sunsetTop=vec3(.15,.24,.48), sunsetHorizon=vec3(.92,.23,.19);
  vec3 blueTop=vec3(.035,.105,.24), blueHorizon=vec3(.18,.22,.38);
  vec3 nightTop=vec3(.004,.012,.045), nightHorizon=vec3(.035,.07,.12);
  vec3 top; vec3 low;
  if(uProgress<.2){float t=smoothstep(0.,.2,uProgress);top=mix(dayTop,goldTop,t);low=mix(dayHorizon,goldHorizon,t);}
  else if(uProgress<.6){float t=smoothstep(.2,.6,uProgress);top=mix(goldTop,sunsetTop,t);low=mix(goldHorizon,sunsetHorizon,t);}
  else if(uProgress<.75){float t=smoothstep(.6,.75,uProgress);top=mix(sunsetTop,blueTop,t);low=mix(sunsetHorizon,blueHorizon,t);}
  else {float t=smoothstep(.75,1.,uProgress);top=mix(blueTop,nightTop,t);low=mix(blueHorizon,nightHorizon,t);}
  float atmospheric=pow(clamp(h,0.,1.),.48); return mix(low,top,atmospheric);
}
void main(){
  float h=vDirection.y*.5+.5; vec3 color=palette(h);
  float sunHeight=mix(.28,-.06,smoothstep(.1,.72,uProgress));
  vec3 sunDirection=normalize(vec3(mix(.7,-.35,uProgress),sunHeight,-1.));
  float sunDot=max(dot(normalize(vDirection),sunDirection),0.);
  float disk=smoothstep(.99955,.99982,sunDot)*(1.-smoothstep(.63,.76,uProgress));
  float glow=pow(sunDot,28.)*(1.-smoothstep(.6,.82,uProgress));
  color+=vec3(1.,.43,.17)*glow*.7+vec3(1.,.82,.55)*disk*2.;
  float haze=pow(1.-abs(vDirection.y),7.); color+=vec3(.48,.20,.16)*haze*(1.-uProgress)*.3;
  gl_FragColor=vec4(color,1.);
}`;

const starVertex = `attribute float aSize; attribute float aPhase; attribute float aTemp; uniform float uTime; varying float vLight; varying float vTemp; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); float twinkle=.9+.1*sin(uTime*.65+aPhase); vLight=twinkle; vTemp=aTemp; gl_PointSize=aSize*twinkle*(180./-mv.z); gl_Position=projectionMatrix*mv; }`;
const starFragment = `uniform float uOpacity; varying float vLight; varying float vTemp; void main(){ vec2 p=gl_PointCoord-.5; float d=length(p); float alpha=smoothstep(.5,.05,d)*uOpacity*vLight; vec3 warm=vec3(1.,.78,.62); vec3 cool=vec3(.68,.8,1.); gl_FragColor=vec4(mix(warm,cool,vTemp),alpha); }`;

function StarField({ progress, count }: { progress: number; count: number }) {
  const material = useRef<ShaderMaterial>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3); const sizes = new Float32Array(count); const phases = new Float32Array(count); const temperatures = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const random = (offset: number) => { const value = Math.sin((i + 1) * 127.1 + offset * 311.7) * 43758.5453; return value - Math.floor(value); }; const theta = random(1) * Math.PI * 2; const phi = random(2) * Math.PI * .47; const radius = 430 + random(3) * 18;
      positions[i * 3] = Math.cos(theta) * Math.sin(phi) * radius; positions[i * 3 + 1] = Math.cos(phi) * radius; positions[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * radius;
      sizes[i] = .55 + random(4) * 1.35; phases[i] = random(5) * 12; temperatures[i] = random(6);
    }
    const value = new BufferGeometry(); value.setAttribute("position", new BufferAttribute(positions, 3)); value.setAttribute("aSize", new BufferAttribute(sizes, 1)); value.setAttribute("aPhase", new BufferAttribute(phases, 1)); value.setAttribute("aTemp", new BufferAttribute(temperatures, 1)); return value;
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }) => { if (!material.current) return; material.current.uniforms.uTime.value = clock.elapsedTime; material.current.uniforms.uOpacity.value = Math.max(0, Math.min(1, (progress - .58) / .36)); });
  return <points geometry={geometry}><shaderMaterial ref={material} vertexShader={starVertex} fragmentShader={starFragment} transparent depthWrite={false} blending={AdditiveBlending} uniforms={{ uTime: { value: 0 }, uOpacity: { value: 0 } }} /></points>;
}

export function DynamicSky({ progress, quality }: { progress: number; quality: "high" | "medium" | "low" }) {
  const sky = useRef<ShaderMaterial>(null); const root = useRef<Group>(null); const { camera } = useThree();
  useFrame(() => { if (sky.current) sky.current.uniforms.uProgress.value = progress; if (root.current) root.current.position.copy(camera.position); });
  const starCount = quality === "high" ? 1800 : quality === "medium" ? 1050 : 480;
  return <group ref={root}>
    <mesh scale={500}><sphereGeometry args={[1, quality === "low" ? 32 : 48, 24]} /><shaderMaterial ref={sky} side={BackSide} depthWrite={false} vertexShader={skyVertex} fragmentShader={skyFragment} uniforms={{ uProgress: { value: progress } }} /></mesh>
    <StarField progress={progress} count={starCount} />
  </group>;
}
