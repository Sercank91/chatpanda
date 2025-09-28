import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header"; // 🐼 Header importiert

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chatpanda – Kostenlos chatten ohne Anmeldung",
  description:
    "Chatpanda ist dein kostenloser Chatroom. Treffe neue Leute, chatte live und anonym – auch ohne Anmeldung. Direkt starten mit Nickname.",
  keywords: [
    "chat",
    "kostenlos",
    "chatroom",
    "ohne anmeldung",
    "freunde finden",
    "chatten",
  ],
  openGraph: {
    title: "Chatpanda – Kostenlos chatten ohne Anmeldung",
    description:
      "Chatpanda ist dein kostenloser Chatroom. Treffe neue Leute, chatte live und anonym.",
    url: "https://www.chatpanda.io",
    siteName: "Chatpanda",
    images: [{ url: "/globe.svg", width: 800, height: 600, alt: "Chatpanda Logo" }],
    locale: "de_DE",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="de">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-950 text-gray-100`}
        >
          <Header /> {/* 🐼 Panda-Header global */}
          <main className="mx-auto px-4 py-6">{children}</main> /*max-w-6xl */
        </body>
      </html>
    </ClerkProvider>
  );
}
