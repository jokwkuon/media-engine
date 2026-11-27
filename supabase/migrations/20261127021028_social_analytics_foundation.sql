alter table public.social_accounts add column profile_url text, add column retrieval_status text not null default 'pending' check(retrieval_status in ('pending','retrieved','unavailable'));
alter table public.social_accounts add constraint social_accounts_owner_id_unique unique(owner_id,id);
create table public.account_snapshots (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null,
 account_id uuid not null,
 observed_at timestamptz not null,
 source text not null,
 followers bigint check(followers>=0),
 published_count bigint check(published_count>=0),
 lifetime_views bigint check(lifetime_views>=0),
 foreign key(owner_id,account_id) references public.social_accounts(owner_id,id) on delete cascade,
 unique(account_id,observed_at,source)
);
create index account_snapshots_owner_account_idx on public.account_snapshots(owner_id,account_id,observed_at desc);
alter table public.account_snapshots enable row level security;
revoke all on public.account_snapshots from public,anon,authenticated;
grant select on public.account_snapshots to authenticated;
grant select,insert,update,delete on public.account_snapshots to service_role;
create policy snapshot_owner_read on public.account_snapshots for select to authenticated using ((select auth.uid())=owner_id);;
