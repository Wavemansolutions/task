
-- WAVEMAN TASKS V1 CONSOLIDATED REPAIR
-- Non-destructive and rerunnable.
-- Run the whole file once in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
alter table if exists public.profiles
  add column if not exists full_name text;

alter table if exists public.profiles
  add column if not exists phone text;

alter table if exists public.profiles
  add column if not exists role text default 'worker';

alter table if exists public.profiles
  add column if not exists trust_score integer default 100;

alter table if exists public.profiles
  add column if not exists account_status text default 'active';

alter table if exists public.profiles
  add column if not exists suspension_reason text;

alter table if exists public.profiles
  add column if not exists suspended_at timestamptz;

alter table if exists public.profiles
  add column if not exists suspended_by uuid;

update public.profiles
set role = coalesce(role, 'worker'),
    trust_score = coalesce(trust_score, 100),
    account_status = coalesce(account_status, 'active');

-- ------------------------------------------------------------
-- TASKS
-- ------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled task',
  description text not null default '',
  instructions text not null default '',
  platform text not null default 'general',
  type text not null default 'general',
  task_url text,
  reward_amount numeric(14,2) not null default 0,
  total_slots integer not null default 1,
  slots_available integer not null default 1,
  proof_instructions text,
  status text not null default 'draft',
  campaign_id uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks add column if not exists title text;
alter table public.tasks add column if not exists description text;
alter table public.tasks add column if not exists instructions text;
alter table public.tasks add column if not exists platform text;
alter table public.tasks add column if not exists type text;
alter table public.tasks add column if not exists task_url text;
alter table public.tasks add column if not exists reward_amount numeric(14,2);
alter table public.tasks add column if not exists total_slots integer;
alter table public.tasks add column if not exists slots_available integer;
alter table public.tasks add column if not exists proof_instructions text;
alter table public.tasks add column if not exists status text;
alter table public.tasks add column if not exists campaign_id uuid;
alter table public.tasks add column if not exists created_by uuid;
alter table public.tasks add column if not exists created_at timestamptz;
alter table public.tasks add column if not exists updated_at timestamptz;

update public.tasks
set title = coalesce(title, 'Untitled task'),
    description = coalesce(description, ''),
    instructions = coalesce(instructions, ''),
    platform = coalesce(platform, 'general'),
    type = coalesce(type, 'general'),
    reward_amount = coalesce(reward_amount, 0),
    total_slots = greatest(coalesce(total_slots, 1), 1),
    slots_available = greatest(coalesce(slots_available, total_slots, 1), 0),
    status = coalesce(status, 'draft'),
    created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now());

alter table public.tasks alter column type set default 'general';
alter table public.tasks alter column status set default 'draft';
alter table public.tasks alter column reward_amount set default 0;
alter table public.tasks alter column total_slots set default 1;
alter table public.tasks alter column slots_available set default 1;

-- ------------------------------------------------------------
-- WORKER TASK RESERVATIONS
-- ------------------------------------------------------------
create table if not exists public.worker_tasks (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  status text not null default 'started',
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(worker_id, task_id)
);

alter table public.worker_tasks add column if not exists worker_id uuid;
alter table public.worker_tasks add column if not exists task_id uuid;
alter table public.worker_tasks add column if not exists status text default 'started';
alter table public.worker_tasks add column if not exists started_at timestamptz default now();
alter table public.worker_tasks add column if not exists submitted_at timestamptz;
alter table public.worker_tasks add column if not exists completed_at timestamptz;
alter table public.worker_tasks add column if not exists created_at timestamptz default now();
alter table public.worker_tasks add column if not exists updated_at timestamptz default now();

-- ------------------------------------------------------------
-- SUBMISSIONS
-- ------------------------------------------------------------
create table if not exists public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  worker_task_id uuid references public.worker_tasks(id) on delete cascade,
  worker_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  proof_url text,
  proof_text text,
  status text not null default 'pending',
  review_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.task_submissions add column if not exists worker_task_id uuid;
alter table public.task_submissions add column if not exists worker_id uuid;
alter table public.task_submissions add column if not exists task_id uuid;
alter table public.task_submissions add column if not exists proof_url text;
alter table public.task_submissions add column if not exists proof_text text;
alter table public.task_submissions add column if not exists status text default 'pending';
alter table public.task_submissions add column if not exists review_notes text;
alter table public.task_submissions add column if not exists reviewed_by uuid;
alter table public.task_submissions add column if not exists reviewed_at timestamptz;
alter table public.task_submissions add column if not exists created_at timestamptz default now();
alter table public.task_submissions add column if not exists updated_at timestamptz default now();

-- ------------------------------------------------------------
-- WALLETS AND LEDGER
-- ------------------------------------------------------------
create table if not exists public.worker_wallets (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references auth.users(id) on delete cascade,
  balance numeric(14,2) not null default 0,
  total_earned numeric(14,2) not null default 0,
  total_withdrawn numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(worker_id)
);

