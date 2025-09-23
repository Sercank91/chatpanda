// app/api/chatpanda/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  // Clerk: SERVER-VARIANTE verwenden
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Body lesen und validieren (sehr basic)
  const body = await req.json().catch(() => null) as
    | { content?: string; room?: string }
    | null;

  const content = (body?.content ?? "").trim();
  const room = (body?.room ?? "global").trim();

  if (!content) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }
  if (content.length > 2000) {
    return NextResponse.json({ error: "Content too long" }, { status: 400 });
  }

  // Optional: Username aus Clerk ziehen (fallbacks)
  const cu = await currentUser().catch(() => null);
  const username =
    cu?.username ||
    [cu?.firstName, cu?.lastName].filter(Boolean).join(" ").trim() ||
    cu?.emailAddresses?.[0]?.emailAddress ||
    "User";

  // Insert mit Service Role (Server only!)
  const { error } = await supabaseAdmin
    .from("messages")
    .insert([{ room, user_id: userId, username, content }]);

  if (error) {
    console.error("Insert failed:", error);
    return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
