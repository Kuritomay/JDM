import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "JDM Garage",
  description: "A cinematic automotive study.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
