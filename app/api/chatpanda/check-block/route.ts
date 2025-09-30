import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { createSystemMessage } from "@/lib/systemMessage"; // ⬅️ NEU

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const blocker = searchParams.get("blocker");
  const blocked = searchParams.get("blocked");

  if (!blocker || !blocked) {
    return NextResponse.json(
      { error: "Ungültige Anfrage", system: createSystemMessage("❌ Ungültige Block-Check-Anfrage.") },
      { status: 400 }
    );
  }

  const key = `block:${blocker}:${blocked}`;
  const exists = await redis.exists(key);

  return NextResponse.json({
    blocked: exists === 1,
    system: exists
      ? createSystemMessage(`🚫 ${blocked} ist von ${blocker} blockiert.`)
      : createSystemMessage(`✅ Keine Blockierung aktiv zwischen ${blocker} und ${blocked}.`),
  });
}
