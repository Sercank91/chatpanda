// app/api/chatpanda/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redis } from "@/lib/redis";

// Limits
const LIMIT = 5;          // max Nachrichten
const WINDOW = 15_000;    // 15 Sekunden
const BAN_TIME = 60_000;  // 1 Minute Ban

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
    const room = body.room || "global";

    // Flood-Check mit Redis
    const key = `chat:${nickname}`;
    const now = Date.now();
    const windowStart = now - WINDOW;

    // Ban prüfen
    const bannedUntil = await redis.get(`${key}:ban`);
    if (bannedUntil && Number(bannedUntil) > now) {
      return NextResponse.json(
        { error: "Zu viele Nachrichten – bitte kurz warten." },
        { status: 429 }
      );
    }

    // Letzte Nachrichten holen
    const recent = await redis.lrange(key, 0, -1);
    const filtered = recent.map(Number).filter((t) => t > windowStart);

    if (filtered.length >= LIMIT) {
      // Ban setzen
      await redis.set(`${key}:ban`, String(now + BAN_TIME), "PX", BAN_TIME);
      return NextResponse.json(
        { error: "Flooding erkannt – 1 Minute gesperrt." },
        { status: 429 }
      );
    }

    // Neues Event speichern
    await redis.lpush(key, String(now));
    await redis.ltrim(key, 0, LIMIT);
    await redis.pexpire(key, WINDOW * 2);

    // Nachricht in DB speichern
    const { error } = await supabaseAdmin.from("messages").insert({
      room,
      username: nickname,
      gender,
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
