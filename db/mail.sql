create table if not exists public.mails_sortants (
  id uuid primary key default gen_random_uuid(),
  destinataire text not null,
  sujet text not null,
  html text not null,
  created_at timestamptz not null default now()
);

create index if not exists mails_sortants_destinataire_idx on public.mails_sortants (destinataire, created_at desc);
