# QA — Recette responsive et sécurité

Branche `feat/responsive-ux`. Dernière passe : 24 août 2026. Captures PNG **non versionnées** (`docs/audit/*.png` dans `.gitignore`).

## Sécurité de l'état métier

`chargerEtatDistant` / `sauverEtatDistant` sont des endpoints HTTP publics. Ils dérivent
l'identifiant de l'utilisateur de la session (`auth.api.getSession`) et n'acceptent **aucun**
identifiant en entrée. La règle est testée à deux niveaux.

| Vérification | Commande | Ce qu'elle prouve |
|---|---|---|
| Unitaire (`src/data/etat-distant.test.ts`) | `npm test` | Sans session : refus, aucune requête SQL. Avec session : l'UUID interpolé est celui de la session. |
| Sonde d'exploitation | `npm run audit:idor` | Un compte Lecture qui forge l'`userId` du super-admin reçoit **son propre** état. |
| Cloisonnement par rôle (`e2e/securite.spec.ts`) | `npm run e2e` | Prestataire et Lecture n'ouvrent pas `/team`, `/tarifs`, `/reservations/nouveau`. |
| Étanchéité entre comptes | `npm run e2e` | Un événement créé par l'admin est invisible pour le compte suivant, y compris dans `localStorage`. |
| Échec d'enregistrement | `npm run e2e` | Écriture serveur coupée → bandeau d'alerte, puis reprise au clic. |

Mesure du 24 août sur `http://127.0.0.1:8080`, appel forgé depuis une session Lecture :

| Appel | Réponse |
|---|---|
| État du super-admin (sa propre session) | 200, **37 404 octets** |
| État du lecteur (sa propre session) | 200, **35 602 octets** |
| Lecteur + `?data={"userId":"<uuid super-admin>"}` | 200, **35 602 octets** — identique à son propre état |

`npm run audit:idor` sort en code 1 si une réponse servie à un compte correspond à l'état d'un autre.

La suite e2e exige une base et les comptes de démo. Sans `DATABASE_URL`, les tests concernés
sont **ignorés en local** (`test.skip`). **En CI ils s'exécutent obligatoirement** : le workflow
démarre Postgres 16, applique le schéma, sème les comptes, puis lance Playwright. `src/lib/sql.ts`
parle le protocole Postgres standard (`pg`) — le même client que Better Auth — donc un service
GitHub ou `docker compose up -d` suffisent. Sans `DATABASE_URL` en CI, Playwright **échoue** au
chargement de la config, au lieu de passer au vert en silence.

## Automate responsive — mesure, pas d'œil nu

Trois scripts Playwright, tous connectés avec le compte de démo (`.env.local`) :

| Commande | Couverture |
|---|---|
| `npm run audit:responsive` | 24 routes × largeurs (`WIDTHS=…`, défaut 320→1024) |
| `npm run audit:surcouches` | ouvre tous les déclencheurs de dialogue / panneau et mesure |
| `npm run audit:etats` | états inatteignables par URL : fil de messagerie mobile, drawer, planning défilé, menus |
| `npm run audit:idor` | sonde de sécurité : lecture forgée de l'état d'un autre compte |

Variables d'environnement de `audit:responsive` :

- `ROUTES=/a,/b` — restreint la liste des routes
- `ANONYME=1` — mesure l'app **déconnectée** (sans cette option la page de connexion redirige vers l'accueil et n'est donc jamais mesurée)
- `EMAIL=…` — rejoue le balayage avec un autre rôle (nav et droits différents)

Détections (`docs/audit/probe-page.mjs`) :

- **SCROLL-X PAGE** — `documentElement.scrollWidth > clientWidth`
- **SQUEEZE** — élément flex/grid comprimé sous son contenu : cause n°1 des superpositions
- **BLEED** — élément dont le rect visible sort du viewport
- **OVERLAP** — paires d'éléments texte / contrôles qui se recouvrent (rects rognés par les ancêtres à scroll)
- **CLIP** — contenu masqué par `overflow-hidden` sans scroll possible (hors troncature `truncate` volontaire)
- **TARGET** — cible interactive < 24 px sous 768 px (minimum WCAG 2.5.8 AA). La zone mesurée est la
  zone réellement cliquable : un `<label>` englobant compte pour la cible de sa case à cocher. Les cibles
  de 24 à 43 px sont listées à part, en informatif.

Les 24 routes couvrent **toutes** les routes de page de l'app (`src/routes`, hors `api/auth`), y compris
les variantes par paramètre d'URL (`/reservations?vue=liste` et `?vue=planning`) et la page 404.

Dernier résultat : **0 SCROLL-X / SQUEEZE / BLEED / OVERLAP / CLIP / TARGET** sur les 24 routes,
pour les **4 rôles** (super-admin, gestionnaire, prestataire, lecture) et en déconnecté,
surcouches et états interactifs inclus, plus le paysage téléphone 812×375.

