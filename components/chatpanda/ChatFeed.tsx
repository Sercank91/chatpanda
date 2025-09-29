// components/chatpanda/ChatFeed.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/browser";
import type { Message } from "@/types/message";

type Props = { initial?: Message[] };

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
          setMessages((prev) => [...prev, m]);
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
        // 🛡️ System-Nachricht
        if (m.type === "system" || m.username === "System") {
          return (
            <div
              key={m.id}
              className="text-sm text-yellow-400 italic flex justify-between"
            >
              <span>🛡️ {m.content}</span>
              <span className="text-xs opacity-60">
                {new Date(m.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        }

        // 👤 Normale User-Nachricht
        return (
          <div key={m.id} className="flex justify-between items-start">
            <div>
              <span className="font-bold">{m.username}</span>{" "}
              <span className="text-gray-100">{m.content}</span>
            </div>
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
