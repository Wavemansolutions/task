-- Waveman Tasks: withdrawal request system

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.worker_wallets(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  bank_name text not null,
  account_name text not null,
  account_number text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'paid')),
  review_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists withdrawal_requests_worker_id_idx
  on public.withdrawal_requests(worker_id);

create index if not exists withdrawal_requests_status_idx
  on public.withdrawal_requests(status);

create index if not exists withdrawal_requests_created_at_idx
  on public.withdrawal_requests(created_at desc);

alter table public.withdrawal_requests enable row level security;

drop policy if exists "Workers can read their withdrawals"
  on public.withdrawal_requests;

create policy "Workers can read their withdrawals"
on public.withdrawal_requests
for select
to authenticated
using (auth.uid() = worker_id);

drop policy if exists "Finance admins can read all withdrawals"
  on public.withdrawal_requests;

create policy "Finance admins can read all withdrawals"
on public.withdrawal_requests
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

create or replace function public.create_withdrawal_request(
  p_amount numeric,
  p_bank_name text,
  p_account_name text,
  p_account_number text
)
returns public.withdrawal_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_wallet public.worker_wallets;
  v_request public.withdrawal_requests;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'You must be signed in.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Withdrawal amount must be greater than zero.';
  end if;

  if p_amount < 1000 then
    raise exception 'Minimum withdrawal is ₦1,000.';
  end if;

  if nullif(trim(coalesce(p_bank_name, '')), '') is null then
    raise exception 'Bank name is required.';
  end if;

  if nullif(trim(coalesce(p_account_name, '')), '') is null then
    raise exception 'Account name is required.';
  end if;

  if nullif(trim(coalesce(p_account_number, '')), '') is null then
    raise exception 'Account number is required.';
  end if;

  if trim(p_account_number) !~ '^[0-9]{10}$' then
    raise exception 'Account number must contain exactly 10 digits.';
  end if;

  select *
  into v_wallet
  from public.worker_wallets
  where worker_id = v_user_id
  for update;

  if not found then
    raise exception 'Wallet not found.';
  end if;

  if exists (
    select 1
    from public.withdrawal_requests
    where worker_id = v_user_id
      and status in ('pending', 'approved')
  ) then
    raise exception 'You already have an active withdrawal request.';
  end if;

  if v_wallet.balance < p_amount then
    raise exception 'Insufficient wallet balance.';
  end if;

  insert into public.withdrawal_requests (
    worker_id,
    wallet_id,
    amount,
    bank_name,
    account_name,
    account_number
  )
  values (
    v_user_id,
    v_wallet.id,
    round(p_amount, 2),
    trim(p_bank_name),
    trim(p_account_name),
    trim(p_account_number)
  )
  returning *
  into v_request;

  return v_request;
end;
$$;

create or replace function public.review_withdrawal_request(
  p_request_id uuid,
  p_decision text,
  p_review_notes text
)
returns public.withdrawal_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_request public.withdrawal_requests;
  v_wallet public.worker_wallets;
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
        'finance_admin'
      )
  ) then
    raise exception 'You are not allowed to review withdrawals.';
  end if;

  if p_decision not in ('approved', 'rejected', 'paid') then
    raise exception 'Decision must be approved, rejected, or paid.';
  end if;

  select *
  into v_request
  from public.withdrawal_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Withdrawal request not found.';
  end if;

  if p_decision in ('approved', 'rejected')
     and v_request.status <> 'pending' then
    raise exception 'Only pending requests can be approved or rejected.';
  end if;

  if p_decision = 'paid'
     and v_request.status <> 'approved' then
    raise exception 'Only approved requests can be marked paid.';
  end if;

  if p_decision = 'rejected'
     and nullif(trim(coalesce(p_review_notes, '')), '') is null then
    raise exception 'A rejection reason is required.';
  end if;

  if p_decision = 'approved' then
    select *
    into v_wallet
    from public.worker_wallets
    where id = v_request.wallet_id
    for update;

    if not found then
      raise exception 'Wallet not found.';
    end if;

    if v_wallet.balance < v_request.amount then
      raise exception 'Worker wallet no longer has enough balance.';
    end if;

    v_reference := 'withdrawal-' || v_request.id::text;

    insert into public.wallet_transactions (
      wallet_id,
      worker_id,
      transaction_type,
      direction,
      amount,
      description,
      reference,
      created_by
    )
    values (
      v_wallet.id,
      v_request.worker_id,
      'withdrawal',
      'debit',
      v_request.amount,
      'Approved withdrawal request',
      v_reference,
      v_admin_id
    )
    on conflict (reference) do nothing;

    if found then
      update public.worker_wallets
      set
        balance = balance - v_request.amount,
        total_withdrawn = total_withdrawn + v_request.amount,
        updated_at = now()
      where id = v_wallet.id;
    end if;
  end if;

  update public.withdrawal_requests
  set
    status = p_decision,
    review_notes = nullif(trim(coalesce(p_review_notes, '')), ''),
    reviewed_by = v_admin_id,
    reviewed_at = case
      when p_decision in ('approved', 'rejected') then now()
      else reviewed_at
    end,
    paid_at = case
      when p_decision = 'paid' then now()
      else paid_at
    end,
    updated_at = now()
  where id = p_request_id
  returning *
  into v_request;

  return v_request;
end;
$$;

revoke all on function public.create_withdrawal_request(numeric, text, text, text) from public;
grant execute on function public.create_withdrawal_request(numeric, text, text, text) to authenticated;

revoke all on function public.review_withdrawal_request(uuid, text, text) from public;
grant execute on function public.review_withdrawal_request(uuid, text, text) to authenticated;
