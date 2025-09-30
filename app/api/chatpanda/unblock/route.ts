import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { createSystemMessage } from "@/lib/systemMessage"; // ⬅️ NEU

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.blocker || !body?.blocked) {
      return NextResponse.json(
        { error: "Ungültige Anfrage.", system: createSystemMessage("❌ Ungültige Entblocken-Anfrage.") },
        { status: 400 }
      );
    }

    const key = `block:${body.blocker}:${body.blocked}`;
    await redis.del(key);

    return NextResponse.json({
      success: true,
      unblocked: body.blocked,
      system: createSystemMessage(`✅ ${body.blocked} wurde entblockt.`),
    });
  } catch (err) {
    console.error("🔥 Unblock-User Error:", err);
    return NextResponse.json(
      { error: "Interner Fehler beim Entblocken.", system: createSystemMessage("❌ Interner Fehler beim Entblocken.") },
      { status: 500 }
    );
  }
}
