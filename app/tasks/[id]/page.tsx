import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { FiArrowLeft, FiCalendar, FiCheckCircle, FiClock, FiExternalLink, FiFileText, FiShield, FiUsers } from 'react-icons/fi';
import { AppShell } from '@/components/layout/AppShell';
import { createClient } from '@/utils/supabase/server';
import { detectTaskPlatform, generatedTaskThumbnail } from '@/lib/task-platform';
import { startTask } from '@/app/tasks/actions';

type Task = {
  id:string; title:string; description:string|null; instructions:string; type:string|null; task_url:string|null;
  proof_type:string|null; proof_instructions?:string|null; reward_amount:number|string|null; slots_available:number|null; total_slots:number|null;
  reservation_minutes:number|null; minimum_trust_score:number|null; starts_at:string|null; ends_at:string|null; status:string|null;
  social_platform?:string|null; thumbnail_url?:string|null; banner_headline?:string|null;
};

function instructionLines(value: string) {
  return value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
}

function formatDate(value?: string|null) {
  if (!value) return 'Not specified';
  return new Intl.DateTimeFormat('en-NG',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
}

export default async function TaskDetailsPage({ params, searchParams }: { params:Promise<{id:string}>; searchParams:Promise<{error?:string;message?:string}> }) {
  const { id } = await params;
  const notices = await searchParams;
  const supabase = await createClient();
  const { data:{user} } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data:profile } = await supabase.from('profiles').select('full_name,role').eq('id',user.id).maybeSingle();
  const enhanced = await supabase.from('tasks').select('id,title,description,instructions,type,task_url,proof_type,proof_instructions,reward_amount,slots_available,total_slots,reservation_minutes,minimum_trust_score,starts_at,ends_at,status,social_platform,thumbnail_url,banner_headline').eq('id',id).maybeSingle();
  let task = enhanced.data as Task|null;
  let error = enhanced.error;
  if (error && /column .* does not exist|schema cache/i.test(error.message)) {
    const fallback = await supabase.from('tasks').select('id,title,description,instructions,type,task_url,proof_type,reward_amount,slots_available,total_slots,reservation_minutes,minimum_trust_score,starts_at,ends_at,status').eq('id',id).maybeSingle();
    task = fallback.data as Task|null; error = fallback.error;
  }
  if (error || !task) notFound();

  const { data:workerTask } = await supabase.from('worker_tasks').select('id,status').eq('task_id',id).eq('user_id',user.id).maybeSingle();
  const role=profile?.role??'worker';
  const isAdmin=['super_admin','admin','task_manager','proof_reviewer','finance_admin','support_admin','auditor'].includes(role);
  const platform=detectTaskPlatform(task);
  const thumbnail=task.thumbnail_url || generatedTaskThumbnail(platform);
  const lines=instructionLines(task.instructions || '');

  return <AppShell userName={profile?.full_name||user.email?.split('@')[0]||'Worker'} userRole={role} isAdmin={isAdmin}>
    <div className="mx-auto max-w-6xl space-y-5">
      <Link href="/tasks" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-green-700"><FiArrowLeft/> Back to tasks</Link>
      {notices.error?<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{notices.error}</div>:null}
      {notices.message?<div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">{notices.message}</div>:null}

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative aspect-[16/6] min-h-64 overflow-hidden bg-slate-900">
          <img src={thumbnail} alt={`${task.title} thumbnail`} className="h-full w-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
            <div className="flex flex-wrap gap-2"><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold capitalize backdrop-blur">{platform}</span><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold capitalize backdrop-blur">{task.type||'general'}</span></div>
            <h1 className="mt-3 max-w-4xl text-3xl font-black sm:text-4xl">{task.title}</h1>
            {task.banner_headline?<p className="mt-2 font-bold text-green-300">{task.banner_headline}</p>:null}
          </div>
        </div>

        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_340px]">
          <main className="space-y-8">
            <section><h2 className="text-xl font-black">Task details</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{task.description||'No additional description was provided.'}</p></section>
            <section><h2 className="text-xl font-black">Instructions</h2><div className="mt-4 space-y-3">{lines.length?lines.map((line,index)=><div key={`${index}-${line}`} className="flex gap-3 rounded-2xl bg-slate-50 p-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-black text-green-700">{index+1}</span><p className="whitespace-pre-line text-sm leading-7 text-slate-700">{line}</p></div>):<p className="text-sm text-slate-500">No instructions available.</p>}</div></section>
            <section><h2 className="text-xl font-black">Proof requirements</h2><div className="mt-4 rounded-2xl border border-slate-200 p-5"><p className="flex items-center gap-2 font-bold capitalize"><FiFileText className="text-green-600"/> {task.proof_type||'Proof submission'}</p><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{task.proof_instructions||'Follow the task instructions and submit clear evidence showing the completed action.'}</p></div></section>
            {task.task_url?<a href={task.task_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-green-600 px-5 py-3 font-bold text-green-700 hover:bg-green-50">Open task destination <FiExternalLink/></a>:null}
          </main>

          <aside className="h-fit rounded-2xl bg-slate-50 p-5 lg:sticky lg:top-24">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white p-4"><p className="text-xs text-slate-500">Reward</p><p className="mt-1 text-2xl font-black">₦{Number(task.reward_amount||0).toLocaleString('en-NG')}</p></div>
              <div className="rounded-xl bg-white p-4"><p className="text-xs text-slate-500">Slots left</p><p className="mt-1 text-2xl font-black">{Number(task.slots_available||0)}</p></div>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between gap-4"><dt className="flex items-center gap-2 text-slate-500"><FiClock/> Reservation</dt><dd className="font-bold">{task.reservation_minutes||60} min</dd></div>
              <div className="flex justify-between gap-4"><dt className="flex items-center gap-2 text-slate-500"><FiShield/> Trust score</dt><dd className="font-bold">{task.minimum_trust_score||0}</dd></div>
              <div className="flex justify-between gap-4"><dt className="flex items-center gap-2 text-slate-500"><FiUsers/> Total slots</dt><dd className="font-bold">{task.total_slots||0}</dd></div>
              <div className="border-t pt-4"><dt className="flex items-center gap-2 text-slate-500"><FiCalendar/> Starts</dt><dd className="mt-1 font-semibold">{formatDate(task.starts_at)}</dd></div>
              <div><dt className="flex items-center gap-2 text-slate-500"><FiCalendar/> Ends</dt><dd className="mt-1 font-semibold">{formatDate(task.ends_at)}</dd></div>
            </dl>

            {workerTask ? <Link href={`/tasks/${id}/submit`} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700"><FiCheckCircle/> {workerTask.status==='submitted'?'View submission':'Continue task'}</Link> : <form action={startTask} className="mt-6"><input type="hidden" name="task_id" value={id}/><button disabled={Number(task.slots_available||0)<=0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"><FiCheckCircle/> {Number(task.slots_available||0)>0?'Reserve task':'No slots available'}</button></form>}
          </aside>
        </div>
      </article>
    </div>
  </AppShell>;
}
