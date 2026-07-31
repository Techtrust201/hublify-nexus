# Audit corrigé — V2 Redris → Hublify (avant toute construction)

Vos 4 corrections sont acceptées et vérifiées. Ce document remplace les affirmations trop fortes du précédent audit.

---

## 1. Audit figmake — VÉRIFIÉ : aucun code source n'est accessible

Méthode : `V2_Redris_copie.fig` (ZIP) → `canvas.fig` (`fig-kiwi`, 2,74 Mo) → bloc de données zstd décompressé (37,18 Mo, 18,36 M de caractères lisibles). Recherche exhaustive de signatures de code dans la totalité du binaire :

| Signature recherchée | Occurrences |
|---|---|
| `import React` | **0** |
| `from "react"` / `from 'react'` | **0** |
| `export default function` | **0** |
| `useState(` | **0** |
| `const [` | **0** |
| `className=` | **0** |
| `return (` | **0** |
| `codeSyntax` / `devStatus` | **0** |
| `github` | **0** |
| `React` / `Vite` / `Tailwind` / `Next.js` (en clair) | **0** |
| `figmake` (marqueur `m2d_node` / `make_to_design_build_data`) | 141 |

**Conclusion corrigée : je retire l'affirmation « la maquette est l'export d'une application déjà générée. »**
Ce qui est prouvé : le fichier porte 141 marqueurs `figmake` (Figma Make → Design) et 23 **chemins de fichiers** en métadonnées. Rien d'autre. Aucun octet de code source, aucun import, aucun export, aucune dépendance, aucun lien de dépôt.

Échelle de preuve, position réelle du dossier :

| Niveau | Statut |
|---|---|
| 1. Métadonnées mentionnant des fichiers | **ATTEINT** |
| 2. Code source réellement accessible | **NON — 0 occurrence** |
| 3. Code complet ou fragments | **NON** |
| 4. Projet compilable | **NON VÉRIFIABLE** |
| 5. Application fonctionnelle | **NON VÉRIFIABLE** |
| 6. Dépôt GitHub historique | **AUCUNE TRACE** |

### `docs/FIGMAKE_CODE_AUDIT.md` (à créer au lancement du lot)

23 lignes, une par fichier référencé. Les colonnes « imports », « exports », « dépendances », « erreurs » seront toutes renseignées **`indisponible — métadonnée seule`**, car le contenu n'est pas dans le fichier. Extrait :

| Fichier (chemin métadonnée) | Occurrences | Contenu accessible | Imports/Exports/Deps | Rôle apparent (déduit des calques) | Complétude | Réutilisation réelle |
|---|---|---|---|---|---|---|
| `/src/app/components/Dashboard.tsx` | 14 566 | Métadonnée seule | Indisponible | Vue générale gestionnaire | Inconnue | Aucune — à reconstruire d'après le visuel |
| `/src/app/components/AnnualCalendarPage.tsx` | 5 309 | Métadonnée seule | Indisponible | Calendrier annuel / missions / tarifs | Inconnue | Aucune |
| `/src/app/components/DocumentsPage.tsx` | 3 156 | Métadonnée seule | Indisponible | Documents | Inconnue | Aucune |
| … 20 autres (Modeles, TeamMate, Messaging, Patrimoine, PropertyConfiguration, Analytics, CreateReservation, Reservations, Inventory, InventoryInspection, AccessSheet, Settings, AddPrestataire, ManagerProfileInfo, TravelerProfile, ModernProfile, reservation-modal, PaymentFormModal, add-event-modal, App) | 5 → 2 195 | Métadonnée seule | Indisponible | — | Inconnue | Aucune |

**Conséquence pratique : ces 23 noms servent uniquement de nomenclature d'écrans, pas de code à récupérer.** Si un dépôt Figma Make ou GitHub existe côté Yannick, il faut le fournir : cela changerait complètement l'économie du chantier.

---

## 2. Les trois stacks, séparées

| Origine | Stack | Statut |
|---|---|---|
| **A. Projet de travail actuel** (ce dépôt Lovable, créé pour Hublify) | React 19, TypeScript, Vite 7, Tailwind v4, TanStack Start + TanStack Router (routage par fichiers) | **VÉRIFIÉ** — lu dans `package.json`, `src/router.tsx`, `src/routeTree.gen.ts` |
| **B. Stack décrite dans les métadonnées Figma** | Aucune. Seule une arborescence `/src/app/components/*.tsx` suggère du React/TSX. Aucun `Vite`, `Next`, `Tailwind`, `package.json` dans le fichier | **NON DÉTERMINÉE** |
| **C. Ancien dépôt Hublify / REDRIS** | Inconnu | **AUCUN DÉPÔT FOURNI NI DÉTECTÉ** |

