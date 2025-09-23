'use client';

import { useState } from 'react';
import { useUser, SignedIn, SignedOut } from '@clerk/nextjs';

export default function ChatInput() {
  const { isSignedIn } = useUser();
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || sending || !isSignedIn) return;

    setSending(true);
    try {
      const res = await fetch('/api/chatpanda/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: value }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(text);
        alert('Senden fehlgeschlagen');
      } else {
        setValue('');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <SignedOut>
        <div className="mt-4 text-sm opacity-70">
          Bitte zuerst anmelden, um zu schreiben.
        </div>
      </SignedOut>

      <SignedIn>
        <form onSubmit={onSubmit} className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-md bg-gray-900/60 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-2"
            placeholder="Nachricht eingeben…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={sending || !value.trim()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Senden
          </button>
        </form>
      </SignedIn>
    </>
  );
}
