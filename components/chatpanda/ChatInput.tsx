"use client";
import { useState, useRef, useEffect } from "react";

export default function ChatInput({ room }: { room: string }) {
  const [message, setMessage] = useState("");
  const [lastSent, setLastSent] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([]);
  const lastMessageRef = useRef<string>("");

  // ⏳ State für Cooldown
  const [cooldownActive, setCooldownActive] = useState(false);

  useEffect(() => {
    if (!lastSent) return;
    setCooldownActive(true);

    const interval = setInterval(() => {
      if (Date.now() - lastSent >= 1000) {
        setCooldownActive(false);
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [lastSent]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const now = Date.now();

    if (!message.trim()) return;

    if (message.length > 500) {
      alert("Nachricht zu lang (max. 500 Zeichen).");
      return;
    }

    if (cooldownActive) return;

    const newHistory = [...history.filter((t) => now - t < 10000), now];
    if (newHistory.length > 5) {
      alert("Zu viele Nachrichten in kurzer Zeit.");
      return;
    }

    if (lastMessageRef.current === message.trim()) {
      alert("Du hast dieselbe Nachricht gerade eben gesendet.");
      return;
    }

    const nickname = localStorage.getItem("chatpanda_nickname");
    const gender = localStorage.getItem("chatpanda_gender");

    try {
      const res = await fetch("/api/chatpanda/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room,
          content: message.trim(),
          nickname,
          gender,
        }),
      });

      const data = await res.json().catch(() => ({}));
      console.log("API Response:", res.status, data);

      if (!res.ok) {
        alert(data.error || "Fehler beim Senden der Nachricht.");
        return;
      }

      setMessage("");
      setLastSent(now);
      setHistory(newHistory);
      lastMessageRef.current = message.trim();
    } catch (err) {
      console.error("Network error:", err);
      alert("Netzwerkfehler beim Senden – bitte Konsole (F12) prüfen.");
    }
  }

  return (
    <form
      onSubmit={sendMessage}
      className="flex items-center gap-2 border-t border-gray-800"
      style={{ padding: "10px" }}
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Nachricht schreiben..."
        className="flex-1 rounded-lg bg-gray-900 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="submit"
        disabled={cooldownActive}
        className={`rounded-lg px-4 py-2 font-semibold transition-colors ${
          cooldownActive
            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-500 text-white"
        }`}
      >
        {cooldownActive ? "Warte..." : "Senden"}
      </button>
    </form>
  );
}
