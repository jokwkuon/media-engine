create table public.brands (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check (char_length(trim(name)) between 1 and 100),
 niche text not null default '',
 audience text not null default '',
 identity jsonb not null default '{}'::jsonb check (jsonb_typeof(identity)='object'),
 status text not null default 'draft' check(status in ('draft','active','paused','archived')),
 monthly_budget_cents integer not null default 0 check(monthly_budget_cents>=0),
 created_at timestamptz not null default now(),
 unique(owner_id,id)
);
create index brands_owner_idx on public.brands(owner_id);
create table public.content_items (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid(),
 brand_id uuid not null,
 title text not null check(char_length(trim(title)) between 1 and 200),
 format text not null default 'carousel' check(format in ('carousel','short_video','image','article')),
 script text not null default '',
 status text not null default 'idea' check(status in ('idea','script','review','approved','archived')),
 created_at timestamptz not null default now(),
 foreign key(owner_id,brand_id) references public.brands(owner_id,id) on delete cascade,
 unique(owner_id,brand_id,id)
);
create index content_items_brand_idx on public.content_items(owner_id,brand_id);
create table public.social_accounts (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid(),
 brand_id uuid not null,
 platform text not null check(platform in ('instagram','tiktok','youtube','facebook','x','threads')),
 handle text not null check(char_length(trim(handle)) between 1 and 100),
 created_at timestamptz not null default now(),
 foreign key(owner_id,brand_id) references public.brands(owner_id,id) on delete cascade,
 unique(brand_id,platform,handle)
);
create index social_accounts_owner_brand_idx on public.social_accounts(owner_id,brand_id);
create table public.production_jobs (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid(),
 brand_id uuid not null,
 content_id uuid not null,
 kind text not null check(kind in ('script','image','video','carousel')),
 status text not null default 'queued' check(status in ('queued','running','succeeded','failed','cancelled')),
 created_at timestamptz not null default now(),
 foreign key(owner_id,brand_id,content_id) references public.content_items(owner_id,brand_id,id) on delete cascade
);
create index production_jobs_content_idx on public.production_jobs(owner_id,brand_id,content_id);
alter table public.brands enable row level security;
alter table public.content_items enable row level security;
alter table public.social_accounts enable row level security;
alter table public.production_jobs enable row level security;
revoke all on public.brands,public.content_items,public.social_accounts,public.production_jobs from public,anon,authenticated;
grant select,insert,update,delete on public.brands,public.content_items,public.social_accounts to authenticated;
grant select on public.production_jobs to authenticated;
grant select,insert,update,delete on public.brands,public.content_items,public.social_accounts,public.production_jobs to service_role;
create policy brand_owner on public.brands for all to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy content_owner on public.content_items for all to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy account_owner on public.social_accounts for all to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy jobs_owner_read on public.production_jobs for select to authenticated using ((select auth.uid())=owner_id);;
