import type { Metadata } from "next";
import { Noto_Serif_JP, Noto_Serif_SC } from "next/font/google";
import "./globals.css";

const notoJp = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-jp",
  display: "swap",
});

const notoSc = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-sc",
  display: "swap",
});

export const metadata: Metadata = {
  title: "三語リーダー — Trilingual Reader",
  description: "Trilingual EPUB novel reader with AI translation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="dark">
      <body
        className={`${notoJp.variable} ${notoSc.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
