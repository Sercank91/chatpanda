// components/layout/Header.tsx
"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 border-b border-gray-800 h-12 flex items-center">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl transition-transform group-hover:scale-110">
            🐼
          </span>
          <span className="text-lg font-bold tracking-wide bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            ChatPanda
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex gap-6 text-sm font-medium">
          <Link
            href="/"
            className="text-gray-300 hover:text-purple-400 transition-colors"
          >
            Startseite
          </Link>
          <Link
            href="/chatpanda"
            className="text-gray-300 hover:text-purple-400 transition-colors"
          >
            Chat
          </Link>
        </nav>
      </div>
    </header>
  );
}
