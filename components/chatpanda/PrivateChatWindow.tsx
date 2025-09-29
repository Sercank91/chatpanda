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

  // Flood-Protection states
  const [lastSent, setLastSent] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([]);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const lastMessageRef = useRef<string>("");

  // clock for countdown
  const [, setTick] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("chatpanda_nickname");
      setMyNickname(stored || "Ich");
    }
  }, []);

  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // countdown re-render
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
    const now = Date.now();

    if (!input.trim() || !myNickname || !user) return;

    // block if cooldown
    if (now < cooldownUntil) return;

    // limit: min 2s zwischen Nachrichten
    if (now - lastSent < 2000) return;

    // limit: max 5 Nachrichten pro 15s
    const newHistory = [...history.filter((t) => now - t < 15000), now];
    if (newHistory.length > 5) {
      setCooldownUntil(now + 30000); // 30s sperre
      setHistory(newHistory);
      return;
    }

    // keine duplicate messages
    if (lastMessageRef.current === input.trim()) return;

    const text = input.trim();
    setInput("");
    setLastSent(now);
    setHistory(newHistory);
    lastMessageRef.current = text;

    try {
      const { error } = await supabase.from("private_messages").insert({
        from_nickname: myNickname,
        to_nickname: user,
        message: text,
      });
      if (error) console.error("Fehler beim Senden:", error.message);
    } catch (err) {
      console.error("Unerwarteter Fehler:", err);
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
          {messages.length === 0 && <p className="text-gray-400">Noch keine Nachrichten</p>}
          {messages.map((m, i) => (
            <div key={i} className="p-2 rounded bg-gray-800 text-left">
              <span className="font-semibold">{m.from}:</span> {m.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
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
            placeholder={
              cooldownActive ? `Warte ${cooldownSeconds}s` : "Nachricht..."
            }
            disabled={cooldownActive}
            className="flex-1 bg-gray-800 px-2 py-1 rounded text-sm focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={cooldownActive}
            className={`ml-2 px-3 py-1 rounded text-sm no-drag ${
              cooldownActive
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {cooldownActive ? `⏳ ${cooldownSeconds}s` : "➤"}
          </button>
        </div>
      </div>
    </Rnd>
  );
}