alter table public.worker_wallets add column if not exists worker_id uuid;
alter table public.worker_wallets add column if not exists balance numeric(14,2) default 0;
alter table public.worker_wallets add column if not exists total_earned numeric(14,2) default 0;
alter table public.worker_wallets add column if not exists total_withdrawn numeric(14,2) default 0;
alter table public.worker_wallets add column if not exists created_at timestamptz default now();
alter table public.worker_wallets add column if not exists updated_at timestamptz default now();

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.worker_wallets(id) on delete cascade,
  worker_id uuid not null references auth.users(id) on delete cascade,
  submission_id uuid,
  task_id uuid,
  transaction_type text not null default 'adjustment',
  direction text not null default 'credit',
  amount numeric(14,2) not null default 0,
  description text,
  reference text not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(reference)
);

alter table public.wallet_transactions add column if not exists wallet_id uuid;
alter table public.wallet_transactions add column if not exists worker_id uuid;
alter table public.wallet_transactions add column if not exists submission_id uuid;
alter table public.wallet_transactions add column if not exists task_id uuid;
alter table public.wallet_transactions add column if not exists transaction_type text default 'adjustment';
alter table public.wallet_transactions add column if not exists direction text default 'credit';
alter table public.wallet_transactions add column if not exists amount numeric(14,2) default 0;
alter table public.wallet_transactions add column if not exists description text;
alter table public.wallet_transactions add column if not exists reference text;
alter table public.wallet_transactions add column if not exists created_by uuid;
alter table public.wallet_transactions add column if not exists created_at timestamptz default now();

-- ------------------------------------------------------------
-- WITHDRAWALS
-- ------------------------------------------------------------
create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.worker_wallets(id) on delete cascade,
  amount numeric(14,2) not null default 0,
  bank_name text not null default '',
  account_name text not null default '',
  account_number text not null default '',
  status text not null default 'pending',
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.withdrawal_requests add column if not exists worker_id uuid;
alter table public.withdrawal_requests add column if not exists wallet_id uuid;
alter table public.withdrawal_requests add column if not exists amount numeric(14,2) default 0;
alter table public.withdrawal_requests add column if not exists bank_name text default '';
alter table public.withdrawal_requests add column if not exists account_name text default '';
alter table public.withdrawal_requests add column if not exists account_number text default '';
alter table public.withdrawal_requests add column if not exists status text default 'pending';
alter table public.withdrawal_requests add column if not exists review_notes text;
alter table public.withdrawal_requests add column if not exists reviewed_by uuid;
alter table public.withdrawal_requests add column if not exists reviewed_at timestamptz;
alter table public.withdrawal_requests add column if not exists paid_at timestamptz;
alter table public.withdrawal_requests add column if not exists created_at timestamptz default now();
alter table public.withdrawal_requests add column if not exists updated_at timestamptz default now();

-- ------------------------------------------------------------
-- NOTIFICATIONS / ACTIVITY
-- ------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  message text not null default '',
  type text not null default 'info',
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null default '',
  entity_type text,
  entity_id uuid,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- SUPPORT / FRAUD
-- ------------------------------------------------------------
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null default '',
  category text not null default 'general',
  priority text not null default 'normal',
  status text not null default 'open',
  assigned_to uuid,
  last_message_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_tickets add column if not exists user_id uuid;
alter table public.support_tickets add column if not exists subject text default '';
alter table public.support_tickets add column if not exists category text default 'general';
alter table public.support_tickets add column if not exists priority text default 'normal';
alter table public.support_tickets add column if not exists status text default 'open';
alter table public.support_tickets add column if not exists assigned_to uuid;
alter table public.support_tickets add column if not exists last_message_at timestamptz default now();
alter table public.support_tickets add column if not exists resolved_at timestamptz;
alter table public.support_tickets add column if not exists created_at timestamptz default now();
alter table public.support_tickets add column if not exists updated_at timestamptz default now();

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null default '',
  is_staff boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.fraud_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reported_by uuid,
  reason text not null default '',
  severity text not null default 'medium',
  status text not null default 'open',
  evidence jsonb not null default '{}'::jsonb,
  resolution_notes text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fraud_flags add column if not exists user_id uuid;
alter table public.fraud_flags add column if not exists reported_by uuid;
alter table public.fraud_flags add column if not exists reason text default '';
alter table public.fraud_flags add column if not exists severity text default 'medium';
alter table public.fraud_flags add column if not exists status text default 'open';
alter table public.fraud_flags add column if not exists evidence jsonb default '{}'::jsonb;
alter table public.fraud_flags add column if not exists resolution_notes text;
alter table public.fraud_flags add column if not exists resolved_by uuid;
alter table public.fraud_flags add column if not exists resolved_at timestamptz;
alter table public.fraud_flags add column if not exists created_at timestamptz default now();
alter table public.fraud_flags add column if not exists updated_at timestamptz default now();

