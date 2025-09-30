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

    // --- Blockierung prüfen ---
    const blockedByReceiver = await redis.get(`block:${to}:${from}`);   // Empfänger blockiert Sender
    const blockedBySender = await redis.get(`block:${from}:${to}`);     // Sender blockiert Empfänger

    if (blockedByReceiver) {
      return NextResponse.json(
        { error: `${to} hat dich blockiert.` },
        { status: 403 }
      );
    }

    if (blockedBySender) {
      return NextResponse.json(
        { error: `Du hast ${to} blockiert.` },
        { status: 403 }
      );
    }

    // ---- Flood-Schutz Keys ----
    const keyCount = `privmsg:${from}:count`;
    const keyStrikes = `privmsg:${from}:strikes`;

    const windowSec = 15;
    const maxMsgs = 5;

    const count = await redis.incr(keyCount);
    if (count === 1) {
      await redis.expire(keyCount, windowSec);
    }

    if (count > maxMsgs) {
      const strikes = await redis.incr(keyStrikes);
      if (strikes === 1) {
        await redis.expire(keyStrikes, 3600);
      }

      let retry_after = 15;
      if (strikes === 2) retry_after = 30;
      else if (strikes === 3) retry_after = 60;
      else if (strikes >= 4) retry_after = 300;

      const banKey = `privmsg:${from}:ban`;
      await redis.set(banKey, "1", "EX", retry_after);

      return NextResponse.json(
        { error: "Zu viele Nachrichten – bitte kurz warten.", retry_after },
        { status: 429 }
      );
    }

    // Prüfen ob aktive Sperre existiert
    const banKey = `privmsg:${from}:ban`;
    const ttl = await redis.ttl(banKey);
    if (ttl > 0) {
      return NextResponse.json(
        { error: "Du bist temporär gesperrt.", retry_after: ttl },
        { status: 429 }
      );
    }

    // ---- In DB speichern (nur wenn keine Blockierung) ----
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
