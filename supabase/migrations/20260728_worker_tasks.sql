-- Waveman Tasks: worker task reservation system

create table if not exists public.worker_tasks (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  status text not null default 'started'
    check (status in ('started', 'submitted', 'approved', 'rejected', 'cancelled')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (worker_id, task_id)
);

create index if not exists worker_tasks_worker_id_idx
  on public.worker_tasks(worker_id);

create index if not exists worker_tasks_task_id_idx
  on public.worker_tasks(task_id);

create index if not exists worker_tasks_status_idx
  on public.worker_tasks(status);

alter table public.worker_tasks enable row level security;

drop policy if exists "Workers can read their own task records"
  on public.worker_tasks;

create policy "Workers can read their own task records"
on public.worker_tasks
for select
to authenticated
using (auth.uid() = worker_id);

drop policy if exists "Task admins can read all worker task records"
  on public.worker_tasks;

create policy "Task admins can read all worker task records"
on public.worker_tasks
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

create or replace function public.start_worker_task(p_task_id uuid)
returns public.worker_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_task public.tasks;
  v_worker_task public.worker_tasks;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'You must be signed in to start a task.';
  end if;

  select *
  into v_task
  from public.tasks
  where id = p_task_id
  for update;

  if not found then
    raise exception 'Task not found.';
  end if;

  if coalesce(v_task.status, 'draft') <> 'active' then
    raise exception 'This task is not currently active.';
  end if;

  if coalesce(v_task.slots_available, 0) <= 0 then
    raise exception 'No worker slots are available for this task.';
  end if;

  if exists (
    select 1
    from public.worker_tasks
    where worker_id = v_user_id
      and task_id = p_task_id
  ) then
    raise exception 'You have already started this task.';
  end if;

  insert into public.worker_tasks (
    worker_id,
    task_id,
    status
  )
  values (
    v_user_id,
    p_task_id,
    'started'
  )
  returning *
  into v_worker_task;

  update public.tasks
  set slots_available = greatest(
    coalesce(slots_available, 0) - 1,
    0
  )
  where id = p_task_id;

  return v_worker_task;
end;
$$;

revoke all on function public.start_worker_task(uuid) from public;
grant execute on function public.start_worker_task(uuid) to authenticated;
