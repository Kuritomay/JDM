export const CAR_IDS = ["miata-na", "cappuccino"] as const;
export const SIGN_STYLES = ["road", "wood", "neon"] as const;
export type CarId = (typeof CAR_IDS)[number];
export type SignStyle = (typeof SIGN_STYLES)[number];

export interface DriveSong {
  id?: string;
  position: number;
  youtube_video_id: string;
}

export interface DriveSign {
  id?: string;
  kilometer: number;
  message: string;
  style: SignStyle;
}

export interface Drive {
  id?: string;
  slug: string;
  recipient_name: string;
  car_id: CarId;
  total_km: number;
  letter: string | null;
  signature: string | null;
  songs: DriveSong[];
  signs: DriveSign[];
  created_at?: string;
}

export interface DriveInput {
  recipient_name: string;
  car_id: CarId;
  total_km: number;
  youtube_urls: string[];
  signs: DriveSign[];
  letter: string;
  signature: string;
}

export interface ValidatedDrive {
  recipient_name: string;
  car_id: CarId;
  total_km: number;
  letter: string | null;
  signature: string | null;
  songs: DriveSong[];
  signs: DriveSign[];
}

export const carDetails: Record<CarId, { name: string; code: string; year: string; color: string }> = {
  "miata-na": { name: "MX-5 MIATA NA", code: "NA6CE", year: "1989", color: "#8f1f21" },
  cappuccino: { name: "SUZUKI CAPPUCCINO", code: "EA11R", year: "1991", color: "#244d50" },
};

export const demoDrive: Drive = {
  slug: "NIGHT01",
  recipient_name: "AKIRA",
  car_id: "miata-na",
  total_km: 32,
  songs: [],
  signs: [
    { kilometer: 7, message: "ARE YOU STILL WITH ME?", style: "road" },
    { kilometer: 19, message: "NOT MUCH FARTHER.", style: "wood" },
    { kilometer: 29, message: "3 KM TO GO.", style: "neon" },
  ],
  letter: "There are journeys I would not mind repeating. This is one of them.",
  signature: "P",
};

export function extractYouTubeId(value: string): string | null {
  if (!value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.hostname === "youtu.be") return validVideoId(url.pathname.slice(1));
    if (["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"].includes(url.hostname)) {
      if (url.pathname === "/watch") return validVideoId(url.searchParams.get("v") ?? "");
      const match = url.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/);
      return validVideoId(match?.[1] ?? "");
    }
  } catch { return null; }
  return null;
}

function validVideoId(value: string) {
  return /^[A-Za-z0-9_-]{11}$/.test(value) ? value : null;
}

const clean = (value: unknown, max: number) => typeof value === "string"
  ? value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max)
  : "";

export function validateDriveInput(value: unknown): { data?: ValidatedDrive; error?: string } {
  if (!value || typeof value !== "object") return { error: "Invalid drive." };
  const raw = value as Record<string, unknown>;
  if (typeof raw.recipient_name !== "string" || raw.recipient_name.length > 40) return { error: "Add a name of up to 40 characters." };
  const recipientName = clean(raw.recipient_name, 40);
  if (!recipientName) return { error: "Add the name of the person receiving this drive." };
  if (!CAR_IDS.includes(raw.car_id as CarId)) return { error: "Choose a valid car." };
  const totalKm = Number(raw.total_km);
  if (!Number.isInteger(totalKm) || totalKm < 5 || totalKm > 100) return { error: "Journey distance must be between 5 and 100 km." };
  if (!Array.isArray(raw.youtube_urls) || raw.youtube_urls.length < 1 || raw.youtube_urls.length > 5) return { error: "Add between one and five songs." };
  const songs: DriveSong[] = [];
  for (const [position, entry] of raw.youtube_urls.entries()) {
    if (typeof entry !== "string" || entry.length > 256) return { error: "Invalid YouTube link." };
    const videoId = extractYouTubeId(entry);
    if (!videoId) return { error: `Song ${position + 1} needs a valid YouTube link.` };
    songs.push({ position, youtube_video_id: videoId });
  }
  if (!Array.isArray(raw.signs) || raw.signs.length > 8) return { error: "A drive can have up to eight road moments." };
  const signs: DriveSign[] = [];
  for (const [index, entry] of raw.signs.entries()) {
    if (!entry || typeof entry !== "object") return { error: `Road moment ${index + 1} is invalid.` };
    const sign = entry as Record<string, unknown>;
    const kilometer = Number(sign.kilometer);
    const message = clean(sign.message, 64);
    if (!Number.isFinite(kilometer) || kilometer <= 0 || kilometer >= totalKm) return { error: `Road moment ${index + 1} must be inside the journey.` };
    if (typeof sign.message !== "string" || sign.message.length > 64 || !message) return { error: `Road moment ${index + 1} needs a message of up to 64 characters.` };
    if (!SIGN_STYLES.includes(sign.style as SignStyle)) return { error: `Road moment ${index + 1} has an invalid style.` };
    signs.push({ kilometer: Math.round(kilometer * 10) / 10, message, style: sign.style as SignStyle });
  }
  signs.sort((a, b) => a.kilometer - b.kilometer);
  if (new Set(signs.map((sign) => sign.kilometer)).size !== signs.length) return { error: "Road moments cannot share the same kilometer." };
  if (typeof raw.letter !== "string" || raw.letter.length > 600) return { error: "The letter is limited to 600 characters." };
  if (typeof raw.signature !== "string" || raw.signature.length > 40) return { error: "The signature is limited to 40 characters." };
  return { data: {
    recipient_name: recipientName,
    car_id: raw.car_id as CarId,
    total_km: totalKm,
    songs,
    signs,
    letter: clean(raw.letter, 600) || null,
    signature: clean(raw.signature, 40) || null,
  } };
}
