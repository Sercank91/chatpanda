// lib/redis.ts
import Redis from "ioredis";

declare global {
  // ✅ Typ für globalThis definieren (ohne eslint-disable)
  // So weiß TypeScript, dass __redis__ existieren kann
  var __redis__: Redis | undefined;
}

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("❌ REDIS_URL is not set in env");
}

export const redis: Redis =
  globalThis.__redis__ ??
  new Redis(redisUrl, {
    // ⬇️ wichtig für Vercel / Serverless
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

// Im Dev-Modus im globalen Scope zwischenspeichern,
// damit bei Hot Reload keine neuen Redis-Verbindungen entstehen.
if (process.env.NODE_ENV === "development") {
  globalThis.__redis__ = redis;
}
