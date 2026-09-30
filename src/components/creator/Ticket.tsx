"use client";

import { useState } from "react";
import { driveCode } from "../../lib/drive-links";
import { carDetails, type Drive } from "../../lib/drives";

export function Ticket({ drive }: { drive: Drive }) {
  const [copied, setCopied] = useState(false);
  const detail = carDetails[drive.car_id];
  const code = driveCode(drive.slug);
  const url = typeof window === "undefined" ? `/drive/${drive.slug}` : `${window.location.origin}/drive/${drive.slug}`;
  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  async function share() {
    if (navigator.share) await navigator.share({ title: "A drive is waiting for you", url });
    else await copy();
  }
  return <section className="ticket-result" aria-live="polite">
    <div className="ticket">
      <div className="ticket-stub"><span>夜間</span><strong>{code.slice(0, 2)}</strong><small>ONE WAY</small></div>
      <div className="ticket-main">
        <div className="ticket-heading"><span>NIGHT DRIVE</span><span>夜のドライブ</span></div>
        <h2>{detail.name}</h2><p>{detail.code} · {detail.year}</p>
        <div className="ticket-route"><b>AYACUCHO</b><i /><b>∞</b></div>
        <div className="ticket-grid"><span>DISTANCE<strong>{drive.total_km} KM</strong></span><span>ARRIVAL<strong>STARLIGHT</strong></span><span>MUSIC<strong>{drive.songs.length} TRACK{drive.songs.length === 1 ? "" : "S"}</strong></span></div>
        <div className="ticket-code">{code}</div>
      </div>
    </div>
    <p className="ready-label">YOUR DRIVE IS READY</p>
    <a className="drive-url" href={`/drive/${drive.slug}`}>{url}</a>
    <div className="ticket-actions"><button onClick={copy}>{copied ? "COPIED" : "COPY LINK"}</button><button onClick={share}>SHARE</button></div>
    <p className="privacy-note">Anyone with this link can open the drive.</p>
  </section>;
}
