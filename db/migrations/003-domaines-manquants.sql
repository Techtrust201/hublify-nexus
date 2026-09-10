-- Domaines qui vivaient encore dans le localStorage du navigateur : patrimoine
-- (immeubles), occupants, GED, modèles de documents, inventaire, états des
-- lieux, paramétrage, profil étendu et droits personnalisés.

-- ------------------------------------------------------------------ immeubles

create table if not exists public.immeubles (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  nom text not null,
  proprietaire text not null default '',
  initiales text not null default '',
  adresse text not null default '',
  statut text not null default 'actif',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, id),
  constraint immeubles_statut check (statut in ('actif', 'inactif'))
);

-- Le nombre de logements se déduit des biens rattachés, on ne le stocke pas.
alter table public.biens add column if not exists immeuble_id text;

alter table public.biens
  add constraint biens_immeuble_fk
    foreign key (org_id, immeuble_id) references public.immeubles (org_id, id) on delete set null;

create index if not exists biens_immeuble_idx on public.biens (org_id, immeuble_id);

-- ------------------------------------------------------------------ occupants

create table if not exists public.occupants (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  nom text not null,
  initiales text not null default '',
  type_occupant text not null default 'Voyageur',
  logement text not null default '',
  telephone text not null default '',
  email text not null default '',
  arrivee date,
  depart date,
  statut text not null default 'Actif',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, id),
  constraint occupants_type check (type_occupant in ('Locataire', 'Voyageur')),
  constraint occupants_statut check (statut in ('Actif', 'À venir')),
  constraint occupants_sejour check (depart is null or arrivee is null or depart >= arrivee)
);

create index if not exists occupants_logement_idx on public.occupants (org_id, logement);

-- ------------------------------------------------------------------------ GED

drop table if exists public.documents cascade;

create table if not exists public.documents (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  titre text not null,
  type_doc text not null default '',
  filtre text not null default '',
  logement text not null default '',
  date_doc text not null default '',
  taille text not null default '',
  modifie_par text not null default '',
  photos integer not null default 0,
  vue text not null,
  occupant text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, id),
  constraint documents_vue
    check (vue in ('logements', 'residents', 'proprio', 'inventaire-presta', 'factures')),
  constraint documents_occupant
    check (occupant is null or occupant in ('locataires', 'voyageurs', 'prestataires')),
  constraint documents_photos check (photos >= 0)
);

create index if not exists documents_vue_idx on public.documents (org_id, vue);
create index if not exists documents_logement_idx on public.documents (org_id, logement);

-- Les binaires vivent à part : lister la GED ne doit pas rapatrier les fichiers.
create table if not exists public.documents_fichiers (
  org_id uuid not null,
  document_id text not null,
  nom text not null,
  mime text not null default 'application/pdf',
  contenu bytea not null,
  primary key (org_id, document_id),
  foreign key (org_id, document_id) references public.documents (org_id, id) on delete cascade
);

-- ------------------------------------------------------- modèles de documents

create table if not exists public.modeles_documents (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  designation text not null,
  type_doc text not null default '',
  categorie text not null default 'Général',
  derniere text not null default '—',
  utilisations integer not null default 0,
  reference text not null default '',
  favori boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, id),
  constraint modeles_utilisations check (utilisations >= 0)
);

create index if not exists modeles_categorie_idx on public.modeles_documents (org_id, categorie);

-- ----------------------------------------------------------------- inventaire

create table if not exists public.inventaire_items (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  code text not null default '',
  designation text not null,
  etat text not null default 'Bon',
  qte integer not null default 1,
  emoji text not null default '📦',
  emplacement text not null default '',
  serie text not null default '',
  onglet text not null default '1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, id),
  constraint inventaire_onglet check (onglet in ('1', '2', 'conso')),
  constraint inventaire_qte check (qte >= 0)
);

create index if not exists inventaire_onglet_idx on public.inventaire_items (org_id, onglet);

-- ----------------------------------------------------------- états des lieux

create table if not exists public.edl_dossiers (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  logement text not null,
  type_edl text not null,
  occupant text not null default '',
  date_edl date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, id),
  constraint edl_type check (type_edl in ('Entrée', 'Sortie'))
);

create index if not exists edl_logement_idx on public.edl_dossiers (org_id, logement, type_edl);

