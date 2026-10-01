"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

declare global {
  interface Window {
    YT?: { Player: new (element: HTMLElement, options: Record<string, unknown>) => YouTubePlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayer {
  playVideo(): void;
  loadVideoById(id: string): void;
  setVolume(value: number): void;
  destroy(): void;
}

export interface VideoBackdropHandle {
  play(): void;
}

export const VideoBackdrop = forwardRef<VideoBackdropHandle, { songs: string[]; onReady: () => void; letterMode: boolean }>(function VideoBackdrop({ songs, onReady, letterMode }, ref) {
  const mount = useRef<HTMLDivElement>(null);
  const player = useRef<YouTubePlayer | null>(null);
  const index = useRef(0);
  const [current, setCurrent] = useState(0);

  useImperativeHandle(ref, () => ({ play: () => player.current?.playVideo() }), []);

  useEffect(() => {
    if (!mount.current || !songs.length) return;
    function next() {
      index.current = (index.current + 1) % songs.length;
      setCurrent(index.current);
      player.current?.loadVideoById(songs[index.current]);
    }
    function create() {
      if (!window.YT || !mount.current || player.current) return;
      player.current = new window.YT.Player(mount.current, {
        width: "100%",
        height: "100%",
        videoId: songs[0],
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1, rel: 0, modestbranding: 1, origin: window.location.origin },
        events: {
          onReady: () => { player.current?.setVolume(62); onReady(); },
          onStateChange: (event: { data: number }) => { if (event.data === 0) next(); },
          onError: next,
        },
      });
    }
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
  }, [onReady, songs]);

  return <div className={`video-backdrop ${letterMode ? "letter-mode" : ""}`} aria-label={`Video ${current + 1} of ${songs.length}`}>
    <div className="garage-video-screen"><div ref={mount} /><span>PLAYING {String(current + 1).padStart(2, "0")} / {String(songs.length).padStart(2, "0")}</span></div>
  </div>;
});
