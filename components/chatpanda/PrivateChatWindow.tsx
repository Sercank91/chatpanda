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
  type?: "system" | "user";
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

  // Nickname laden
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("chatpanda_nickname");
      setMyNickname(stored || "Ich");
    }
  }, []);

  // Initial Nachrichten
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages.map((m) => ({ ...m, type: "user" })));
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

          const blockedRaw = localStorage.getItem("chatpanda_blocked");
          const blocked: string[] = blockedRaw ? JSON.parse(blockedRaw) : [];

          if (blocked.includes(m.from_nickname) || blocked.includes(m.to_nickname)) {
            return;
          }

          if (
            (m.from_nickname === user && m.to_nickname === myNickname) ||
            (m.from_nickname === myNickname && m.to_nickname === user)
          ) {
            setMessages((prev) => [
              ...prev,
              { from: m.from_nickname, text: m.message, type: "user" },
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myNickname, user]);

  // Scroll automatisch
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !myNickname || !user) return;

    const text = input.trim();
    setInput("");

    try {
      // Vorab-Check ob blockiert (UX)
      const check1 = await fetch(
        `/api/chatpanda/check-block?blocker=${encodeURIComponent(user)}&blocked=${encodeURIComponent(myNickname)}`
      );
      const checkData1 = await check1.json().catch(() => ({}));
      if (checkData1.blocked) {
        setMessages((prev) => [
          ...prev,
          { from: "System", text: `🚫 ${user} hat dich blockiert. Nachricht nicht zugestellt.`, type: "system" },
        ]);
        return;
      }

      const check2 = await fetch(
        `/api/chatpanda/check-block?blocker=${encodeURIComponent(myNickname)}&blocked=${encodeURIComponent(user)}`
      );
      const checkData2 = await check2.json().catch(() => ({}));
      if (checkData2.blocked) {
        setMessages((prev) => [
          ...prev,
          { from: "System", text: `🚫 Du hast ${user} blockiert. Bitte Blockierung aufheben.`, type: "system" },
        ]);
        return;
      }

      // ✅ Supabase Session holen → Access Token
      const sessionRes = await supabase.auth.getSession();
      const accessToken = sessionRes.data?.session?.access_token;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const body: Record<string, string> = { to: user, message: text };

      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      } else {
        // Gastmodus → Nickname mitschicken
        body["from"] = myNickname;
      }

      // POST senden
      const res = await fetch("/api/chatpanda/send-private", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429 && data.retry_after) {
          setCooldownUntil(Date.now() + data.retry_after * 1000);
        } else if (res.status === 403 || data.system) {
          setMessages((prev) => [
            ...prev,
            {
              from: "System",
              text: data.error || "🚫 Nachricht konnte nicht zugestellt werden.",
              type: "system",
            },
          ]);
        } else {
          console.error("❌ Fehler:", data.error || res.statusText);
        }
        return;
      }

      // Erfolgreich → Realtime übernimmt
    } catch (err) {
      console.error("🔥 Netzwerkfehler:", err);
      setMessages((prev) => [
        ...prev,
        { from: "System", text: "Netzwerkfehler beim Senden.", type: "system" },
      ]);
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
            <div
              key={i}
              className={`p-2 rounded text-left ${
                m.type === "system" ? "bg-red-800 text-red-200 italic" : "bg-gray-800"
              }`}
            >
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
