"use client";

import { useCallback, useEffect, useState } from "react";
import { availableCars } from "../../data/cars";
import { Hello } from "../intro/Hello";
import { Loader } from "../intro/Loader";
import { CarInfo } from "../ui/CarInfo";
import { ExperienceControls } from "../ui/ExperienceControls";
import { CollectionNavigation } from "../ui/CollectionNavigation";
import { GarageScene } from "./GarageScene";
import { SceneErrorBoundary } from "./SceneErrorBoundary";
import { DefaultLoadingManager } from "three";

type Stage = "hello" | "loading" | "experience";

export function GarageExperience() {
  const [stage, setStage] = useState<Stage>("hello");
  const [loaded, setLoaded] = useState(false);
  const [assetProgress, setAssetProgress] = useState(0);
  const [cinematic, setCinematic] = useState(false);
  const [carIndex, setCarIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const car = availableCars[carIndex];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setStage("loading"), reducedMotion ? 300 : 2500);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);
  useEffect(() => {
    DefaultLoadingManager.onProgress = (_url, loadedItems, totalItems) => {
      setAssetProgress(totalItems ? (loadedItems / totalItems) * 100 : 0);
    };
    return () => { DefaultLoadingManager.onProgress = () => undefined; };
  }, []);
  useEffect(() => {
    if (!loaded || stage !== "loading") return;
    const timer = window.setTimeout(() => setStage("experience"), reducedMotion ? 0 : 420);
    return () => window.clearTimeout(timer);
  }, [loaded, reducedMotion, stage]);
  const markLoaded = useCallback(() => setLoaded(true), []);
  function changeCar(direction: number) {
    setLoaded(false);
    setAssetProgress(0);
    setCinematic(false);
    setStage("loading");
    setCarIndex((index) => (index + direction + availableCars.length) % availableCars.length);
  }

  return <main className="garage">
    {stage !== "hello" && <SceneErrorBoundary><GarageScene key={car.id} car={car} revealed={stage === "experience"} cinematic={cinematic} onLoaded={markLoaded} /></SceneErrorBoundary>}
    {stage === "hello" && <Hello />}
    {stage === "loading" && <Loader progress={loaded ? 100 : assetProgress} />}
    {stage === "experience" && <div className={cinematic ? "hud hidden" : "hud"}>
      <CarInfo car={car} />
      <CollectionNavigation current={carIndex + 1} total={availableCars.length} onPrevious={() => changeCar(-1)} onNext={() => changeCar(1)} />
      <a className="asset-credits" href="/credits.txt" target="_blank" rel="noreferrer">MODEL CREDITS</a>
      <ExperienceControls cinematic={cinematic} onCinematic={() => setCinematic((value) => !value)} />
    </div>}
  </main>;
}
