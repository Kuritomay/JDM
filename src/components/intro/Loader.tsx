"use client";

import type { GreetingLanguage } from "../../lib/gift";

const copy: Record<GreetingLanguage, { label: string; message: string }> = {
  en: { label: "LOADING", message: "ONE MOMENT. YOUR SPECIAL NIGHT IS TAKING SHAPE." },
  es: { label: "CARGANDO", message: "ESPERA UN INSTANTE. TU NOCHE ESPECIAL ESTÁ TOMANDO FORMA." },
  ja: { label: "準備中", message: "もう少しだけ。あなたの特別な夜が、今始まります。" },
};

export function Loader({ progress, language = "en" }: { progress: number; language?: GreetingLanguage }) {
  const value = Math.min(100, Math.max(0, Math.round(progress)));
  return <div className="loader" aria-live="polite">
    <div className="loader-row"><span>{copy[language].label}</span><span>{value}%</span></div>
    <div className="loader-track"><i style={{ transform: `scaleX(${value / 100})` }} /></div>
    <p>{copy[language].message}</p>
  </div>;
}