-- ------------------------------------------------------------
-- INDEXES (created only after all columns exist)
-- ------------------------------------------------------------
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_type_idx on public.tasks(type);
create index if not exists worker_tasks_worker_id_idx on public.worker_tasks(worker_id);
create index if not exists worker_tasks_task_id_idx on public.worker_tasks(task_id);
create index if not exists task_submissions_worker_id_idx on public.task_submissions(worker_id);
create index if not exists task_submissions_status_idx on public.task_submissions(status);
create index if not exists worker_wallets_worker_id_idx on public.worker_wallets(worker_id);
create index if not exists wallet_transactions_worker_id_idx on public.wallet_transactions(worker_id);
create index if not exists withdrawal_requests_worker_id_idx on public.withdrawal_requests(worker_id);
create index if not exists withdrawal_requests_status_idx on public.withdrawal_requests(status);
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists support_tickets_user_id_idx on public.support_tickets(user_id);
create index if not exists support_tickets_status_idx on public.support_tickets(status);
create index if not exists support_messages_ticket_id_idx on public.support_messages(ticket_id);
create index if not exists fraud_flags_user_id_idx on public.fraud_flags(user_id);
create index if not exists fraud_flags_status_idx on public.fraud_flags(status);

-- ------------------------------------------------------------
-- ENSURE A WALLET EXISTS FOR EVERY AUTH USER
-- ------------------------------------------------------------
insert into public.worker_wallets (worker_id)
select u.id
from auth.users u
where not exists (
  select 1
  from public.worker_wallets w
  where w.worker_id = u.id
);

-- ------------------------------------------------------------
-- BASIC RPCS
-- ------------------------------------------------------------
create or replace function public.ensure_worker_wallet()
returns public.worker_wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.worker_wallets;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;

  insert into public.worker_wallets(worker_id)
  values (auth.uid())
  on conflict (worker_id) do nothing;

  select *
  into v_wallet
  from public.worker_wallets
  where worker_id = auth.uid();

  return v_wallet;
end;
$$;

create or replace function public.start_worker_task(p_task_id uuid)
returns public.worker_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.worker_tasks;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;

  if not exists (
    select 1 from public.tasks
    where id = p_task_id
      and status = 'active'
      and slots_available > 0
  ) then
    raise exception 'Task is unavailable.';
  end if;

  insert into public.worker_tasks(worker_id, task_id)
  values (auth.uid(), p_task_id)
  on conflict (worker_id, task_id)
  do update set updated_at = now()
  returning * into v_row;

  update public.tasks
  set slots_available = greatest(slots_available - 1, 0),
      updated_at = now()
  where id = p_task_id
    and not exists (
      select 1 from public.worker_tasks wt
      where wt.worker_id = auth.uid()
        and wt.task_id = p_task_id
        and wt.id <> v_row.id
    );

  return v_row;
end;
$$;

grant execute on function public.ensure_worker_wallet() to authenticated;
grant execute on function public.start_worker_task(uuid) to authenticated;

-- ------------------------------------------------------------
-- RLS: enable, then add safe minimum policies
-- ------------------------------------------------------------
alter table public.worker_tasks enable row level security;
alter table public.task_submissions enable row level security;
alter table public.worker_wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

drop policy if exists "worker_tasks_own_select" on public.worker_tasks;
create policy "worker_tasks_own_select"
on public.worker_tasks for select to authenticated
using (worker_id = auth.uid());

drop policy if exists "submissions_own_select" on public.task_submissions;
create policy "submissions_own_select"
on public.task_submissions for select to authenticated
using (
  worker_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin','proof_reviewer','auditor')
  )
);

drop policy if exists "wallets_own_select" on public.worker_wallets;
create policy "wallets_own_select"
on public.worker_wallets for select to authenticated
using (
  worker_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin','finance_admin','auditor')
  )
);

drop policy if exists "transactions_own_select" on public.wallet_transactions;
create policy "transactions_own_select"
on public.wallet_transactions for select to authenticated
using (
  worker_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin','finance_admin','auditor')
  )
);

drop policy if exists "withdrawals_own_select" on public.withdrawal_requests;
create policy "withdrawals_own_select"
on public.withdrawal_requests for select to authenticated
using (
  worker_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin','finance_admin','auditor')
  )
);

drop policy if exists "notifications_own_select" on public.notifications;
create policy "notifications_own_select"
on public.notifications for select to authenticated
using (user_id = auth.uid());

drop policy if exists "support_own_select" on public.support_tickets;
create policy "support_own_select"
on public.support_tickets for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin','support_admin','auditor')
  )
);

-- ------------------------------------------------------------
-- FINAL DATABASE CHECK
-- ------------------------------------------------------------
select
  table_name,
  string_agg(column_name, ', ' order by ordinal_position) as columns
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'tasks',
    'worker_tasks',
    'task_submissions',
    'worker_wallets',
    'wallet_transactions',
    'withdrawal_requests',
    'notifications',
    'activity_logs',
    'support_tickets',
    'support_messages',
    'fraud_flags'
  )
group by table_name
order by table_name;