Je ne présente **pas** A comme un dépôt historique Hublify : c'est un projet vierge de travail. Le choix TanStack vient du gabarit, pas de moi ; une bascule React Router reste possible et ne touche que le dossier des routes.

---

## 3. Gestion locative / conciergerie — hiérarchisation, pas séparation

Formulation corrigée : **la maquette mélange une orientation gestion locative et financière avec une orientation opérationnelle de conciergerie. Leur hiérarchie dans la V1 reste à décider.** Ce peuvent être deux pans d'une même plateforme.

| Orientation | Modules concernés | Valeur apportée | Complexité | Décision nécessaire |
|---|---|---|---|---|
| Gestion locative & financière | Vue générale (loyers, impayés), Réservations, Locataires, Documents/Modèles (baux, quittances), Paiements, Analytics, Tarifs | Revenus, conformité, relation propriétaire | Élevée (juridique, comptable, paiements) | Est-ce le cœur V1 ? Traite-t-on l'argent en V1 ? |
| Conciergerie opérationnelle | Calendrier missions, Fiches d'intervention, Prestataires, Fiche d'accès, États des lieux, Messagerie, (mobile prestataire) | Exécution terrain, traçabilité, gain de temps | Moyenne (statuts, assignation, preuves) | Est-ce le cœur V1 ? Quels statuts de mission ? |
| Socle commun aux deux | Patrimoines, Occupants, Team mate & droits, Documents, Identité/Navigation | Indispensable dans les deux cas | Faible à moyenne | Vocabulaire officiel à figer |

Décision attendue des associés : **quelle orientation est centrale en V1**, l'autre devenant satellite.

---

## 4. Sources — et un blocage à lever

- **SOURCE PRINCIPALE — `V2 Redris` (version reprise par Yannick)** : disponible, analysée (`V2_Redris_copie.fig`, 37 649 frames, 51 sections, 14 448 textes).
- **SOURCE SECONDAIRE — `Redris V2` (ancienne maquette, wireframes Mobile First – Prestataire)** : **NON FOURNIE**. Vérifié : les fichiers déposés ne contiennent que la V2 Redris actuelle, et le mot « mobile » y apparaît **0 fois** (0 frame mobile, 0 barre de navigation basse).

**Il me faut donc l'export `.fig` de l'ancienne maquette Redris V2 pour construire le mobile prestataire d'après une source réelle.** Sans ce fichier, tout écran mobile serait inventé — ce que vous m'avez demandé de ne pas faire silencieusement.

Règle appliquée : tout élément repris de l'ancienne maquette sera étiqueté **« Source secondaire — à revalider »** dans le code (commentaire d'en-tête) et dans la matrice de traçabilité. Aucun mélange silencieux.

---

## 5. Deux propositions de lot 1

### LOT 1A — strictement fidèle à V2 Redris actuelle

| Écran | Fichier / frame source | Observé | Adapté | Inventé | Décision requise |
|---|---|---|---|---|---|
| Identité Hublify + purge REDRIS | `Maq V1 Gestionnaire/ Redris`, `2025 Redris`, `john.doe@redris.com` | Textes à purger | Renommage | Nom de marque affiché | Couleur de marque |
| Tokens | `V2_Redris_copie_.design.json` + couleurs relevées | Gris #101828→#99A1AF, surfaces, 4/8/12/16/24, rayons 4/8/12/16 | — | Couleur d'accent (aucune dans la maquette) | Accent + Inter ou Nunito Sans |
| Layout gestionnaire | `Dashboard Sidebar`, `NavItem` | 10 entrées de nav, en-tête, `Compte gestionnaire` | Regroupement « Outils » | — | Arborescence « Outils » |
| Vue générale | `Dashboard.tsx` (variante principale) | Cartes loyers/impayés/événements/arrivées | — | — | Garde-t-on le financier ? |
| Calendrier missions 3 jours + mois | `Vision Missions Calendar` | Grille, filtres, `+1 mission` | 2 vues sur 12 variantes | — | Vues retenues |
| Détail mission | `Voir infos missions / Détails`, `Fiche intervention` | Champs, membres assignés | Assemblage en un panneau | Statuts reliés | Cycle de statuts |
| Prestataires + ajout | `AddPrestataireForm.tsx`, `Mes prestataires` | Liste, catégories, formulaire | — | — | Catégories officielles |

