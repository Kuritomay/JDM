"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { encodeDrive } from "../../lib/drive-links";
import { carDetails, extractYouTubeId, validateDriveInput, type CarId, type Drive, type DriveInput, type DriveSign, type SignStyle } from "../../lib/drives";
import { DriveExperience } from "../drive/DriveExperience";
import { CarPreview } from "./CarPreview";
import { Ticket } from "./Ticket";

const initial: DriveInput = {
  recipient_name: "",
  car_id: "miata-na",
  total_km: 32,
  youtube_urls: [""],
  signs: [
    { kilometer: 7, message: "Are you still with me?", style: "road" },
    { kilometer: 19, message: "Not much farther.", style: "wood" },
    { kilometer: 29, message: "3 km to go.", style: "neon" },
  ],
  letter: "",
  signature: "",
};

function MomentTimeline({ total, signs, onChange }: { total: number; signs: DriveSign[]; onChange: (index: number, kilometer: number) => void }) {
  return <div className="journey-map">
    <div className="journey-labels"><span>GARAGE<small>0 KM</small></span><span>DESTINATION<small>{total} KM</small></span></div>
    <div className="journey-rail"><i />{signs.map((sign, index) => <label key={index} className={`journey-point ${sign.style}`} style={{ left: `${(sign.kilometer / total) * 100}%` }} title={`KM ${sign.kilometer}`}><input aria-label={`Move road moment ${index + 1}`} type="range" min="0.5" max={Math.max(.5, total - .5)} step="0.5" value={sign.kilometer} onChange={(event) => onChange(index, Number(event.target.value))} /><b>{sign.kilometer}</b></label>)}</div>
  </div>;
}

