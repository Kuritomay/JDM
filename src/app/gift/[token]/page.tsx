import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GiftExperience } from "../../../components/gift/GiftExperience";
import { decodeGift, type GreetingLanguage } from "../../../lib/gift";

type Props = { params: Promise<{ token: string }> };

const meta: Record<GreetingLanguage, { title: (to: string) => string; description: (to: string, from: string) => string }> = {
  en: {
    title: (to) => `For ${to} · JDM Garage`,
    description: (to, from) => `A JDM garage, a playlist and a letter for ${to}, from ${from}.`,
  },
  es: {
    title: (to) => `Para ${to} · JDM Garage`,
    description: (to, from) => `Un garaje JDM, una playlist y una carta para ${to}, de ${from}.`,
  },
  ja: {
    title: (to) => `${to}へ · JDM Garage`,
    description: (to, from) => `${from}から${to}へのJDMガレージ、プレイリスト、そしてレター。`,
  },
};

const fallback: Metadata = {
  title: "Something is waiting in the garage",
  description: "A JDM garage, a playlist, and a letter.",
  robots: { index: false, follow: false },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const gift = decodeGift(token);
  if (!gift) return fallback;
  const title = meta[gift.language].title(gift.to);
  const description = meta[gift.language].description(gift.to, gift.from);
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function GiftPage({ params }: Props) {
  const { token } = await params;
  const gift = decodeGift(token);
  if (!gift) notFound();
  return <GiftExperience gift={gift} />;
}
