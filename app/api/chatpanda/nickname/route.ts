// app/api/chatpanda/nickname/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/browser"; // Presence-Check
import { supabaseAdmin } from "@/lib/supabase/admin"; // DB-Fallback

// 🔹 Typ für Presence-Nutzer
type PresenceUser = {
  nickname: string;
  gender: string;
  online_at: string;
};

export async function POST(req: NextRequest) {
  const { nickname, gender } = await req.json();

  if (!nickname) {
    return NextResponse.json(
      { error: "Kein Nickname angegeben." },
      { status: 400 }
    );
  }

  const lowerName = nickname.toLowerCase();

  try {
    // ✅ Schritt 1: Presence-Check
    const channel = supabase.channel("presence-check");
    const state = channel.presenceState();

    const exists = Object.values(state).some((arr) =>
      (arr as unknown as PresenceUser[]).some(
        (user) => user.nickname?.toLowerCase() === lowerName
      )
    );

    if (exists) {
      return NextResponse.json(
        { error: "Nickname bereits vergeben (online)." },
        { status: 409 }
      );
    }

    // ✅ Schritt 2: DB-Fallback (falls Tabelle "nicknames" noch existiert)
    const { data, error } = await supabaseAdmin
      .from("nicknames")
      .select("id, last_seen")
      .eq("nickname", lowerName)
      .maybeSingle();

    if (error) {
      console.error("DB Fehler:", error);
      // Kein Abbruch – wir nehmen trotzdem Presence
    }

    const now = new Date();
    const timeoutMs = 60 * 1000; // 60 Sekunden

    if (data) {
      const lastSeen = new Date(data.last_seen);
      const diff = now.getTime() - lastSeen.getTime();

      if (diff < timeoutMs) {
        return NextResponse.json(
          { error: "Nickname in DB noch reserviert." },
          { status: 409 }
        );
      } else {
        // Nickname reaktivieren
        await supabaseAdmin
          .from("nicknames")
          .update({ last_seen: now, gender })
          .eq("id", data.id);
      }
    } else {
      // Neuer Nickname → in DB speichern
      await supabaseAdmin
        .from("nicknames")
        .insert({ nickname: lowerName, gender, last_seen: now });
    }

    return NextResponse.json({ success: true, reserved: lowerName });
  } catch (err) {
    console.error("Nickname-Check Fehler:", err);
    return NextResponse.json(
      { error: "Fehler bei Nickname-Check." },
      { status: 500 }
    );
  }
}
