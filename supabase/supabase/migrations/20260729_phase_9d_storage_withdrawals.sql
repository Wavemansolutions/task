-- WAVEMAN TASKS PHASE 9D
-- Direct proof storage, withdrawal requests, finance review, payout tracking,
-- worker wallet history, notifications, and audit-safe finance operations.

create extension if not exists pgcrypto;

-- ===============================================================
-- STORAGE BUCKET
-- ===============================================================
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
  15728640,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'application/pdf'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Worker path convention:
-- task-proofs/{worker_id}/{reservation_id}/{filename}

drop policy if exists "workers_upload_own_task_proofs"
on storage.objects;

create policy "workers_upload_own_task_proofs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'task-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "workers_read_own_task_proofs"
on storage.objects;

create policy "workers_read_own_task_proofs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'task-proofs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.current_user_is_admin(
      array[
        'super_admin',
        'proof_reviewer',
        'task_manager',
        'finance_admin',
        'auditor'
      ]
    )
  )
);

drop policy if exists "workers_delete_unsubmitted_task_proofs"
on storage.objects;

create policy "workers_delete_unsubmitted_task_proofs"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'task-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ===============================================================
-- PROOF STORAGE FIELDS
-- ===============================================================
alter table if exists public.proof_submissions
  add column if not exists storage_bucket text;

alter table if exists public.proof_submissions
  add column if not exists storage_path text;

alter table if exists public.proof_submissions
  add column if not exists original_filename text;

alter table if exists public.proof_submissions
  add column if not exists mime_type text;

alter table if exists public.proof_submissions
  add column if not exists file_size_bytes bigint;

-- ===============================================================
-- PAYOUT ACCOUNTS
-- ===============================================================
create table if not exists public.payout_accounts (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'bank',
  account_name text not null,
  account_number text not null,
  bank_name text not null,
  bank_code text,
  recipient_code text,
  is_default boolean not null default true,
  is_verified boolean not null default false,
  verification_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payout_provider_check check (
    provider in ('bank','mobile_money','manual')
  )
);

create unique index if not exists payout_accounts_worker_account_unique
on public.payout_accounts(worker_id, provider, account_number);

create index if not exists payout_accounts_worker_idx
on public.payout_accounts(worker_id, is_default desc);

-- ===============================================================
-- WITHDRAWAL REQUESTS
-- ===============================================================
create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references auth.users(id) on delete cascade,
  payout_account_id uuid not null
    references public.payout_accounts(id) on delete restrict,
  amount numeric(14,2) not null,
  fee_amount numeric(14,2) not null default 0,
  net_amount numeric(14,2) generated always as (amount - fee_amount) stored,
  currency text not null default 'NGN',
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  approved_at timestamptz,
  rejected_at timestamptz,
  paid_at timestamptz,
  payment_reference text,
  provider_response jsonb not null default '{}'::jsonb,
  idempotency_key text not null default gen_random_uuid()::text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint withdrawal_amount_positive check (amount > 0),
  constraint withdrawal_fee_nonnegative check (fee_amount >= 0),
  constraint withdrawal_net_positive check (amount - fee_amount > 0),
  constraint withdrawal_status_check check (
    status in (
      'pending',
      'under_review',
      'approved',
      'processing',
      'paid',
      'rejected',
      'cancelled',
      'failed'
    )
  )
);

create unique index if not exists withdrawal_requests_idempotency_unique
on public.withdrawal_requests(idempotency_key);

create index if not exists withdrawal_requests_worker_idx
on public.withdrawal_requests(worker_id, requested_at desc);

create index if not exists withdrawal_requests_queue_idx
on public.withdrawal_requests(status, requested_at);

