-- Passage des tables métier du blob `payload jsonb` à des colonnes typées, avec
-- reprise des données existantes puis suppression du blob. Les clés étrangères
-- remplacent les rattachements par convention (bienId, ensembleId, conversationId).

-- ---------------------------------------------------------------------- biens

alter table public.biens
  add column if not exists adresse text not null default '',
  add column if not exists typologie text not null default '',
  add column if not exists created_at timestamptz not null default now();

update public.biens set adresse = coalesce(payload ->> 'adresse', '') where payload is not null;

alter table public.biens drop column if exists payload;
alter table public.biens add constraint biens_base_nuit_positif check (base_nuit >= 0);

-- --------------------------------------------------------------- prestataires

alter table public.prestataires
  add column if not exists nom text not null default '',
  add column if not exists categorie text not null default 'Ménage',
  add column if not exists telephone text not null default '',
  add column if not exists email text not null default '',
  add column if not exists ville text not null default '',
  add column if not exists actif boolean not null default true,
  add column if not exists note numeric(3, 2) not null default 0,
  add column if not exists created_at timestamptz not null default now();

update public.prestataires set
  nom = coalesce(payload ->> 'nom', ''),
  categorie = coalesce(payload ->> 'categorie', 'Ménage'),
  telephone = coalesce(payload ->> 'telephone', ''),
  email = coalesce(payload ->> 'email', ''),
  ville = coalesce(payload ->> 'ville', ''),
  actif = coalesce((payload ->> 'actif')::boolean, true),
  note = coalesce((payload ->> 'note')::numeric, 0);

alter table public.prestataires drop column if exists payload;
alter table public.prestataires
  add constraint prestataires_note_bornee check (note >= 0 and note <= 5);

-- --------------------------------------------------------- reservations_cal

alter table public.reservations_cal
  add column if not exists bien_id text,
  add column if not exists voyageur text not null default '',
  add column if not exists arrivee date,
  add column if not exists depart date;

update public.reservations_cal set
  bien_id = payload ->> 'bienId',
  voyageur = coalesce(payload ->> 'voyageur', ''),
  arrivee = (payload ->> 'arrivee')::date,
  depart = (payload ->> 'depart')::date;

alter table public.reservations_cal drop column if exists payload;
alter table public.reservations_cal
  alter column bien_id set not null,
  alter column arrivee set not null,
  alter column depart set not null,
  add constraint reservations_cal_sejour check (depart >= arrivee),
  add constraint reservations_cal_bien_fk
    foreign key (org_id, bien_id) references public.biens (org_id, id) on delete cascade;

create index if not exists reservations_cal_bien_idx
  on public.reservations_cal (org_id, bien_id, arrivee);

-- ----------------------------------------------------- reservations_dossier

alter table public.reservations_dossier
  add column if not exists bien_id text,
  add column if not exists occupant text not null default '',
  add column if not exists initiales text not null default '',
  add column if not exists email text not null default '',
  add column if not exists telephone text not null default '',
  add column if not exists arrivee date,
  add column if not exists depart date,
  add column if not exists heure_arrivee text not null default '16:00',
  add column if not exists heure_depart text not null default '10:00',
  add column if not exists plateforme text not null default 'Direct',
  add column if not exists voyageurs integer not null default 1,
  add column if not exists adultes integer not null default 1,
  add column if not exists enfants integer not null default 0,
  add column if not exists montant numeric(12, 2) not null default 0,
  add column if not exists paye numeric(12, 2) not null default 0,
  add column if not exists statut text not null default 'Confirmé',
  add column if not exists couleur text not null default '#e5e7eb',
  add column if not exists type_sejour text,
  add column if not exists upsell_ids text[] not null default '{}',
  add column if not exists services text[] not null default '{}',
  add column if not exists created_at timestamptz not null default now();

