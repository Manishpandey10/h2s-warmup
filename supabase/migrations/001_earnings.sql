-- Run manually in Supabase SQL Editor. No sample records or admin/service key required.
begin;

create table public.earnings (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  work_date date not null check (work_date between date '2000-01-01' and date '2099-12-31'),
  received_paise integer not null check (received_paise between 0 and 100000000),
  expense_paise integer not null check (expense_paise between 0 and 100000000),
  pending_paise integer not null check (pending_paise between 0 and 100000000),
  minutes_worked integer not null check (minutes_worked between 0 and 1440),
  note text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  constraint nonempty_earning check (received_paise::bigint + expense_paise + pending_paise + minutes_worked > 0)
);

create index earnings_user_date_idx on public.earnings (user_id, work_date desc, created_at desc, id);
alter table public.earnings enable row level security;
revoke all on public.earnings from anon, authenticated;
grant select, delete on public.earnings to authenticated;
grant insert (id, user_id, work_date, received_paise, expense_paise, pending_paise, minutes_worked, note)
  on public.earnings to authenticated;
grant update (work_date, received_paise, expense_paise, pending_paise, minutes_worked, note)
  on public.earnings to authenticated;

create policy earnings_select_own on public.earnings for select to authenticated
  using ((select auth.uid()) = user_id);
create policy earnings_insert_own on public.earnings for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy earnings_update_own on public.earnings for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy earnings_delete_own on public.earnings for delete to authenticated
  using ((select auth.uid()) = user_id);

create function public.earnings_month_summary(p_month date)
returns table (received_paise bigint, expense_paise bigint, pending_paise bigint, minutes_worked bigint)
language sql stable security invoker set search_path = '' as $$
  select coalesce(sum(e.received_paise), 0), coalesce(sum(e.expense_paise), 0),
    coalesce(sum(e.pending_paise), 0), coalesce(sum(e.minutes_worked), 0)
  from public.earnings e
  where e.user_id = (select auth.uid())
    and e.work_date >= date_trunc('month', p_month)::date
    and e.work_date < (date_trunc('month', p_month) + interval '1 month')::date;
$$;
revoke all on function public.earnings_month_summary(date) from public, anon;
grant execute on function public.earnings_month_summary(date) to authenticated;

commit;
