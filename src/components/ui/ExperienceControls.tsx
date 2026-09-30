"use client";

export function ExperienceControls({ cinematic, onCinematic }: { cinematic: boolean; onCinematic: () => void }) {
  return <div className="experience-controls">
    <button type="button" onClick={onCinematic} aria-pressed={cinematic}>{cinematic ? "EXIT CINEMATIC" : "CINEMATIC"}</button>
    <p>DRAG TO EXPLORE <span>DOUBLE CLICK TO RESET</span></p>
  </div>;
}
