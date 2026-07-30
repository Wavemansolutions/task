import Link from "next/link";

export default function AdminRiskNavigation() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Link
        href="/admin/support"
        className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
      >
        <p className="text-2xl">🎧</p>
        <h3 className="mt-3 font-bold">Support Inbox</h3>
      </Link>

      <Link
        href="/admin/fraud"
        className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
      >
        <p className="text-2xl">🚨</p>
        <h3 className="mt-3 font-bold">Fraud Review</h3>
      </Link>

      <Link
        href="/admin/users"
        className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
      >
        <p className="text-2xl">👥</p>
        <h3 className="mt-3 font-bold">Account Controls</h3>
      </Link>
    </div>
  );
}
