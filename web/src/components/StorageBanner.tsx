"use client";

import { useEffect, useState } from "react";

type Health = {
  ready: boolean;
  redis: boolean;
  message: string;
};

export function StorageBanner() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setHealth(data))
      .catch(() => undefined);
  }, []);

  if (!health || health.ready) return null;

  return (
    <div className="mx-auto mb-6 max-w-lg rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
      <p className="font-semibold text-amber-200">قاعدة البيانات غير مربوطة</p>
      <p className="mt-2 leading-relaxed text-amber-100/85">
        عشان البطاقة تظهر لما تمسحين الـ QR، اربطي Redis مجاناً:
      </p>
      <ol className="mt-3 list-decimal space-y-1 pr-5 text-amber-100/80">
        <li>Vercel → مشروعك → Storage</li>
        <li>Create Database → Upstash Redis</li>
        <li>Connect للمشروع</li>
        <li>Deployments → Redeploy</li>
        <li>بعدها أنشئ البطاقة من جديد</li>
      </ol>
    </div>
  );
}
