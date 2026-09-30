import { ImageResponse } from "next/og";
import { decodeDrive, driveCode } from "../../../lib/drive-links";
import { carDetails, demoDrive } from "../../../lib/drives";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const drive = slug.toUpperCase() === demoDrive.slug ? demoDrive : decodeDrive(slug);
  const detail = carDetails[drive?.car_id ?? "miata-na"];
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px", color: "#f2eee4", background: "linear-gradient(145deg,#d27754 0%,#313849 48%,#080d16 100%)", fontFamily: "sans-serif" }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 19, letterSpacing: "0.18em" }}><span>JDM / ∞</span><span>夜のドライブ</span></div>
    <div style={{ display: "flex", flexDirection: "column" }}><span style={{ fontSize: 25, letterSpacing: "0.24em", marginBottom: 18 }}>NIGHT DRIVE</span><strong style={{ fontSize: 72, letterSpacing: "-0.04em" }}>{detail.name}</strong><span style={{ fontSize: 25, opacity: 0.72, marginTop: 16 }}>A DRIVE IS WAITING FOR YOU</span></div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 20 }}>SUNSET → ∞</span><strong style={{ fontSize: 30, letterSpacing: "0.2em" }}>{drive ? driveCode(drive.slug) : "UNKNOWN"}</strong></div>
  </div>, size);
}
