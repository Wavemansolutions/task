
-- Run this after the main migration.
select
  t.table_name,
  exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = t.table_name
      and c.column_name = t.required_column
  ) as required_column_exists,
  t.required_column
from (
  values
    ('tasks', 'type'),
    ('tasks', 'status'),
    ('worker_tasks', 'worker_id'),
    ('task_submissions', 'worker_id'),
    ('worker_wallets', 'worker_id'),
    ('withdrawal_requests', 'status'),
    ('support_tickets', 'status'),
    ('fraud_flags', 'status')
) as t(table_name, required_column)
order by t.table_name, t.required_column;
