import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeleteTaskButton from "./components/DeleteTaskButton";

type AdminTasksPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

type TaskRecord = {
  id: string;
  title: string | null;
  platform: string | null;
  reward_amount: number | string | null;
  total_slots: number | null;
  slots_available: number | null;
  status: string | null;
  created_at: string | null;
};

const allowedAdminRoles = [
  "super_admin",
  "task_manager",
];

export default async function AdminTasksPage({
  searchParams,
}: AdminTasksPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    !allowedAdminRoles.includes(profile.role)
  ) {
    redirect("/dashboard");
  }

  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id,title,platform,reward_amount,total_slots,slots_available,status,created_at",
    )
    .order("created_at", { ascending: false });

  const tasks = (data ?? []) as TaskRecord[];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS ADMIN
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Task Management
            </h1>
          </div>

          <Link
            href="/admin/tasks/new"
            className="w-fit rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-400"
          >
            Create Task
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
          {tasks.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <h2 className="text-xl font-bold">
                No tasks created
              </h2>

              <p className="mt-2 text-slate-400">
                Create your first worker task.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead className="bg-white/5 text-sm text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Task</th>
                    <th className="px-6 py-4">Platform</th>
                    <th className="px-6 py-4">Reward</th>
                    <th className="px-6 py-4">Slots</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-t border-white/10"
                    >
                      <td className="px-6 py-4 font-medium">
                        {task.title ?? "Untitled task"}
                      </td>

                      <td className="px-6 py-4 capitalize text-slate-300">
                        {task.platform ?? "general"}
                      </td>

                      <td className="px-6 py-4 font-semibold text-emerald-400">
                        ₦
                        {Number(
                          task.reward_amount ?? 0,
                        ).toLocaleString("en-NG")}
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        {task.slots_available ?? 0}/
                        {task.total_slots ?? 0}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize">
                          {task.status ?? "draft"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {task.created_at
                          ? new Date(
                              task.created_at,
                            ).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Link
                            href={
                              "/admin/tasks/" +
                              task.id +
                              "/edit"
                            }
                            className="rounded-lg border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-500/20"
                          >
                            Edit
                          </Link>

                          <DeleteTaskButton
                            taskId={task.id}
                            taskTitle={
                              task.title ?? "this task"
                            }
                          />
                        </div>
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
