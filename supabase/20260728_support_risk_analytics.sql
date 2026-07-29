-- Waveman Tasks: support tickets, account controls, fraud flags, analytics

alter table public.profiles
add column if not exists account_status text not null default 'active'
check (account_status in ('active', 'suspended', 'restricted'));

alter table public.profiles
add column if not exists suspension_reason text;

alter table public.profiles
add column if not exists suspended_at timestamptz;

alter table public.profiles
add column if not exists suspended_by uuid
references auth.users(id)
on delete set null;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  category text not null default 'general'
    check (
      category in (
        'general',
        'task',
        'proof',
        'wallet',
        'withdrawal',
        'account'
      )
    ),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to uuid references auth.users(id) on delete set null,
  last_message_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null
    references public.support_tickets(id)
    on delete cascade,
  sender_id uuid not null
    references auth.users(id)
    on delete cascade,
  message text not null,
  is_staff boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.fraud_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reported_by uuid references auth.users(id) on delete set null,
  reason text not null,
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  evidence jsonb not null default '{}'::jsonb,
  resolution_notes text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_user_id_idx
  on public.support_tickets(user_id);

create index if not exists support_tickets_status_idx
  on public.support_tickets(status);

create index if not exists support_messages_ticket_id_idx
  on public.support_messages(ticket_id);

create index if not exists fraud_flags_user_id_idx
  on public.fraud_flags(user_id);

create index if not exists fraud_flags_status_idx
  on public.fraud_flags(status);

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.fraud_flags enable row level security;

drop policy if exists "Users can read own tickets"
  on public.support_tickets;

create policy "Users can read own tickets"
on public.support_tickets
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in (
        'super_admin',
        'support_admin',
        'auditor'
      )
  )
);

drop policy if exists "Users can read ticket messages"
  on public.support_messages;

create policy "Users can read ticket messages"
on public.support_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.support_tickets
    where support_tickets.id = support_messages.ticket_id
      and (
        support_tickets.user_id = auth.uid()
        or exists (
          select 1
          from public.profiles
          where profiles.id = auth.uid()
            and profiles.role in (
              'super_admin',
              'support_admin',
              'auditor'
            )
        )
      )
  )
);

drop policy if exists "Admins can read fraud flags"
  on public.fraud_flags;

create policy "Admins can read fraud flags"
on public.fraud_flags
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in (
        'super_admin',
        'support_admin',
        'auditor'
      )
  )
);

create or replace function public.create_support_ticket(
  p_subject text,
  p_category text,
  p_priority text,
  p_message text
)
returns public.support_tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_ticket public.support_tickets;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'You must be signed in.';
  end if;

  if nullif(trim(coalesce(p_subject, '')), '') is null then
    raise exception 'Subject is required.';
  end if;

  if nullif(trim(coalesce(p_message, '')), '') is null then
    raise exception 'Message is required.';
  end if;

  insert into public.support_tickets (
    user_id,
    subject,
    category,
    priority
  )
  values (
    v_user_id,
    trim(p_subject),
    p_category,
    p_priority
  )
  returning *
  into v_ticket;

  insert into public.support_messages (
    ticket_id,
    sender_id,
    message,
    is_staff
  )
  values (
    v_ticket.id,
    v_user_id,
    trim(p_message),
    false
  );

  return v_ticket;
end;
$$;

create or replace function public.reply_support_ticket(
  p_ticket_id uuid,
  p_message text
)
returns public.support_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_is_staff boolean;
  v_message public.support_messages;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'You must be signed in.';
  end if;

  if nullif(trim(coalesce(p_message, '')), '') is null then
    raise exception 'Message is required.';
  end if;

  select exists (
    select 1
    from public.profiles
    where profiles.id = v_user_id
      and profiles.role in ('super_admin', 'support_admin')
  )
  into v_is_staff;

  if not exists (
    select 1
    from public.support_tickets
    where id = p_ticket_id
      and (
        user_id = v_user_id
        or v_is_staff
      )
  ) then
    raise exception 'Ticket not found or access denied.';
  end if;

  insert into public.support_messages (
    ticket_id,
    sender_id,
    message,
    is_staff
  )
  values (
    p_ticket_id,
    v_user_id,
    trim(p_message),
    v_is_staff
  )
  returning *
  into v_message;

  update public.support_tickets
  set
    status = case
      when v_is_staff then 'in_progress'
      else status
    end,
    last_message_at = now(),
    updated_at = now()
  where id = p_ticket_id;

  return v_message;
end;
$$;

create or replace function public.update_support_ticket_status(
  p_ticket_id uuid,
  p_status text
)
returns public.support_tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.support_tickets;
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('super_admin', 'support_admin')
  ) then
    raise exception 'You are not allowed to update tickets.';
  end if;

  if p_status not in ('open', 'in_progress', 'resolved', 'closed') then
    raise exception 'Invalid ticket status.';
  end if;

  update public.support_tickets
  set
    status = p_status,
    resolved_at = case
      when p_status in ('resolved', 'closed') then now()
      else null
    end,
    updated_at = now()
  where id = p_ticket_id
  returning *
  into v_ticket;

  if not found then
    raise exception 'Ticket not found.';
  end if;

  return v_ticket;
end;
$$;

create or replace function public.set_user_account_status(
  p_user_id uuid,
  p_status text,
  p_reason text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
  ) then
    raise exception 'Only a super admin can change account status.';
  end if;

  if p_status not in ('active', 'suspended', 'restricted') then
    raise exception 'Invalid account status.';
  end if;

  if p_status <> 'active'
     and nullif(trim(coalesce(p_reason, '')), '') is null then
    raise exception 'A reason is required.';
  end if;

  update public.profiles
  set
    account_status = p_status,
    suspension_reason = case
      when p_status = 'active' then null
      else trim(p_reason)
    end,
    suspended_at = case
      when p_status = 'active' then null
      else now()
    end,
    suspended_by = case
      when p_status = 'active' then null
      else auth.uid()
    end
  where id = p_user_id
  returning *
  into v_profile;

  if not found then
    raise exception 'User profile not found.';
  end if;

  return v_profile;
end;
$$;

create or replace function public.create_fraud_flag(
  p_user_id uuid,
  p_reason text,
  p_severity text,
  p_evidence jsonb default '{}'::jsonb
)
returns public.fraud_flags
language plpgsql
security definer
set search_path = public
as $$
declare
  v_flag public.fraud_flags;
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('super_admin', 'support_admin')
  ) then
    raise exception 'You are not allowed to create fraud flags.';
  end if;

  insert into public.fraud_flags (
    user_id,
    reported_by,
    reason,
    severity,
    evidence
  )
  values (
    p_user_id,
    auth.uid(),
    trim(p_reason),
    p_severity,
    coalesce(p_evidence, '{}'::jsonb)
  )
  returning *
  into v_flag;

  return v_flag;
end;
$$;

revoke all on function public.create_support_ticket(text, text, text, text) from public;
grant execute on function public.create_support_ticket(text, text, text, text) to authenticated;

revoke all on function public.reply_support_ticket(uuid, text) from public;
grant execute on function public.reply_support_ticket(uuid, text) to authenticated;

revoke all on function public.update_support_ticket_status(uuid, text) from public;
grant execute on function public.update_support_ticket_status(uuid, text) to authenticated;

revoke all on function public.set_user_account_status(uuid, text, text) from public;
grant execute on function public.set_user_account_status(uuid, text, text) to authenticated;

revoke all on function public.create_fraud_flag(uuid, text, text, jsonb) from public;
grant execute on function public.create_fraud_flag(uuid, text, text, jsonb) to authenticated;
