"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "تعذر التسجيل");
        return;
      }
      router.push(`/card/${data.customer.memberCode}`);
    } catch {
      setError("حصل خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-8 w-full max-w-md space-y-4">
      <div>
        <label className="mb-1.5 block text-sm text-white/70" htmlFor="name">
          الاسم
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: أحمد"
          className="field"
          required
          autoComplete="name"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-white/70" htmlFor="phone">
          رقم الجوال
        </label>
        <input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="05xxxxxxxx"
          className="field"
          required
          inputMode="tel"
          autoComplete="tel"
        />
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button type="submit" className="btn-gold w-full" disabled={loading}>
        {loading ? "جارٍ الإنشاء..." : "إنشاء بطاقة الولاء"}
      </button>
    </form>
  );
}