export function CreateDrive() {
  const [form, setForm] = useState<DriveInput>(initial);
  const [preview, setPreview] = useState(false);
  const [created, setCreated] = useState<Drive | null>(null);
  const [error, setError] = useState("");
  const previewDrive: Drive = {
    slug: "PREVIEW",
    recipient_name: form.recipient_name || "YOUR NAME",
    car_id: form.car_id,
    total_km: form.total_km,
    songs: form.youtube_urls.map((url, position) => ({ position, youtube_video_id: extractYouTubeId(url) ?? "" })).filter((song) => song.youtube_video_id),
    signs: form.signs,
    letter: form.letter || null,
    signature: form.signature || null,
  };

  function update<K extends keyof DriveInput>(key: K, value: DriveInput[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function updateSong(index: number, value: string) { update("youtube_urls", form.youtube_urls.map((song, position) => position === index ? value : song)); }
  function updateSign(index: number, patch: Partial<DriveSign>) { update("signs", form.signs.map((sign, position) => position === index ? { ...sign, ...patch } : sign)); }
  function addSign() {
    if (form.signs.length >= 8) return;
    const used = new Set(form.signs.map((sign) => sign.kilometer));
    let kilometer = Math.max(.5, Math.round(form.total_km * ((form.signs.length + 1) / (form.signs.length + 2)) * 2) / 2);
    while (used.has(kilometer) && kilometer < form.total_km - .5) kilometer += .5;
    update("signs", [...form.signs, { kilometer, message: "A moment on the road.", style: "road" }]);
  }
  function changeDistance(total: number) {
    const previous = form.total_km;
    setForm((current) => ({ ...current, total_km: total, signs: current.signs.map((sign) => ({ ...sign, kilometer: Math.max(.5, Math.min(total - .5, Math.round((sign.kilometer / previous) * total * 2) / 2)) })) }));
  }
  function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    const result = validateDriveInput(form);
    if (!result.data) { setError(result.error ?? "Could not create drive."); return; }
    const slug = encodeDrive(result.data);
    setCreated({ ...result.data, slug });
  }

  if (created) return <main className="creator creator-result"><header className="creator-header"><a href="/create" className="wordmark">JDM / 終点</a><span>DRIVE ISSUED</span></header><Ticket drive={created} /></main>;

  return <main className="creator">
    <header className="creator-header"><span className="wordmark">JDM / 終点</span><span>CREATE / 01</span></header>
    <form className="creator-form" onSubmit={submit}>
      <div className="creator-intro"><p>旅をつくる</p><h1>CREATE YOUR<br />DRIVE</h1><span>A beginning, a distance, and the things they will find along the way.</span></div>

      <fieldset><legend><b>01</b> FOR</legend><label className="text-field recipient"><span>THEIR NAME</span><input required maxLength={40} value={form.recipient_name} onChange={(event) => update("recipient_name", event.target.value)} placeholder="Akira" /></label></fieldset>

      <fieldset><legend><b>02</b> CAR</legend><div className="car-options">{(["miata-na", "cappuccino"] as CarId[]).map((id) => <label key={id} className={form.car_id === id ? "car-option selected" : "car-option"}><input type="radio" name="car" checked={form.car_id === id} onChange={() => update("car_id", id)} /><div className="car-preview"><CarPreview car={id} /></div><span>{carDetails[id].name}<small>{carDetails[id].code} · {carDetails[id].year}</small></span></label>)}</div><p className="field-note">The licensed MX-5 is the production-quality experience. Cappuccino remains a procedural prototype pending its asset audit.</p></fieldset>

      <fieldset><legend><b>03</b> JOURNEY <em>{form.total_km} KM</em></legend><div className="distance-editor"><label><span>DISTANCE</span><input type="number" min="5" max="100" value={form.total_km} onChange={(event) => changeDistance(Number(event.target.value))} /><b>KM</b></label><input className="distance-range" aria-label="Journey distance" type="range" min="5" max="100" value={form.total_km} onChange={(event) => changeDistance(Number(event.target.value))} /></div></fieldset>

      <fieldset><legend><b>04</b> MUSIC <em>{form.youtube_urls.length} / 5</em></legend><div className="song-list">{form.youtube_urls.map((song, index) => <label key={index}><span>{String(index + 1).padStart(2, "0")}</span><input required type="url" value={song} onChange={(event) => updateSong(index, event.target.value)} placeholder="https://youtu.be/..." />{form.youtube_urls.length > 1 && <button type="button" aria-label={`Remove song ${index + 1}`} onClick={() => update("youtube_urls", form.youtube_urls.filter((_, position) => position !== index))}>REMOVE</button>}</label>)}</div>{form.youtube_urls.length < 5 && <button className="add-row" type="button" onClick={() => update("youtube_urls", [...form.youtube_urls, ""])}>+ ADD SONG</button>}<p className="field-note">Official YouTube playback only. Tracks are not downloaded or stored.</p></fieldset>

      <fieldset><legend><b>05</b> ROAD MOMENTS <em>{form.signs.length} / 8</em></legend><MomentTimeline total={form.total_km} signs={form.signs} onChange={(index, kilometer) => updateSign(index, { kilometer })} /><div className="moment-list">{form.signs.map((sign, index) => <article className="moment-editor" key={index}><div><label>KM<input type="number" min="0.5" max={form.total_km - .5} step="0.5" value={sign.kilometer} onChange={(event) => updateSign(index, { kilometer: Number(event.target.value) })} /></label><label>STYLE<select value={sign.style} onChange={(event) => updateSign(index, { style: event.target.value as SignStyle })}><option value="road">ROAD</option><option value="wood">WOOD</option><option value="neon">NEON</option></select></label></div><label>MESSAGE<input required maxLength={64} value={sign.message} onChange={(event) => updateSign(index, { message: event.target.value })} /></label><button type="button" onClick={() => update("signs", form.signs.filter((_, position) => position !== index))}>REMOVE</button></article>)}</div>{form.signs.length < 8 && <button className="add-row" type="button" onClick={addSign}>+ ADD ROAD MOMENT</button>}</fieldset>

      <fieldset><legend><b>06</b> LETTER <em>OPTIONAL</em></legend><label className="text-field"><span>A LETTER FOR THEM</span><textarea maxLength={600} value={form.letter} onChange={(event) => update("letter", event.target.value)} placeholder="There are journeys..." /><small>{form.letter.length} / 600</small></label></fieldset>
      <fieldset><legend><b>07</b> SIGNATURE <em>OPTIONAL</em></legend><label className="text-field signature"><span>FROM</span><input maxLength={40} value={form.signature} onChange={(event) => update("signature", event.target.value)} placeholder="P" /></label></fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="creator-actions"><button type="button" className="button-secondary" onClick={() => setPreview(true)}>08 / PREVIEW</button><button type="submit" className="button-primary">09 / CREATE DRIVE</button></div>
    </form>
    <AnimatePresence>{preview && <motion.div className="preview-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><button className="preview-close" onClick={() => setPreview(false)}>CLOSE PREVIEW</button><DriveExperience drive={previewDrive} preview /></motion.div>}</AnimatePresence>
  </main>;
}
