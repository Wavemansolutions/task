import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { createTaskAction } from './actions';
import { FaFacebook, FaInstagram, FaTelegram, FaTiktok, FaWhatsapp, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { FiCalendar, FiCheckCircle, FiDollarSign, FiFileText, FiImage, FiInfo } from 'react-icons/fi';

export default async function CreateTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const query = await searchParams;
  const steps = [
    ['Basic Info', 'Task details', FiInfo],
    ['Reward & Slots', 'Payment settings', FiDollarSign],
    ['Proof Settings', 'Proof requirements', FiFileText],
    ['Social & Banner', 'Platform and thumbnail', FiImage],
    ['Schedule', 'Start and end time', FiCalendar],
    ['Publish', 'Review task settings', FiCheckCircle],
  ] as const;

  return (
    <AppShell userName="Task Money Admin" userRole="task_manager" isAdmin>
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-green-600">Admin workspace</p>
            <h1 className="mt-1 text-3xl font-black">Create New Task</h1>
            <p className="mt-2 text-sm text-slate-500">Create a social task for workers to complete.</p>
          </div>
          <Link href="/admin/tasks" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold">Back to Tasks</Link>
        </div>

        {query.error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{decodeURIComponent(query.error)}</div> : null}
        {query.success ? <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">Task created successfully.</div> : null}

        <form action={createTaskAction} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[250px_1fr]">
            <aside className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
              <div className="space-y-2">
                {steps.map(([label, description, Icon], index) => (
                  <div key={label} className={`flex items-center gap-3 rounded-xl p-3 ${index === 3 ? 'bg-green-100 text-green-900' : ''}`}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${index === 3 ? 'bg-green-600 text-white' : 'bg-white text-slate-600'}`}><Icon /></div>
                    <div><p className="text-sm font-bold">{label}</p><p className="text-xs text-slate-500">{description}</p></div>
                  </div>
                ))}
              </div>
            </aside>

            <section className="space-y-8 p-5 sm:p-7">
              <div>
                <h2 className="text-xl font-black">Basic Information</h2>
                <div className="mt-5 grid gap-5">
                  <label><span className="mb-2 block text-sm font-bold">Task title</span><input name="title" required minLength={3} placeholder="Like and share our Facebook post" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500" /></label>
                  <label><span className="mb-2 block text-sm font-bold">Description</span><textarea name="description" required rows={4} placeholder="Explain exactly what the worker must do." className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500" /></label>
                  <label><span className="mb-2 block text-sm font-bold">Instructions</span><textarea name="instructions" rows={4} placeholder="Step 1: Open the link..." className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500" /></label>
                  <label><span className="mb-2 block text-sm font-bold">Task link</span><input name="task_url" type="url" placeholder="https://example.com/post" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500" /></label>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-7">
                <h2 className="text-xl font-black">Social & Banner</h2>
                <p className="mt-1 text-sm text-slate-500">Select the task type. The card will automatically use matching platform styling.</p>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <label><span className="mb-2 block text-sm font-bold">Task type</span><select name="type" required defaultValue="general" className="w-full rounded-xl border border-slate-200 px-4 py-3"><option value="general">General</option><option value="like">Like</option><option value="follow">Follow</option><option value="comment">Comment</option><option value="share">Share</option><option value="subscribe">Subscribe</option><option value="join">Join Group</option><option value="visit">Visit Website</option><option value="review">Review</option></select></label>
                  <label><span className="mb-2 block text-sm font-bold">Proof required</span><select name="proof_type" defaultValue="screenshot" className="w-full rounded-xl border border-slate-200 px-4 py-3"><option value="screenshot">Screenshot</option><option value="image">Image</option><option value="video">Video</option><option value="text">Text response</option><option value="link">Proof link</option></select></label>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {[['Facebook',FaFacebook],['Instagram',FaInstagram],['X',FaXTwitter],['YouTube',FaYoutube],['TikTok',FaTiktok],['Telegram',FaTelegram],['WhatsApp',FaWhatsapp]].map(([label, Icon]: any) => (
                    <div key={label} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"><Icon />{label}</div>
                  ))}
                </div>

                <div className="relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-800 via-blue-700 to-blue-500 p-7 text-white">
                  <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-yellow-300/20" />
                  <div className="relative flex items-center gap-5"><div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 text-5xl"><FaFacebook /></div><div><p className="text-3xl font-black uppercase">Complete tasks</p><p className="text-3xl font-black uppercase text-yellow-300">Earn money</p><p className="mt-2 text-sm text-white/80">Automatic Task Money social thumbnail</p></div></div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-7">
                <h2 className="text-xl font-black">Reward, Slots & Schedule</h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <label><span className="mb-2 block text-sm font-bold">Reward per worker</span><input name="reward_amount" type="number" required min="1" step="0.01" defaultValue="50" className="w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
                  <label><span className="mb-2 block text-sm font-bold">Number of workers</span><input name="total_slots" type="number" required min="1" defaultValue="20" className="w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
                  <label><span className="mb-2 block text-sm font-bold">Start date</span><input name="starts_at" type="datetime-local" className="w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
                  <label><span className="mb-2 block text-sm font-bold">End date</span><input name="ends_at" type="datetime-local" className="w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
                  <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold">Status</span><select name="status" defaultValue="active" className="w-full rounded-xl border border-slate-200 px-4 py-3"><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option></select></label>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-6">
                <button type="submit" className="rounded-xl bg-green-600 px-7 py-3 font-bold text-white shadow-lg shadow-green-600/20 hover:bg-green-700">Create Task</button>
              </div>
            </section>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
