"use client";
import { useEffect, useState } from "react";
import ChatFeed from "@/components/chatpanda/ChatFeed";
import ChatInput from "@/components/chatpanda/ChatInput";
import ChatRoom from "./ChatRoom"; // 🔹 Online-User

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
    <div className="flex h-[calc(100vh-64px)]">
      {/* Hauptbereich: Chat */}
      <div className="flex-1 flex flex-col border-r border-gray-800">
        {/* Begrüßung oben */}
        <div className="p-4 border-b border-gray-800 bg-gray-950">
          <h1 className="text-lg font-semibold">
            Willkommen, {nickname} ({gender})
          </h1>
        </div>

        {/* Nachrichtenliste scrollt */}
        <div className="flex-1 overflow-y-auto p-4">
          <ChatFeed />
        </div>

        {/* Eingabefeld fixiert unten */}
        <div className="border-t border-gray-800 bg-gray-950 p-3">
          <ChatInput room="global" />
        </div>
      </div>

      {/* Rechte Sidebar: Online-User */}
      <aside className="w-64 bg-gray-950 p-4 overflow-y-auto border-l border-gray-800">
        <ChatRoom room="global" />
      </aside>
    </div>
  );
}
