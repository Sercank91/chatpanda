import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redis } from "@/lib/redis";
import { createSystemMessage } from "@/lib/systemMessage"; // ⬅️ NEU

interface UserMetadata {
  nickname?: string;
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  try {
    let fromIdVerified: string | null = null;
    let fromNickname: string | null = null;

    // --- Auth prüfen (optional) ---
    const authHeader = req.headers.get("authorization") || "";
    const tokenMatch = authHeader.match(/^Bearer (.+)$/);

    if (tokenMatch) {
      const accessToken = tokenMatch[1];
      const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

      if (!authError && authData?.user) {
        const authUser = authData.user;
        fromIdVerified = authUser.id;
        const userMeta = authUser.user_metadata as UserMetadata;
        fromNickname = userMeta.nickname || authUser.email || "Unbekannt";
      }
    }

    // --- Body lesen ---
    const body = await req.json().catch(() => null);
    if (!body?.to || !body?.message || (!fromNickname && !body?.from)) {
      return NextResponse.json(
        { error: "Ungültige Anfrage – Felder fehlen.", system: createSystemMessage("❌ Ungültige Anfrage – Felder fehlen.") },
        { status: 400 }
      );
    }

    const to = String(body.to).trim();
    const message = String(body.message).trim();

    // Wenn kein Supabase-Login → Gast-Nickname aus Body
    if (!fromNickname) {
      fromNickname = String(body.from).trim();
      fromIdVerified = `guest:${fromNickname}`;
    }

    // --- Blockierung prüfen (IP-basiert, 1h) ---
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const keyBlockedByReceiver = `block:${to}:${fromIdVerified}:ip:${ip}`;
    const keyBlockedBySender = `block:${fromIdVerified}:${to}:ip:${ip}`;

    const blockedByReceiver = (await redis.exists(keyBlockedByReceiver)) === 1;
    const blockedBySender = (await redis.exists(keyBlockedBySender)) === 1;

    if (blockedByReceiver) {
      return NextResponse.json(
        { error: `🚫 ${to} hat dich blockiert. Nachricht nicht zugestellt.`, system: createSystemMessage(`🚫 ${to} hat dich blockiert. Nachricht nicht zugestellt.`) },
        { status: 403 }
      );
    }

    if (blockedBySender) {
      return NextResponse.json(
        { error: `🚫 Du hast ${to} blockiert. Bitte Blockierung aufheben.`, system: createSystemMessage(`🚫 Du hast ${to} blockiert. Bitte Blockierung aufheben.`) },
        { status: 403 }
      );
    }

    // ---- Flood-Schutz (pro User-ID oder Gastname) ----
    const keyCount = `privmsg:${fromIdVerified}:count`;
    const keyStrikes = `privmsg:${fromIdVerified}:strikes`;

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

      const banKey = `privmsg:${fromIdVerified}:ban`;
      await redis.set(banKey, "1", "EX", retry_after);

      return NextResponse.json(
        { error: "Zu viele Nachrichten – bitte kurz warten.", retry_after, system: createSystemMessage("⚠️ Zu viele Nachrichten – bitte kurz warten.") },
        { status: 429 }
      );
    }

    const banKey = `privmsg:${fromIdVerified}:ban`;
    const ttl = await redis.ttl(banKey);
    if (ttl > 0) {
      return NextResponse.json(
        { error: "Du bist temporär gesperrt.", retry_after: ttl, system: createSystemMessage(`⏳ Du bist temporär gesperrt (${ttl}s).`) },
        { status: 429 }
      );
    }

    // ---- Nachricht speichern ----
    const { error } = await supabaseAdmin.from("private_messages").insert({
      from_nickname: fromNickname,
      from_id: fromIdVerified,
      to_nickname: to,
      message,
    });

    if (error) {
      console.error("❌ Supabase Insert Error:", error);
      return NextResponse.json(
        { error: error.message || "Fehler beim Speichern.", system: createSystemMessage("❌ Fehler beim Speichern der Nachricht.") },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("🔥 Server Error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Interner Serverfehler.", system: createSystemMessage("❌ Interner Serverfehler beim Senden.") },
      { status: 500 }
    );
  }
}
