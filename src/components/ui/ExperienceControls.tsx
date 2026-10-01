"use client";

import { getUiCopy, useUiLocale } from "../../lib/ui-locale";

export function ExperienceControls({ cinematic, onCinematic }: { cinematic: boolean; onCinematic: () => void }) {
  const copy = getUiCopy(useUiLocale());
  return <div className="experience-controls">
    <button type="button" onClick={onCinematic} aria-pressed={cinematic}>{cinematic ? copy.exitCinematic : copy.cinematic}</button>
    <a className="editor-entry" href="/create">{copy.editorEntry}</a>
    <p>{copy.dragExplore} <span>{copy.doubleClickReset}</span></p>
  </div>;
}
