"use client";

export function Loader({ progress }: { progress: number }) {
  const value = Math.min(100, Math.max(0, Math.round(progress)));
  return <div className="loader" aria-live="polite">
    <div className="loader-row"><span>LOADING</span><span>{value}%</span></div>
    <div className="loader-track"><i style={{ transform: `scaleX(${value / 100})` }} /></div>
    <p>PREPARING THE STUDIO</p>
  </div>;
}
