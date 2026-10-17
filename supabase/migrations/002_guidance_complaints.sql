-- Run after 001_earnings.sql. Publicly displayed test admin accounts can edit
-- only their own drafts, never worker records or approved guidance.
begin;

create table public.source_editors (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.source_editors enable row level security;
revoke all on public.source_editors from anon, authenticated;
grant select on public.source_editors to authenticated;
create policy editors_read_own on public.source_editors for select to authenticated
  using ((select auth.uid()) = user_id);

create table public.guidance_sources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  title text not null check (char_length(title) between 5 and 160),
  url text not null check (char_length(url) <= 1000 and url ~ '^https://([a-zA-Z0-9-]+\.)+(gov|nic)\.in([/?#]|$)'),
  category text not null check (category in ('schemes', 'rights', 'safety', 'documents')),
  content text not null check (char_length(content) between 30 and 3000),
  jurisdiction text not null check (char_length(jurisdiction) between 2 and 80),
  verified_on date not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);
create index guidance_category_idx on public.guidance_sources (category, status, verified_on desc);
alter table public.guidance_sources enable row level security;
revoke all on public.guidance_sources from anon, authenticated;
grant select on public.guidance_sources to authenticated;
grant insert (id, owner_id, title, url, category, content, jurisdiction, verified_on, status)
  on public.guidance_sources to authenticated;
grant update (title, url, category, content, jurisdiction, verified_on)
  on public.guidance_sources to authenticated;
create policy sources_read on public.guidance_sources for select to authenticated
  using (status = 'published' or (owner_id = (select auth.uid()) and exists (
    select 1 from public.source_editors where user_id = (select auth.uid()))));
create policy sources_insert_draft on public.guidance_sources for insert to authenticated
  with check (status = 'draft' and owner_id = (select auth.uid()) and exists (
    select 1 from public.source_editors where user_id = (select auth.uid())));
create policy sources_edit_own_draft on public.guidance_sources for update to authenticated
  using (status = 'draft' and owner_id = (select auth.uid()) and exists (
    select 1 from public.source_editors where user_id = (select auth.uid())))
  with check (status = 'draft' and owner_id = (select auth.uid()) and exists (
    select 1 from public.source_editors where user_id = (select auth.uid())));

create table public.complaints (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 200),
  body text not null check (char_length(body) between 30 and 5000),
  facts jsonb not null check (jsonb_typeof(facts) = 'object' and octet_length(facts::text) <= 12000),
  created_at timestamptz not null default now()
);
create index complaints_user_idx on public.complaints (user_id, created_at desc);
alter table public.complaints enable row level security;
revoke all on public.complaints from anon, authenticated;
grant select on public.complaints to authenticated;
grant insert (id, user_id, title, body, facts) on public.complaints to authenticated;
create policy complaints_read_own on public.complaints for select to authenticated using (user_id = (select auth.uid()));
create policy complaints_insert_own on public.complaints for insert to authenticated with check (user_id = (select auth.uid()));

create table public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket timestamptz not null,
  request_count integer not null check (request_count between 1 and 10),
  primary key (user_id, bucket)
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;
-- Only this bounded function can reserve a request. Atomic across Vercel instances.
create function public.claim_ai_request() returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_hour timestamptz := date_trunc('hour', now());
  v_count integer;
begin
  if v_user is null then return false; end if;
  insert into public.ai_usage (user_id, bucket, request_count) values (v_user, v_hour, 1)
  on conflict (user_id, bucket) do update set request_count = public.ai_usage.request_count + 1
    where public.ai_usage.request_count < 10
  returning request_count into v_count;
  return v_count is not null;
end;
$$;
revoke all on function public.claim_ai_request() from public, anon;
grant execute on function public.claim_ai_request() to authenticated;

commit;
