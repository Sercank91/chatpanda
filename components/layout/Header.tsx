"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full bg-gray-950 text-white shadow-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-3xl">🐼</span>
          <span className="text-xl font-bold tracking-wide">ChatPanda</span>
        </Link>

        {/* Navigation */}
        <nav className="flex gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-purple-400 transition">
            Startseite
          </Link>
          <Link href="/chatpanda" className="hover:text-purple-400 transition">
            Chat
          </Link>
        </nav>
      </div>
    </header>
  );
}