-- ===============================================================
-- WITHDRAWAL EVENTS
-- ===============================================================
create table if not exists public.withdrawal_events (
  id uuid primary key default gen_random_uuid(),
  withdrawal_id uuid not null
    references public.withdrawal_requests(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  old_status text,
  new_status text,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists withdrawal_events_request_idx
on public.withdrawal_events(withdrawal_id, created_at desc);

-- ===============================================================
-- NOTIFICATIONS
-- ===============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notification_type_check check (
    type in ('info','success','warning','error','payment','task','review')
  )
);

create index if not exists notifications_user_idx
on public.notifications(user_id, read_at, created_at desc);

-- ===============================================================
-- UPDATED AT TRIGGERS
-- ===============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists payout_accounts_set_updated_at
on public.payout_accounts;

create trigger payout_accounts_set_updated_at
before update on public.payout_accounts
for each row execute function public.set_updated_at();

drop trigger if exists withdrawal_requests_set_updated_at
on public.withdrawal_requests;

create trigger withdrawal_requests_set_updated_at
before update on public.withdrawal_requests
for each row execute function public.set_updated_at();

-- ===============================================================
-- SAVE PAYOUT ACCOUNT
-- ===============================================================
create or replace function public.save_payout_account(
  p_account_name text,
  p_account_number text,
  p_bank_name text,
  p_bank_code text default null,
  p_provider text default 'bank'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_worker_id uuid := auth.uid();
  v_account_id uuid;
begin
  if v_worker_id is null then
    raise exception 'Authentication required.';
  end if;

  if nullif(trim(coalesce(p_account_name, '')), '') is null then
    raise exception 'Account name is required.';
  end if;

  if nullif(trim(coalesce(p_account_number, '')), '') is null then
    raise exception 'Account number is required.';
  end if;

  if nullif(trim(coalesce(p_bank_name, '')), '') is null then
    raise exception 'Bank name is required.';
  end if;

  update public.payout_accounts
  set is_default = false
  where worker_id = v_worker_id;

  insert into public.payout_accounts (
    worker_id,
    provider,
    account_name,
    account_number,
    bank_name,
    bank_code,
    is_default
  )
  values (
    v_worker_id,
    coalesce(nullif(trim(p_provider), ''), 'bank'),
    trim(p_account_name),
    trim(p_account_number),
    trim(p_bank_name),
    nullif(trim(coalesce(p_bank_code, '')), ''),
    true
  )
  on conflict (worker_id, provider, account_number)
  do update set
    account_name = excluded.account_name,
    bank_name = excluded.bank_name,
    bank_code = excluded.bank_code,
    is_default = true,
    updated_at = now()
  returning id into v_account_id;

  return v_account_id;
end;
$$;

-- ===============================================================
-- REQUEST WITHDRAWAL
-- ===============================================================
create or replace function public.request_withdrawal(
  p_amount numeric,
  p_payout_account_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_worker_id uuid := auth.uid();
  v_wallet public.wallets;
  v_request_id uuid;
  v_minimum numeric(14,2) := 1000;
begin
  if v_worker_id is null then
    raise exception 'Authentication required.';
  end if;

  if p_amount is null or p_amount < v_minimum then
    raise exception 'Minimum withdrawal is ₦%.', v_minimum;
  end if;

  if not exists (
    select 1
    from public.payout_accounts
    where id = p_payout_account_id
      and worker_id = v_worker_id
  ) then
    raise exception 'Payout account not found.';
  end if;

  select *
  into v_wallet
  from public.wallets
  where user_id = v_worker_id
  for update;

  if not found then
    raise exception 'Wallet not found.';
  end if;

  if v_wallet.available_balance < p_amount then
    raise exception 'Insufficient available balance.';
  end if;

  update public.wallets
  set
    available_balance = available_balance - p_amount,
    pending_balance = pending_balance + p_amount,
    updated_at = now()
  where user_id = v_worker_id;

  insert into public.withdrawal_requests (
    worker_id,
    payout_account_id,
    amount
  )
  values (
    v_worker_id,
    p_payout_account_id,
    p_amount
  )
  returning id into v_request_id;

  insert into public.wallet_ledger (
    worker_id,
    entry_type,
    amount,
    balance_after,
    reference_type,
    reference_id,
    description,
    created_by
  )
  select
    v_worker_id,
    'withdrawal',
    -p_amount,
    available_balance,
    'withdrawal',
    v_request_id,
    'Withdrawal requested',
    v_worker_id
  from public.wallets
  where user_id = v_worker_id;

  insert into public.withdrawal_events (
    withdrawal_id,
    actor_id,
    event_type,
    old_status,
    new_status,
    note
  )
  values (
    v_request_id,
    v_worker_id,
    'requested',
    null,
    'pending',
    'Worker requested a withdrawal'
  );

  insert into public.notifications (
    user_id,
    title,
    message,
    type,
    action_url
  )
  values (
    v_worker_id,
    'Withdrawal requested',
    'Your withdrawal request has been submitted for review.',
    'payment',
    '/wallet'
  );

  return v_request_id;
end;
$$;

-- ===============================================================
-- CLAIM WITHDRAWAL
-- ===============================================================
create or replace function public.claim_withdrawal_for_review(
  p_withdrawal_id uuid
)
returns public.withdrawal_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.withdrawal_requests;
begin
  if not public.current_user_is_admin(
    array['super_admin','finance_admin']
  ) then
    raise exception 'Finance permission required.';
  end if;

  update public.withdrawal_requests
  set
    status = 'under_review',
    reviewed_by = auth.uid(),
    reviewed_at = now()
  where id = p_withdrawal_id
    and status = 'pending'
  returning * into v_request;

  if not found then
    raise exception 'Withdrawal is unavailable or already claimed.';
  end if;

  insert into public.withdrawal_events (
    withdrawal_id,
    actor_id,
    event_type,
    old_status,
    new_status,
    note
  )
  values (
    p_withdrawal_id,
    auth.uid(),
    'claimed',
    'pending',
    'under_review',
    'Finance officer claimed request'
  );

  return v_request;
end;
$$;

-- ===============================================================
-- APPROVE WITHDRAWAL
-- ===============================================================
create or replace function public.approve_withdrawal(
  p_withdrawal_id uuid,
  p_review_note text default null
)
returns public.withdrawal_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.withdrawal_requests;
begin
  if not public.current_user_is_admin(
    array['super_admin','finance_admin']
  ) then
    raise exception 'Finance permission required.';
  end if;

  select *
  into v_request
  from public.withdrawal_requests
  where id = p_withdrawal_id
  for update;

  if not found then
    raise exception 'Withdrawal not found.';
  end if;

  if v_request.status not in ('pending','under_review') then
    raise exception 'Withdrawal cannot be approved from its current status.';
  end if;

  update public.withdrawal_requests
  set
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = coalesce(reviewed_at, now()),
    approved_at = now(),
    review_note = nullif(trim(coalesce(p_review_note, '')), '')
  where id = p_withdrawal_id
  returning * into v_request;

  insert into public.withdrawal_events (
    withdrawal_id,
    actor_id,
    event_type,
    old_status,
    new_status,
    note
  )
  values (
    p_withdrawal_id,
    auth.uid(),
    'approved',
    'under_review',
    'approved',
    p_review_note
  );

  insert into public.notifications (
    user_id,
    title,
    message,
    type,
    action_url
  )
  values (
    v_request.worker_id,
    'Withdrawal approved',
    'Your withdrawal has been approved and is awaiting payment.',
    'payment',
    '/wallet'
  );

  return v_request;
end;
$$;

-- ===============================================================
-- REJECT WITHDRAWAL AND REFUND
-- ===============================================================
create or replace function public.reject_withdrawal(
  p_withdrawal_id uuid,
  p_reason text
)
returns public.withdrawal_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.withdrawal_requests;
  v_wallet public.wallets;
begin
  if not public.current_user_is_admin(
    array['super_admin','finance_admin']
  ) then
    raise exception 'Finance permission required.';
  end if;

  if nullif(trim(coalesce(p_reason, '')), '') is null then
    raise exception 'A rejection reason is required.';
  end if;

  select *
  into v_request
  from public.withdrawal_requests
  where id = p_withdrawal_id
  for update;

  if not found then
    raise exception 'Withdrawal not found.';
  end if;

  if v_request.status not in ('pending','under_review','approved') then
    raise exception 'Withdrawal cannot be rejected from its current status.';
  end if;

  update public.wallets
  set
    available_balance = available_balance + v_request.amount,
    pending_balance = greatest(pending_balance - v_request.amount, 0),
    updated_at = now()
  where user_id = v_request.worker_id
  returning * into v_wallet;

  update public.withdrawal_requests
  set
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = coalesce(reviewed_at, now()),
    rejected_at = now(),
    review_note = trim(p_reason)
  where id = p_withdrawal_id
  returning * into v_request;

  insert into public.wallet_ledger (
    worker_id,
    entry_type,
    amount,
    balance_after,
    reference_type,
    reference_id,
    description,
    created_by
  )
  values (
    v_request.worker_id,
    'withdrawal_reversal',
    v_request.amount,
    v_wallet.available_balance,
    'withdrawal',
    v_request.id,
    'Rejected withdrawal returned to wallet',
    auth.uid()
  )
  on conflict do nothing;

  insert into public.withdrawal_events (
    withdrawal_id,
    actor_id,
    event_type,
    old_status,
    new_status,
    note
  )
  values (
    v_request.id,
    auth.uid(),
    'rejected',
    'under_review',
    'rejected',
    p_reason
  );

  insert into public.notifications (
    user_id,
    title,
    message,
    type,
    action_url
  )
  values (
    v_request.worker_id,
    'Withdrawal rejected',
    'Your withdrawal was rejected and the amount was returned to your wallet.',
    'warning',
    '/wallet'
  );

  return v_request;
end;
$$;

-- ===============================================================
-- MARK WITHDRAWAL PAID
-- ===============================================================
create or replace function public.mark_withdrawal_paid(
  p_withdrawal_id uuid,
  p_payment_reference text,
  p_provider_response jsonb default '{}'::jsonb
)
returns public.withdrawal_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.withdrawal_requests;
begin
  if not public.current_user_is_admin(
    array['super_admin','finance_admin']
  ) then
    raise exception 'Finance permission required.';
  end if;

  if nullif(trim(coalesce(p_payment_reference, '')), '') is null then
    raise exception 'Payment reference is required.';
  end if;

  select *
  into v_request
  from public.withdrawal_requests
  where id = p_withdrawal_id
  for update;

  if not found then
    raise exception 'Withdrawal not found.';
  end if;

  if v_request.status not in ('approved','processing') then
    raise exception 'Only approved or processing withdrawals can be paid.';
  end if;

  update public.wallets
  set
    pending_balance = greatest(pending_balance - v_request.amount, 0),
    lifetime_withdrawn = coalesce(lifetime_withdrawn, 0) + v_request.amount,
    updated_at = now()
  where user_id = v_request.worker_id;

  update public.withdrawal_requests
  set
    status = 'paid',
    paid_at = now(),
    payment_reference = trim(p_payment_reference),
    provider_response = coalesce(p_provider_response, '{}'::jsonb)
  where id = p_withdrawal_id
  returning * into v_request;

  insert into public.withdrawal_events (
    withdrawal_id,
    actor_id,
    event_type,
    old_status,
    new_status,
    note,
    metadata
  )
  values (
    v_request.id,
    auth.uid(),
    'paid',
    'approved',
    'paid',
    'Withdrawal marked as paid',
    jsonb_build_object(
      'payment_reference', p_payment_reference
    )
  );

  insert into public.notifications (
    user_id,
    title,
    message,
    type,
    action_url
  )
  values (
    v_request.worker_id,
    'Withdrawal paid',
    'Your withdrawal has been paid successfully.',
    'success',
    '/wallet'
  );

  return v_request;
end;
$$;

-- ===============================================================
-- WORKER WALLET VIEW
-- ===============================================================
create or replace view public.worker_wallet_summary
with (security_invoker = true)
as
select
  w.user_id,
  w.available_balance,
  w.pending_balance,
  w.lifetime_earned,
  w.lifetime_withdrawn,
  coalesce((
    select count(*)
    from public.withdrawal_requests wr
    where wr.worker_id = w.user_id
      and wr.status in ('pending','under_review','approved','processing')
  ), 0) as active_withdrawals
from public.wallets w;

-- ===============================================================
-- FINANCE QUEUE VIEW
-- ===============================================================
create or replace view public.admin_withdrawal_queue
with (security_invoker = true)
as
select
  wr.id,
  wr.worker_id,
  p.full_name as worker_name,
  p.phone,
  wr.amount,
  wr.fee_amount,
  wr.net_amount,
  wr.currency,
  wr.status,
  wr.requested_at,
  wr.reviewed_at,
  wr.review_note,
  wr.payment_reference,
  pa.account_name,
  pa.account_number,
  pa.bank_name,
  pa.bank_code,
  pa.is_verified
from public.withdrawal_requests wr
join public.payout_accounts pa
  on pa.id = wr.payout_account_id
left join public.profiles p
  on p.id = wr.worker_id;

-- ===============================================================
-- GRANTS
-- ===============================================================
grant execute on function public.save_payout_account(
  text,text,text,text,text
) to authenticated;

grant execute on function public.request_withdrawal(
  numeric,uuid
) to authenticated;

grant execute on function public.claim_withdrawal_for_review(
  uuid
) to authenticated;

grant execute on function public.approve_withdrawal(
  uuid,text
) to authenticated;

grant execute on function public.reject_withdrawal(
  uuid,text
) to authenticated;

grant execute on function public.mark_withdrawal_paid(
  uuid,text,jsonb
) to authenticated;

grant select on public.worker_wallet_summary to authenticated;
grant select on public.admin_withdrawal_queue to authenticated;

-- ===============================================================
-- RLS
-- ===============================================================
alter table public.payout_accounts enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.withdrawal_events enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "payout_accounts_owner_select"
on public.payout_accounts;

create policy "payout_accounts_owner_select"
on public.payout_accounts
for select
to authenticated
using (
  worker_id = auth.uid()
  or public.current_user_is_admin(
    array['super_admin','finance_admin','auditor']
  )
);

drop policy if exists "withdrawals_owner_select"
on public.withdrawal_requests;

create policy "withdrawals_owner_select"
on public.withdrawal_requests
for select
to authenticated
using (
  worker_id = auth.uid()
  or public.current_user_is_admin(
    array['super_admin','finance_admin','auditor']
  )
);

drop policy if exists "withdrawal_events_owner_select"
on public.withdrawal_events;

create policy "withdrawal_events_owner_select"
on public.withdrawal_events
for select
to authenticated
using (
  exists (
    select 1
    from public.withdrawal_requests wr
    where wr.id = withdrawal_id
      and (
        wr.worker_id = auth.uid()
        or public.current_user_is_admin(
          array['super_admin','finance_admin','auditor']
        )
      )
  )
);

drop policy if exists "notifications_owner_select"
on public.notifications;

create policy "notifications_owner_select"
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "notifications_owner_update"
on public.notifications;

create policy "notifications_owner_update"
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
