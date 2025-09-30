"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/browser";
import type { Message } from "@/types/message";
import { createSystemMessage } from "@/lib/systemMessage";

type Props = { initial?: Message[]; blockedUsers?: string[] };

export default function ChatFeed({ initial = [], blockedUsers = [] }: Props) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: "room=eq.global" },
        (payload) => {
          const m = payload.new as Message;
          if (blockedUsers.includes(m.username)) return;
          setMessages((prev) => [...prev, m]);
        }
      )
      .subscribe();

    const handler = (e: Event) => {
      const custom = e as CustomEvent<Message>;
      const msg = custom.detail;

      if (blockedUsers.includes(msg.username)) return;

      if (msg.isLocalFail) {
        setMessages((prev) => [
          ...prev,
          createSystemMessage("🚫 Deine Nachricht konnte nicht zugestellt werden."),
        ]);
        return;
      }

      // Normale Nachrichten
      setMessages((prev) => [...prev, msg]);
    };
    window.addEventListener("local-message", handler);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("local-message", handler);
    };
  }, [blockedUsers]);

  useEffect(() => {
    if (!bottomRef.current) return;
    bottomRef.current.scrollIntoView({ behavior: messages.length <= 1 ? "auto" : "smooth" });
  }, [messages]);

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
            <div key={m.id} className="p-2 rounded bg-gray-900/70 text-yellow-300 italic">
              {m.content}
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
      <div ref={bottomRef} />
    </div>
  );
}
