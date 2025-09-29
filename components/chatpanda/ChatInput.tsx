"use client";
import { useState } from "react";

export default function ChatInput({ room }: { room: string }) {
  const [message, setMessage] = useState("");

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    // Nickname & Gender aus localStorage holen
    const nickname = localStorage.getItem("chatpanda_nickname");
    const gender = localStorage.getItem("chatpanda_gender");

    try {
      const res = await fetch("/api/chatpanda/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room,
          content: message,
          nickname,
          gender,
        }),
      });

      // Versuche JSON zu parsen, auch wenn Fehler kommt
      const data = await res.json().catch(() => ({}));
      console.log("API Response:", res.status, data);

      if (!res.ok) {
        alert(data.error || "Fehler beim Senden der Nachricht.");
        return;
      }

      setMessage(""); // Eingabefeld leeren
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
        className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-white font-semibold"
      >
        Senden
      </button>
    </form>
  );
}
