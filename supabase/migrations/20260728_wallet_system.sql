-- Waveman Tasks: wallet and earnings ledger

create table if not exists public.worker_wallets (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null unique references auth.users(id) on delete cascade,
  balance numeric(14,2) not null default 0 check (balance >= 0),
  total_earned numeric(14,2) not null default 0 check (total_earned >= 0),
  total_withdrawn numeric(14,2) not null default 0 check (total_withdrawn >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.worker_wallets(id) on delete cascade,
  worker_id uuid not null references auth.users(id) on delete cascade,
  submission_id uuid references public.task_submissions(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  transaction_type text not null
    check (transaction_type in ('task_reward', 'withdrawal', 'adjustment', 'refund')),
  direction text not null
    check (direction in ('credit', 'debit')),
  amount numeric(14,2) not null check (amount > 0),
  description text,
  reference text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists wallet_transactions_worker_id_idx
  on public.wallet_transactions(worker_id);

create index if not exists wallet_transactions_wallet_id_idx
  on public.wallet_transactions(wallet_id);

create index if not exists wallet_transactions_created_at_idx
  on public.wallet_transactions(created_at desc);

create unique index if not exists wallet_transactions_submission_reward_uidx
  on public.wallet_transactions(submission_id)
  where transaction_type = 'task_reward'
    and submission_id is not null;

alter table public.worker_wallets enable row level security;
alter table public.wallet_transactions enable row level security;

drop policy if exists "Workers can read their wallet"
  on public.worker_wallets;

create policy "Workers can read their wallet"
on public.worker_wallets
for select
to authenticated
using (auth.uid() = worker_id);

drop policy if exists "Finance admins can read all wallets"
  on public.worker_wallets;

create policy "Finance admins can read all wallets"
on public.worker_wallets
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in (
        'super_admin',
        'finance_admin',
        'auditor'
      )
  )
);

drop policy if exists "Workers can read their wallet transactions"
  on public.wallet_transactions;

create policy "Workers can read their wallet transactions"
on public.wallet_transactions
for select
to authenticated
using (auth.uid() = worker_id);

drop policy if exists "Finance admins can read all wallet transactions"
  on public.wallet_transactions;

create policy "Finance admins can read all wallet transactions"
on public.wallet_transactions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in (
        'super_admin',
        'finance_admin',
        'auditor'
      )
  )
);

create or replace function public.ensure_worker_wallet(
  p_worker_id uuid
)
returns public.worker_wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.worker_wallets;
begin
  insert into public.worker_wallets (worker_id)
  values (p_worker_id)
  on conflict (worker_id)
  do update set worker_id = excluded.worker_id
  returning *
  into v_wallet;

  return v_wallet;
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
  v_task public.tasks;
  v_wallet public.worker_wallets;
  v_reward numeric(14,2);
  v_reference text;
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

  select *
  into v_task
  from public.tasks
  where id = v_submission.task_id;

  if not found then
    raise exception 'Task not found.';
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

  if p_decision = 'approved' then
    v_reward := coalesce(v_task.reward_amount, 0);

    if v_reward <= 0 then
      raise exception 'Task reward must be greater than zero.';
    end if;

    v_wallet := public.ensure_worker_wallet(
      v_submission.worker_id
    );

    v_reference := 'task-reward-' || v_submission.id::text;

    insert into public.wallet_transactions (
      wallet_id,
      worker_id,
      submission_id,
      task_id,
      transaction_type,
      direction,
      amount,
      description,
      reference,
      created_by
    )
    values (
      v_wallet.id,
      v_submission.worker_id,
      v_submission.id,
      v_submission.task_id,
      'task_reward',
      'credit',
      v_reward,
      'Reward for approved task: ' || coalesce(v_task.title, 'Task'),
      v_reference,
      v_admin_id
    )
    on conflict (reference) do nothing;

    if found then
      update public.worker_wallets
      set
        balance = balance + v_reward,
        total_earned = total_earned + v_reward,
        updated_at = now()
      where id = v_wallet.id;
    end if;
  end if;

  return v_submission;
end;
$$;

revoke all on function public.ensure_worker_wallet(uuid) from public;
grant execute on function public.ensure_worker_wallet(uuid) to authenticated;

revoke all on function public.review_task_submission(uuid, text, text) from public;
grant execute on function public.review_task_submission(uuid, text, text) to authenticated;