update public.reservations_dossier set
  bien_id = payload ->> 'bienId',
  occupant = coalesce(payload ->> 'occupant', ''),
  initiales = coalesce(payload ->> 'initiales', ''),
  email = coalesce(payload ->> 'email', ''),
  telephone = coalesce(payload ->> 'telephone', ''),
  arrivee = (payload ->> 'arrivee')::date,
  depart = (payload ->> 'depart')::date,
  heure_arrivee = coalesce(nullif(payload ->> 'heureArrivee', ''), '16:00'),
  heure_depart = coalesce(nullif(payload ->> 'heureDepart', ''), '10:00'),
  plateforme = coalesce(payload ->> 'plateforme', 'Direct'),
  voyageurs = coalesce((payload ->> 'voyageurs')::integer, 1),
  adultes = coalesce((payload ->> 'adultes')::integer, 1),
  enfants = coalesce((payload ->> 'enfants')::integer, 0),
  montant = coalesce((payload ->> 'montant')::numeric, 0),
  paye = coalesce((payload ->> 'paye')::numeric, 0),
  statut = coalesce(payload ->> 'statut', 'Confirmé'),
  couleur = coalesce(payload ->> 'couleur', '#e5e7eb'),
  type_sejour = payload ->> 'type',
  upsell_ids = coalesce(array(select jsonb_array_elements_text(payload -> 'upsellIds')), '{}'),
  services = coalesce(array(select jsonb_array_elements_text(payload -> 'services')), '{}');

alter table public.reservations_dossier drop column if exists payload;
alter table public.reservations_dossier
  alter column bien_id set not null,
  alter column arrivee set not null,
  alter column depart set not null,
  add constraint reservations_sejour check (depart >= arrivee),
  add constraint reservations_statut
    check (statut in ('Confirmé', 'En attente', 'Annulé')),
  add constraint reservations_plateforme
    check (plateforme in ('Airbnb', 'Booking.com', 'Direct', 'Autre')),
  add constraint reservations_heures
    check (heure_arrivee ~ '^[0-2][0-9]:[0-5][0-9]$' and heure_depart ~ '^[0-2][0-9]:[0-5][0-9]$'),
  add constraint reservations_montants check (montant >= 0 and paye >= 0),
  add constraint reservations_effectif
    check (voyageurs >= 0 and adultes >= 0 and enfants >= 0),
  add constraint reservations_bien_fk
    foreign key (org_id, bien_id) references public.biens (org_id, id) on delete cascade;

create index if not exists reservations_dossier_bien_idx
  on public.reservations_dossier (org_id, bien_id, arrivee);
create index if not exists reservations_dossier_statut_idx
  on public.reservations_dossier (org_id, statut);

-- -------------------------------------------------------------- dates bloquées

alter table public.dates_bloquees
  add column if not exists bien_id text,
  add column if not exists jour date,
  add column if not exists motif text not null default '';

update public.dates_bloquees set
  bien_id = payload ->> 'bienId',
  jour = (payload ->> 'date')::date,
  motif = coalesce(payload ->> 'motif', '');

alter table public.dates_bloquees drop column if exists payload;
alter table public.dates_bloquees
  alter column bien_id set not null,
  alter column jour set not null,
  add constraint dates_bloquees_bien_fk
    foreign key (org_id, bien_id) references public.biens (org_id, id) on delete cascade;

create unique index if not exists dates_bloquees_uidx
  on public.dates_bloquees (org_id, bien_id, jour);

-- L'identifiant d'une date bloquée annuelle est la date elle-même : on s'appuie
-- sur la clé naturelle plutôt que de dupliquer l'information.
alter table public.dates_bloquees_annuelles add column if not exists jour date;

update public.dates_bloquees_annuelles
  set jour = coalesce(payload ->> 'date', payload ->> 'id', id)::date;

delete from public.dates_bloquees_annuelles a
  using public.dates_bloquees_annuelles b
  where a.org_id = b.org_id and a.jour = b.jour and a.ctid > b.ctid;

alter table public.dates_bloquees_annuelles drop constraint dates_bloquees_annuelles_pkey;
alter table public.dates_bloquees_annuelles drop column if exists payload;
alter table public.dates_bloquees_annuelles drop column if exists id;
alter table public.dates_bloquees_annuelles
  alter column jour set not null,
  add primary key (org_id, jour);

-- ------------------------------------------------------------------- missions

