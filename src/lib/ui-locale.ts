"use client";

import { useEffect, useState } from "react";
import type { UiLocale } from "./gift";

export type { UiLocale };

export function detectUiLocale(): UiLocale {
  if (typeof navigator === "undefined") return "en";
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const candidate of candidates) {
    const lower = (candidate ?? "").toLowerCase();
    if (lower.startsWith("es")) return "es";
    if (lower.startsWith("ja")) return "ja";
    if (lower.startsWith("en")) return "en";
  }
  return "en";
}

export function useUiLocale(): UiLocale {
  const [locale, setLocale] = useState<UiLocale>("en");
  useEffect(() => setLocale(detectUiLocale()), []);
  return locale;
}

export interface UiCopy {
  editorHeader: string;
  editorTitle1: string;
  editorTitle2: string;
  editorSubtitle: string;
  legendTo: string;
  labelFor: string;
  labelFrom: string;
  placeholderTo: string;
  placeholderFrom: string;
  labelGreeting: string;
  legendPlaylist: string;
  remove: string;
  addVideo: string;
  songsNote: string;
  legendLetter: string;
  letterLabel: string;
  letterPlaceholder: string;
  createError: string;
  createLink: string;
  readyToShare: string;
  copied: string;
  copyLink: string;
  openExperience: string;
  enter: string;
  loadingVideo: string;
  soundOn: (videos: number) => string;
  close: string;
  forFrom: (to: string, from: string) => string;
  modelCredits: string;
  cinematic: string;
  exitCinematic: string;
  dragExplore: string;
  doubleClickReset: string;
  collection: (current: number, total: number) => string;
  notFound1: string;
  notFound2: string;
  createNew: string;
  editorEntry: string;
}

const copy: Record<UiLocale, UiCopy> = {
  en: {
    editorHeader: "MUSIC + LETTER",
    editorTitle1: "MAKE IT",
    editorTitle2: "THEIRS.",
    editorSubtitle: "Miata. Trueno. Their videos behind it all, and one letter waiting.",
    legendTo: "TO / FROM",
    labelFor: "FOR",
    labelFrom: "FROM",
    placeholderTo: "Their name",
    placeholderFrom: "Your name",
    labelGreeting: "GREETING",
    legendPlaylist: "YOUTUBE PLAYLIST",
    remove: "REMOVE",
    addVideo: "+ ADD VIDEO",
    songsNote: "Videos play in this order. When one ends, the next begins.",
    legendLetter: "LETTER",
    letterLabel: "WHAT DO YOU WANT TO SAY?",
    letterPlaceholder: "Write the letter they will find...",
    createError: "Could not create the link.",
    createLink: "CREATE LINK",
    readyToShare: "READY TO SHARE",
    copied: "COPIED",
    copyLink: "COPY LINK",
    openExperience: "OPEN EXPERIENCE",
    enter: "ENTER",
    loadingVideo: "LOADING VIDEO",
    soundOn: (videos) => `SOUND ON · ${videos} VIDEO${videos === 1 ? "" : "S"}`,
    close: "CLOSE",
    forFrom: (to, from) => `FOR ${to} · FROM ${from}`,
    modelCredits: "MODEL CREDITS",
    cinematic: "CINEMATIC",
    exitCinematic: "EXIT CINEMATIC",
    dragExplore: "DRAG TO EXPLORE",
    doubleClickReset: "DOUBLE CLICK TO RESET",
    collection: (current, total) => `CAR  ${String(current).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    notFound1: "THIS LINK",
    notFound2: "ISN'T HERE.",
    createNew: "CREATE A NEW ONE",
    editorEntry: "CREATE A GIFT",
  },
  es: {
    editorHeader: "MÚSICA + CARTA",
    editorTitle1: "HAZLO",
    editorTitle2: "SUYO.",
    editorSubtitle: "Miata. Trueno. Sus vídeos detrás de todo, y una carta esperando.",
    legendTo: "PARA / DE",
    labelFor: "PARA",
    labelFrom: "DE",
    placeholderTo: "Su nombre",
    placeholderFrom: "Tu nombre",
    labelGreeting: "SALUDO",
    legendPlaylist: "LISTA DE YOUTUBE",
    remove: "QUITAR",
    addVideo: "+ AÑADIR VÍDEO",
    songsNote: "Los vídeos se reproducen en este orden. Cuando uno termina, empieza el siguiente.",
    legendLetter: "CARTA",
    letterLabel: "¿QUÉ QUIERES DECIR?",
    letterPlaceholder: "Escribe la carta que encontrará...",
    createError: "No se pudo crear el enlace.",
    createLink: "CREAR ENLACE",
    readyToShare: "LISTO PARA COMPARTIR",
    copied: "COPIADO",
    copyLink: "COPIAR ENLACE",
    openExperience: "ABRIR EXPERIENCIA",
    enter: "ENTRAR",
    loadingVideo: "CARGANDO VÍDEO",
    soundOn: (videos) => `SONIDO ACTIVADO · ${videos} VÍDEO${videos === 1 ? "" : "S"}`,
    close: "CERRAR",
    forFrom: (to, from) => `PARA ${to} · DE ${from}`,
    modelCredits: "CRÉDITOS DEL MODELO",
    cinematic: "CINEMATOGRÁFICA",
    exitCinematic: "SALIR DE LA CINEMATOGRÁFICA",
    dragExplore: "ARRASTRA PARA EXPLORAR",
    doubleClickReset: "DOBLE CLIC PARA REINICIAR",
    collection: (current, total) => `COCHE  ${String(current).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    notFound1: "ESTE ENLACE",
    notFound2: "NO EXISTE.",
    createNew: "CREAR UNO NUEVO",
    editorEntry: "CREAR UN REGALO",
  },
  ja: {
    editorHeader: "ミュージック + レター",
    editorTitle1: "これを、",
    editorTitle2: "あなたへ。",
    editorSubtitle: "Miata、Trueno。その裏にある動画と、待っている一通のレター。",
    legendTo: "宛名 / 差出人",
    labelFor: "宛名",
    labelFrom: "差出人",
    placeholderTo: "相手の名前",
    placeholderFrom: "あなたの名前",
    labelGreeting: "挨拶",
    legendPlaylist: "YouTubeプレイリスト",
    remove: "削除",
    addVideo: "+ 動画を追加",
    songsNote: "動画はこの順番で再生されます。1本終わると、次が始まります。",
    legendLetter: "レター",
    letterLabel: "何を伝えたい？",
    letterPlaceholder: "見つけられるレターを書いてください...",
    createError: "リンクを作成できませんでした。",
    createLink: "リンクを作成",
    readyToShare: "共有できます",
    copied: "コピー済み",
    copyLink: "リンクをコピー",
    openExperience: "体験を開く",
    enter: "入る",
    loadingVideo: "動画を読み込み中",
    soundOn: (videos) => `サウンドON · ${videos}本の動画`,
    close: "閉じる",
    forFrom: (to, from) => `${to}へ · ${from}より`,
    modelCredits: "モデルクレジット",
    cinematic: "シネマティック",
    exitCinematic: "シネマを終了",
    dragExplore: "ドラッグで探索",
    doubleClickReset: "ダブルクリックでリセット",
    collection: (current, total) => `クルマ  ${String(current).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    notFound1: "このリンクは",
    notFound2: "ありません。",
    createNew: "新しく作成する",
    editorEntry: "ギフトを作る",
  },
};

export function getUiCopy(locale: UiLocale): UiCopy {
  return copy[locale];
}
