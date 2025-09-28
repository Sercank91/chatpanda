import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { userId } = await auth(); // ✅ await hinzufügen
  const body = await req.json().catch(() => null);

  if (!body?.content || !body?.room) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Falls Clerk-User eingeloggt
  if (userId) {
    const user = await currentUser();
    const username =
      user?.username ||
      user?.firstName ||
      user?.emailAddresses[0]?.emailAddress ||
      "User";

    const { error } = await supabaseAdmin.from("messages").insert({
      room: body.room,
      content: body.content,
      user_id: userId,
      username,
      gender: body.gender || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // Falls kein Clerk-User → Gastmodus
  if (!body?.nickname || !body?.gender) {
    return NextResponse.json({ error: "Nickname & Gender required for guest" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("messages").insert({
    room: body.room,
    content: body.content,
    user_id: null, // kein Clerk
    username: body.nickname,
    gender: body.gender,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
