import type { Metadata } from "next";
import { CreateDrive } from "../../components/creator/CreateDrive";

export const metadata: Metadata = {
  title: "JDM / 終点 — Create a drive",
  description: "Issue a shareable night drive with a song and something left to say.",
  robots: { index: false, follow: false },
};

export default function CreateDrivePage() {
  return <CreateDrive />;
}
