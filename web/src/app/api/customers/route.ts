import { NextResponse } from "next/server";
import { createCustomer, getCustomerByPhone, getSettings } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();

    if (name.length < 2) {
      return NextResponse.json({ error: "الاسم قصير جداً" }, { status: 400 });
    }
    if (phone.length < 8) {
      return NextResponse.json(
        { error: "رقم الجوال غير صحيح" },
        { status: 400 }
      );
    }

    const existing = await getCustomerByPhone(phone);
    const customer = existing ?? (await createCustomer({ name, phone }));
    const settings = await getSettings();

    return NextResponse.json({
      customer,
      settings,
      existing: Boolean(existing),
    });
  } catch {
    return NextResponse.json({ error: "تعذر التسجيل" }, { status: 500 });
  }
}
