# UX-NOTES — Refonte responsive

Décisions prises pendant le run (lots 0–4), sans validation intermédiaire. Règle : rester le plus proche du desktop MO1.

## Problèmes d’ergonomie déjà dans la maquette

Ces points **ne sont pas « corrigés »** : les changer casserait la fidélité MO1.

1. **Contraste des gris** — `#99a1af` (`--ink-muted`) et placeholders `#d1d5dc` (`--line-strong`) vs texte blanc/fond clair. Ratio souvent sous WCAG AA. Conservé tel quel.
2. **Densité du planning** — pastilles missions `h-[21px]` / `text-[10px]`. Illisibles au doigt ; c’est la densité de la grille 3 jours. Conservé. Compensation : scroll-snap + colonne biens sticky + prev/next 44 px.
3. **Cloche notifications** — présente dans le chrome, comportement mock (liste session). Pas un vrai centre de notifications. Déjà documenté SOURCE ; inchangé.
4. **Vocabulaire Occupant vs Voyageur** — l’UI Occupants mélange « résidents », « locataires », « voyageurs ». Aligné sur l’écran existant, pas sur `docs/DECISIONS.md`.

## Décisions solo (conservatrices)

| Sujet | Choix | Justification |
|---|---|---|
| Seuil chrome | **1024 px (`lg`)** unique | Ferme le trou 640–767. Sidebar desktop inchangée au-dessus. |
| Nav mobile | Drawer Sheet 255 px, overlay `bg-ink/40` | Réplique la sidebar ; overlay plus proche navy MO1 que `black/80` shadcn. |
| Vue générale desktop | Dropdown header **conservé** | Le drawer mobile liste Missions/Tarifs. Desktop : menu existant. |
| Outils dans la sidebar | Liens Modèles / Vue annuelle / Inventaire **aussi** en sidebar | Sinon le drawer et la sidebar divergeraient. Desktop gagne 3 liens ; dropdown « Outils » reste. |
| Planning mobile | Scroll X + `scroll-snap`, **pas** de vue jour | Une vue jour changerait l’architecture de l’information. |
| Colonne biens | `sticky left-0` fond blanc | Reste lisible pendant le scroll des jours. |
| Tables Occupants / Réservations | Cartes empilées **&lt; 768 px** | Usage : une ligne = une personne / une resa. |
| Tables Inventaire / Patrimoine / Modèles / Documents | Scroll X + dégradé | Trop de colonnes pour des cartes fidèles. |
| Messagerie | Master-detail, bascule **1024 px**, bouton Retour | Liste seule par défaut sous `lg` ; tap ouvre le fil. |
| Tokens | Hex MO1 **gagne** vs oklch shadcn | `--ink: #1e2939`, etc. Bloc `.dark` intact, non activé. |
| Overlay Dialog (InfosOccupants, fiche Occupants) | Kit shadcn `black/80` + focus trap | Priorité a11y (trap, Escape, restitution) vs overlay navy custom sans trap. |
| Vue annuelle | Cellules `h-11` mobile, `size-7` desktop | Desktop reste fidèle ; mobile devient cliquable. |
| Pastilles planning | Taille maquette conservée | Voir problème n°2. |
| Chips desktop | 30–34 px au-dessus de `md`/`lg` | Le mockup desktop n’est pas 44 px. Mobile seulement. |
| Double intitulé Messagerie | Titre AppShell + bandeau interne | Le bandeau interne existe sur desktop (compteur, archives). |
| Occupants `h1` page | Conservé (28 px), AppShell sans titre | Fidèle à l’écran liste ; le header mobile n’affiche que hamburger + cloche, comme la Vue générale. |
| `overflow-wrap` | `break-word` (pas `anywhere`) | `anywhere` coupait « Missions / Réservations » au milieu des onglets planning à 320 px. |
| KPI dashboard | `md:grid-cols-3` conservé | Sans sidebar sous 1024, 768 px tient 3 cartes. |
| Hub Outils | `sm:2` / `lg:3` colonnes | Évite 3 cartes trop étroites à 768. |

## Hors périmètre respecté

Pas de rewrite, pas de nouvelle lib UI, pas de dark mode, pas de changement métier / endpoints, pas d’effet visuel absent de la maquette (pas de glassmorphism).