Complexité : **faible à moyenne**. Effort relatif : **1×**. Risque d'invention : **très faible**. Limite : démontre une mise en page, pas un parcours métier.

### LOT 1B — parcours métier complet (recommandé, sous condition)

| Écran | Source principale | Source secondaire | Observé | Adapté | Inventé | Décision requise |
|---|---|---|---|---|---|---|
| Identité + tokens + layout gestionnaire | V2 Redris | — | Oui | Faible | Accent | Marque |
| Calendrier / suivi des missions | `Vision Missions Calendar` | — | Oui | Réduit à 1 vue | — | — |
| Détail mission gestionnaire | `Voir infos missions`, `Fiche intervention` | — | Oui | Assemblé | Actions de statut | Cycle de statuts |
| Assignation à un prestataire | `Membres assignés`, `AddPrestataireForm.tsx` | — | Partiel | Oui | Bouton « Assigner » | — |
| **Mobile prestataire : réception** | — | `Redris V2` Mobile First (à fournir) | — | — | **Total si fichier absent** | Fichier source |
| **Acceptation / refus** | — | idem | — | — | idem | Refus motivé ? |
| **Démarrage** | — | idem | — | — | idem | Géoloc/horodatage ? |
| **Preuve photo** | `Photo du compteur en cours` (inventaire) | idem | Partiel | Oui | Upload prestataire | Nb de photos, obligatoire ? |
| **Clôture** | — | idem | — | — | idem | Validation gestionnaire ? |
| Synchronisation simulée des statuts | — | — | — | — | Machine à états en mémoire | Liste des statuts |

Complexité : **moyenne à élevée**. Effort relatif : **2,5×**. Risque d'invention : **élevé sans l'ancien `.fig`, faible avec**.

---

## 6. Traçabilité — `docs/SOURCE_MAPPING.md`

Créé dès le premier écran et tenu à jour à chaque ajout, une ligne par écran construit :

| Écran construit | Source principale | Source secondaire | Nom du frame/composant | Fidèle | Adapté | Inventé | Décision requise |
|---|---|---|---|---|---|---|---|

Chaque fichier de composant portera aussi un en-tête de commentaire : `SOURCE: V2 Redris — <frame>` ou `SOURCE SECONDAIRE — à revalider: Redris V2 — <frame>` ou `INVENTÉ — à valider`.

---

## 7. Ma recommandation motivée

**Je recommande le LOT 1B, votre variante** : gestionnaire tiré de la V2 de Yannick, mobile prestataire tiré uniquement de l'ancienne maquette, une seule mission fictive traversant les deux interfaces. C'est le seul lot qui teste le cœur potentiel de Hublify plutôt qu'un tableau de bord de chiffres fictifs.

**Condition bloquante : fournissez l'export `.fig` de l'ancienne maquette Redris V2 (partie Wireframes Mobile First – Prestataire).** Sans lui, le lot 1B devient 60 % inventé, ce qui contredit votre méthode.

Trois issues possibles, à votre main :
1. Vous fournissez l'ancien `.fig` → je construis le **lot 1B** tel que recommandé.
2. Vous ne l'avez pas sous la main → je construis le **lot 1A** maintenant, et le mobile prestataire est ajouté en lot 2 dès réception.
3. Vous acceptez un mobile prestataire proposé par moi → je construis le lot 1B en marquant **chaque écran mobile « INVENTÉ — à valider »**, écran par écran.

## 8. Décisions toujours en attente

1. Orientation centrale V1 : locative/financière ou conciergerie.
2. Couleur de marque Hublify + Inter ou Nunito Sans.
3. Liste et transitions des statuts de mission.
4. Rôles et permissions Team mate.
5. Vocabulaire officiel (Patrimoine/Bien · Occupant/Locataire/Voyageur · Mission/Intervention/Événement).
6. Périmètre : Tarifs, Paiements, Analytics, États des lieux, Portail voyageur.
7. Écran de connexion (absent des deux sources connues à ce jour).
8. React Router ou maintien de TanStack Router.

Aucune base de données, aucun paiement, aucune intégration externe dans ce lot.
