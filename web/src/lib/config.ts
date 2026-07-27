import type { Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  stampsRequired: 4,
  salonName: "Gentlemen",
  offerTitle: "ولاؤك يستحق",
};

export function getStaffPin() {
  return process.env.STAFF_PIN || "1234";
}

export function getOfferSubtitle(stampsRequired: number) {
  const paid = stampsRequired;
  const freeOrdinal = arabicOrdinal(paid + 1);
  return {
    before: `${arabicCount(paid)} وال${freeOrdinal} `,
    highlight: "مجاناً",
  };
}

function arabicCount(n: number) {
  const map: Record<number, string> = {
    2: "تحليقتين",
    3: "ثلاث تحليقات",
    4: "أربع تحليقات",
    5: "خمس تحليقات",
    6: "ست تحليقات",
  };
  return map[n] || `${n} تحليقات`;
}

function arabicOrdinal(n: number) {
  const map: Record<number, string> = {
    3: "ثالثة",
    4: "رابعة",
    5: "خامسة",
    6: "سادسة",
    7: "سابعة",
  };
  return map[n] || `${n}`;
}

export function stampLabel(index: number, stampsRequired: number) {
  if (index === stampsRequired) return "التحليقة المجانية";
  const labels = [
    "التحليقة الأولى",
    "التحليقة الثانية",
    "التحليقة الثالثة",
    "التحليقة الرابعة",
    "التحليقة الخامسة",
    "التحليقة السادسة",
  ];
  return labels[index] || `التحليقة ${index + 1}`;
}
