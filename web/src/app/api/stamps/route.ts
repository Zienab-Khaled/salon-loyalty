import { NextResponse } from "next/server";
import { isStaffAuthenticated } from "@/lib/auth";
import { addStamp, redeemFree } from "@/lib/store";

export async function POST(request: Request) {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const memberCode = String(body.memberCode || "").trim();
    const action = String(body.action || "stamp");

    if (!memberCode) {
      return NextResponse.json({ error: "أدخل رقم العضوية" }, { status: 400 });
    }

    if (action === "redeem") {
      const result = await redeemFree(memberCode);
      return NextResponse.json(result);
    }

    const result = await addStamp(memberCode);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "ERROR";
    const map: Record<string, { status: number; error: string }> = {
      CUSTOMER_NOT_FOUND: { status: 404, error: "العميل غير موجود" },
      FREE_PENDING: {
        status: 400,
        error: "العميل عنده تحليقة مجانية — استخدمها أولاً",
      },
      TOO_SOON: {
        status: 429,
        error: "تم تسجيل تحليقة قبل قليل — انتظر دقيقة",
      },
      NO_FREE: { status: 400, error: "ما عنده تحليقة مجانية حالياً" },
    };
    const mapped = map[message] ?? { status: 500, error: "تعذر تنفيذ العملية" };
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
