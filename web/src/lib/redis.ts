import { Redis } from "@upstash/redis";

export function hasRedis() {
  return Boolean(
    (process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN) ||
      (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  );
}

export function getRedis() {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return Redis.fromEnv();
  }

  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }

  throw new Error("REDIS_NOT_CONFIGURED");
}

export function isVercelRuntime() {
  return Boolean(process.env.VERCEL);
}
