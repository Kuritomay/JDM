import { CAR_IDS, validateDriveInput, type Drive, type DriveInput, type SignStyle, type ValidatedDrive } from "./drives";

type DrivePayload = [
  version: 1,
  recipientName: string,
  carIndex: number,
  totalKm: number,
  videoIds: string[],
  signs: Array<[number, string, SignStyle]>,
  letter: string,
  signature: string,
];

function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

export function encodeDrive(drive: ValidatedDrive) {
  const payload: DrivePayload = [
    1,
    drive.recipient_name,
    CAR_IDS.indexOf(drive.car_id),
    drive.total_km,
    drive.songs.map((song) => song.youtube_video_id),
    drive.signs.map((sign) => [sign.kilometer, sign.message, sign.style]),
    drive.letter ?? "",
    drive.signature ?? "",
  ];
  return toBase64Url(JSON.stringify(payload));
}

export function decodeDrive(token: string): Drive | null {
  if (!token || token.length > 4096) return null;
  try {
    const payload = JSON.parse(fromBase64Url(token)) as unknown;
    if (!Array.isArray(payload) || payload.length !== 8 || payload[0] !== 1) return null;
    const [, recipientName, carIndex, totalKm, videoIds, signs, letter, signature] = payload;
    if (!Number.isInteger(carIndex) || !CAR_IDS[carIndex as number] || !Array.isArray(videoIds) || !Array.isArray(signs)) return null;
    const input: DriveInput = {
      recipient_name: recipientName as string,
      car_id: CAR_IDS[carIndex as number],
      total_km: totalKm as number,
      youtube_urls: videoIds.map((id) => `https://youtu.be/${String(id)}`),
      signs: signs.map((sign) => ({ kilometer: sign[0], message: sign[1], style: sign[2] })),
      letter: letter as string,
      signature: signature as string,
    };
    const result = validateDriveInput(input);
    return result.data ? { ...result.data, slug: token } : null;
  } catch {
    return null;
  }
}

export function driveCode(token: string) {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) hash = Math.imul(hash ^ token.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(36).toUpperCase().padStart(7, "0").slice(0, 7);
}
