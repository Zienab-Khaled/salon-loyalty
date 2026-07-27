import type { Customer, Settings } from "./types";

const KEY = (code: string) => `gentlemen-card:${code}`;

export type CardCache = {
  customer: Customer;
  settings?: Settings;
};

export function saveCardCache(code: string, data: CardCache) {
  try {
    sessionStorage.setItem(KEY(code), JSON.stringify(data));
    localStorage.setItem(KEY(code), JSON.stringify(data));
  } catch {
    // private mode / quota
  }
}

export function readCardCache(code: string): CardCache | null {
  try {
    const raw =
      sessionStorage.getItem(KEY(code)) || localStorage.getItem(KEY(code));
    if (!raw) return null;
    return JSON.parse(raw) as CardCache;
  } catch {
    return null;
  }
}
