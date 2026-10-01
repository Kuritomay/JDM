"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { carDetails, type Drive } from "../../lib/drives";
import { DriveScene, type CameraMode, type NarrativeStage } from "./DriveScene";
import { YouTubeStereo } from "./YouTubeStereo";
import { DriveErrorBoundary } from "./DriveErrorBoundary";

type Stage = "hello" | "loading" | NarrativeStage;
type Quality = "high" | "medium" | "low";

function detectQuality(): Quality {
  if (typeof window === "undefined") return "medium";
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4; const cores = navigator.hardwareConcurrency ?? 4;
  if (memory <= 2 || cores <= 4) return "low"; if (memory >= 8 && cores >= 8 && window.devicePixelRatio <= 2) return "high"; return "medium";
}

export function DriveExperience({ drive, preview = false }: { drive: Drive; preview?: boolean }) {
  const [stage, setStage] = useState<Stage>(preview ? "drive" : "hello"); const [quality] = useState(detectQuality);
  const [loaded, setLoaded] = useState(preview); const [visualLoad, setVisualLoad] = useState(preview ? 100 : 7); const [progress, setProgress] = useState(preview ? .38 : 0);
  const [cameraMode, setCameraMode] = useState<CameraMode>(preview ? "chase" : "driver"); const [letterOpen, setLetterOpen] = useState(false); const [letterRead, setLetterRead] = useState(false);
  const ready = useCallback(() => setLoaded(true), []); const currentKm = Math.min(drive.total_km, progress * drive.total_km);
  const sceneStage: NarrativeStage = stage === "hello" || stage === "loading" ? "garage" : stage;

  useEffect(() => {
    if (preview) return;
    if (stage === "hello") { const timer = window.setTimeout(() => setStage("loading"), 1800); return () => clearTimeout(timer); }
    if (stage === "loading") { const timer = window.setInterval(() => setVisualLoad((value) => Math.min(loaded ? 100 : 90, value + Math.max(1, (93 - value) * .075))), 100); return () => clearInterval(timer); }
    const durations: Partial<Record<Stage, [number, Stage]>> = { garage: [10500, "cockpit"], ignition: [2400, "departure"], departure: [5200, "drive"], arrival: [6500, "destination"] };
    const transition = durations[stage]; if (transition) { const timer = window.setTimeout(() => setStage(transition[1]), transition[0]); return () => clearTimeout(timer); }
  }, [loaded, preview, stage]);
  useEffect(() => { if (stage === "loading" && loaded && visualLoad >= 98) setStage("garage"); }, [loaded, stage, visualLoad]);
  useEffect(() => { if (stage === "drive" && progress >= .975) { setCameraMode("chase"); setStage("arrival"); } }, [progress, stage]);

  const journeyActive = ["ignition","departure","drive","arrival","destination"].includes(stage);
  const controlsVisible = ["drive","arrival","destination"].includes(stage);
  function openLetter() { setLetterOpen(true); setLetterRead(true); }
  return <main className="drive-experience">
    {stage !== "hello" && <DriveErrorBoundary><DriveScene key={stage === "loading" ? "preload" : "experience"} stage={sceneStage} cameraMode={cameraMode} quality={quality} progress={progress} currentKm={currentKm} totalKm={drive.total_km} signs={drive.signs} letterOpen={letterOpen} onProgress={setProgress} onReady={ready} car={drive.car_id} /></DriveErrorBoundary>}
    <AnimatePresence mode="wait">
      {stage === "hello" && <motion.div className="drive-intro" key="hello" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><h1>HELLO,<br /><strong>{drive.recipient_name}.</strong></h1></motion.div>}
      {stage === "loading" && <motion.div className="drive-intro loading-screen" key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><span>PREPARING THE GARAGE</span><div><i style={{ width: `${visualLoad}%` }} /></div><b>{Math.round(visualLoad)}%</b><small>{quality.toUpperCase()} QUALITY · {carDetails[drive.car_id].name}</small></motion.div>}
    </AnimatePresence>
    {stage === "garage" && <motion.div className="garage-caption" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}><span>01 / GARAGE</span><strong>{carDetails[drive.car_id].name}</strong><small>{carDetails[drive.car_id].code} · WAITING</small></motion.div>}
    {stage === "cockpit" && <motion.button className="start-journey" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onClick={() => setStage("ignition")}><span>EMPECEMOS</span><i /></motion.button>}
    {stage === "ignition" && <motion.div className="ignition-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>IGNITION / ON</motion.div>}
    {!["hello","loading","garage"].includes(stage) && <div className={`drive-controls ${cameraMode} ${journeyActive ? "journey-active" : ""} ${controlsVisible ? "" : "predrive"}`}>
      {controlsVisible && <button className="camera-toggle" onClick={() => setCameraMode((mode) => mode === "driver" ? "chase" : "driver")} aria-label={`Switch to ${cameraMode === "driver" ? "chase" : "driver"} camera`}><svg viewBox="0 0 24 24"><path d="M4 7.5h3l1.4-2h7.2l1.4 2h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Zm8 2.2a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z" /></svg><span>{cameraMode === "driver" ? "CHASE" : "DRIVER"}</span></button>}
      <YouTubeStereo songs={drive.songs} active={journeyActive} driver={cameraMode === "driver"} />
      {controlsVisible && drive.letter && <button className="road-letter" onClick={openLetter} aria-label="Open letter"><svg viewBox="0 0 24 24"><path d="M3 5h18v14H3V5Zm1.8 1.8 7.2 5.6 7.2-5.6H4.8Zm14.4 10.4V9.1L12 14.7 4.8 9.1v8.1h14.4Z" /></svg>{!letterRead && <i />}</button>}
    </div>}
    {stage === "arrival" && <motion.div className="arrival-distance" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>500 m<small>DESTINATION</small></motion.div>}
    {stage === "destination" && <motion.div className="destination-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 1.8 }}>LLEGAMOS.<small>{drive.total_km.toFixed(1)} KM · JOURNEY COMPLETE</small></motion.div>}
    <AnimatePresence>{letterOpen && <motion.div className="letter-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="letter-mark">✦</div><p>FOR YOU</p><blockquote>{drive.letter}</blockquote>{drive.signature && <cite>— {drive.signature}</cite>}<button onClick={() => setLetterOpen(false)}>CLOSE</button></motion.div>}</AnimatePresence>
  </main>;
}
