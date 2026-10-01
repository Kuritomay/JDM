"use client";

import { getUiCopy, useUiLocale } from "../../../lib/ui-locale";

export default function NotFound() {
  const copy = getUiCopy(useUiLocale());
  return <main className="gift-not-found"><span>404 / GARAGE</span><h1>{copy.notFound1}<br />{copy.notFound2}</h1><a href="/create">{copy.createNew}</a></main>;
}
