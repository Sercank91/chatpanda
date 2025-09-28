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
      {/* Header-Bereich */}
      <header className="fixed top-0 left-0 w-full bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between z-50">
        <h1 className="text-lg font-bold">
          Willkommen, {nickname} ({gender})
        </h1>
        <div className="text-sm text-gray-400">ChatPanda 🐼</div>
      </header>

      {/* Haupt-Chat-Bereich */}
      <main className="flex flex-1 pt-[56px] pb-[60px]">
        {/* Nachrichten & Input links */}
        <div className="flex-1 flex flex-col">
          {/* Nachrichtenliste (scrollbar) */}
          <div className="flex-1 overflow-y-auto p-4">
            <ChatFeed />
          </div>
        </div>

        {/* Online-Liste rechts */}
        <aside className="hidden md:block w-64 border-l border-gray-800 bg-gray-900 p-4 overflow-y-auto">
          <ChatRoom room="global" />
        </aside>
      </main>

      {/* Eingabe fixiert unten */}
      <div className="fixed bottom-0 left-0 w-full bg-gray-900 border-t border-gray-800 p-2">
        <div className="max-w-5xl mx-auto">
          <ChatInput room="global" />
        </div>
      </div>
    </div>
  );
}
