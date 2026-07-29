-- Waveman Tasks: proof submission and review

create table if not exists public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  worker_task_id uuid not null references public.worker_tasks(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  worker_id uuid not null references auth.users(id) on delete cascade,
  proof_text text,
  proof_url text,
  proof_image_path text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  review_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (worker_task_id)
);

create index if not exists task_submissions_worker_id_idx
  on public.task_submissions(worker_id);

create index if not exists task_submissions_task_id_idx
  on public.task_submissions(task_id);

create index if not exists task_submissions_status_idx
  on public.task_submissions(status);

alter table public.task_submissions enable row level security;

drop policy if exists "Workers can read their submissions"
  on public.task_submissions;

create policy "Workers can read their submissions"
on public.task_submissions
for select
to authenticated
using (auth.uid() = worker_id);

drop policy if exists "Review admins can read submissions"
  on public.task_submissions;

create policy "Review admins can read submissions"
on public.task_submissions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in (
        'super_admin',
        'task_manager',
        'proof_reviewer',
        'auditor'
      )
  )
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'task-proofs',
  'task-proofs',
  false,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Workers upload their task proofs"
  on storage.objects;

create policy "Workers upload their task proofs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'task-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Workers read their task proofs"
  on storage.objects;

create policy "Workers read their task proofs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'task-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Review admins read task proofs"
  on storage.objects;

create policy "Review admins read task proofs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'task-proofs'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in (
        'super_admin',
        'task_manager',
        'proof_reviewer',
        'auditor'
      )
  )
);

create or replace function public.submit_task_proof(
  p_worker_task_id uuid,
  p_proof_text text,
  p_proof_url text,
  p_proof_image_path text
)
returns public.task_submissions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_worker_task public.worker_tasks;
  v_submission public.task_submissions;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'You must be signed in to submit proof.';
  end if;

  select *
  into v_worker_task
  from public.worker_tasks
  where id = p_worker_task_id
    and worker_id = v_user_id
  for update;

  if not found then
    raise exception 'Worker task not found.';
  end if;

  if v_worker_task.status not in ('started', 'rejected') then
    raise exception 'This task cannot accept proof in its current state.';
  end if;

  if nullif(trim(coalesce(p_proof_text, '')), '') is null
     and nullif(trim(coalesce(p_proof_url, '')), '') is null
     and nullif(trim(coalesce(p_proof_image_path, '')), '') is null then
    raise exception 'Please submit text, a link, or a screenshot.';
  end if;

  insert into public.task_submissions (
    worker_task_id,
    task_id,
    worker_id,
    proof_text,
    proof_url,
    proof_image_path,
    status,
    review_notes,
    reviewed_by,
    submitted_at,
    reviewed_at,
    updated_at
  )
  values (
    v_worker_task.id,
    v_worker_task.task_id,
    v_user_id,
    nullif(trim(coalesce(p_proof_text, '')), ''),
    nullif(trim(coalesce(p_proof_url, '')), ''),
    nullif(trim(coalesce(p_proof_image_path, '')), ''),
    'pending',
    null,
    null,
    now(),
    null,
    now()
  )
  on conflict (worker_task_id)
  do update set
    proof_text = excluded.proof_text,
    proof_url = excluded.proof_url,
    proof_image_path = excluded.proof_image_path,
    status = 'pending',
    review_notes = null,
    reviewed_by = null,
    submitted_at = now(),
    reviewed_at = null,
    updated_at = now()
  returning *
  into v_submission;

  update public.worker_tasks
  set
    status = 'submitted',
    submitted_at = now(),
    updated_at = now()
  where id = v_worker_task.id;

  return v_submission;
end;
$$;

create or replace function public.review_task_submission(
  p_submission_id uuid,
  p_decision text,
  p_review_notes text
)
returns public.task_submissions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_submission public.task_submissions;
begin
  v_admin_id := auth.uid();

  if v_admin_id is null then
    raise exception 'You must be signed in.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where profiles.id = v_admin_id
      and profiles.role in (
        'super_admin',
        'task_manager',
        'proof_reviewer'
      )
  ) then
    raise exception 'You are not allowed to review submissions.';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected.';
  end if;

  if p_decision = 'rejected'
     and nullif(trim(coalesce(p_review_notes, '')), '') is null then
    raise exception 'A rejection reason is required.';
  end if;

  select *
  into v_submission
  from public.task_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Submission not found.';
  end if;

  if v_submission.status <> 'pending' then
    raise exception 'This submission has already been reviewed.';
  end if;

  update public.task_submissions
  set
    status = p_decision,
    review_notes = nullif(trim(coalesce(p_review_notes, '')), ''),
    reviewed_by = v_admin_id,
    reviewed_at = now(),
    updated_at = now()
  where id = p_submission_id
  returning *
  into v_submission;

  update public.worker_tasks
  set
    status = case
      when p_decision = 'approved' then 'approved'
      else 'rejected'
    end,
    completed_at = case
      when p_decision = 'approved' then now()
      else null
    end,
    updated_at = now()
  where id = v_submission.worker_task_id;

  return v_submission;
end;
$$;

revoke all on function public.submit_task_proof(uuid, text, text, text) from public;
grant execute on function public.submit_task_proof(uuid, text, text, text) to authenticated;

revoke all on function public.review_task_submission(uuid, text, text) from public;
grant execute on function public.review_task_submission(uuid, text, text) to authenticated;
