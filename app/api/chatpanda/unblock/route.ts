// app/api/chatpanda/unblock-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.blocker || !body?.blocked) {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const key = `block:${body.blocker}:${body.blocked}:ip:${ip}`;
    await redis.del(key);

    return NextResponse.json({ success: true, unblocked: body.blocked });
  } catch (err) {
    console.error("🔥 Unblock-User Error:", err);
    return NextResponse.json({ error: "Interner Fehler beim Entblocken." }, { status: 500 });
  }
}
