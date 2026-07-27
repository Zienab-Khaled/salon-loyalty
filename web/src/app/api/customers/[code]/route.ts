import { NextResponse } from "next/server";
import { getCustomerByCode, getSettings } from "@/lib/store";

type Params = { params: Promise<{ code: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { code } = await params;
  const customer = await getCustomerByCode(code);
  if (!customer) {
    return NextResponse.json({ error: "البطاقة غير موجودة" }, { status: 404 });
  }
  const settings = await getSettings();
  return NextResponse.json({ customer, settings });
}
