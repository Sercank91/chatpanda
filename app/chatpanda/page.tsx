// app/chatpanda/page.tsx
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
    <div className="flex flex-col h-screen w-screen">
      {/* Kopfbereich */}
      <header className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
        <h1 className="text-lg font-semibold">
          Willkommen, {nickname} ({gender})
        </h1>
      </header>

      {/* Hauptbereich */}
      <div className="flex flex-1 overflow-hidden">
        {/* Nachrichtenbereich */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <ChatFeed />
          </div>
          <div className="border-t border-gray-800">
            <ChatInput room="global" />
          </div>
        </main>

        {/* Userliste (nur Desktop sichtbar) */}
        <aside className="hidden md:block w-64 bg-gray-900 border-l border-gray-800 overflow-y-auto p-4">
          <ChatRoom room="global" />
        </aside>
      </div>
    </div>
  );
}
