// components/chatpanda/ChatFeed.tsx
"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { Message } from "@/types/message";

type Props = { initial?: Message[] };

export default function ChatFeed({ initial = [] }: Props) {
  const [messages, setMessages] = useState<Message[]>(initial);

  useEffect(() => {
    const channel = supabaseBrowser
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: "room=eq.global" },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => [m, ...prev]); // neueste oben
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
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
      {messages.map((m) => (
        <div key={m.id} className="rounded-md bg-gray-900/70 p-3">
          <div className="text-xs opacity-70">
            {new Date(m.created_at).toLocaleTimeString()} •{" "}
            <span className="font-semibold">{m.username}</span>
          </div>
          <div className="text-gray-100">{m.content}</div>
        </div>
      ))}
    </div>
  );
}
