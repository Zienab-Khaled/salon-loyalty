import { NextResponse } from "next/server";
import { isStaffAuthenticated } from "@/lib/auth";
import { recentVisits } from "@/lib/store";

export async function GET() {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const visits = await recentVisits(15);
  return NextResponse.json({ visits });
}
