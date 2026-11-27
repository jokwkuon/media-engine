alter table public.social_accounts add column content_style text not null default '', add column content_goal text not null default '';
create table public.marketing_posts (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 account_id uuid not null,
 title text not null check (length(title) between 1 and 200),
 format text not null check (format in ('short_video','carousel','image','text','article')),
 campaign text not null default '',
 hook text not null default '',
 planned_date date,
 status text not null default 'draft' check(status in ('draft','scheduled','published','cancelled')),
 post_url text,
 published_at timestamptz,
 views bigint check(views>=0), likes bigint check(likes>=0), comments bigint check(comments>=0), shares bigint check(shares>=0), saves bigint check(saves>=0), follows bigint check(follows>=0), clicks bigint check(clicks>=0), conversions bigint check(conversions>=0),
 metrics_observed_at timestamptz,
 created_at timestamptz not null default now(),
 foreign key(owner_id,account_id) references public.social_accounts(owner_id,id) on delete cascade,
 check (status<>'scheduled' or planned_date is not null),
 check (status<>'published' or published_at is not null)
);
create index marketing_posts_owner_date on public.marketing_posts(owner_id,planned_date);
create index marketing_posts_account on public.marketing_posts(owner_id,account_id);
alter table public.marketing_posts enable row level security;
revoke all on public.marketing_posts from public, anon, authenticated;
grant select,insert,update,delete on public.marketing_posts to authenticated;
grant all on public.marketing_posts to service_role;
create policy marketing_posts_owner on public.marketing_posts for all to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
;
