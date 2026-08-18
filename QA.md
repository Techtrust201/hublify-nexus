# QA — Recette responsive

Branche `feat/responsive-ux`. Date : 18 août 2026. Captures PNG **non versionnées** (`docs/audit/*.png` dans `.gitignore`). Paires de référence locales : dashboard-375, occupants-375, messagerie-375, dashboard-1440. Régénération : `node docs/audit/capture-after.mjs`.

## Automate (à relancer)

Script Playwright `docs/audit/capture-after.mjs` : overflow page + 4 paires (dashboard 375/1440, occupants 375, messagerie 375).

Critères bloquants par écran :

- [ ] `document.documentElement.scrollWidth <= clientWidth` (zéro scroll X de **page**)
- [ ] Pas de contenu métier clipé (`overflow-hidden` sans scroll interne)
- [ ] Cibles principales ≥ 44×44 px sous 768 px (hamburger, prev/next, composer, CTA)
- [ ] Drawer : overlay, Escape, clic extérieur, `aria-expanded`, nav complète

## Viewports

| Largeur | Orientation | Chrome | Dashboard | Résa | Occupants | Messagerie | Docs |
|---|---|---|---|---|---|---|---|
| 320 | portrait | drawer | [x] | [x] | [x] | [x] | [x] |
| 375 | portrait | drawer | [x] | [x] | [x] | [x] | [x] |
| 768 | portrait | drawer | [x] | [x] | [x] cartes | [x] liste | [x] |
| 810 | tablette | drawer | [x] | [x] | [x] | [x] | [x] |
| 1024 | — | **sidebar** | [x] | [x] | table | split | [x] |
| 1440 | — | sidebar | [x] | [x] | [x] | [x] | [x] |
| 1920 | — | sidebar | [x] | — | — | — | — |
| 2560 | — | sidebar | [x] | — | — | — | — |

## Landscape téléphone (~812×375)

- [x] Header sticky + `safe-area-inset-top`
- [x] Planning : scroll X interne, pas de scroll page
- [x] Drawer utilisable (255 px &lt; 812)

## Zoom 200 % (Chrome)

- [x] Texte wrapping (`overflow-wrap: anywhere`)
- [x] Pas de recouvrement hamburger / cloche (header `min-w-0` + truncate titre)
- [ ] Contraste muted `#99a1af` : **échec AA connu** (maquette, voir UX-NOTES)

## iOS Safari

- [x] `viewport-fit=cover` dans le meta viewport
- [x] `env(safe-area-inset-*)` header / drawer / `main` padding-bottom
- [x] Inputs métier `text-base` (16 px) sous `md` — anti-zoom focus
- [x] `min-h-dvh` / messagerie `100dvh`
- [ ] À valider sur device réel (simulateur non exécuté ici)

## Navigation

- [x] Un seul seuil 1024 px : plus de trou 640–767
- [x] Hamburger `size-11`, `aria-expanded` / `aria-controls="nav-mobile"`
- [x] Overlay + fermeture Escape / clic extérieur (Radix Sheet)
- [x] Scroll-lock + focus trap + focus restitué au hamburger
- [x] Nav complète : Vue générale, Missions, Tarifs, Réservations, Documents, Prestataires, Occupants, Patrimoines, Inventaire, Messagerie, Team, Outils, Modèles, Vue annuelle, Profil

## Planning

- [x] Pas de vue jour
- [x] `scroll-snap` + fade droit `lg:hidden`
- [x] Colonne biens `sticky left-0` fond opaque
- [x] Prev / next `size-11`

## Tables

- [x] Occupants : plus de clip `overflow-hidden` ; cartes &lt; 768 ; table `md+`
- [x] Réservations : filtres période visibles en chips mobile ; cartes &lt; 768
- [x] Inventaire / Patrimoine / Modèles / Documents : `ScrollHint`

## Messagerie

- [x] Sous 1024 : liste seule → tap → fil + Retour
- [x] `lg+` : split inchangé
- [x] Composer `text-base` / boutons `size-11` mobile

## A11y lot 4

- [x] Skip link « Aller au contenu »
- [x] `focus-visible` outline ink
- [x] `prefers-reduced-motion` (déjà lot 0)
- [x] Toaster `aria-live="polite"`
- [x] InfosOccupants + fiche Occupants → Dialog Radix
- [x] 404 / erreur déjà en français (`__root.tsx`)

## Récapitulatif des 19 routes

| Route | Traitement | Confiance |
|---|---|---|
| `/` Dashboard | KPI empilés, planning snap + sticky, filtres messages sans chevauchement | **haute** |
| `/missions` | Même `PlanningGrid` | **haute** |
| `/missions/$id` | Formulaire existant, chrome 1024 | **haute** |
| `/reservations` | Planning snap + liste cartes &lt; 768 + filtres période mobile | **haute** |
| `/reservations/nouveau` | `text-base` / `h-11` / `inputMode` | **haute** |
| `/occupants` | P0 clip corrigé, cartes &lt; 768, Dialog fiche | **haute** |
| `/documents` | Hub OK ; listes `ScrollHint` | **haute** |
| `/prestataires` | Cartes déjà ; chips 44 px mobile | **haute** |
| `/prestataires/nouveau` | Formulaire existant | **moyenne** |
| `/prestataires/$id` | Fiche existante | **moyenne** |
| `/patrimoines` | `ScrollHint` tables | **haute** |
| `/inventaire` | `ScrollHint` | **haute** |
| `/messagerie` | Master-detail 1024 + Retour, composer 44 px | **haute** |
| `/tarifs` | Même planning | **haute** |
| `/team` | Liste qui wrap, cibles 44 px, Dialogs existants | **haute** |
| `/outils` | Grille `sm:2` / `lg:3` | **haute** |
| `/outils/modeles` | Cartes + table `ScrollHint` | **haute** |
| `/outils/vue-annuelle` | Mois empilés, cellules 44 px mobile | **haute** |
| `/profil` | Onglets 44 px, `Champ` 16 px | **haute** |

Mesures live (après correctif onglets) : overflow page = **0** à 320 / 375 / 768 / 1440. Hamburger **44×44**.

## Limites acceptées

- Pastilles planning 10 px (maquette).
- Chips desktop &lt; 44 px au-dessus de `md`.
- Contraste muted sous AA (maquette).
