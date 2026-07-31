import { AppShell } from '@/components/layout/AppShell';
import Link from 'next/link';
import { FiArrowLeft, FiCheckCircle, FiExternalLink, FiUploadCloud } from 'react-icons/fi';
import { FaFacebook } from 'react-icons/fa';

export default function TaskDetailsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <Link href="/tasks" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-600">
          <FiArrowLeft /> Back to tasks
        </Link>

        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          <div className="bg-gradient-to-r from-blue-800 to-blue-500 p-8 text-white">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-4xl">
              <FaFacebook />
            </div>
            <p className="mt-7 text-sm font-semibold text-white/75">Facebook task</p>
            <h1 className="mt-2 text-3xl font-black">Like and share our Facebook post</h1>
            <p className="mt-3 max-w-2xl text-white/80">
              Open the supplied Facebook post, like it, share it publicly and submit a screenshot as proof.
            </p>
          </div>

          <div className="grid gap-7 p-6 lg:grid-cols-[1fr_320px]">
            <div>
              <h2 className="text-xl font-black">Instructions</h2>
              <div className="mt-5 space-y-4">
                {[
                  'Open the Facebook task link.',
                  'Like the post using your real account.',
                  'Share the post publicly.',
                  'Take a clear screenshot showing the completed action.',
                  'Upload your screenshot before the reservation expires.',
                ].map((item, index) => (
                  <div key={item} className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-black text-green-700">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-7 text-slate-600">{item}</p>
                  </div>
                ))}
              </div>

              <a href="#" className="mt-7 inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-bold text-blue-700">
                Open task link <FiExternalLink />
              </a>
            </div>

            <aside className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Reward</p>
              <p className="mt-1 text-3xl font-black">₦50</p>
              <p className="mt-6 text-sm text-slate-500">Proof required</p>
              <p className="mt-1 font-bold">Screenshot</p>
              <p className="mt-6 text-sm text-slate-500">Slots remaining</p>
              <p className="mt-1 font-bold">20</p>

              <button className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white">
                <FiCheckCircle /> Reserve Task
              </button>

              <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-sm font-bold text-slate-600">
                <FiUploadCloud /> Upload Proof
                <input type="file" className="hidden" />
              </label>
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
