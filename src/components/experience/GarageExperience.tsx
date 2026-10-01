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
import type { GreetingLanguage } from "../../lib/gift";
import { getUiCopy, useUiLocale } from "../../lib/ui-locale";

const languageNames: Record<GreetingLanguage, string> = { en: "ENGLISH", es: "ESPAÑOL", ja: "日本語" };

type Stage = "hello" | "loading" | "reveal" | "experience";

export function GarageExperience({ transparent = false, helloName, helloLanguage, onStageChange }: { transparent?: boolean; helloName?: string; helloLanguage?: GreetingLanguage; onStageChange?: (stage: Stage) => void }) {
  const [stage, setStage] = useState<Stage>("hello");
  const [loaded, setLoaded] = useState(false);
  const [assetProgress, setAssetProgress] = useState(0);
  const [cinematic, setCinematic] = useState(false);
  const [carIndex, setCarIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const car = availableCars[carIndex];
  const uiLocale = useUiLocale();
  const copy = getUiCopy(uiLocale);
  const greetingLanguage = helloLanguage ?? uiLocale;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    DefaultLoadingManager.onProgress = (_url, loadedItems, totalItems) => {
      setAssetProgress(totalItems ? (loadedItems / totalItems) * 100 : 0);
    };
    return () => { DefaultLoadingManager.onProgress = () => undefined; };
  }, []);
  useEffect(() => {
    if (!loaded || stage !== "loading") return;
    const timer = window.setTimeout(() => setStage("reveal"), reducedMotion ? 0 : 350);
    return () => window.clearTimeout(timer);
  }, [loaded, reducedMotion, stage]);
  useEffect(() => {
    if (stage !== "reveal") return;
    const timer = window.setTimeout(() => setStage("experience"), reducedMotion ? 0 : 1900);
    return () => window.clearTimeout(timer);
  }, [reducedMotion, stage]);
  const markLoaded = useCallback(() => setLoaded(true), []);
  const finishHello = useCallback(() => setStage("loading"), []);
  useEffect(() => { onStageChange?.(stage); }, [onStageChange, stage]);
  useEffect(() => {
    if (!cinematic) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setCinematic(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cinematic]);
  function changeCar(direction: number) {
    setLoaded(false);
    setAssetProgress(0);
    setCinematic(false);
    setStage("loading");
    setCarIndex((index) => (index + direction + availableCars.length) % availableCars.length);
  }

  return <main className={`garage${transparent ? " transparent" : ""} stage-${stage}`}>
    {stage !== "hello" && <SceneErrorBoundary><GarageScene key={car.id} car={car} revealed={stage === "reveal" || stage === "experience"} cinematic={cinematic} onLoaded={markLoaded} transparent={transparent} /></SceneErrorBoundary>}
    {stage === "hello" && <Hello name={helloName} language={greetingLanguage} reducedMotion={reducedMotion} onComplete={finishHello} />}
    {stage === "loading" && <Loader progress={loaded ? 100 : assetProgress} language={greetingLanguage} />}
    {stage === "reveal" && <div className="reveal-curtain" />}
    {stage === "experience" && <div className={cinematic ? "hud hidden" : "hud"}>
      <CarInfo car={car} />
      <CollectionNavigation current={carIndex + 1} total={availableCars.length} onPrevious={() => changeCar(-1)} onNext={() => changeCar(1)} />
      <a className="asset-credits" href="/credits.txt" target="_blank" rel="noreferrer">{copy.modelCredits}</a>
      <div className="language-badge">{languageNames[greetingLanguage]}</div>
    </div>}
    {stage === "experience" && <ExperienceControls cinematic={cinematic} onCinematic={() => setCinematic((value) => !value)} />}
  </main>;
}
