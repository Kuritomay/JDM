"use client";

export function CollectionNavigation({ current, total, onPrevious, onNext }: { current: number; total: number; onPrevious: () => void; onNext: () => void }) {
  return <div className="collection-navigation" aria-label="Collection position">
    <button type="button" onClick={onPrevious} aria-label="Previous car">&larr;</button>
    <span>CAR&nbsp;&nbsp;{String(current).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
    <button type="button" onClick={onNext} aria-label="Next car">&rarr;</button>
  </div>;
}
