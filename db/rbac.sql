-- Rôles, permissions et profils (RBAC). Dépend des tables Better Auth.

create table if not exists public.roles (
  id text primary key,
  label text not null,
  description text not null
);

create table if not exists public.permissions (
  id text primary key,
  groupe text not null,
  titre text not null,
  description text not null
);

create table if not exists public.role_permissions (
  role_id text not null references public.roles (id) on delete cascade,
  permission_id text not null references public.permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.profils (
  user_id uuid primary key references "user" (id) on delete cascade,
  prenom text not null,
  nom text not null,
  initiales text not null,
  role_id text not null references public.roles (id),
  affectation text not null default '',
  statut text not null default 'actif',
  droits text[] not null default '{}'
);

create index if not exists profils_role_id_idx on public.profils (role_id);

drop table if exists public.etats_session;

insert into public.roles (id, label, description) values
  ('super-admin', 'Super-administrateur', 'Accès intégral, comptes fondateurs protégés'),
  ('administrateur', 'Administrateur', 'Pilotage complet, équipe et finances'),
  ('gestionnaire', 'Gestionnaire', 'Opérations quotidiennes sans administration d''équipe'),
  ('prestataire', 'Prestataire', 'Missions, documents d''intervention et messagerie'),
  ('lecteur', 'Lecture', 'Consultation seule, sans modification')
on conflict (id) do update
  set label = excluded.label,
      description = excluded.description;

insert into public.permissions (id, groupe, titre, description) values
  ('voir-reservations', 'Lecture', 'Voir les réservations', 'Accès en lecture aux réservations'),
  ('voir-finances', 'Lecture', 'Voir les finances', 'Accès en lecture aux données financières'),
  ('voir-biens', 'Lecture', 'Voir les biens', 'Accès en lecture aux fiches biens'),
  ('voir-documents', 'Lecture', 'Voir les documents', 'Accès aux documents et contrats'),
  ('messagerie', 'Lecture', 'Messagerie', 'Envoyer et recevoir des messages'),
  ('voir-calendrier', 'Lecture', 'Voir le calendrier', 'Accès au calendrier et aux vues annuelles'),
  ('mod-reservations', 'Modification', 'Modifier les réservations', 'Créer et modifier des réservations'),
  ('mod-finances', 'Modification', 'Modifier les finances', 'Saisir et modifier les montants'),
  ('mod-biens', 'Modification', 'Modifier les biens', 'Créer et modifier les fiches biens'),
  ('mod-missions', 'Modification', 'Mettre à jour les missions', 'Changer le statut des missions et interventions'),
  ('gerer-equipe', 'Administration', 'Gérer l''équipe', 'Inviter, modifier les droits et supprimer des membres')
on conflict (id) do update
  set groupe = excluded.groupe,
      titre = excluded.titre,
      description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select 'super-admin', id from public.permissions
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'administrateur', id from public.permissions
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'gestionnaire', id from public.permissions where id <> 'gerer-equipe'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id) values
  ('prestataire', 'voir-calendrier'),
  ('prestataire', 'voir-documents'),
  ('prestataire', 'messagerie'),
  ('prestataire', 'mod-missions'),
  ('lecteur', 'voir-reservations'),
  ('lecteur', 'voir-biens'),
  ('lecteur', 'voir-documents'),
  ('lecteur', 'voir-calendrier')
on conflict do nothing;
