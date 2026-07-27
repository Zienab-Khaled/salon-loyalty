"use client";

import { useCallback, useEffect, useState } from "react";
import type { Customer, Settings } from "@/lib/types";
import { LoyaltyCard } from "./LoyaltyCard";

type Props = {
  code: string;
  initialCustomer: Customer;
  initialSettings: Settings;
  cardUrl: string;
};

export function CardClient({
  code,
  initialCustomer,
  initialSettings,
  cardUrl,
}: Props) {
  const [customer, setCustomer] = useState(initialCustomer);
  const [settings, setSettings] = useState(initialSettings);
  const [toast, setToast] = useState<string | null>(null);
  const [seenAt, setSeenAt] = useState(initialCustomer.notificationAt);

  const maybeNotify = useCallback(
    (next: Customer) => {
      if (
        next.lastNotification &&
        next.notificationAt &&
        next.notificationAt !== seenAt
      ) {
        setToast(next.lastNotification);
        setSeenAt(next.notificationAt);
        if (typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "granted") {
            new Notification("Gentlemen", {
              body: next.lastNotification,
              icon: "/logo-gentlemen.png",
            });
          }
        }
      }
    },
    [seenAt]
  );

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => undefined);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const res = await fetch(`/api/customers/${code}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setCustomer(data.customer);
        setSettings(data.settings);
        maybeNotify(data.customer);
      } catch {
        // ignore polling errors
      }
    };
    const id = window.setInterval(tick, 4000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [code, maybeNotify]);

  return (
    <div className="w-full max-w-[400px]">
      {toast ? (
        <div className="notify-toast mb-4 animate-[rise-in_0.35s_ease]">
          <div className="flex items-start justify-between gap-3">
            <div className="text-right">
              <p className="text-[11px] font-semibold tracking-wide text-[var(--gold)]">
                ✓ تم إضافة تحليقة
              </p>
              <p className="mt-1 text-sm leading-relaxed text-white/90">
                {toast}
              </p>
            </div>
            <button
              type="button"
              className="text-lg leading-none text-white/35 hover:text-white"
              onClick={() => setToast(null)}
              aria-label="إغلاق"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

      <LoyaltyCard
        customer={customer}
        settings={settings}
        cardUrl={cardUrl}
      />
    </div>
  );
}
