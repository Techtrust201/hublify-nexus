-- Plafonds de débit des formulaires publics (liste des bailleurs), partagés entre
-- toutes les instances serverless : un compteur en mémoire repart de zéro à chaque
-- démarrage à froid et n'est pas vu par les autres instances.
--
-- Strictement additive et idempotente : une nouvelle table, aucune donnée existante
-- touchée. Fenêtre fixe : une ligne par (clé, début de fenêtre), incrémentée de façon
-- atomique (insert … on conflict … returning). Les clés ne contiennent jamais d'adresse
-- e-mail en clair (empreinte SHA-256) ; les IP sont celles posées par la plateforme.
-- Les lignes de plus de 2 jours sont purgées au fil de l'eau par l'application.

create table if not exists public.cadence_publique (
  cle text not null,
  fenetre timestamptz not null,
  nombre integer not null default 0,
  primary key (cle, fenetre)
);

create index if not exists cadence_publique_fenetre_idx
  on public.cadence_publique (fenetre);
