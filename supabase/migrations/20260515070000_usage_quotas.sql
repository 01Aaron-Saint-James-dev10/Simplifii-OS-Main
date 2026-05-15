-- Usage quota tracking for per-user API cost protection.
-- Each row is one API call. Monthly counts are derived via aggregate queries.
-- Quota enforcement runs in the serverless layer (api/_quota.js).

create table if not exists usage_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  endpoint      text not null,           -- e.g. 'tutor', 'score-essay'
  tokens_in     integer not null default 0,
  tokens_out    integer not null default 0,
  cost_usd      numeric(10, 6) not null default 0,
  created_at    timestamptz not null default now()
);

-- Index for fast monthly rollup per user
create index if not exists usage_events_user_month
  on usage_events (user_id, created_at);

-- RLS: users can only see their own usage
alter table usage_events enable row level security;

create policy "Users can read own usage"
  on usage_events for select
  using (auth.uid() = user_id);

-- Service role inserts on behalf of users (serverless functions use service key)
create policy "Service role can insert usage"
  on usage_events for insert
  with check (true);

-- Monthly quota view: rolling 30-day cost per user
create or replace view user_monthly_usage as
select
  user_id,
  count(*)                          as call_count,
  sum(tokens_in)                    as total_tokens_in,
  sum(tokens_out)                   as total_tokens_out,
  round(sum(cost_usd)::numeric, 4)  as total_cost_usd
from usage_events
where created_at >= now() - interval '30 days'
group by user_id;
