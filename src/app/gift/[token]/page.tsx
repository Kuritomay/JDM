import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GiftExperience } from "../../../components/gift/GiftExperience";
import { decodeGift } from "../../../lib/gift";

type Props = { params: Promise<{ token: string }> };

export const metadata: Metadata = {
  title: "Something is waiting in the garage",
  description: "A JDM garage, a playlist, and a letter.",
  robots: { index: false, follow: false },
};

export default async function GiftPage({ params }: Props) {
  const { token } = await params;
  const gift = decodeGift(token);
  if (!gift) notFound();
  return <GiftExperience gift={gift} />;
}
