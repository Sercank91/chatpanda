// app/api/chatpanda/nickname/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { nickname, gender } = await req.json();

  if (!nickname) {
    return NextResponse.json({ error: "Kein Nickname angegeben." }, { status: 400 });
  }

  const lowerName = nickname.toLowerCase();
  const timeoutMs = 60 * 1000; // 60 Sekunden

  // Nickname in DB prüfen
  const { data, error } = await supabaseAdmin
    .from("nicknames")
    .select("id, last_seen")
    .eq("nickname", lowerName)
    .maybeSingle();

  if (error) {
    console.error("DB Fehler:", error);
    return NextResponse.json({ error: "DB-Fehler bei Nickname-Prüfung." }, { status: 500 });
  }

  const now = new Date();

  if (data) {
    const lastSeen = new Date(data.last_seen);
    const diff = now.getTime() - lastSeen.getTime();

    if (diff < timeoutMs) {
      // Noch aktiv -> blockieren
      return NextResponse.json({ error: "Nickname bereits vergeben." }, { status: 409 });
    } else {
      // Abgelaufen -> Nickname reaktivieren
      const { error: updateError } = await supabaseAdmin
        .from("nicknames")
        .update({ last_seen: now, gender })
        .eq("id", data.id);

      if (updateError) {
        console.error("Update Fehler:", updateError);
        return NextResponse.json({ error: "Nickname konnte nicht aktualisiert werden." }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }
  }

  // Neuer Nickname -> einfügen
  const { error: insertError } = await supabaseAdmin
    .from("nicknames")
    .insert({ nickname: lowerName, gender, last_seen: now });

  if (insertError) {
    console.error("Insert Fehler:", insertError);
    return NextResponse.json({ error: "Nickname konnte nicht reserviert werden." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
