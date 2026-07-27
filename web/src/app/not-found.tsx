import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold text-white">البطاقة غير موجودة</h1>
      <p className="mt-3 text-white/55">تأكد من رقم العضوية أو أنشئ بطاقة جديدة</p>
      <Link href="/" className="btn-gold mt-8 inline-flex">
        العودة للتسجيل
      </Link>
    </main>
  );
}