> Piège à éviter en relançant ces scripts : ne pas passer la sortie dans `tail`/`head`. Le compteur final
> reste juste mais la liste des défauts est coupée — c'est ce qui avait masqué le débordement de
> `/reservations?vue=liste` pendant plusieurs passes.

## Défauts trouvés et corrigés le 24 août

| Symptôme | Cause | Correctif |
|---|---|---|
| `/profil` : cartes larges de 690 px, tableau par-dessus la colonne de droite (jusqu'à 386 px de scroll page à 320) | colonnes de grille sans `min-w-0` : la piste se dimensionnait sur le `min-w-[640px]` du tableau | `min-w-0` sur les deux colonnes |
| `/team` : bouton « Envoyer un message » par-dessus le rôle | bloc texte `flex-1` écrasé à 5 px par le groupe d'actions resté sur la même ligne | groupe d'actions `w-full sm:w-auto` |
| `/messagerie` à 1024 : nom du contact réduit à 35 px | 6 boutons outils `shrink-0` sur la ligne du nom | en-tête `flex-wrap`, nom `basis-40`, outils `w-full sm:w-auto` |
| Tableau de bord : lignes de loyers écrasées à 390 px | même motif ligne / actions | texte `basis-32`, actions `w-full sm:w-auto` |
| Dialogue « Créer un événement » : contenu 6 px hors écran à 320 | `DialogContent` en `grid` sans piste bornée | base `grid-cols-1` + `w-[calc(100%-1.5rem)]` + `max-h-[92dvh] overflow-y-auto` |
| Barres de mission par-dessus la colonne « biens » collée du planning | barres et colonne toutes deux en `z-10`, les barres plus loin dans le DOM | barres `z-[1]`, colonne `z-[5]`, en-tête app `z-sticky` (10) |
| Menu « + Assigner » coupé | carte parente en `overflow-hidden` | `overflow-hidden` retiré, menu borné à `min(12rem, 100vw-4rem)` |
| Inventaire : recherche 320 px rognée par la carte | `w-[320px]` plus large que la carte à 320 | `w-full sm:w-[320px]` |
| Planning tarifs : onglet sous le bouton « Gérer les ensembles de règles » | bouton sans `shrink-0` dans la barre d'onglets | icône seule sous `md` (`aria-label` conservé) + `shrink-0` |
| Stepper « Je débute » : 344 px de contenu à 320 | 3 étapes sur une ligne | étapes empilées sous `sm`, chevrons masqués |
| Bandeau « Événements en cours » rogné de 18 px | en-tête sans `flex-wrap` | `flex-wrap` + `shrink-0` sur les actions |
| `/reservations?vue=liste` à 320 : filtres de statut hors de leur carte (26 px rognés) | segment 4 boutons `flex` non réductible : 312 px de contenu pour 286 px | grille 2×2 sous `md`, ligne unique au-delà |
| Cases à cocher de 4 tableaux sans nom accessible | `<input type="checkbox">` sans `aria-label` ni `<label>` associé | `aria-label` explicite + `<label>` englobant de 44 px |
| Champs du formulaire prestataire, pagination, filtres plateforme, CTA 404 / stepper sous 44 px | hauteurs fixes de maquette desktop appliquées aussi en mobile | `h-11` sous `md`, hauteur MO1 restaurée au-dessus |
| Recherche inventaire encore à 39 px entre 640 et 767 px | override écrit en `sm:` (640) alors que la règle tactile porte jusqu'à 768 | `md:` à la place de `sm:` pour la hauteur |

Critères bloquants par écran :

- [x] `document.documentElement.scrollWidth <= clientWidth` (zéro scroll X de **page**)
- [x] Pas de contenu métier clipé (`overflow-hidden` sans scroll interne)
- [x] Aucun élément flex/grid comprimé sous son contenu
- [x] Cibles principales ≥ 44×44 px sous 768 px (hamburger, prev/next, composer, CTA)
- [x] Drawer : overlay, Escape, clic extérieur, `aria-expanded`, nav complète

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

Trois routes s'ajoutent à ce tableau, absentes des passes précédentes : `/reservations?vue=liste`
(vue tableau par paramètre d'URL), la page 404 et l'écran d'erreur du routeur.

Mesures live : overflow page = **0** sur les 24 routes, pour les 4 rôles et en déconnecté,
dialogues et états interactifs inclus.

## Limites acceptées

- Chips de mission du planning et bouton « +N voir plus » : **24 px** sous `md` (minimum WCAG 2.5.8 AA
  respecté), `21px` / `19px` au-dessus pour rester fidèle à MO1. Les porter à 44 px empilerait plusieurs
  cibles par cellule de jour et triplerait la hauteur du planning : arbitrage de densité assumé, le détail
  de chaque mission restant accessible via son dialogue.
- Chips desktop &lt; 44 px au-dessus de `md`.
- Contraste muted sous AA (maquette).
- Troncature `truncate` volontaire sur les libellés longs (sous-titres, aperçus de messages).
- Formatage Prettier : 47 fichiers non conformes **avant** cette passe ; non touché pour garder le diff lisible (la CI `verify.yml` ne vérifie pas le formatage).
