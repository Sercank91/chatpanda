import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { createSystemMessage } from "@/lib/systemMessage"; // ⬅️ NEU

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.blocker || !body?.blocked) {
      return NextResponse.json(
        { error: "Ungültige Anfrage.", system: createSystemMessage("❌ Ungültige Block-Anfrage.") },
        { status: 400 }
      );
    }

    if (body.blocker === body.blocked) {
      return NextResponse.json(
        { error: "Du kannst dich nicht selbst blockieren.", system: createSystemMessage("🚫 Du kannst dich nicht selbst blockieren.") },
        { status: 400 }
      );
    }

    const key = `block:${body.blocker}:${body.blocked}`;
    await redis.set(key, "1", "EX", 3600); // ⏳ Blockierung 1h gültig

    return NextResponse.json({
      success: true,
      blocked: body.blocked,
      expires_in: 3600,
      system: createSystemMessage(`🚫 ${body.blocked} wurde erfolgreich blockiert.`),
    });
  } catch (err) {
    console.error("🔥 Block-User Error:", err);
    return NextResponse.json(
      { error: "Interner Fehler beim Blockieren.", system: createSystemMessage("❌ Interner Fehler beim Blockieren.") },
      { status: 500 }
    );
  }
}
