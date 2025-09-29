// components/chatpanda/ChatFeed.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/browser";
import type { Message } from "@/types/message";

type Props = { initial?: Message[] };

export default function ChatFeed({ initial = [] }: Props) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // DB-Events (für alle)
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

    // Lokale Events (nur Willkommensnachricht für eigenen Client)
    const handler = (e: Event) => {
      const custom = e as CustomEvent<Message>;
      setMessages((prev) => [...prev, custom.detail]);
    };
    window.addEventListener("local-message", handler);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("local-message", handler);
    };
  }, []);

  // ⬇️ Immer ans Ende scrollen
  useEffect(() => {
    if (!bottomRef.current) return;

    // Wenn es die erste Nachricht ist -> sofortiger Jump
    if (messages.length <= 1) {
      bottomRef.current.scrollIntoView({ behavior: "auto" });
    } else {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
        if (m.type === "system" || m.username === "System") {
          return (
            <div key={m.id} className="rounded-md bg-gray-900/70 p-3">
              <div className="text-xs opacity-70">
                {new Date(m.created_at).toLocaleTimeString()} •{" "}
                <span className="font-semibold text-yellow-400">🛡️ {m.username}</span>
              </div>
              <div className="text-yellow-300 italic">{m.content}</div>
            </div>
          );
        }

        return (
          <div key={m.id} className="rounded-md bg-gray-900/70 p-3">
            <div className="text-xs opacity-70">
              {new Date(m.created_at).toLocaleTimeString()} •{" "}
              <span className="font-semibold">{m.username}</span>
            </div>
            <div className="text-gray-100">{m.content}</div>
          </div>
        );
      })}
      {/* Dummy-Element zum Scrollen */}
      <div ref={bottomRef} />
    </div>
  );
}
