// app/api/chatpanda/send-private/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body?.from || !body?.to || !body?.message) {
      return NextResponse.json(
        { error: "Ungültige Anfrage – Felder fehlen." },
        { status: 400 }
      );
    }

    const from = body.from.trim();
    const to = body.to.trim();
    const message = body.message.trim();

    // Flood-Schutz mit Redis
    const key = `privmsg:${from}`;
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, 10); // 10 Sekunden Fenster
    }

    if (count > 5) {
      return NextResponse.json(
        { error: "Zu viele Nachrichten – bitte kurz warten." },
        { status: 429 }
      );
    }

    // In DB speichern
    const { error } = await supabaseAdmin.from("private_messages").insert({
      from_nickname: from,
      to_nickname: to,
      message,
    });

    if (error) {
      console.error("❌ Supabase Insert Error:", error);
      return NextResponse.json(
        { error: error.message || "Fehler beim Speichern." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("🔥 Server Error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Interner Serverfehler." },
      { status: 500 }
    );
  }
}
