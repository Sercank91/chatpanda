// lib/redis.ts
import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __redis__: Redis | undefined;
}

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL is not set in env");
}

export const redis: Redis =
  global.__redis__ ??
  new Redis(redisUrl, {
    // ⬇️ wichtig für Vercel / Serverless
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

if (process.env.NODE_ENV === "development") {
  global.__redis__ = redis;
}
