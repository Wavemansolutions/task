import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/notifications/actions";

type NotificationsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: notifications, error } =
    await supabase
      .from("notifications")
      .select(
        "id,title,message,type,link,is_read,created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

  const unreadCount = (notifications ?? []).filter(
    (notification) => !notification.is_read,
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Notifications
            </h1>
            <p className="mt-2 text-slate-400">
              {unreadCount} unread notification
              {unreadCount === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {unreadCount > 0 ? (
              <form action={markAllNotificationsRead}>
                <button className="rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-400">
                  Mark All Read
                </button>
              </form>
            ) : null}

            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium hover:bg-white/10"
            >
              Dashboard
            </Link>
          </div>
        </header>

        {query.message ? (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
            {query.message}
          </div>
        ) : null}

        {query.error || error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {query.error ?? error?.message}
          </div>
        ) : null}

        <section className="space-y-4">
          {(notifications ?? []).map((notification) => (
            <article
              key={notification.id}
              className={
                "rounded-2xl border p-5 " +
                (notification.is_read
                  ? "border-white/10 bg-white/5"
                  : "border-emerald-500/30 bg-emerald-500/10")
              }
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-bold">
                      {notification.title}
                    </h2>
                    {!notification.is_read ? (
                      <span className="rounded-full bg-emerald-500 px-2 py-1 text-xs font-bold text-slate-950">
                        New
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 leading-7 text-slate-300">
                    {notification.message}
                  </p>

                  <p className="mt-3 text-xs text-slate-500">
                    {new Date(
                      notification.created_at,
                    ).toLocaleString("en-NG")}
                  </p>
                </div>

                {!notification.is_read ? (
                  <form action={markNotificationRead}>
                    <input
                      type="hidden"
                      name="notification_id"
                      value={notification.id}
                    />
                    <input
                      type="hidden"
                      name="link"
                      value={
                        notification.link ??
                        "/notifications"
                      }
                    />
                    <button className="whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10">
                      {notification.link
                        ? "Open"
                        : "Mark Read"}
                    </button>
                  </form>
                ) : notification.link ? (
                  <Link
                    href={notification.link}
                    className="whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
                  >
                    Open
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        {(notifications ?? []).length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center text-slate-400">
            You have no notifications yet.
          </div>
        ) : null}
      </div>
    </main>
  );
}
