import { StaffPanel } from "@/components/StaffPanel";
import { StorageBanner } from "@/components/StorageBanner";
import Link from "next/link";

export default function StaffPage() {
  return (
    <main className="home-shell flex flex-1 flex-col px-4 py-6 sm:py-10">
      <div className="mx-auto mb-6 flex w-full max-w-lg items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-gentlemen.png"
            alt=""
            className="h-9 w-9 rounded-full object-cover ring-1 ring-white/15"
          />
          <span className="font-medium">Gentlemen</span>
        </Link>
        <span className="text-[11px] tracking-[0.2em] text-[var(--gold)]/80">
          STAFF
        </span>
      </div>
      <div className="mx-auto w-full max-w-lg">
        <StorageBanner />
      </div>
      <StaffPanel />
    </main>
  );
}
