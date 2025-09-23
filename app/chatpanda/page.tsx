// app/chatpanda/page.tsx
import { createClient } from '@supabase/supabase-js';
import ChatFeed from '@/components/chatpanda/ChatFeed';
import ChatInput from '@/components/chatpanda/ChatInput';
import type { Message } from '@/types/message';

// wichtig: kein Caching für diese Seite
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ChatPandaPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // verhindert Next.js-Cache auf Server-Fetches
      global: {
        fetch: (input, init) => fetch(input as any, { ...init, cache: 'no-store' }),
      },
    }
  );

  const { data, error } = await supabase
    .from('messages')
    .select('id, user_id, username, content, created_at, room')
    .eq('room', 'global')
    .order('created_at', { ascending: true })
    .limit(100);

  const initial: Message[] = Array.isArray(data) ? data : [];

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-center text-2xl font-semibold">ChatPanda – Global</h1>
        <a href="/" className="text-sm text-blue-400 hover:underline">Home</a>
      </div>

      {/* Liste */}
      {initial.length === 0 ? (
        <div className="rounded-xl bg-white/5 p-4 text-center text-sm text-gray-400">
          Noch keine Nachrichten.
        </div>
      ) : (
        <div className="rounded-xl bg-white/5 p-4">
          <ChatFeed initial={initial} />
        </div>
      )}

      {/* Input */}
      <div className="rounded-xl bg-white/5 p-4">
        <ChatInput />
      </div>

      {error && (
        <pre className="whitespace-pre-wrap rounded-md bg-red-900/30 p-3 text-red-200">
          {error.message}
        </pre>
      )}
    </div>
  );
}