alter table public.missions
  add column if not exists bien_id text,
  add column if not exists jour date,
  add column if not exists titre text not null default '',
  add column if not exists type_mission text not null default 'Menage',
  add column if not exists emoji text not null default '🧹',
  add column if not exists heure text not null default '09:00',
  add column if not exists assigne text not null default '',
  add column if not exists statut text not null default 'a_faire',
  add column if not exists description text not null default '',
  add column if not exists pastille_accentuee boolean not null default false,
  add column if not exists created_at timestamptz not null default now();

update public.missions set
  bien_id = payload ->> 'bienId',
  jour = (payload ->> 'date')::date,
  titre = coalesce(payload ->> 'titre', ''),
  type_mission = coalesce(payload ->> 'type', 'Menage'),
  emoji = coalesce(payload ->> 'emoji', '🧹'),
  heure = coalesce(nullif(payload ->> 'heure', ''), '09:00'),
  assigne = coalesce(payload ->> 'assigne', ''),
  statut = coalesce(payload ->> 'statut', 'a_faire'),
  description = coalesce(payload ->> 'description', ''),
  pastille_accentuee = coalesce((payload ->> 'pastilleAccentuee')::boolean, false);

alter table public.missions drop column if exists payload;
alter table public.missions
  alter column bien_id set not null,
  alter column jour set not null,
  add constraint missions_statut check (statut in ('a_faire', 'en_cours', 'terminee')),
  add constraint missions_type
    check (type_mission in ('Menage', 'Check-in', 'Check-out', 'Inventaire', 'Maintenance')),
  add constraint missions_bien_fk
    foreign key (org_id, bien_id) references public.biens (org_id, id) on delete cascade;

create index if not exists missions_jour_idx on public.missions (org_id, jour);

-- --------------------------------------------------------------------- loyers

alter table public.loyers
  add column if not exists locataire text not null default '',
  add column if not exists initiales text not null default '',
  add column if not exists bien_nom text not null default '',
  add column if not exists echeance text not null default '',
  add column if not exists montant numeric(12, 2) not null default 0,
  add column if not exists valide boolean not null default false,
  add column if not exists quittance boolean not null default false;

update public.loyers set
  locataire = coalesce(payload ->> 'locataire', ''),
  initiales = coalesce(payload ->> 'initiales', ''),
  bien_nom = coalesce(payload ->> 'bienNom', ''),
  echeance = coalesce(payload ->> 'echeance', ''),
  montant = coalesce((payload ->> 'montant')::numeric, 0),
  valide = coalesce((payload ->> 'valide')::boolean, false),
  quittance = coalesce((payload ->> 'quittance')::boolean, false);

alter table public.loyers drop column if exists payload;
alter table public.loyers
  add constraint loyers_montant_positif check (montant >= 0),
  add constraint loyers_quittance_apres_validation check (not quittance or valide);

-- ----------------------------------------------------------------- evenements

alter table public.evenements
  add column if not exists titre text not null default '',
  add column if not exists lieu text not null default '',
  add column if not exists dates text not null default '',
  add column if not exists impact text not null default 'Impact modéré',
  add column if not exists description text not null default '';

update public.evenements set
  titre = coalesce(payload ->> 'titre', ''),
  lieu = coalesce(payload ->> 'lieu', ''),
  dates = coalesce(payload ->> 'dates', ''),
  impact = coalesce(payload ->> 'impact', 'Impact modéré'),
  description = coalesce(payload ->> 'description', '');

alter table public.evenements drop column if exists payload;
alter table public.evenements
  add constraint evenements_impact
    check (impact in ('Fort impact', 'Impact modéré', 'Opportunité'));

-- -------------------------------------------------------------- messages_dash

alter table public.messages_dash
  add column if not exists canal text not null default 'team',
  add column if not exists auteur text not null default '',
  add column if not exists initiales text not null default '',
  add column if not exists bien_nom text,
  add column if not exists texte text not null default '',
  add column if not exists il_y_a text not null default '',
  add column if not exists created_at timestamptz not null default now();

update public.messages_dash set
  canal = coalesce(payload ->> 'canal', 'team'),
  auteur = coalesce(payload ->> 'auteur', ''),
  initiales = coalesce(payload ->> 'initiales', ''),
  bien_nom = payload ->> 'bienNom',
  texte = coalesce(payload ->> 'texte', ''),
  il_y_a = coalesce(payload ->> 'ilYa', '');

