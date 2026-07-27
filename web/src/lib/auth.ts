import { cookies } from "next/headers";
import { getStaffPin } from "./config";

export const STAFF_COOKIE = "gentlemen_staff";

export async function isStaffAuthenticated() {
  const jar = await cookies();
  return jar.get(STAFF_COOKIE)?.value === "1";
}

export function verifyStaffPin(pin: string) {
  return pin.trim() === getStaffPin();
}
