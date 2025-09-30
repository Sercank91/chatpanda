// app/api/chatpanda/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redis } from "@/lib/redis";
import { createSystemMessage } from "@/lib/systemMessage"; // ⬅️ NEU

// Limits
const LIMIT = 5;          // max Nachrichten
const WINDOW = 15_000;    // 15 Sekunden
const BAN_TIME = 60_000;  // 1 Minute Ban

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.content) {
      return NextResponse.json(
        {
          error: "Keine Nachricht übergeben.",
          system: createSystemMessage("❌ Keine Nachricht übergeben."),
        },
        { status: 400 }
      );
    }

    const nickname = body.nickname?.trim() || "Gast";
    const gender = body.gender || "u";
    const room = body.room || "global";

    // --- Block-Check ---
    const blockedByOthers = await redis.get(`block:*:${nickname}`);
    const iBlockedOthers = await redis.get(`block:${nickname}:*`);

    if (blockedByOthers) {
      return NextResponse.json(
        {
          error: "Du wurdest blockiert und kannst nicht schreiben.",
          system: createSystemMessage("🚫 Du wurdest blockiert und kannst nicht schreiben."),
        },
        { status: 403 }
      );
    }

    if (iBlockedOthers) {
      return NextResponse.json(
        {
          error: "Du hast jemanden blockiert – bitte Block aufheben um zu schreiben.",
          system: createSystemMessage("🚫 Du hast jemanden blockiert – bitte Block aufheben um zu schreiben."),
        },
        { status: 403 }
      );
    }

    // Flood-Check
    const key = `chat:${nickname}`;
    const now = Date.now();
    const windowStart = now - WINDOW;

    const bannedUntil = await redis.get(`${key}:ban`);
    if (bannedUntil && Number(bannedUntil) > now) {
      return NextResponse.json(
        {
          error: "Zu viele Nachrichten – bitte kurz warten.",
          system: createSystemMessage("⚠️ Zu viele Nachrichten – bitte kurz warten."),
        },
        { status: 429 }
      );
    }

    const recent = await redis.lrange(key, 0, -1);
    const filtered = recent.map(Number).filter((t) => t > windowStart);

    if (filtered.length >= LIMIT) {
      await redis.set(`${key}:ban`, String(now + BAN_TIME), "PX", BAN_TIME);
      return NextResponse.json(
        {
          error: "Flooding erkannt – 1 Minute gesperrt.",
          system: createSystemMessage("🚫 Flooding erkannt – du bist 1 Minute gesperrt."),
        },
        { status: 429 }
      );
    }

    await redis.lpush(key, String(now));
    await redis.ltrim(key, 0, LIMIT);
    await redis.pexpire(key, WINDOW * 2);

    // Nachricht speichern
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
        {
          error: error.message || "Fehler beim Speichern in der DB.",
          system: createSystemMessage("❌ Fehler beim Speichern der Nachricht."),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("🔥 Server Error:", err);
    return NextResponse.json(
      {
        error: (err as Error).message || "Interner Serverfehler.",
        system: createSystemMessage("❌ Interner Serverfehler beim Senden."),
      },
      { status: 500 }
    );
  }
}
