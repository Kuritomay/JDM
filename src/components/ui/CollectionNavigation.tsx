"use client";

import { getUiCopy, useUiLocale } from "../../lib/ui-locale";

export function CollectionNavigation({ current, total, onPrevious, onNext }: { current: number; total: number; onPrevious: () => void; onNext: () => void }) {
  const copy = getUiCopy(useUiLocale());
  return <div className="collection-navigation" aria-label={copy.collection(current, total)}>
    <button type="button" onClick={onPrevious} aria-label="←">&larr;</button>
    <span>{copy.collection(current, total)}</span>
    <button type="button" onClick={onNext} aria-label="→">&rarr;</button>
  </div>;
}
