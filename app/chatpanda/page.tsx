import { createClient } from '@supabase/supabase-js';
import type { Message } from '@/types/message';
import ChatFeed from '@/components/chatpanda/ChatFeed';
import ChatInput from '@/components/chatpanda/ChatInput';

export const dynamic = 'force-dynamic'; // damit die Seite nicht statisch gecacht wird

export default async function Page() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('room', 'global')
    .order('created_at', { ascending: true })
    .limit(100);

  const initial = (data ?? []) as Message[];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">ChatPanda – Global</h1>
      <ChatFeed initial={initial} />
      <ChatInput />
    </main>
  );
}
