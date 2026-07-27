import Link from "next/link";
import { RegisterForm } from "@/components/RegisterForm";
import { StorageBanner } from "@/components/StorageBanner";

export default function HomePage() {
  return (
    <main className="home-shell relative flex flex-1 flex-col px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <StorageBanner />
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-gentlemen.png"
              alt="Gentlemen"
              className="h-14 w-14 rounded-full object-cover ring-1 ring-white/15"
            />
            <div>
              <p className="font-display text-xl font-bold tracking-wide text-white">
                Gentlemen
              </p>
              <p className="text-xs text-white/40">صالون حلاقة رجالي</p>
            </div>
          </div>
          <Link href="/staff" className="btn-ghost !py-2 !px-4 text-sm">
            لوحة الصالون
          </Link>
        </header>

        <section className="mt-14 text-center sm:mt-20">
          <div className="mx-auto mb-8 overflow-hidden rounded-[24px] border border-white/8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-barber.png"
              alt=""
              className="h-44 w-full object-cover object-[70%_center] grayscale contrast-110 sm:h-56"
            />
          </div>

          <p className="text-[11px] font-medium tracking-[0.28em] text-[var(--gold)]">
            بطاقة الولاء
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-6xl">
            ولاؤك يستحق
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg">
            أربع تحليقات والخامسة{" "}
            <span className="text-[var(--gold)]">مجاناً</span>. سجّل بياناتك
            واحصل على بطاقتك الرقمية خلال ثوانٍ.
          </p>
          <RegisterForm />
        </section>

        <section className="mx-auto mt-16 grid max-w-2xl gap-3 text-sm sm:grid-cols-3">
          <Step n="01" title="سجّل" text="بالاسم والجوال" />
          <Step n="02" title="أظهر الـ QR" text="عند كل زيارة" />
          <Step n="03" title="اجمع" text="والخامسة مجاناً" />
        </section>
      </div>
    </main>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-5 text-center">
      <p className="text-[11px] tracking-[0.2em] text-[var(--gold)]">{n}</p>
      <p className="mt-2 font-semibold text-white">{title}</p>
      <p className="mt-1 text-white/45">{text}</p>
    </div>
  );
}
