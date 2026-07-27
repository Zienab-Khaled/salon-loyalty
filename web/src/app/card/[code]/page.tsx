import { notFound } from "next/navigation";
import Link from "next/link";
import { CardClient } from "@/components/CardClient";
import { getCustomerByCode, getSettings } from "@/lib/store";

type Props = {
  params: Promise<{ code: string }>;
};

export default async function CardPage({ params }: Props) {
  const { code } = await params;
  const customer = await getCustomerByCode(code);
  if (!customer) notFound();
  const settings = await getSettings();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const base = siteUrl.replace(/\/$/, "");
  const cardUrl = `${base}/staff?code=${customer.memberCode}`;

  return (
    <main className="card-stage flex min-h-full flex-1 flex-col">
      <div className="flex items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="text-xs font-medium tracking-wide text-black/40 transition hover:text-black/70"
        >
          Gentlemen
        </Link>
        <Link
          href="/staff"
          className="text-xs font-medium text-black/35 transition hover:text-black/65"
        >
          للصالون
        </Link>
      </div>

      <div className="flex flex-1 items-start justify-center px-4 pb-10 pt-2 sm:items-center sm:pb-14">
        <CardClient
          code={customer.memberCode}
          initialCustomer={customer}
          initialSettings={settings}
          cardUrl={cardUrl}
        />
      </div>
    </main>
  );
}
