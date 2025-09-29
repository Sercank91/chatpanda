// components/chatpanda/PrivateChatWindow.tsx
"use client";
import { useEffect, useState, useRef } from "react";
import { Rnd } from "react-rnd";
import { supabase } from "@/lib/supabase/browser";

type PrivateChatWindowProps = {
  user: string;
  onClose: () => void;
  initialMessages?: { from: string; text: string }[];
};

type Message = {
  from: string;
  text: string;
};

export default function PrivateChatWindow({
  user,
  onClose,
  initialMessages = [],
}: PrivateChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [myNickname, setMyNickname] = useState("Ich");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [tick, setTick] = useState(0);

  // Nickname laden
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("chatpanda_nickname");
      setMyNickname(stored || "Ich");
    }
  }, []);

  // Initial nur einmal Nachrichten setzen
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime Subscription
  useEffect(() => {
    if (!myNickname || !user) return;

    const channel = supabase
      .channel(`dm:${myNickname}-${user}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "private_messages" },
        (payload) => {
          const m = payload.new as {
            from_nickname: string;
            to_nickname: string;
            message: string;
          };

          if (
            (m.from_nickname === user && m.to_nickname === myNickname) ||
            (m.from_nickname === myNickname && m.to_nickname === user)
          ) {
            setMessages((prev) => [...prev, { from: m.from_nickname, text: m.message }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myNickname, user]);

  // Automatisches Scrollen
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Countdown re-rendern
  useEffect(() => {
    let id: number | undefined;
    if (cooldownUntil > Date.now()) {
      id = window.setInterval(() => setTick((t) => t + 1), 1000);
    }
    return () => {
      if (id) clearInterval(id);
    };
  }, [cooldownUntil]);

  async function handleSend() {
    if (!input.trim() || !myNickname || !user) return;

    const text = input.trim();
    setInput("");

    try {
      const res = await fetch("/api/chatpanda/send-private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: myNickname, to: user, message: text }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429 && data.retry_after) {
          setCooldownUntil(Date.now() + data.retry_after * 1000);
        } else {
          console.error("❌ Fehler:", data.error || res.statusText);
        }
        return;
      }
    } catch (err) {
      console.error("🔥 Netzwerkfehler:", err);
    }
  }

  const now = Date.now();
  const cooldownActive = now < cooldownUntil;
  const cooldownSeconds = cooldownActive ? Math.ceil((cooldownUntil - now) / 1000) : 0;

  return (
    <Rnd
      default={{ x: 100, y: 100, width: 300, height: 350 }}
      bounds="window"
      dragHandleClassName="header"
      cancel=".no-drag"
      enableResizing={false}
    >
      <div className="bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700 h-full flex flex-col">
        {/* Header */}
        <div className="header cursor-move bg-blue-600 px-3 py-2 rounded-t-lg flex justify-between items-center">
          <span className="font-semibold">Privatchat mit {user}</span>
          <button
            onClick={onClose}
            className="no-drag text-white hover:text-red-400 px-2 py-1"
          >
            ✖
          </button>
        </div>

        {/* Nachrichtenbereich */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
          {messages.length === 0 && <p className="text-gray-400">Noch keine Nachrichten</p>}
          {messages.map((m, i) => (
            <div key={i} className="p-2 rounded bg-gray-800 text-left">
              <span className="font-semibold">{m.from}:</span> {m.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Eingabefeld */}
        <div className="border-t border-gray-700 p-2 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={cooldownActive ? `Warte ${cooldownSeconds}s` : "Nachricht..."}
            disabled={cooldownActive}
            className="flex-1 bg-gray-800 px-2 py-1 rounded text-sm focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            className={`ml-2 px-3 py-1 rounded text-sm ${
              cooldownActive
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } no-drag`}
            disabled={cooldownActive}
          >
            {cooldownActive ? `⏳ ${cooldownSeconds}s` : "➤"}
          </button>
        </div>
      </div>
    </Rnd>
  );
}
