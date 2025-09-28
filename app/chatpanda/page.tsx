"use client";
import { useEffect, useState } from "react";
import ChatFeed from "@/components/chatpanda/ChatFeed";
import ChatInput from "@/components/chatpanda/ChatInput";
import ChatRoom from "./ChatRoom"; // Online-User

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
    <div className="h-[calc(100vh-64px)] flex">
      {/* === DESKTOP Ansicht === */}
      <div className="hidden md:flex flex-1">
        {/* Hauptbereich: Chat */}
        <div className="flex-1 flex flex-col border-r border-gray-800">
          {/* Begrüßung */}
          <div className="p-4 border-b border-gray-800 bg-gray-950">
            <h1 className="text-lg font-semibold">
              Willkommen, {nickname} ({gender})
            </h1>
          </div>

          {/* Nachrichten scrollbar */}
          <div className="flex-1 overflow-y-auto p-4">
            <ChatFeed />
          </div>

          {/* Eingabefeld fixiert */}
          <div className="border-t border-gray-800 bg-gray-950 p-3">
            <ChatInput room="global" />
          </div>
        </div>

        {/* Rechte Sidebar: Online-User */}
        <aside className="w-72 bg-gray-950 p-4 overflow-y-auto border-l border-gray-800">
          <ChatRoom room="global" />
        </aside>
      </div>

      {/* === MOBILE Ansicht === */}
      <div className="flex flex-col flex-1 md:hidden">
        {/* Header fix */}
        <div className="p-4 border-b border-gray-800 bg-gray-950 flex items-center justify-between">
          <h1 className="text-lg font-bold flex items-center gap-2">
            🐼 ChatPanda
          </h1>
          <span className="text-sm text-gray-400">
            {nickname} ({gender})
          </span>
        </div>

        {/* Nachrichten scrollbar */}
        <div className="flex-1 overflow-y-auto p-3">
          <ChatFeed />
        </div>

        {/* Eingabefeld fix */}
        <div className="border-t border-gray-800 bg-gray-950 p-3">
          <ChatInput room="global" />
        </div>
      </div>
    </div>
  );
}