alter table public.messages_dash drop column if exists payload;
alter table public.messages_dash
  add constraint messages_dash_canal check (canal in ('occupants', 'prestataires', 'team'));

-- -------------------------------------------------------------- conversations

alter table public.conversations
  add column if not exists section text not null default 'inbox',
  add column if not exists nom text not null default '',
  add column if not exists initiales text not null default '',
  add column if not exists type_interlocuteur text not null default 'voyageur',
  add column if not exists badge text not null default '',
  add column if not exists bien_nom text,
  add column if not exists extrait text not null default '',
  add column if not exists il_y_a text not null default '',
  add column if not exists non_lu boolean not null default false,
  add column if not exists archivee boolean not null default false,
  add column if not exists assigne text,
  add column if not exists created_at timestamptz not null default now();

update public.conversations set
  section = coalesce(payload ->> 'section', 'inbox'),
  nom = coalesce(payload ->> 'nom', ''),
  initiales = coalesce(payload ->> 'initiales', ''),
  type_interlocuteur = coalesce(payload ->> 'type', 'voyageur'),
  badge = coalesce(payload ->> 'badge', ''),
  bien_nom = payload ->> 'bienNom',
  extrait = coalesce(payload ->> 'extrait', ''),
  il_y_a = coalesce(payload ->> 'ilYa', ''),
  non_lu = coalesce((payload ->> 'nonLu')::boolean, false),
  archivee = coalesce((payload ->> 'archivee')::boolean, false),
  assigne = payload ->> 'assigne';

-- Les documents liés d'une conversation sortent du blob : table dédiée.
create table if not exists public.conversation_documents (
  org_id uuid not null,
  conversation_id text not null,
  position integer not null,
  nom text not null,
  date text not null default '',
  mime text,
  contenu bytea,
  primary key (org_id, conversation_id, position),
  foreign key (org_id, conversation_id)
    references public.conversations (org_id, id) on delete cascade
);

insert into public.conversation_documents (org_id, conversation_id, position, nom, date, mime)
select c.org_id, c.id, d.ordinalite - 1, coalesce(d.doc ->> 'nom', 'Document'),
       coalesce(d.doc ->> 'date', ''), d.doc ->> 'mime'
from public.conversations c
cross join lateral jsonb_array_elements(coalesce(c.payload -> 'documents', '[]'::jsonb))
  with ordinality as d(doc, ordinalite)
on conflict do nothing;

alter table public.conversations drop column if exists payload;
alter table public.conversations
  add constraint conversations_section
    check (section in ('inbox', 'prospections', 'prestataires', 'team')),
  add constraint conversations_type
    check (type_interlocuteur in ('voyageur', 'locataire', 'prestataire', 'team'));

create index if not exists conversations_section_idx
  on public.conversations (org_id, section, archivee);

-- --------------------------------------------------------------- messages_fil

alter table public.messages_fil
  add column if not exists conversation_id text,
  add column if not exists kind text not null default 'recu',
  add column if not exists texte text not null default '',
  add column if not exists heure text,
  add column if not exists icone_systeme text,
  add column if not exists created_at timestamptz not null default now();

update public.messages_fil set
  conversation_id = payload ->> 'conversationId',
  kind = coalesce(payload ->> 'kind', 'recu'),
  texte = coalesce(payload ->> 'texte', ''),
  heure = payload ->> 'heure',
  icone_systeme = payload ->> 'iconeSysteme';

create table if not exists public.message_pieces (
  org_id uuid not null,
  message_id text not null,
  position integer not null,
  nom text not null,
  taille text not null default '',
  mime text,
  contenu bytea,
  primary key (org_id, message_id, position),
  foreign key (org_id, message_id)
    references public.messages_fil (org_id, id) on delete cascade
);

insert into public.message_pieces (org_id, message_id, position, nom, taille, mime)
select m.org_id, m.id, p.ordinalite - 1, coalesce(p.piece ->> 'nom', 'Pièce jointe'),
       coalesce(p.piece ->> 'taille', ''), p.piece ->> 'mime'
