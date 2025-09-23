// app/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChatPanda",
  description: "Live-Chats in Echtzeit",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="de">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-950 text-gray-100`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
