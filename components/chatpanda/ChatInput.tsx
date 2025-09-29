"use client";
import { useState, useRef, useEffect } from "react";

export default function ChatInput({ room }: { room: string }) {
  const [message, setMessage] = useState("");
  const [lastSent, setLastSent] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([]);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const lastMessageRef = useRef<string>("");

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const now = Date.now();

    if (!message.trim()) return;

    // 1. Max Länge
    if (message.length > 300) {
      setError("Nachricht zu lang (max. 300 Zeichen).");
      return;
    }

    // 2. Temporärer Block aktiv
    if (now < cooldownUntil) {
      return;
    }

    // 3. Mindestens 2 Sekunden zwischen Nachrichten
    if (now - lastSent < 2000) {
      setError("Bitte warte mindestens 2 Sekunden zwischen Nachrichten.");
      return;
    }

    // 4. Rate Limit – max. 5 Nachrichten pro 15 Sekunden
    const newHistory = [...history.filter((t) => now - t < 15000), now];
    if (newHistory.length > 5) {
      setCooldownUntil(now + 30000); // 30 Sekunden block
      setError("Flood erkannt! Du bist 30 Sekunden blockiert.");
      return;
    }

    // 5. Gleiche Nachricht wie zuletzt → blocken
    if (lastMessageRef.current === message.trim()) {
      setError("Bitte nicht die gleiche Nachricht wiederholen.");
      return;
    }

    // Nickname & Gender
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
        setError(data.error || "Fehler beim Senden der Nachricht.");
        return;
      }

      setMessage("");
      setLastSent(now);
      setHistory(newHistory);
      lastMessageRef.current = message.trim();
      setError(null); // ✅ Fehler zurücksetzen
    } catch (err) {
      console.error("Network error:", err);
      setError("Netzwerkfehler beim Senden – bitte erneut versuchen.");
    }
  }

  // Countdown aktualisieren
  useEffect(() => {
    if (!cooldownUntil) return;

    const interval = setInterval(() => {
      const diff = cooldownUntil - Date.now();
      if (diff <= 0) {
        clearInterval(interval);
        setCooldownUntil(0);
        setTimeLeft(0);
        setError(null);
      } else {
        setTimeLeft(Math.ceil(diff / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const cooldownActive = cooldownUntil > Date.now();

  return (
    <form
      onSubmit={sendMessage}
      className="flex flex-col gap-1 border-t border-gray-800 p-2"
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            cooldownActive
              ? `Gesperrt für ${timeLeft}s`
              : "Nachricht schreiben..."
          }
          disabled={cooldownActive}
          className="flex-1 rounded-lg bg-gray-900 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
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
          {cooldownActive ? `Warte ${timeLeft}s` : "Senden"}
        </button>
      </div>

      {/* ✅ Hinweis */}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </form>
  );
}
