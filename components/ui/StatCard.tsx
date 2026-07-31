export function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
          {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
        </div>
        <div className="rounded-2xl bg-green-50 p-3 text-green-600">{icon}</div>
      </div>
    </div>
  );
}
