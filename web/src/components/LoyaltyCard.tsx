"use client";

import { getOfferSubtitle, stampLabel } from "@/lib/config";
import type { Customer, Settings } from "@/lib/types";

type Props = {
  customer: Customer;
  settings: Settings;
  cardUrl: string;
  notification?: string | null;
};

export function LoyaltyCard({
  customer,
  settings,
  cardUrl,
  notification,
}: Props) {
  const required = settings.stampsRequired;
  const offer = getOfferSubtitle(required);
  const slots = Array.from({ length: required + 1 }, (_, i) => i);
  const filled = customer.freeAvailable
    ? required
    : Math.min(customer.stamps, required);

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&ecc=M&data=${encodeURIComponent(cardUrl)}`;

  return (
    <article className="loyalty-card relative mx-auto w-full max-w-[400px] overflow-hidden rounded-[26px] bg-black text-white shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      {/* Header: logo + barber photo fading into black */}
      <div className="relative h-[210px] overflow-hidden sm:h-[230px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-barber.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[72%_center] grayscale contrast-[1.15] brightness-[0.92]"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/20 to-black" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent" />

        <div className="absolute left-3 top-3 z-10 h-[92px] w-[92px] overflow-hidden rounded-xl bg-black sm:left-4 sm:top-4 sm:h-[100px] sm:w-[100px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-gentlemen.png"
            alt="Gentlemen"
            className="h-full w-full object-cover object-center"
            style={{ transform: "scale(1.08)" }}
          />
        </div>
      </div>

      <div className="relative z-10 -mt-6 px-5 pb-8 text-center sm:px-7">
        <h1 className="font-display text-[2.35rem] font-bold leading-none tracking-tight sm:text-[2.75rem]">
          {settings.offerTitle}
        </h1>

        <p className="mt-3 text-[1.05rem] font-medium text-white/90 sm:text-xl">
          {offer.before}
          <span className="text-[var(--gold)]">{offer.highlight}</span>
        </p>

        {/* Progress stamps — matches design circles */}
        <div
          className="mt-8 flex items-start justify-between gap-1 px-0.5"
          style={{ direction: "ltr" }}
        >
          {slots.map((index) => {
            const isGift = index === required;
            const isFilled =
              index < filled || (isGift && customer.freeAvailable);

            return (
              <div
                key={index}
                className="flex min-w-0 flex-1 flex-col items-center"
              >
                <div
                  className={[
                    "flex items-center justify-center rounded-full border-[1.5px] transition duration-300",
                    required >= 4
                      ? "h-11 w-11 text-base sm:h-12 sm:w-12 sm:text-lg"
                      : "h-14 w-14 text-xl",
                    isFilled
                      ? isGift
                        ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)] scale-105"
                        : "border-white bg-white text-black"
                      : isGift
                        ? "border-[var(--gold)]/70 text-[var(--gold)]"
                        : "border-white text-white",
                  ].join(" ")}
                >
                  {isGift ? (
                    <GiftIcon
                      className={
                        required >= 4 ? "h-5 w-5" : "h-6 w-6"
                      }
                    />
                  ) : (
                    <span className="font-semibold tabular-nums">
                      {index + 1}
                    </span>
                  )}
                </div>

                <p
                  className={[
                    "mt-2 max-w-[4.6rem] text-center leading-snug",
                    required >= 4 ? "text-[9px] sm:text-[10px]" : "text-[11px]",
                    isGift ? "text-white/80" : "text-white/65",
                  ].join(" ")}
                >
                  {isGift ? (
                    <>
                      التحليقة {arabicFreeWord(required + 1)}{" "}
                      <span className="text-[var(--gold)]">مجاناً</span>
                    </>
                  ) : (
                    stampLabel(index, required)
                  )}
                </p>
              </div>
            );
          })}
        </div>

        {notification ? (
          <div className="mt-6 rounded-xl border border-[var(--gold)]/35 bg-[var(--gold)]/10 px-4 py-3 text-sm leading-relaxed text-[var(--gold)]">
            {notification}
          </div>
        ) : null}

        {/* QR block — same structure as design */}
        <div className="mt-8 border-t border-white/20 pt-7">
          <div className="mx-auto w-fit rounded-[4px] bg-white p-3.5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt="QR بطاقة الولاء"
              width={180}
              height={180}
              className="block h-[180px] w-[180px]"
            />
          </div>
          <p className="mt-5 font-mono text-[1.65rem] font-medium tracking-[0.28em] text-white sm:text-[1.85rem]">
            {customer.memberCode}
          </p>
        </div>
      </div>
    </article>
  );
}

function arabicFreeWord(n: number) {
  const map: Record<number, string> = {
    3: "الثالثة",
    4: "الرابعة",
    5: "الخامسة",
    6: "السادسة",
  };
  return map[n] || `${n}`;
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M20 7h-2.18A3 3 0 0 0 15 3c-1.27 0-2.4.8-2.82 2H12c-.42-1.2-1.55-2-2.82-2a3 3 0 0 0-2.82 4H4a1 1 0 0 0-1 1v3h18V8a1 1 0 0 0-1-1ZM9.18 7A1 1 0 0 1 8.2 5.2 1 1 0 1 1 9.18 7Zm5.64 0a1 1 0 1 1 .98-1.8 1 1 0 0 1-.98 1.8ZM3 12v8a1 1 0 0 0 1 1h7v-9H3Zm10 9h7a1 1 0 0 0 1-1v-8h-8v9Z" />
    </svg>
  );
}
