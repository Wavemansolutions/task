import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assignUserRole } from "@/app/admin/users/actions";

type AdminUsersPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

type ProfileRecord = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  account_status: string | null;
  created_at: string | null;
};

const roles = [
  {
    value: "worker",
    label: "Worker",
  },
  {
    value: "super_admin",
    label: "Super Admin",
  },
  {
    value: "task_manager",
    label: "Task Manager",
  },
  {
    value: "proof_reviewer",
    label: "Proof Reviewer",
  },
  {
    value: "finance_admin",
    label: "Finance Admin",
  },
  {
    value: "support_admin",
    label: "Support Admin",
  },
  {
    value: "auditor",
    label: "Auditor",
  },
];

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (currentProfile?.role !== "super_admin") {
    redirect(
      "/dashboard?error=Only+the+Super+Admin+can+manage+roles.",
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,full_name,phone,role,account_status,created_at",
    )
    .order("created_at", { ascending: false });

  const profiles = (data ?? []) as ProfileRecord[];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS ADMIN
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              User Role Management
            </h1>

            <p className="mt-2 text-slate-400">
              Assign staff permissions and administrator roles.
            </p>
          </div>

          <Link
            href="/admin/tasks"
            className="w-fit rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium hover:bg-white/10"
          >
            Task management
          </Link>
        </header>

        {params.message ? (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
            {params.message}
          </div>
        ) : null}

        {params.error || error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {params.error ?? error?.message}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {profiles.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No users were found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-white/5 text-sm text-slate-400">
                  <tr>
                    <th className="px-6 py-4">
                      User
                    </th>

                    <th className="px-6 py-4">
                      Phone
                    </th>

                    <th className="px-6 py-4">
                      Current role
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Assign role
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {profiles.map((profile) => (
                    <tr
                      key={profile.id}
                      className="border-t border-white/10"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold">
                          {profile.full_name ??
                            "Unnamed user"}
                        </p>

                        <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">
                          {profile.id}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        {profile.phone ?? "—"}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize">
                          {(
                            profile.role ?? "worker"
                          ).replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="px-6 py-4 capitalize text-slate-300">
                        {profile.account_status ??
                          "active"}
                      </td>

                      <td className="px-6 py-4">
                        <form
                          action={assignUserRole}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="hidden"
                            name="userId"
                            value={profile.id}
                          />

                          <select
                            name="role"
                            defaultValue={
                              profile.role ?? "worker"
                            }
                            className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                          >
                            {roles.map((role) => (
                              <option
                                key={role.value}
                                value={role.value}
                              >
                                {role.label}
                              </option>
                            ))}
                          </select>

                          <button
                            type="submit"
                            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400"
                          >
                            Save
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
