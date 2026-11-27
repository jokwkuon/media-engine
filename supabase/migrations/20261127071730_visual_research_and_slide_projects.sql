create table public.research_library (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 brand_id uuid not null, kind text not null check(kind in ('post','format')), source_key text not null, source text not null default 'Volume snapshot',
 title text not null check(length(title) between 1 and 240), platform text, creator text, niche text not null default '', source_url text, cover_url text,
 reach_label text, likes_label text, relative_label text, metric_basis text, description text not null default '', hook text not null default '', beats jsonb not null default '[]'::jsonb check(jsonb_typeof(beats)='array'), saved boolean not null default false, observed_at timestamptz not null default now(),
 foreign key(owner_id,brand_id) references public.brands(owner_id,id) on delete cascade,
 unique(owner_id,brand_id,kind,source_key)
);
create index research_library_brand_idx on public.research_library(owner_id,brand_id,kind);
alter table public.research_library enable row level security;
revoke all on public.research_library from public,anon,authenticated;
grant select,insert,update,delete on public.research_library to authenticated;
grant all on public.research_library to service_role;
create policy research_library_owner on public.research_library for all to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create table public.slide_projects (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 brand_id uuid not null, title text not null check(length(title) between 1 and 200), format text not null check(format in ('vertical','portrait')),
 caption text not null default '' check(length(caption)<=10000),
 slides jsonb not null check(case when jsonb_typeof(slides)='array' then jsonb_array_length(slides) between 1 and 35 else false end) check(octet_length(slides::text)<=1000000),
 revision integer not null default 1 check(revision>0), updated_at timestamptz not null default now(),
 foreign key(owner_id,brand_id) references public.brands(owner_id,id) on delete cascade
);
create index slide_projects_brand_idx on public.slide_projects(owner_id,brand_id,updated_at desc);
alter table public.slide_projects enable row level security;
revoke all on public.slide_projects from public,anon,authenticated;
grant select,insert,update,delete on public.slide_projects to authenticated;
grant all on public.slide_projects to service_role;
create policy slide_projects_owner on public.slide_projects for all to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
;
