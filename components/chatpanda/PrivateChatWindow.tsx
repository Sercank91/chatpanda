// components/chatpanda/PrivateChatWindow.tsx
"use client";
import { useEffect, useState } from "react";
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
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [myNickname, setMyNickname] = useState("Ich");

  // Nickname laden
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("chatpanda_nickname");
      setMyNickname(stored || "Ich");
    }
  }, []);

  // ✅ Synchronisierung mit page.tsx
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

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

  async function handleSend() {
    if (!input.trim() || !myNickname || !user) return;

    const text = input.trim();
    setInput("");

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

  return (
    <Rnd
      default={{ x: 100, y: 100, width: 300, height: 350 }}
      bounds="window"
      dragHandleClassName="header"
      enableResizing={false}
    >
      <div className="bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700 h-full flex flex-col">
        {/* Header */}
        <div className="header cursor-move bg-blue-600 px-3 py-2 rounded-t-lg flex justify-between items-center">
          <span className="font-semibold">Privatchat mit {user}</span>
          <button onClick={onClose} className="text-white hover:text-red-400">✖</button>
        </div>

        {/* Nachrichtenbereich */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
          {messages.length === 0 && <p className="text-gray-400">Noch keine Nachrichten</p>}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-2 rounded ${
                m.from === myNickname ? "bg-blue-700 text-right" : "bg-gray-800 text-left"
              }`}
            >
              <span className="font-semibold">{m.from}:</span> {m.text}
            </div>
          ))}
        </div>

        {/* Eingabefeld */}
        <div className="border-t border-gray-700 p-2 flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Nachricht..."
            className="flex-1 bg-gray-800 px-2 py-1 rounded text-sm focus:outline-none"
          />
          <button
            onClick={handleSend}
            className="ml-2 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
          >
            ➤
          </button>
        </div>
      </div>
    </Rnd>
  );
}
