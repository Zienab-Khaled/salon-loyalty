"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CardClient } from "@/components/CardClient";
import { readCardCache, saveCardCache } from "@/lib/card-cache";
import { DEFAULT_SETTINGS } from "@/lib/config";
import type { Customer, Settings } from "@/lib/types";

type Props = {
  code: string;
  siteUrl: string;
};

export function CardPageClient({ code, siteUrl }: Props) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(
    "loading"
  );

  useEffect(() => {
    let active = true;

    async function load() {
      const cached = readCardCache(code);

      try {
        const res = await fetch(`/api/customers/${code}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (!active) return;
          setCustomer(data.customer);
          setSettings(data.settings);
          saveCardCache(code, {
            customer: data.customer,
            settings: data.settings,
          });
          setStatus("ready");
          return;
        }
      } catch {
        // fall through to cache
      }

      if (cached?.customer) {
        if (!active) return;
        setCustomer(cached.customer);
        setSettings(cached.settings || DEFAULT_SETTINGS);
        setStatus("ready");

        // Re-save on server if Redis is available (best effort)
        fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: cached.customer.name,
            phone: cached.customer.phone,
          }),
        }).catch(() => undefined);
        return;
      }

      if (active) setStatus("missing");
    }

    load();
    return () => {
      active = false;
    };
  }, [code]);

  if (status === "loading") {
    return (
      <p className="py-24 text-center text-sm text-black/45">
        جارٍ فتح البطاقة...
      </p>
    );
  }

  if (status === "missing" || !customer) {
    return (
      <div className="mx-auto max-w-sm py-20 text-center">
        <h1 className="font-display text-3xl font-bold text-black">
          البطاقة غير موجودة
        </h1>
        <p className="mt-3 text-black/55">
          تأكد من رقم العضوية أو أنشئ بطاقة جديدة
        </p>
        <Link href="/" className="btn-gold mt-8 inline-flex">
          العودة للتسجيل
        </Link>
      </div>
    );
  }

  const base = siteUrl.replace(/\/$/, "");
  const cardUrl = `${base}/staff?code=${customer.memberCode}`;

  return (
    <CardClient
      code={customer.memberCode}
      initialCustomer={customer}
      initialSettings={settings}
      cardUrl={cardUrl}
    />
  );
}
