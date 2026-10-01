export const GREETING_LANGUAGES = ["en", "es", "ja"] as const;
export type GreetingLanguage = (typeof GREETING_LANGUAGES)[number];

export type UiLocale = "es" | "en" | "ja";

const createErrors: Record<UiLocale, { to: string; from: string; language: string; songs: string; link: (index: number) => string; letter: string; letterLength: string }> = {
  en: {
    to: "Add who this is for, using up to 40 characters.",
    from: "Add who the letter is from, using up to 40 characters.",
    language: "Choose a greeting language.",
    songs: "Add between one and five YouTube links.",
    link: (index) => `Link ${index} is not a valid YouTube video.`,
    letter: "Write the letter.",
    letterLength: "The letter is limited to 800 characters.",
  },
  es: {
    to: "Añade para quién es, con un máximo de 40 caracteres.",
    from: "Añade quién envía la carta, con un máximo de 40 caracteres.",
    language: "Elige un idioma de saludo.",
    songs: "Añade entre uno y cinco enlaces de YouTube.",
    link: (index) => `El enlace ${index} no es un vídeo válido de YouTube.`,
    letter: "Escribe la carta.",
    letterLength: "La carta está limitada a 800 caracteres.",
  },
  ja: {
    to: "誰向けかを40文字以内で入力してください。",
    from: "差出人を40文字以内で入力してください。",
    language: "挨拶の言語を選んでください。",
    songs: "YouTubeリンクを1〜5件追加してください。",
    link: (index) => `${index}番目のリンクは有効なYouTube動画ではありません。`,
    letter: "レターを書いてください。",
    letterLength: "レターは800文字までです。",
  },
};

export interface Gift {
  to: string;
  from: string;
  language: GreetingLanguage;
  songs: string[];
  letter: string;
}

export function extractYouTubeId(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.hostname === "youtu.be") return validId(url.pathname.slice(1));
    if (["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"].includes(url.hostname)) {
      if (url.pathname === "/watch") return validId(url.searchParams.get("v") ?? "");
      return validId(url.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/)?.[1] ?? "");
    }
  } catch {
    return null;
  }
  return null;
}

function validId(value: string) {
  return /^[A-Za-z0-9_-]{11}$/.test(value) ? value : null;
}

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

function cleanName(value: string) {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
}

export function createGift(to: string, from: string, language: GreetingLanguage, urls: string[], letter: string, uiLocale: UiLocale = "en"): { gift?: Gift; error?: string } {
  const copy = createErrors[uiLocale];
  const cleanTo = cleanName(to);
  const cleanFrom = cleanName(from);
  if (!cleanTo || to.length > 40) return { error: copy.to };
  if (!cleanFrom || from.length > 40) return { error: copy.from };
  if (!GREETING_LANGUAGES.includes(language)) return { error: copy.language };
  if (urls.length < 1 || urls.length > 5) return { error: copy.songs };
  const songs = urls.map(extractYouTubeId);
  const invalid = songs.findIndex((song) => !song);
  if (invalid >= 0) return { error: copy.link(invalid + 1) };
  const cleanLetter = letter.replace(/[<>]/g, "").trim();
  if (!cleanLetter) return { error: copy.letter };
  if (letter.length > 800) return { error: copy.letterLength };
  return { gift: { to: cleanTo, from: cleanFrom, language, songs: songs as string[], letter: cleanLetter } };
}

export function encodeGift(gift: Gift) {
  return encodeBase64Url(JSON.stringify([3, gift.to, gift.from, gift.language, gift.songs, gift.letter]));
}

export function decodeGift(token: string): Gift | null {
  if (!token || token.length > 2400) return null;
  try {
    const payload = JSON.parse(decodeBase64Url(token)) as unknown;
    if (!Array.isArray(payload) || payload.length !== 6 || payload[0] !== 3 || !GREETING_LANGUAGES.includes(payload[3] as GreetingLanguage) || !Array.isArray(payload[4])) return null;
    const result = createGift(payload[1] as string, payload[2] as string, payload[3] as GreetingLanguage, payload[4].map((id) => `https://youtu.be/${String(id)}`), payload[5] as string);
    return result.gift ?? null;
  } catch {
    return null;
  }
}
