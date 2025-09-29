// components/chatpanda/ChatFeed.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/browser"; // ✅ korrekt importieren
import type { Message } from "@/types/message";

type Props = { initial?: Message[] };

// 🔹 Mapping für Geschlecht
const genderMap: Record<string, { icon: string; color: string }> = {
  m: { icon: "♂️", color: "text-blue-400" },
  w: { icon: "♀️", color: "text-pink-400" },
  d: { icon: "⚧", color: "text-purple-400" },
  u: { icon: "?", color: "text-gray-400" },
};

export default function ChatFeed({ initial = [] }: Props) {
  const [messages, setMessages] = useState<Message[]>(initial);

  useEffect(() => {
    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: "room=eq.global" },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => [...prev, m]); // neueste unten
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!messages.length) {
    return (
      <div className="rounded-md bg-gray-900/40 p-4 text-sm text-gray-400">
        Noch keine Nachrichten.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((m) => {
        const g = genderMap[m.gender ?? "u"];
        return (
          <div key={m.id} className="flex justify-between items-start">
            {/* Links: Symbol + Nickname + Nachricht */}
            <div className="flex items-start gap-2">
              <span className={g.color}>{g.icon}</span>
              <div>
                <span className="font-bold">{m.username}</span>{" "}
                <span className="text-gray-100">{m.content}</span>
              </div>
            </div>

            {/* Rechts: Uhrzeit */}
            <span className="text-xs text-gray-500 whitespace-nowrap ml-3">
              {new Date(m.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
