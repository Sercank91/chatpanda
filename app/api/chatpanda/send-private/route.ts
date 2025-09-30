// app/api/chatpanda/send-private/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redis } from "@/lib/redis";

// ✅ Typ für user_metadata
interface UserMetadata {
  nickname?: string;
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  try {
    // --- Auth: Token aus Authorization header ziehen ---
    const authHeader = req.headers.get("authorization") || "";
    const tokenMatch = authHeader.match(/^Bearer (.+)$/);
    if (!tokenMatch) {
      return NextResponse.json(
        { error: "Nicht authentifiziert (kein Token).", system: true },
        { status: 401 }
      );
    }
    const accessToken = tokenMatch[1];

    // Supabase-admin prüft Token und liefert den User
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !authData?.user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Ungültiges Auth-Token.", system: true },
        { status: 401 }
      );
    }
    const authUser = authData.user;
    const fromIdVerified = authUser.id; // server-verifizierte sender-id

    // ✅ Statt any → typisiertes Casting
    const userMeta = authUser.user_metadata as UserMetadata;
    const fromNickname = userMeta.nickname || authUser.email || "Unbekannt";

    // --- Body lesen ---
    const body = await req.json().catch(() => null);
    if (!body?.to || !body?.message) {
      return NextResponse.json(
        { error: "Ungültige Anfrage – Felder fehlen.", system: true },
        { status: 400 }
      );
    }
    const to = String(body.to).trim();
    const message = String(body.message).trim();

    // --- Blockierung prüfen ---
    const blockedByReceiver = (await redis.exists(`block:${to}:${fromIdVerified}`)) === 1;
    const blockedBySender = (await redis.exists(`block:${fromIdVerified}:${to}`)) === 1;

    if (blockedByReceiver) {
      console.info("PrivMsg blocked (recipient blocked sender)", { fromId: fromIdVerified, fromNickname, to });
      return NextResponse.json(
        { error: `${to} hat dich blockiert.`, system: true },
        { status: 403 }
      );
    }

    if (blockedBySender) {
      console.info("PrivMsg blocked (sender blocked recipient)", { fromId: fromIdVerified, fromNickname, to });
      return NextResponse.json(
        { error: `Du hast ${to} blockiert. Bitte Blockierung aufheben, um Nachrichten zu senden.`, system: true },
        { status: 403 }
      );
    }

    // ---- Flood-Schutz ----
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

      console.info("PrivMsg rate-limited", { fromId: fromIdVerified, to, strikes });
      return NextResponse.json(
        { error: "Zu viele Nachrichten – bitte kurz warten.", retry_after, system: true },
        { status: 429 }
      );
    }

    // Prüfen ob aktive Sperre existiert
    const banKey = `privmsg:${fromIdVerified}:ban`;
    const ttl = await redis.ttl(banKey);
    if (ttl > 0) {
      return NextResponse.json(
        { error: "Du bist temporär gesperrt.", retry_after: ttl, system: true },
        { status: 429 }
      );
    }

    // ---- Nachricht in DB speichern ----
    const { error } = await supabaseAdmin.from("private_messages").insert({
      from_nickname: fromNickname,
      from_id: fromIdVerified,
      to_nickname: to,
      message,
    });

    if (error) {
      console.error("❌ Supabase Insert Error:", error);
      return NextResponse.json(
        { error: error.message || "Fehler beim Speichern.", system: true },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("🔥 Server Error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Interner Serverfehler.", system: true },
      { status: 500 }
    );
  }
}
