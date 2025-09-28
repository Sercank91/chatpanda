// components/chatpanda/ChatInput.tsx
"use client";

import { useState } from "react";

export type ChatInputProps = { room: string };

export default function ChatInput({ room }: ChatInputProps) {
  const [value, setValue] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = value.trim();
    if (!content) return;

    await fetch("/api/chatpanda/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room, content }),
    }).catch(() => {});

    setValue("");
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-3">
      <input
        className="flex-1 rounded-md bg-gray-800/50 px-3 py-2 outline-none"
        placeholder="Nachricht schreiben…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        type="submit"
        className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500"
      >
        Senden
      </button>
    </form>
  );
}
