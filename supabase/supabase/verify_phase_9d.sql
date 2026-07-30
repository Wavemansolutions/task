-- PHASE 9D VERIFICATION

select table_name
from information_schema.tables
where table_schema = 'public'
and table_name in (
  'payout_accounts',
  'withdrawal_requests',
  'withdrawal_events',
  'notifications'
)
order by table_name;

select routine_name
from information_schema.routines
where routine_schema = 'public'
and routine_name in (
  'save_payout_account',
  'request_withdrawal',
  'claim_withdrawal_for_review',
  'approve_withdrawal',
  'reject_withdrawal',
  'mark_withdrawal_paid'
)
order by routine_name;

select id, name, public, file_size_limit
from storage.buckets
where id = 'task-proofs';

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'withdrawal_requests'
order by ordinal_position;

select *
from public.admin_withdrawal_queue
limit 10;
