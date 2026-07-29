-- Waveman Tasks: notifications and audit logs

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info'
    check (type in ('info', 'success', 'warning', 'error')),
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx
  on public.notifications(user_id);

create index if not exists notifications_is_read_idx
  on public.notifications(user_id, is_read);

create index if not exists notifications_created_at_idx
  on public.notifications(created_at desc);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_actor_id_idx
  on public.activity_logs(actor_id);

create index if not exists activity_logs_entity_idx
  on public.activity_logs(entity_type, entity_id);

create index if not exists activity_logs_created_at_idx
  on public.activity_logs(created_at desc);

alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists "Users can read their notifications"
  on public.notifications;

create policy "Users can read their notifications"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can update their notifications"
  on public.notifications;

create policy "Users can update their notifications"
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Admins can read activity logs"
  on public.activity_logs;

create policy "Admins can read activity logs"
on public.activity_logs
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
        'finance_admin',
        'support_admin',
        'auditor'
      )
  )
);

create or replace function public.create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text default 'info',
  p_link text default null
)
returns public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification public.notifications;
begin
  if p_user_id is null then
    raise exception 'User ID is required.';
  end if;

  if nullif(trim(coalesce(p_title, '')), '') is null then
    raise exception 'Notification title is required.';
  end if;

  if nullif(trim(coalesce(p_message, '')), '') is null then
    raise exception 'Notification message is required.';
  end if;

  if p_type not in ('info', 'success', 'warning', 'error') then
    raise exception 'Invalid notification type.';
  end if;

  insert into public.notifications (
    user_id,
    title,
    message,
    type,
    link
  )
  values (
    p_user_id,
    trim(p_title),
    trim(p_message),
    p_type,
    nullif(trim(coalesce(p_link, '')), '')
  )
  returning *
  into v_notification;

  return v_notification;
end;
$$;

create or replace function public.log_activity(
  p_action text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_description text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.activity_logs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_log public.activity_logs;
begin
  insert into public.activity_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    auth.uid(),
    trim(p_action),
    nullif(trim(coalesce(p_entity_type, '')), ''),
    p_entity_id,
    nullif(trim(coalesce(p_description, '')), ''),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning *
  into v_log;

  return v_log;
end;
$$;

create or replace function public.mark_notification_read(
  p_notification_id uuid
)
returns public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification public.notifications;
begin
  update public.notifications
  set is_read = true
  where id = p_notification_id
    and user_id = auth.uid()
  returning *
  into v_notification;

  if not found then
    raise exception 'Notification not found.';
  end if;

  return v_notification;
end;
$$;

create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.notifications
  set is_read = true
  where user_id = auth.uid()
    and is_read = false;

  get diagnostics v_count = row_count;

  return v_count;
end;
$$;

revoke all on function public.create_notification(uuid, text, text, text, text) from public;
grant execute on function public.create_notification(uuid, text, text, text, text) to authenticated;

revoke all on function public.log_activity(text, text, uuid, text, jsonb) from public;
grant execute on function public.log_activity(text, text, uuid, text, jsonb) to authenticated;

revoke all on function public.mark_notification_read(uuid) from public;
grant execute on function public.mark_notification_read(uuid) to authenticated;

revoke all on function public.mark_all_notifications_read() from public;
grant execute on function public.mark_all_notifications_read() to authenticated;
