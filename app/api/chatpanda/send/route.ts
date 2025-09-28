// app/api/chatpanda/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    console.log("📥 API Body:", body);

    if (!body?.content) {
      return NextResponse.json(
        { error: "Keine Nachricht übergeben." },
        { status: 400 }
      );
    }

    // Standardwerte falls nickname oder gender fehlen
    const nickname = body.nickname || "Gast";
    const gender = body.gender || "u"; // u = unknown/unset

    const { error } = await supabaseAdmin.from("messages").insert({
      room: body.room || "global",
      username: nickname,
      gender: gender,
      content: body.content,
      user_id: body.userId || null,
    });

    if (error) {
      console.error("❌ Supabase Insert Error:", error);
      return NextResponse.json(
        { error: error.message || "Fehler beim Speichern in der DB." },
        { status: 500 }
      );
    }

    console.log("✅ Nachricht gespeichert:", {
      nickname,
      gender,
      content: body.content,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("🔥 Server Error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Interner Serverfehler." },
      { status: 500 }
    );
  }
}
