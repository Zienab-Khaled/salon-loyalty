"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Customer, Settings } from "@/lib/types";

type VisitRow = {
  id: string;
  type: string;
  createdAt: string;
  customerName: string;
  memberCode: string;
  message?: string;
};

export function StaffPanel() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [memberCode, setMemberCode] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [toast, setToast] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  function showToast(type: "ok" | "err", text: string) {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4500);
  }

  async function refreshSession() {
    const res = await fetch("/api/staff/session", { cache: "no-store" });
    const data = await res.json();
    setAuthed(Boolean(data.authenticated));
    if (data.authenticated) await loadVisits();
  }

  async function loadVisits() {
    const res = await fetch("/api/staff/visits", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setVisits(data.visits || []);
  }

  useEffect(() => {
    refreshSession().catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) setMemberCode(code);
  }, []);

  useEffect(() => {
    if (!authed || !memberCode.trim()) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("code") === memberCode.trim()) {
      lookup().catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  async function login(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("err", data.error || "فشل الدخول");
        return;
      }
      setAuthed(true);
      await loadVisits();
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/staff/login", { method: "DELETE" });
    setAuthed(false);
    setCustomer(null);
    setToast(null);
  }

  async function lookup(e?: FormEvent) {
    e?.preventDefault();
    const code = memberCode.trim();
    if (!code) {
      showToast("err", "أدخل رقم العضوية");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/customers/${code}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setCustomer(null);
        showToast("err", data.error || "البطاقة غير موجودة");
        return;
      }
      setCustomer(data.customer);
      setSettings(data.settings);
    } finally {
      setBusy(false);
    }
  }

  async function runAction(action: "stamp" | "redeem") {
    setBusy(true);
    try {
      const res = await fetch("/api/stamps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberCode: memberCode.trim(), action }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("err", data.error || "فشلت العملية");
        return;
      }
      setCustomer(data.customer);
      showToast("ok", data.message);
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("Gentlemen", {
            body: data.message,
            icon: "/logo-gentlemen.png",
          });
        }
      }
      await loadVisits();
    } finally {
      setBusy(false);
    }
  }

  if (authed === null) {
    return (
      <p className="py-20 text-center text-sm text-white/45">جارٍ التحميل...</p>
    );
  }

  if (!authed) {
    return (
      <form onSubmit={login} className="staff-panel mx-auto max-w-md overflow-hidden">
        <div className="relative h-36 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-barber.png"
            alt=""
            className="h-full w-full object-cover object-[70%_center] grayscale brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-gentlemen.png"
            alt=""
            className="absolute left-4 top-4 h-16 w-16 rounded-xl object-cover"
          />
        </div>
        <div className="space-y-5 px-6 pb-8 pt-2">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-white">
              لوحة الصالون
            </h1>
            <p className="mt-1 text-sm text-white/50">
              أدخل رمز الموظف للمتابعة
            </p>
          </div>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            className="field text-center text-xl tracking-[0.5em]"
            required
            autoFocus
          />
          <button className="btn-gold w-full" disabled={busy}>
            {busy ? "..." : "دخول"}
          </button>
        </div>
        {toast ? <ToastBanner toast={toast} onClose={() => setToast(null)} /> : null}
      </form>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-lg space-y-5">
      {toast ? <ToastBanner toast={toast} onClose={() => setToast(null)} /> : null}

      <div className="staff-panel overflow-hidden">
        {/* Brand header */}
        <div className="relative h-28 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-barber.png"
            alt=""
            className="h-full w-full object-cover object-[72%_center] grayscale contrast-110 brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-5 pb-4">
            <div>
              <p className="text-[11px] tracking-[0.25em] text-[var(--gold)]">
                GENTLEMEN
              </p>
              <h1 className="font-display text-2xl font-bold text-white">
                لوحة الصالون
              </h1>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-white/20 bg-black/40 px-4 py-1.5 text-xs text-white/80 backdrop-blur hover:bg-black/60"
            >
              خروج
            </button>
          </div>
        </div>

        <div className="space-y-5 px-5 py-6">
          <p className="text-center text-sm text-white/50">
            أدخل رقم العضوية من البطاقة ثم أضف التحليقة
          </p>

          <form onSubmit={lookup} className="flex gap-2">
            <input
              value={memberCode}
              onChange={(e) => setMemberCode(e.target.value)}
              placeholder="رقم العضوية"
              className="field flex-1 text-center font-mono text-lg tracking-[0.2em]"
              inputMode="numeric"
              autoComplete="off"
            />
            <button
              type="submit"
              className="btn-ghost shrink-0 !px-5"
              disabled={busy}
            >
              بحث
            </button>
          </form>

          {customer && settings ? (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-bold text-white">{customer.name}</p>
                  <p className="mt-0.5 text-sm text-white/45" dir="ltr">
                    {customer.phone}
                  </p>
                </div>
                <p className="font-mono text-lg tracking-wider text-[var(--gold)]">
                  {customer.memberCode}
                </p>
              </div>

              <StampRow customer={customer} settings={settings} />

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="btn-gold order-1 sm:order-2"
                  disabled={busy || customer.freeAvailable}
                  onClick={() => runAction("stamp")}
                >
                  {busy ? "..." : "إضافة تحليقة"}
                </button>
                <button
                  type="button"
                  className="btn-ghost order-2 sm:order-1"
                  disabled={busy || !customer.freeAvailable}
                  onClick={() => runAction("redeem")}
                >
                  استخدام المجانية
                </button>
              </div>

              {customer.freeAvailable ? (
                <p className="mt-3 text-center text-sm text-[var(--gold)]">
                  العميل يستحق تحليقة مجانية الآن
                </p>
              ) : (
                <p className="mt-3 text-center text-xs text-white/40">
                  باقي {settings.stampsRequired - customer.stamps} على المجانية
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/12 px-5 py-10 text-center">
              <p className="text-sm text-white/40">
                ابحث برقم العضوية لعرض بطاقة العميل
              </p>
            </div>
          )}
        </div>
      </div>

      <section className="staff-panel px-5 py-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/70">آخر العمليات</h2>
          <span className="text-[11px] text-white/30">{visits.length} عملية</span>
        </div>
        <div className="space-y-2">
          {visits.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/30">
              لا توجد عمليات بعد
            </p>
          ) : (
            visits.map((visit) => (
              <div
                key={visit.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">
                    {visit.customerName}
                  </p>
                  <p className="mt-0.5 text-xs text-white/40">
                    <span className="font-mono tracking-wider">
                      {visit.memberCode}
                    </span>
                    {" · "}
                    {new Date(visit.createdAt).toLocaleString("ar-SA", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <span
                  className={[
                    "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                    visit.type === "redeem"
                      ? "bg-[var(--gold)]/15 text-[var(--gold)]"
                      : "bg-white/10 text-white/80",
                  ].join(" ")}
                >
                  {visit.type === "redeem" ? "مجانية" : "+ تحليقة"}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function StampRow({
  customer,
  settings,
}: {
  customer: Customer;
  settings: Settings;
}) {
  const required = settings.stampsRequired;
  const filled = customer.freeAvailable
    ? required
    : Math.min(customer.stamps, required);

  return (
    <div className="mt-5 flex items-center justify-center gap-2" style={{ direction: "ltr" }}>
      {Array.from({ length: required + 1 }, (_, i) => {
        const isGift = i === required;
        const isFilled = i < filled || (isGift && customer.freeAvailable);
        return (
          <div
            key={i}
            className={[
              "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition",
              isFilled
                ? isGift
                  ? "border-[var(--gold)] bg-[var(--gold)]/20 text-[var(--gold)]"
                  : "border-white bg-white text-black"
                : isGift
                  ? "border-[var(--gold)]/50 text-[var(--gold)]/70"
                  : "border-white/30 text-white/40",
            ].join(" ")}
          >
            {isGift ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                <path d="M20 7h-2.18A3 3 0 0 0 15 3c-1.27 0-2.4.8-2.82 2H12c-.42-1.2-1.55-2-2.82-2a3 3 0 0 0-2.82 4H4a1 1 0 0 0-1 1v3h18V8a1 1 0 0 0-1-1ZM9.18 7A1 1 0 0 1 8.2 5.2 1 1 0 1 1 9.18 7Zm5.64 0a1 1 0 1 1 .98-1.8 1 1 0 0 1-.98 1.8ZM3 12v8a1 1 0 0 0 1 1h7v-9H3Zm10 9h7a1 1 0 0 0 1-1v-8h-8v9Z" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
        );
      })}
    </div>
  );
}

function ToastBanner({
  toast,
  onClose,
}: {
  toast: { type: "ok" | "err"; text: string };
  onClose: () => void;
}) {
  const ok = toast.type === "ok";
  return (
    <div
      className={[
        "fixed left-1/2 top-5 z-50 w-[min(92vw,420px)] -translate-x-1/2 animate-[rise-in_0.35s_ease] rounded-2xl border px-4 py-3 shadow-[0_16px_50px_rgba(0,0,0,0.45)]",
        ok
          ? "border-[var(--gold)]/40 bg-[#16120c] text-[var(--gold)]"
          : "border-red-400/35 bg-[#1a1010] text-red-200",
      ].join(" ")}
      role="status"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-lg">{ok ? "✓" : "!"}</span>
        <div className="flex-1 text-right">
          <p className="text-[11px] font-semibold tracking-wide opacity-80">
            {ok ? "تم بنجاح — تم إشعار العميل" : "تنبيه"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-white/90">{toast.text}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-lg leading-none text-white/35 hover:text-white"
          aria-label="إغلاق"
        >
          ×
        </button>
      </div>
    </div>
  );
}
