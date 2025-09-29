// app/api/chatpanda/send-private/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.message || !body?.to) {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }

    const nickname = body.from || "Gast";

    // 🔒 Rate Limit: 5 Nachrichten pro 15s, dann 30s Block
    const key = `pm:limit:${nickname}`;
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, 15); // 15 Sekunden Fenster
    }

    if (count > 5) {
      const blockKey = `pm:block:${nickname}`;
      const stillBlocked = await redis.ttl(blockKey);

      if (stillBlocked > 0) {
        return NextResponse.json(
          { error: `Zu viele Privat-Nachrichten – warte ${stillBlocked}s.` },
          { status: 429 }
        );
      }

      await redis.set(blockKey, "1", "EX", 30); // 30 Sekunden Block
      return NextResponse.json(
        { error: "Zu viele Privat-Nachrichten – bitte kurz warten." },
        { status: 429 }
      );
    }

    // 💾 Nachricht in Supabase speichern
    const { error } = await supabaseAdmin.from("private_messages").insert({
      from_nickname: nickname,
      to_nickname: body.to,
      message: body.message,
    });

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Server Error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Interner Fehler." },
      { status: 500 }
    );
  }
}
