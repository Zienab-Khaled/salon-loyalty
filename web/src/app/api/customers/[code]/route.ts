import { NextResponse } from "next/server";
import { getCustomerByCode, getSettings, hasRedis, isVercelRuntime } from "@/lib/store";

type Params = { params: Promise<{ code: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { code } = await params;
  const customer = await getCustomerByCode(code);
  if (!customer) {
    const hint =
      isVercelRuntime() && !hasRedis()
        ? "قاعدة البيانات غير مربوطة — اربطي Upstash Redis من Vercel Storage"
        : "البطاقة غير موجودة. أنشئ البطاقة من جديد بعد ربط قاعدة البيانات";
    return NextResponse.json({ error: hint }, { status: 404 });
  }
  const settings = await getSettings();
  return NextResponse.json({ customer, settings });
}
