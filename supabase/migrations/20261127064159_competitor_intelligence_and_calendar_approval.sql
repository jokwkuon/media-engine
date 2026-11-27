create table public.competitor_observations (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 brand_id uuid not null,
 competitor text not null check(length(competitor) between 1 and 100),
 platform text not null check(platform in ('instagram','tiktok','youtube','facebook','x','threads')),
 post_url text not null check(post_url like 'https://%'),
 caption text not null default '',
 views bigint check(views>=0), likes bigint check(likes>=0), saves bigint check(saves>=0),
 outlier_multiple numeric check(outlier_multiple>=0),
 outlier_metric text check(outlier_metric in ('views','likes')),
 observed_at timestamptz not null default now(),
 source text not null default 'Manual public observation',
 foreign key(owner_id,brand_id) references public.brands(owner_id,id) on delete cascade,
 unique(owner_id,brand_id,post_url)
);
alter table public.competitor_observations enable row level security;
revoke all on public.competitor_observations from public, anon, authenticated;
grant select,insert,update,delete on public.competitor_observations to authenticated;
grant all on public.competitor_observations to service_role;
create policy competitor_owner on public.competitor_observations for all to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create unique index marketing_posts_unique_url on public.marketing_posts(owner_id,account_id,post_url) where post_url is not null;
alter table public.marketing_posts add column approval_key text, add column approved_at timestamptz, add column metrics_source text;
create unique index marketing_posts_approval_key on public.marketing_posts(owner_id,approval_key) where approval_key is not null;
update public.marketing_posts set metrics_source='Volume public feed (point-in-time)' where campaign='Historical public posts' and metrics_observed_at is not null;
;
