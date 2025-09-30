"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/browser";
import type { Message } from "@/types/message";
import { createGlobalSystemMessage } from "@/lib/systemMessage";
import { Shield } from "lucide-react";


type Props = { initial?: Message[]; blockedUsers?: string[] };

export default function ChatFeed({ initial = [], blockedUsers = [] }: Props) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Realtime Subscription auf globale Nachrichten
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

    // Lokale Events (z. B. LocalFail oder Systemhinweise)
    const handler = (e: CustomEvent<Message>) => {
      const msg = e.detail;

      if (blockedUsers.includes(msg.username)) return;

      // Prüfen ob es ein UserMessage mit isLocalFail ist
      if ("isLocalFail" in msg && msg.isLocalFail) {
        setMessages((prev) => [
          ...prev,
          createGlobalSystemMessage("🚫 Deine Nachricht konnte nicht zugestellt werden.") as Message,
        ]);
        return;
      }

      // Falls eine Systemnachricht direkt vom Server kommt
      if (msg.type === "system") {
        setMessages((prev) => [
          ...prev,
          createGlobalSystemMessage(msg.content || "ℹ️ Systemhinweis") as Message,
        ]);
        return;
      }

      // Normale Nachricht durchlassen
      setMessages((prev) => [...prev, msg]);
    };
    window.addEventListener("local-message", handler as EventListener);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("local-message", handler as EventListener);
    };
  }, [blockedUsers]);

  // Immer nach unten scrollen
  useEffect(() => {
    if (!bottomRef.current) return;
    bottomRef.current.scrollIntoView({ behavior: messages.length <= 1 ? "auto" : "smooth" });
  }, [messages]);

  // Blockierte User herausfiltern
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
			<div
			  key={m.id}
			  className="p-2 rounded bg-gray-900/70 text-yellow-300 italic"
			>
			  <div className="text-xs opacity-70 flex items-center gap-2 mb-1">
				{new Date(m.created_at).toLocaleTimeString()} •{" "}
				<span className="flex items-center gap-1 font-semibold text-yellow-400">
				  <Shield size={14} /> System
				</span>
			  </div>
			  <div>{m.content}</div>
			</div>
		  );
		}


        return (
          <div key={m.id} className="rounded-md bg-gray-900/70 p-3">
			<div className="text-xs opacity-70 flex items-center gap-1">
			  {new Date(m.created_at).toLocaleTimeString()} •{" "}
			  {m.gender === "m" && <span className="text-blue-400">♂️</span>}
			  {m.gender === "w" && <span className="text-pink-400">♀️</span>}
			  {m.gender === "d" && <span className="text-purple-400">⚧️</span>}
			  {(!m.gender || m.gender === "u") && (
				<span className="text-gray-400">❔</span>
			  )}
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
