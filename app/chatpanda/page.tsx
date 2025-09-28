// app/chatpanda/page.tsx
"use client";
import { useState } from "react";

export default function ChatpandaPage() {
  const [content, setContent] = useState("");
  const [room, setRoom] = useState("global");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const res = await fetch("/api/chatpanda/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, room }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error || res.statusText);
      setStatus("error");
      return;
    }
    setStatus("ok");
    setContent("");
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">Chatpanda – Test</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full border rounded px-3 py-2"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="Room (z. B. global)"
        />
        <textarea
          className="w-full border rounded px-3 py-2"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nachricht…"
          rows={4}
        />
        <button
          type="submit"
          disabled={!content.trim() || status === "sending"}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {status === "sending" ? "Senden…" : "Senden"}
        </button>
      </form>

      {status === "ok" && <p className="text-green-600">Gesendet.</p>}
      {status === "error" && <p className="text-red-600">Fehler: {error}</p>}
    </div>
  );
}
