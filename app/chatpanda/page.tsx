"use client";
import { useEffect, useState } from "react";
import ChatFeed from "@/components/chatpanda/ChatFeed";
import ChatInput from "@/components/chatpanda/ChatInput";

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
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">
        Willkommen, {nickname} ({gender})
      </h1>

      {/* Nachrichtenliste */}
      <ChatFeed />

      {/* Eingabe */}
      <ChatInput room="global" />
    </div>
  );
}
