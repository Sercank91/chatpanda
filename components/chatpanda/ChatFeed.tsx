"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/browser";
import type { Message } from "@/types/message";

type Props = { initial?: Message[]; blockedUsers?: string[] };

export default function ChatFeed({ initial = [], blockedUsers = [] }: Props) {
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
          // blockierte User überspringen
          if (blockedUsers.includes(m.username)) return;
          setMessages((prev) => [...prev, m]);
        }
      )
      .subscribe();

    // Lokale Events (nur Willkommensnachricht für eigenen Client)
    const handler = (e: Event) => {
      const custom = e as CustomEvent<Message>;
      if (blockedUsers.includes(custom.detail.username)) return;
      setMessages((prev) => [...prev, custom.detail]);
    };
    window.addEventListener("local-message", handler);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("local-message", handler);
    };
  }, [blockedUsers]);

  // ⬇️ Immer ans Ende scrollen
  useEffect(() => {
    if (!bottomRef.current) return;

    if (messages.length <= 1) {
      bottomRef.current.scrollIntoView({ behavior: "auto" });
    } else {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // gefilterte Nachrichten (falls initiale oder alte enthalten)
  const visibleMessages = messages.filter((m) => !blockedUsers.includes(m.username));

  if (!visibleMessages.length) {
    return (
      <div className="rounded-md bg-gray-900/40 p-4 text-sm text-gray-400">
        Noch keine Nachrichten.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visibleMessages.map((m) => {
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
