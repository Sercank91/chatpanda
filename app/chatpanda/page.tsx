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
      {/* Header bleibt wie in layout.tsx */}

      {/* Topbar */}
      <div className="w-full bg-gray-900 border-b border-gray-800 px-4 py-2 flex justify-end text-sm text-gray-300">
        Hallo, <span className="ml-1 font-semibold">{nickname}</span>
      </div>

      {/* Main Bereich mit Chat links und Userliste rechts */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chatbereich (links, später Nachrichten) */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h1 className="text-xl font-semibold mb-4">
            Willkommen, {nickname} ({gender})
          </h1>

          {/* Nachrichtenliste – Schritt 4 */}
          <ChatFeed />
        </div>

        {/* Sidebar: Online-User rechts */}
        <div className="w-64 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto">
          <ChatRoom room="global" />
        </div>
      </div>

      {/* Eingabefeld – Schritt 5 */}
      <div className="border-t border-gray-800 p-3 bg-gray-900">
        <ChatInput room="global" />
      </div>
    </div>
  );
}
