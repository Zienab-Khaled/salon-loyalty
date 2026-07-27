import { NextResponse } from "next/server";
import { hasRedis, isVercelRuntime } from "@/lib/redis";

export async function GET() {
  const redis = hasRedis();
  return NextResponse.json({
    ok: true,
    redis,
    vercel: isVercelRuntime(),
    ready: !isVercelRuntime() || redis,
    message: redis
      ? "قاعدة البيانات متصلة"
      : isVercelRuntime()
        ? "لازم تربطين Upstash Redis من Vercel Storage"
        : "وضع التطوير المحلي",
  });
}
