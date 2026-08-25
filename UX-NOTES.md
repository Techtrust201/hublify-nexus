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
| Outils sidebar vs drawer | Desktop : uniquement « En savoir plus » → `/outils` (maquette). Drawer mobile : liste complète (Modèles, Vue annuelle, Inventaire). | Les 3 liens extra en sidebar desktop ont été retirés — absents de la maquette. |
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

## Passe du 24 août — superpositions mobile / tablette

Le retour terrain (« gros problèmes de superposition ») venait d'un seul motif CSS, décliné à
plusieurs endroits : **un enfant flex/grid dont la taille minimale automatique n'est pas bornée**.
Un bloc texte `flex-1` posé à côté d'un groupe de boutons reste sur la même ligne, se fait
comprimer jusqu'à 3–5 px, et son contenu déborde en `overflow: visible` — donc **par-dessus** le
bouton voisin. Même mécanisme pour une piste de grille qui se dimensionne sur le `min-w-[640px]`
d'un tableau, ou pour `DialogContent` en `grid` sans piste bornée.

| Sujet | Choix | Justification |
|---|---|---|
| Groupes d'actions en bout de ligne | `w-full sm:w-auto` | La ligne passe le groupe à la ligne suivante au lieu d'écraser le texte. Retenu plutôt qu'un `min-w` sur le texte, qui déplacerait juste le débordement sur les boutons. |
| Colonnes de grille contenant un tableau | `min-w-0` explicite | Sans lui, la piste `auto` prend la largeur mini du tableau et sort de l'écran. |
| Base `DialogContent` | `grid-cols-1` + `w-[calc(100%-1.5rem)]` + `max-h-[92dvh] overflow-y-auto` | Corrige **tous** les dialogues d'un coup : marge garantie à 320 px et scroll interne en paysage. |
| Empilement du planning | barres `z-[1]` &lt; colonne biens `z-[5]` &lt; en-tête `z-sticky` (10) | Avant, barres et colonne étaient à `z-10` : l'ordre DOM faisait passer les barres au-dessus de la colonne collée pendant le scroll horizontal. |
| Bouton « Gérer les ensembles de règles » | Icône seule sous `md`, `aria-label` conservé | Garder le libellé imposait soit un chevauchement des onglets, soit une seconde ligne absente de la maquette. |
| Stepper « Je débute » | Étapes empilées sous `sm` | Tronquer les trois libellés à ~30 px les rendait illisibles. |
| Carte « Droits d'accès » (`/team`) | `overflow-hidden` retiré | Le menu « + Assigner » était coupé par la carte. Aucun tableau à rogner dans cette carte. |

Instrumentation ajoutée sous `docs/audit/` (voir `QA.md`) : la détection **SQUEEZE** cible
directement ce motif, ce qui évite de chasser les superpositions à l'œil.

## Seconde passe — trous de couverture de l'audit

Les premières passes déclaraient « zéro défaut » alors que trois angles morts subsistaient. Ils sont
documentés ici parce que l'erreur portait sur la **méthode de mesure**, pas sur le CSS :

| Angle mort | Conséquence | Correction de l'outil |
|---|---|---|
| Sortie des scripts passée dans `tail -25` | Le compteur de défauts restait juste mais la liste était coupée : le débordement des filtres de `/reservations?vue=liste` est resté invisible plusieurs passes | Rapports conservés entiers dans `docs/audit/diag-*.txt` |
| Vues accessibles par paramètre d'URL non listées | `?vue=liste` jamais chargée directement, donc jamais mesurée | `/reservations?vue=liste` et `?vue=planning` ajoutées aux routes |
| Un seul rôle, et jamais l'état déconnecté | La page de connexion redirige vers l'accueil quand la session existe : elle n'était jamais mesurée. Les 3 autres rôles ont une nav et des droits différents | Options `ANONYME=1` et `EMAIL=…` |

| Sujet | Choix | Justification |
|---|---|---|
| Seuil de la règle tactile | Échec sous **24 px** (WCAG 2.5.8 AA), informatif de 24 à 43 px | Un seuil unique à 44 px mélangeait les vraies violations et les arbitrages de densité assumés, ce qui rendait le rapport illisible et poussait à l'ignorer. |
| Zone mesurée pour une case à cocher | Le `<label>` englobant, pas l'`<input>` | La zone réellement cliquable est le label. Mesurer l'input signalait des faux positifs et incitait à grossir la case, ce qui aurait dénaturé le visuel. |
| Lien d'évitement | Exclu de la règle tactile | Masqué jusqu'au focus clavier, il mesure 1×1 px par construction et n'est jamais une cible tactile. |
| Segment de filtres statut (`/reservations` liste) | Grille 2×2 sous `md` | Un segment de 4 boutons ne se réduit pas : à 320 px il réclamait 312 px pour 286 px disponibles. Le scroll horizontal cachait la moitié des filtres sans le signaler. |
| Overrides de hauteur tactile | Toujours en `md:`, jamais en `sm:` | `sm:` vaut 640 px alors que la règle tactile porte jusqu'à 768 px : un override en `sm:` laisse une bande de 128 px non conforme. |

## Passe du 24 août — fiabilité de l'enregistrement et cloisonnement des comptes

Ces choix sortent du responsive : ils viennent de la préparation à la commercialisation. Le détail
technique et les mesures sont dans `QA.md` et `docs/AUDIT-PRODUIT.md`.

| Sujet | Choix | Justification |
|---|---|---|
| Signalement d'un échec d'enregistrement | Bandeau `role="status"` **dans le flux**, sous l'en-tête | Une surcouche aurait recouvert du contenu et déplacé les cibles tactiles déjà mesurées. Le bandeau pousse la page vers le bas, sans recouvrement possible. |
| Reprise après échec | Paliers 2, 4, 8, 16 puis 30 s, plus l'événement `online`, plus un bouton « Réessayer » | Un échec réseau est le plus souvent transitoire. Sans reprise automatique, la seule issue serait un rechargement, qui n'aurait rien renvoyé. |
| Formulation des messages de succès | « Événement **ajouté** » et non « enregistré » | Le toast décrit l'action locale ; la durabilité est la responsabilité du bandeau. Les deux se contredisaient à l'écran quand l'écriture serveur échouait. |
| Clé `localStorage` | Une clé par utilisateur (`hublify.session.v4.<id>`), purge des autres à la connexion et de toutes à la déconnexion | La clé unique `v3` faisait hériter le compte suivant du parc du précédent sur un poste partagé. |
| Perte de la copie locale à la déconnexion | Assumée | Se déconnecter alors que le bandeau signale un échec perd les modifications non envoyées. L'alerte est affichée avant ; laisser l'état d'un compte lisible dans le navigateur est le risque le plus grave des deux. |
| Formulaire de connexion | Champs **non contrôlés** + bouton inactif jusqu'à l'hydratation | L'hydratation (≈ 2 s en dev) réinitialisait les champs contrôlés : ce qui avait été tapé avant était effacé, et le mot de passe repartait vide. |
| Panneau des comptes de démo | Masqué hors développement (`VITE_MODE_DEMO`) | Il affiche des e-mails nominatifs et un mot de passe en clair : inacceptable sur un déploiement client. |

## Hors périmètre respecté

Pas de rewrite, pas de nouvelle lib UI, pas de dark mode, pas d’effet visuel absent de la maquette (pas de glassmorphism).
