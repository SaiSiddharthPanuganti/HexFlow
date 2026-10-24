-- Add optimistic concurrency and server-owned timestamps to workflow storage.
alter table public.workflows
  add column if not exists revision integer not null default 1;

create or replace function public.set_workflow_update_metadata()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = now();
  new.revision = old.revision + 1;
  return new;
end;
$$;

drop trigger if exists workflows_update_metadata on public.workflows;
create trigger workflows_update_metadata
before update on public.workflows
for each row execute function public.set_workflow_update_metadata();
