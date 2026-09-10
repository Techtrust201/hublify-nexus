-- Fiches d'accès des lieux. Le code de boîte à clés, le mot de passe Wi-Fi et le
-- code d'alarme sont chiffrés au repos avec pgcrypto : la clé (APP_CRYPTO_KEY)
-- vit dans l'environnement applicatif, jamais en base. Une fuite du dump ne
-- suffit donc pas à ouvrir les logements.
-- Le SSID et les consignes restent en clair : ce ne sont pas des secrets et on
-- veut pouvoir les rechercher.

create table if not exists public.lieux_acces (
  org_id uuid not null,
  bien_id text not null,
  wifi text not null default '',
  consignes text not null default '',
  code_cles_chiffre bytea,
  wifi_mdp_chiffre bytea,
  alarme_chiffre bytea,
  updated_at timestamptz not null default now(),
  primary key (org_id, bien_id),
  foreign key (org_id, bien_id) references public.biens (org_id, id) on delete cascade
);
