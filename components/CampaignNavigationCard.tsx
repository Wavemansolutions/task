import Link from 'next/link';

export default function CampaignNavigationCard() {
  return (
    <Link
      href="/admin/campaigns"
      className="block rounded-xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow"
    >
      <p className="text-sm text-gray-500">Operations</p>
      <h3 className="mt-1 text-lg font-semibold">Campaign Engine</h3>
      <p className="mt-2 text-sm text-gray-600">
        Create campaigns, control budgets, activate tasks, and track delivery.
      </p>
    </Link>
  );
}
