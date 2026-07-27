import { NextResponse } from "next/server";
import { STAFF_COOKIE, verifyStaffPin } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const pin = String(body.pin || "");

  if (!verifyStaffPin(pin)) {
    return NextResponse.json({ error: "الرمز غير صحيح" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(STAFF_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(STAFF_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
