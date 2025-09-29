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

    // Redis Keys
    const keyCount = `privmsg:${from}:count`; // Nachrichten im Zeitfenster
    const keyStrikes = `privmsg:${from}:strikes`; // Anzahl Verstöße

    // Nachrichten zählen
    const count = await redis.incr(keyCount);
    if (count === 1) {
      await redis.expire(keyCount, 10); // 10 Sekunden Fenster
    }

    if (count > 5) {
      // Strike erhöhen
      const strikes = await redis.incr(keyStrikes);

      // Ablaufzeit für Strikes (z.B. 1 Stunde)
      if (strikes === 1) {
        await redis.expire(keyStrikes, 3600);
      }

      // Strafzeiten: 1=15s, 2=30s, 3=60s, >=4=300s
      let retry_after = 15;
      if (strikes === 2) retry_after = 30;
      else if (strikes === 3) retry_after = 60;
      else if (strikes >= 4) retry_after = 300;

      return NextResponse.json(
        {
          error: "Zu viele Nachrichten – bitte kurz warten.",
          retry_after,
        },
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
