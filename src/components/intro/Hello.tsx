"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GreetingLanguage } from "../../lib/gift";

declare global {
  interface Window { webkitAudioContext?: typeof AudioContext; }
}

const greetings: Record<GreetingLanguage, string> = { en: "HELLO", es: "HOLA", ja: "こんにちは" };

export function Hello({ name, language = "en", reducedMotion, onComplete }: { name?: string; language?: GreetingLanguage; reducedMotion: boolean; onComplete: () => void }) {
  const [phase, setPhase] = useState<"greeting" | "name" | "outro">("greeting");
  const [typed, setTyped] = useState("");
  const completed = useRef(false);
  const greetingCharacters = useMemo(() => Array.from(greetings[language]), [language]);
  const nameCharacters = useMemo(() => Array.from(name ?? ""), [name]);

  useEffect(() => {
    if (completed.current) return;
    if (reducedMotion) {
      const timer = window.setTimeout(() => { completed.current = true; onComplete(); }, 350);
      return () => window.clearTimeout(timer);
    }
    let interval = 0;
    let outroTimer = 0;
    let completeTimer = 0;
    let context: AudioContext | null = null;
    const greetingTimer = window.setTimeout(() => {
      if (!name) {
        setPhase("outro");
        completeTimer = window.setTimeout(() => { completed.current = true; onComplete(); }, 700);
        return;
      }
      setPhase("name");
      const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
      if (AudioContextClass) {
        try { context = new AudioContextClass(); void context.resume(); } catch { context = null; }
      }
      let index = 0;
      interval = window.setInterval(() => {
        index += 1;
        setTyped(nameCharacters.slice(0, index).join(""));
        if (context) {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.frequency.value = 480 + index % 4 * 55;
          gain.gain.setValueAtTime(.015, context.currentTime);
          gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .045);
          oscillator.connect(gain).connect(context.destination);
          oscillator.start(); oscillator.stop(context.currentTime + .05);
        }
        if (index >= nameCharacters.length) {
          window.clearInterval(interval);
          outroTimer = window.setTimeout(() => {
            setPhase("outro");
            completeTimer = window.setTimeout(() => { completed.current = true; onComplete(); }, 720);
          }, 900);
        }
      }, 92);
    }, reducedMotion ? 750 : 1250);
    return () => {
      window.clearTimeout(greetingTimer);
      window.clearTimeout(outroTimer);
      window.clearTimeout(completeTimer);
      window.clearInterval(interval);
      void context?.close();
    };
  }, [name, nameCharacters, onComplete, reducedMotion]);

  return <div className="intro"><div className={`hello-sequence ${phase}`}><p className="greeting-word" aria-label={greetings[language]}>{greetingCharacters.map((character, index) => <span aria-hidden="true" key={`${character}-${index}`} style={{ "--character": index } as React.CSSProperties}>{character}</span>)}</p>{name && <p className="typed-name"><span>{typed}</span><i aria-hidden="true" /></p>}</div></div>;
}
