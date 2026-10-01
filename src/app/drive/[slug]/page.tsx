import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DriveExperience } from "../../../components/drive/DriveExperience";
import { decodeDrive } from "../../../lib/drive-links";
import { demoDrive } from "../../../lib/drives";

type Props = { params: Promise<{ slug: string }> };
function resolveDrive(slug: string) { return slug.toUpperCase() === demoDrive.slug ? demoDrive : decodeDrive(slug); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const drive = resolveDrive(slug);
  if (!drive) return { title: "This road doesn't exist", robots: { index: false, follow: false } };
  return {
    title: "A drive is waiting for you",
    description: "A quiet road, a song, and something left to say.",
    robots: { index: false, follow: false },
    openGraph: { title: "A drive is waiting for you", description: "Sunset to infinity.", images: [`/drive/${drive.slug}/opengraph-image`] },
    twitter: { card: "summary_large_image", title: "A drive is waiting for you", images: [`/drive/${drive.slug}/opengraph-image`] },
  };
}

export default async function DrivePage({ params }: Props) {
  const { slug } = await params; const drive = resolveDrive(slug);
  if (!drive) notFound();
  return <DriveExperience drive={drive} />;
}