from public.messages_fil m
cross join lateral jsonb_array_elements(coalesce(m.payload -> 'pieces', '[]'::jsonb))
  with ordinality as p(piece, ordinalite)
on conflict do nothing;

-- Un message orphelin ne s'affiche nulle part : on nettoie avant de poser la clé.
delete from public.messages_fil m
  where not exists (
    select 1 from public.conversations c
    where c.org_id = m.org_id and c.id = m.conversation_id
  );

alter table public.messages_fil drop column if exists payload;
alter table public.messages_fil
  alter column conversation_id set not null,
  add constraint messages_fil_kind check (kind in ('systeme', 'recu', 'envoye')),
  add constraint messages_fil_icone
    check (icone_systeme is null or icone_systeme in ('login', 'usercheck', 'key')),
  add constraint messages_fil_conversation_fk
    foreign key (org_id, conversation_id)
      references public.conversations (org_id, id) on delete cascade;

create index if not exists messages_fil_conversation_idx
  on public.messages_fil (org_id, conversation_id, created_at);

-- --------------------------------------------------------- ensembles et règles

alter table public.ensembles
  add column if not exists nom text not null default '',
  add column if not exists description text not null default '',
  add column if not exists actif boolean not null default true;

update public.ensembles set
  nom = coalesce(payload ->> 'nom', ''),
  description = coalesce(payload ->> 'description', ''),
  actif = coalesce((payload ->> 'actif')::boolean, true);

alter table public.ensembles drop column if exists payload;

alter table public.regles
  add column if not exists ensemble_id text,
  add column if not exists nom text not null default '',
  add column if not exists type_regle text not null default 'perso',
  add column if not exists debut date,
  add column if not exists fin date,
  add column if not exists nuits integer not null default 0,
  add column if not exists biens text not null default 'tous',
  add column if not exists variation integer not null default 0,
  add column if not exists note text;

update public.regles set
  ensemble_id = payload ->> 'ensembleId',
  nom = coalesce(payload ->> 'nom', ''),
  type_regle = coalesce(payload ->> 'type', 'perso'),
  debut = (payload ->> 'debut')::date,
  fin = (payload ->> 'fin')::date,
  nuits = coalesce((payload ->> 'nuits')::integer, 0),
  biens = coalesce(payload ->> 'biens', 'tous'),
  variation = coalesce((payload ->> 'variation')::integer, 0),
  note = payload ->> 'note';

delete from public.regles r
  where not exists (
    select 1 from public.ensembles e where e.org_id = r.org_id and e.id = r.ensemble_id
  );

alter table public.regles drop column if exists payload;
alter table public.regles
  alter column ensemble_id set not null,
  alter column debut set not null,
  alter column fin set not null,
  add constraint regles_periode check (fin >= debut),
  add constraint regles_type
    check (type_regle in ('weekend', 'haute', 'basse', 'evenement', 'derniere', 'long', 'perso')),
  add constraint regles_ensemble_fk
    foreign key (org_id, ensemble_id) references public.ensembles (org_id, id) on delete cascade;

create index if not exists regles_ensemble_idx on public.regles (org_id, ensemble_id);

-- --------------------------------------------------- notifications et actions

alter table public.notifications
  add column if not exists titre text not null default '',
  add column if not exists detail text not null default '',
  add column if not exists href text not null default '/',
  add column if not exists lu boolean not null default false,
  add column if not exists created_at timestamptz not null default now();

update public.notifications set
  titre = coalesce(payload ->> 'titre', ''),
  detail = coalesce(payload ->> 'detail', ''),
  href = coalesce(payload ->> 'href', '/'),
  lu = coalesce((payload ->> 'lu')::boolean, false);

alter table public.notifications drop column if exists payload;
create index if not exists notifications_non_lues_idx
  on public.notifications (org_id, lu, created_at desc);

alter table public.actions
  add column if not exists titre text not null default '',
  add column if not exists quand text not null default '',
  add column if not exists detail text not null default '',
  add column if not exists created_at timestamptz not null default now();

update public.actions set
  titre = coalesce(payload ->> 'titre', ''),
  quand = coalesce(payload ->> 'quand', ''),
  detail = coalesce(payload ->> 'detail', '');

alter table public.actions drop column if exists payload;
