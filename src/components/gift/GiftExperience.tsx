"use client";

import { useCallback, useRef, useState } from "react";
import type { Gift } from "../../lib/gift";
import { getUiCopy, useUiLocale } from "../../lib/ui-locale";
import { GarageExperience } from "../experience/GarageExperience";
import { VideoBackdrop, type VideoBackdropHandle } from "./VideoBackdrop";

export function GiftExperience({ gift }: { gift: Gift }) {
  const video = useRef<VideoBackdropHandle>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [entered, setEntered] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(gift.language);
  const ready = useCallback(() => setVideoReady(true), []);
  const locale = useUiLocale();
  const copy = getUiCopy(locale);

  function enter() {
    video.current?.play();
    setEntered(true);
  }

  return <div className="gift-experience">
    <VideoBackdrop ref={video} songs={gift.songs} onReady={ready} letterMode={letterOpen} />
    {entered && <GarageExperience transparent helloName={gift.to} helloLanguage={selectedLanguage} />}
    {!entered && <div className="gift-entry">
      <span>{copy.forFrom(gift.to.toUpperCase(), gift.from.toUpperCase())}</span>
      <select
        aria-label={copy.labelGreeting}
        value={selectedLanguage}
        onChange={(event) => setSelectedLanguage(event.target.value as typeof selectedLanguage)}
        style={{
          position: "absolute", right: 28, top: 28, padding: "8px 16px",
          border: "0", background: "#090b0e", color: "#e8e7e0",
          font: "10px DM Mono", letterSpacing: ".08em", cursor: "pointer"
        }}
      >
        <option value="es">ESPAÑOL</option>
        <option value="en">ENGLISH</option>
        <option value="ja">日本語</option>
      </select>
      <button disabled={!videoReady} onClick={enter}>{videoReady ? copy.enter : copy.loadingVideo}</button>
      <small>{copy.soundOn(gift.songs.length)}</small>
    </div>}
    {entered && <button className="gift-letter-button" onClick={() => setLetterOpen(true)} aria-label={copy.letterLabel}><svg viewBox="0 0 24 24"><path d="M3 5h18v14H3V5Zm1.8 1.8 7.2 5.6 7.2-5.6H4.8Zm14.4 10.4V9.1L12 14.7 4.8 9.1v8.1h14.4Z" /></svg><i /></button>}
    {letterOpen && <div className="gift-letter"><div className="gift-letter-copy"><span>{copy.labelFor} {gift.to}</span><blockquote>{gift.letter}</blockquote><cite>{copy.labelFrom} {gift.from}</cite><button onClick={() => setLetterOpen(false)}>{copy.close}</button></div></div>}
  </div>;
}
