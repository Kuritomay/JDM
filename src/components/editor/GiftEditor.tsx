"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createGift, encodeGift, type GreetingLanguage } from "../../lib/gift";
import { getUiCopy, useUiLocale } from "../../lib/ui-locale";

export function GiftEditor() {
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [language, setLanguage] = useState<GreetingLanguage>("es");
  const [songs, setSongs] = useState([""]);
  const [letter, setLetter] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const locale = useUiLocale();
  const copy = getUiCopy(locale);

  useEffect(() => { setLanguage(locale); }, [locale]);

  function updateSong(index: number, value: string) {
    setSongs((current) => current.map((song, position) => position === index ? value : song));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const result = createGift(to, from, language, songs, letter, locale);
    if (!result.gift) { setError(result.error ?? copy.createError); return; }
    setLink(`${window.location.origin}/gift/${encodeGift(result.gift)}`);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return <main className="gift-editor">
    <header><a href="/">JDM / GARAGE</a><span>{copy.editorHeader}</span></header>
    <form onSubmit={submit}>
      <div className="editor-title"><span>私からあなたへ</span><h1>{copy.editorTitle1}<br />{copy.editorTitle2}</h1><p>{copy.editorSubtitle}</p></div>
      <fieldset>
        <legend><b>01</b> {copy.legendTo}</legend>
        <div className="editor-names"><label><span>{copy.labelFor}</span><input required maxLength={40} value={to} onChange={(event) => setTo(event.target.value)} placeholder={copy.placeholderTo} /></label><label><span>{copy.labelFrom}</span><input required maxLength={40} value={from} onChange={(event) => setFrom(event.target.value)} placeholder={copy.placeholderFrom} /></label></div>
        <label className="editor-language"><span>{copy.labelGreeting}</span><select value={language} onChange={(event) => setLanguage(event.target.value as GreetingLanguage)}><option value="es">HOLA · Español</option><option value="en">HELLO · English</option><option value="ja">こんにちは · 日本語</option></select></label>
      </fieldset>
      <fieldset>
        <legend><b>02</b> {copy.legendPlaylist} <em>{songs.length} / 5</em></legend>
        <div className="editor-songs">{songs.map((song, index) => <label key={index}><span>{String(index + 1).padStart(2, "0")}</span><input required type="url" value={song} onChange={(event) => updateSong(index, event.target.value)} placeholder="https://youtu.be/..." />{songs.length > 1 && <button type="button" onClick={() => setSongs((current) => current.filter((_, position) => position !== index))}>{copy.remove}</button>}</label>)}</div>
        {songs.length < 5 && <button className="editor-add" type="button" onClick={() => setSongs((current) => [...current, ""])}>{copy.addVideo}</button>}
        <p className="editor-note">{copy.songsNote}</p>
      </fieldset>
      <fieldset>
        <legend><b>03</b> {copy.legendLetter}</legend>
        <label className="editor-letter"><span>{copy.letterLabel}</span><textarea required maxLength={800} value={letter} onChange={(event) => setLetter(event.target.value)} placeholder={copy.letterPlaceholder} /><small>{letter.length} / 800</small></label>
      </fieldset>
      {error && <p className="editor-error" role="alert">{error}</p>}
      <button className="editor-create" type="submit">{copy.createLink}</button>
    </form>
    {link && <section className="editor-result" aria-live="polite"><span>{copy.readyToShare}</span><a href={link}>{link}</a><div><button onClick={copyLink}>{copied ? copy.copied : copy.copyLink}</button><a href={link}>{copy.openExperience}</a></div></section>}
  </main>;
}
