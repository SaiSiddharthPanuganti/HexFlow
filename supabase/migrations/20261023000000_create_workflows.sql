-- HexFlow cloud workflows. Run in Supabase SQL Editor or apply as a migration.
create table if not exists public.workflows (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null check (char_length(title) between 1 and 200),
  brief text not null default '' check (char_length(brief) <= 20000),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists workflows_user_updated_at_idx on public.workflows (user_id, updated_at desc);
alter table public.workflows enable row level security;

drop policy if exists "Users can read their own workflows" on public.workflows;
create policy "Users can read their own workflows" on public.workflows for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "Users can create their own workflows" on public.workflows;
create policy "Users can create their own workflows" on public.workflows for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own workflows" on public.workflows;
create policy "Users can update their own workflows" on public.workflows for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete their own workflows" on public.workflows;
create policy "Users can delete their own workflows" on public.workflows for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.workflows to authenticated;
revoke all on public.workflows from anon;
