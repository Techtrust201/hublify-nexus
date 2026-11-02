-- L'outil inventaire de la maquette est celui de la conciergerie (linge, consommables).
-- L'onglet « linge » s'ajoute aux valeurs déjà stockées.

alter table public.inventaire_items drop constraint if exists inventaire_onglet;

alter table public.inventaire_items
  add constraint inventaire_onglet check (onglet in ('1', '2', 'conso', 'linge'));
