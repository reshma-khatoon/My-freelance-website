-- Run in the Supabase SQL Editor before deploying the updated website.
begin;

alter table public.inquiries add column if not exists phone text;

do $$
declare
  inquiry_id_type text;
begin
  select format_type(a.atttypid, a.atttypmod)
    into strict inquiry_id_type
    from pg_attribute a
    where a.attrelid = 'public.inquiries'::regclass
      and a.attname = 'id' and a.attnum > 0 and not a.attisdropped;

  execute format(
    'create table if not exists public.inquiry_contact_history (
      id bigint generated always as identity primary key,
      inquiry_id %s not null references public.inquiries(id) on delete cascade,
      channel text not null check (channel in (''Call'', ''WhatsApp'', ''Email'')),
      created_at timestamptz not null default now()
    )', inquiry_id_type
  );
end $$;

alter table public.inquiry_contact_history enable row level security;
revoke all on public.inquiry_contact_history from public, anon, authenticated;
grant select, insert on public.inquiry_contact_history to authenticated;

drop policy if exists "Admin reads contact history" on public.inquiry_contact_history;
create policy "Admin reads contact history" on public.inquiry_contact_history
  for select to authenticated
  using (auth.uid() = 'ed313df0-8ac0-4426-88ca-235ee0b735a6'::uuid);

drop policy if exists "Admin records contact history" on public.inquiry_contact_history;
create policy "Admin records contact history" on public.inquiry_contact_history
  for insert to authenticated
  with check (auth.uid() = 'ed313df0-8ac0-4426-88ca-235ee0b735a6'::uuid);

commit;
