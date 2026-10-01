"use client";

import { useEffect, useRef, useState } from "react";
import type { DriveSong } from "../../lib/drives";

declare global {
  interface Window {
    YT?: { Player: new (element: HTMLElement, options: Record<string, unknown>) => YouTubePlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  setVolume(value: number): void;
  loadVideoById(id: string): void;
  destroy(): void;
}

export function YouTubeStereo({ songs, active, driver }: { songs: DriveSong[]; active: boolean; driver: boolean }) {
  const mount = useRef<HTMLDivElement>(null);
  const player = useRef<YouTubePlayer | null>(null);
  const indexRef = useRef(0);
  const songsRef = useRef(songs);
  const activeRef = useRef(active);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(55);
  const [failed, setFailed] = useState(false);
  songsRef.current = songs;
  activeRef.current = active;

  function go(next: number) {
    if (!songsRef.current.length) return;
    const value = (next + songsRef.current.length) % songsRef.current.length;
    indexRef.current = value;
    setIndex(value);
    setFailed(false);
    player.current?.loadVideoById(songsRef.current[value].youtube_video_id);
    setPlaying(true);
  }

  useEffect(() => {
    const current = songsRef.current[0];
    if (!current || !mount.current) return;
    const create = () => {
      if (!window.YT || !mount.current || player.current) return;
      player.current = new window.YT.Player(mount.current, {
        width: "100%",
        height: "100%",
        videoId: current.youtube_video_id,
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1, rel: 0, origin: window.location.origin },
        events: {
          onReady: () => { player.current?.setVolume(volume); if (activeRef.current) player.current?.playVideo(); },
          onError: () => setFailed(true),
          onStateChange: (event: { data: number }) => {
            setPlaying(event.data === 1);
            if (event.data === 0) go(indexRef.current + 1);
          },
        },
      });
    };
    if (window.YT) create();
    else {
      window.onYouTubeIframeAPIReady = create;
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
    }
    return () => { player.current?.destroy(); player.current = null; };
  // The player owns track changes after initialization.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songs.length]);

  useEffect(() => { if (active) player.current?.playVideo(); else player.current?.pauseVideo(); }, [active]);
  if (!songs.length) return <div className="music-control unavailable"><span>♪</span><small>QUIET DRIVE</small></div>;

  function toggle() { if (!player.current) return; playing ? player.current.pauseVideo() : player.current.playVideo(); }
  function changeVolume(value: number) { setVolume(value); player.current?.setVolume(value); }

  return <section className={`music-control ${driver ? "driver-stereo" : "chase-stereo"}`} aria-label="YouTube playlist">
    <div className="music-screen"><div ref={mount} className="youtube-mount" />{failed && <span>VIDEO UNAVAILABLE</span>}</div>
    <div className="music-panel">
      <div className="music-display"><span>{String(index + 1).padStart(2,"0")} / {String(songs.length).padStart(2,"0")}</span><strong>{playing ? "▶ PLAYING" : "Ⅱ PAUSED"}</strong></div>
      <div className="track-buttons" aria-label="Choose a song">{songs.map((song, position) => <button key={song.youtube_video_id} className={position === index ? "active" : ""} onClick={() => go(position)} aria-label={`Play song ${position + 1}`}>{String(position + 1).padStart(2, "0")}</button>)}</div>
      <div className="music-buttons"><button aria-label="Previous song" onClick={() => go(index - 1)}>│◁</button><button aria-label={playing ? "Pause" : "Play"} onClick={toggle}>{playing ? "Ⅱ" : "▷"}</button><button aria-label="Next song" onClick={() => go(index + 1)}>▷│</button></div>
      <label><span className="sr-only">Volume</span><input type="range" min="0" max="100" value={volume} onChange={(event) => changeVolume(Number(event.target.value))} /></label>
    </div>
  </section>;
}
