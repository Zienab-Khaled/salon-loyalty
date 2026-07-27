import { NextResponse } from "next/server";
import { createCustomer, getCustomerByPhone } from "@/lib/store";

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

    return NextResponse.json({
      customer,
      existing: Boolean(existing),
    });
  } catch {
    return NextResponse.json({ error: "تعذر التسجيل" }, { status: 500 });
  }
}