create table if not exists public.edl_pieces (
  org_id uuid not null,
  dossier_id text not null,
  id text not null,
  nom text not null,
  etat text not null default 'ok',
  commentaire text not null default '',
  position integer not null default 0,
  primary key (org_id, dossier_id, id),
  foreign key (org_id, dossier_id) references public.edl_dossiers (org_id, id) on delete cascade,
  constraint edl_pieces_etat check (etat in ('ok', 'usure', 'a_reparer'))
);

create table if not exists public.edl_points (
  org_id uuid not null,
  dossier_id text not null,
  piece_id text not null,
  id text not null,
  libelle text not null,
  etat text not null default 'ok',
  position integer not null default 0,
  primary key (org_id, dossier_id, piece_id, id),
  foreign key (org_id, dossier_id, piece_id)
    references public.edl_pieces (org_id, dossier_id, id) on delete cascade,
  constraint edl_points_etat check (etat in ('ok', 'usure', 'a_reparer'))
);

create table if not exists public.edl_photos (
  org_id uuid not null,
  dossier_id text not null,
  piece_id text not null,
  id text not null,
  legend text not null default '',
  mime text,
  contenu bytea,
  position integer not null default 0,
  primary key (org_id, dossier_id, piece_id, id),
  foreign key (org_id, dossier_id, piece_id)
    references public.edl_pieces (org_id, dossier_id, id) on delete cascade
);

-- ----------------------------------------------------------------- paramétrage

create table if not exists public.parametrage (
  org_id uuid primary key references public.orgs (id) on delete cascade,
  notif_alertes boolean not null default true,
  notif_aide boolean not null default true,
  notif_maj boolean not null default false,
  notifs_email boolean not null default true,
  notifs_push boolean not null default true,
  notifs_sms boolean not null default false,
  rappel_paiement boolean not null default true,
  rappel_paiement_heures text not null default '00',
  notif_loyer boolean not null default true,
  notif_message boolean not null default true,
  notif_mission boolean not null default true,
  email_pre_checkin boolean not null default true,
  message_pre_checkin text not null default '',
  lien_app_voyageur boolean not null default false,
  delai_envoi_actif boolean not null default true,
  delai_envoi_jours text not null default '3',
  message_lien_perso text not null default '',
  exiger_identifiant boolean not null default true,
  identifiant_tous_voyageurs boolean not null default false,
  accepter_toute_piece boolean not null default true,
  infos_contact_supp boolean not null default true,
  signature_voyageur boolean not null default false,
  passerelle_paiement boolean not null default true,
  portail_voyageurs boolean not null default true,
  code_porte_si_paye boolean not null default true,
  rappel_checkout boolean not null default true,
  rappel_checkout_jours text not null default '1',
  afficher_fiches_acces boolean not null default true,
  afficher_edl boolean not null default true,
  heure_check_in text not null default '16:00',
  heure_check_out text not null default '10:00',
  delai_menage_min text not null default '120',
  consignes_arrivee text not null default '',
  consignes_depart text not null default '',
  updated_at timestamptz not null default now(),
  constraint parametrage_heures
    check (heure_check_in ~ '^[0-2][0-9]:[0-5][0-9]$' and heure_check_out ~ '^[0-2][0-9]:[0-5][0-9]$')
);

create table if not exists public.parametrage_upsells (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  nom text not null,
  prix numeric(10, 2) not null default 0,
  actif boolean not null default true,
  position integer not null default 0,
  primary key (org_id, id),
  constraint upsells_prix check (prix >= 0)
);

-- ------------------------------------------------------------ profil étendu

alter table public.profils
  add column if not exists telephone1 text not null default '',
  add column if not exists telephone2 text not null default '',
  add column if not exists naissance date;

create table if not exists public.profil_documents (
  user_id uuid not null references "user" ("id") on delete cascade,
  id text not null,
  titre text not null,
  statut text not null default 'En attente',
  fichier_nom text,
  fichier_mime text,
  contenu bytea,
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint profil_documents_statut check (statut in ('Vérifié', 'En attente'))
);

-- -------------------------------------------------------- droits personnalisés

create table if not exists public.droits_personnalises (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  nom text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  primary key (org_id, id)
);

create table if not exists public.droits_personnalises_membres (
  org_id uuid not null,
  droit_id text not null,
  membre_id text not null,
  primary key (org_id, droit_id, membre_id),
  foreign key (org_id, droit_id)
    references public.droits_personnalises (org_id, id) on delete cascade
);
