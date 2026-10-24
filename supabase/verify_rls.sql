-- Run this in the Supabase SQL editor after applying all migrations.
-- The first query is an inventory check; the remaining queries should show
-- only authenticated CRUD policies scoped to auth.uid().

select
  schemaname,
  tablename,
  rowsecurity,
  force_row_security
from pg_tables
where schemaname not in ('pg_catalog', 'information_schema')
order by schemaname, tablename;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select
  grantee,
  table_schema,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'workflows'
order by grantee, privilege_type;
