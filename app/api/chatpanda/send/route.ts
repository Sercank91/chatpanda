import { NextRequest } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => null) as { content?: string } | null;
  const content = (body?.content ?? '').trim();
  if (!content) return new Response('Missing content', { status: 400 });

  // Max-Länge ist in der DB sowieso begrenzt (CHECK auf 2000),
  // hier trotzdem sanft cutten:
  const safeContent = content.slice(0, 2000);

  const user = await currentUser();
  const username =
    user?.username ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    'User';

  const { error } = await supabaseAdmin.from('messages').insert({
    room: 'global',
    user_id: userId,
    username,
    content: safeContent,
  });

  if (error) {
    console.error(error);
    return new Response('DB error', { status: 500 });
  }

  return new Response('OK', { status: 201 });
}
