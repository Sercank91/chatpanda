"use client";
import { useEffect, useState } from "react";
import ChatFeed from "@/components/chatpanda/ChatFeed";
import ChatInput from "@/components/chatpanda/ChatInput";
import ChatRoom from "./ChatRoom";

export default function ChatpandaPage() {
  const [nickname, setNickname] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);

  useEffect(() => {
    setNickname(localStorage.getItem("chatpanda_nickname"));
    setGender(localStorage.getItem("chatpanda_gender"));
  }, []);

  if (!nickname || !gender) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500">
        Kein Nickname gefunden. Bitte gehe zurück zur Startseite.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* 1.) Header bleibt wie auf Startseite (kommt aus layout.tsx) */}

      {/* 2.) Kleine Topbar rechtsbündig */}
      <div className="w-full bg-gray-900 border-b border-gray-800 px-4 py-2 flex justify-end text-sm text-gray-300">
        Hallo, <span className="ml-1 font-semibold">{nickname}</span>
      </div>

      {/* Platzhalter – weitere Schritte bauen wir gleich */}
      <div className="flex-1 flex items-center justify-center text-gray-400">
        👉 Nächster Schritt: Online-User rechts & Chat links
      </div>
    </div>
  );
}
