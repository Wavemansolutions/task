import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { createTaskAction } from './actions';
import {
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiFileText,
  FiImage,
  FiInfo,
  FiSend,
} from 'react-icons/fi';

const steps = [
  ['basic-info', 'Basic Info', 'Task details', FiInfo],
  ['reward-slots', 'Reward & Slots', 'Payment settings', FiDollarSign],
  ['proof-settings', 'Proof Settings', 'Proof requirements', FiFileText],
  ['social-banner', 'Social & Banner', 'Platform and thumbnail', FiImage],
  ['schedule', 'Schedule', 'Start and end time', FiCalendar],
  ['publish', 'Publish', 'Review task settings', FiCheckCircle],
] as const;

const inputClass =
  'h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100';
const textAreaClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100';

export default async function CreateTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const query = await searchParams;

  return (
    <AppShell userName="Task Money Admin" userRole="task_manager" isAdmin>
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-green-600">Admin workspace</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Create New Task</h1>
            <p className="mt-2 text-sm text-slate-500">Complete every section, review the settings, then publish or save as a draft.</p>
          </div>
          <Link href="/admin/tasks" className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:border-green-300 hover:text-green-700">
            Back to Tasks
          </Link>
        </header>

        {query.error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {decodeURIComponent(query.error)}
          </div>
        ) : null}
        {query.success ? (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            Task created successfully.
          </div>
        ) : null}

        <form action={createTaskAction} className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24">
            <p className="px-3 pb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Task setup</p>
            <nav className="space-y-1">
              {steps.map(([id, label, description, Icon], index) => (
                <a key={id} href={`#${id}`} className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-green-50">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-green-600 group-hover:text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-slate-900">{index + 1}. {label}</span>
                    <span className="block truncate text-xs text-slate-500">{description}</span>
                  </span>
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-6">
            <FormSection id="basic-info" icon={<FiInfo />} title="Basic Info" subtitle="Task details">
              <div className="grid gap-5">
                <Field label="Task title" required>
                  <input name="title" required minLength={3} placeholder="Like and share our Facebook post" className={inputClass} />
                </Field>
                <Field label="Description" required>
                  <textarea name="description" required rows={4} placeholder="Describe exactly what workers must do." className={textAreaClass} />
                </Field>
                <Field label="Step-by-step instructions">
                  <textarea name="instructions" required rows={5} placeholder={'1. Open the task link\n2. Complete the action\n3. Capture the required proof'} className={textAreaClass} />
                </Field>
                <Field label="Task destination link">
                  <input name="task_url" type="url" placeholder="https://example.com/post" className={inputClass} />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Task action" required>
                    <select name="type" required defaultValue="general" className={inputClass}>
                      <option value="general">General task</option>
                      <option value="follow">Follow</option>
                      <option value="like">Like</option>
                      <option value="comment">Comment</option>
                      <option value="share">Share</option>
                      <option value="subscribe">Subscribe</option>
                      <option value="join">Join group/channel</option>
                      <option value="visit">Visit website</option>
                      <option value="review">Write review</option>
                    </select>
                  </Field>
                  <Field label="Task category">
                    <input name="category" placeholder="Social media, review, traffic…" className={inputClass} />
                  </Field>
                </div>
              </div>
            </FormSection>

            <FormSection id="reward-slots" icon={<FiDollarSign />} title="Reward & Slots" subtitle="Payment settings">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Reward per approved worker (₦)" required>
                  <input name="reward_amount" type="number" required min="1" step="0.01" placeholder="50" className={inputClass} />
                </Field>
                <Field label="Number of available slots" required>
                  <input name="total_slots" type="number" required min="1" step="1" placeholder="20" className={inputClass} />
                </Field>
                <Field label="Reservation time (minutes)">
                  <input name="reservation_minutes" type="number" min="1" step="1" placeholder="30" className={inputClass} />
                </Field>
                <Field label="Minimum trust score">
                  <input name="minimum_trust_score" type="number" min="0" max="100" step="1" placeholder="0" className={inputClass} />
                </Field>
              </div>
            </FormSection>

            <FormSection id="proof-settings" icon={<FiFileText />} title="Proof Settings" subtitle="Proof requirements">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Primary proof type" required>
                  <select name="proof_type" required defaultValue="screenshot" className={inputClass}>
                    <option value="screenshot">Screenshot</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="text">Text response</option>
                    <option value="link">Proof link</option>
                  </select>
                </Field>
                <Field label="Maximum proof files">
                  <input name="max_proof_files" type="number" min="1" max="10" defaultValue="1" className={inputClass} />
                </Field>
                <Field label="Proof instructions" wide>
                  <textarea name="proof_instructions" rows={4} placeholder="Explain what must be visible in the submitted proof." className={textAreaClass} />
                </Field>
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                  <input type="checkbox" name="require_unique_proof" value="true" className="mt-1 h-4 w-4 accent-green-600" />
                  <span><span className="block text-sm font-black text-slate-900">Require unique proof</span><span className="mt-1 block text-xs leading-5 text-slate-500">Each worker must submit proof that belongs to their own account or device.</span></span>
                </label>
              </div>
            </FormSection>

            <FormSection id="social-banner" icon={<FiImage />} title="Social & Banner" subtitle="Platform and thumbnail">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Social platform" required>
                  <select name="social_platform" required defaultValue="general" className={inputClass}>
                    <option value="general">General / Other</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="x">X (Twitter)</option>
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                    <option value="telegram">Telegram</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="google">Google</option>
                    <option value="trustpilot">Trustpilot</option>
                  </select>
                </Field>
                <Field label="Thumbnail image URL">
                  <input name="thumbnail_url" type="url" placeholder="https://.../banner.jpg" className={inputClass} />
                </Field>
                <Field label="Banner headline" wide>
                  <input name="banner_headline" placeholder="Complete this task and earn" className={inputClass} />
                </Field>
              </div>
              <div className="mt-5 rounded-2xl border border-dashed border-green-300 bg-green-50 p-5">
                <p className="text-sm font-black text-green-900">Thumbnail behavior</p>
                <p className="mt-1 text-xs leading-5 text-green-800">When no custom thumbnail URL is supplied, Task Money automatically uses the generated thumbnail for the selected platform. The same thumbnail appears on the task card and full task-details page.</p>
              </div>
            </FormSection>

            <FormSection id="schedule" icon={<FiCalendar />} title="Schedule" subtitle="Start and end time">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Start date and time">
                  <input name="starts_at" type="datetime-local" className={inputClass} />
                </Field>
                <Field label="End date and time">
                  <input name="ends_at" type="datetime-local" className={inputClass} />
                </Field>
              </div>
            </FormSection>

            <FormSection id="publish" icon={<FiCheckCircle />} title="Publish" subtitle="Review task settings">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Task status" required>
                  <select name="status" defaultValue="draft" className={inputClass}>
                    <option value="draft">Save as draft</option>
                    <option value="active">Publish immediately</option>
                    <option value="paused">Save as paused</option>
                  </select>
                </Field>
                <Field label="Internal admin note">
                  <input name="admin_note" placeholder="Optional internal note" className={inputClass} />
                </Field>
              </div>
              <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
                <h3 className="font-black">Review before publishing</h3>
                <p className="mt-1 text-sm leading-6 text-slate-300">Confirm the destination link, worker reward, available slots, proof requirements and schedule. Published tasks become visible to eligible workers.</p>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link href="/admin/tasks" className="rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel</Link>
                <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-7 py-3 text-sm font-black text-white shadow-lg shadow-green-600/20 hover:bg-green-700">
                  <FiSend /> Save task
                </button>
              </div>
            </FormSection>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function FormSection({ id, icon, title, subtitle, children }: { id: string; icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-xl text-green-700">{icon}</span>
        <div><h2 className="text-xl font-black text-slate-950">{title}</h2><p className="mt-0.5 text-sm text-slate-500">{subtitle}</p></div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, required, wide, children }: { label: string; required?: boolean; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={wide ? 'sm:col-span-2' : ''}>
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}{required ? <span className="ml-1 text-red-500">*</span> : null}</span>
      {children}
    </label>
  );
}
