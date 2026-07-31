# SOURCE_MAPPING — traçabilité écran par écran

Règle : aucun écran n'est construit sans une ligne dans ce tableau. Aucun mélange silencieux entre les deux maquettes.

## Niveaux de source

| Niveau | Fichier | Usage autorisé | Disponibilité |
|---|---|---|---|
| **SOURCE PRINCIPALE** | `V2 Redris` (version reprise par Yannick) — `V2_Redris_copie.fig` | Toute l'interface gestionnaire | Disponible |
| **SOURCE SECONDAIRE — à revalider** | `Redris V2` (ancienne maquette, *Wireframes Mobile First – Prestataire*) | Uniquement les parcours absents de la source principale | **NON FOURNIE à ce jour** |
| **INVENTÉ — à valider** | — | Uniquement si aucune source ne couvre le besoin, et signalé écran par écran | — |

## Étiquetage dans le code

Chaque fichier de composant construit porte un en-tête de commentaire :

```text
// SOURCE: V2 Redris — <nom du frame>
// SOURCE SECONDAIRE — à revalider: Redris V2 — <nom du frame>
// INVENTÉ — à valider: <justification>
```

## Matrice

| Écran construit | Source principale | Source secondaire | Nom du frame/composant | Fidèle | Adapté | Inventé | Décision requise |
|---|---|---|---|---|---|---|---|
| Layout + sidebar + en-tête (`src/components/layout/AppShell.tsx`) | V2 Redris | — | `Dashboard Sidebar`, `NavItem`, `Compte gestionnaire` | 10 entrées de navigation, en-tête, bloc compte | 7 entrées désactivées (hors périmètre), bouton de repli | Recherche non fonctionnelle, cloche décorative | Arborescence définitive de la navigation |
| Vue générale (`src/routes/index.tsx`) | V2 Redris | — | `Dashboard.tsx` (variante principale) | Cartes d'indicateurs, liste du jour, prochaines arrivées | Indicateurs recentrés sur les missions au lieu des loyers | — | Garde-t-on les cartes financières ? |
| Calendrier missions (`src/routes/missions.index.tsx`) | V2 Redris | — | `Vision Missions Calendar sur 3 jours`, `… mois complet` | Grille 3 jours, grille mois, filtre par bien | 2 vues sur 12 variantes ; filtre plateformes non repris | Compteurs par statut en tête | Vues et filtres définitifs |
| Détail mission (`src/routes/missions.$missionId.tsx`) | V2 Redris | — | `Voir infos missions`, `Détails`, `Membres assignés`, `Fiche intervention` | Champs date/créneau/bien/consignes, prestataire affecté | Assemblage en une page unique | Boutons de transition de statut | Cycle de statuts définitif |
| Liste prestataires (`src/routes/prestataires.index.tsx`) | V2 Redris | — | `Mes prestataires`, `Prestataires (5)` | Liste, catégories, compteur | Cartes + filtre par catégorie | Note sur 5, nombre de missions | Catégories officielles |
| Fiche prestataire (`src/routes/prestataires.$prestataireId.tsx`) | V2 Redris | — | détail prestataire | Coordonnées, catégorie | Bloc « missions affectées » | Note sur 5 | Champs de la fiche |
| Ajout prestataire (`src/routes/prestataires.nouveau.tsx`) | V2 Redris | — | `AddPrestataireForm.tsx`, `Enregistrer le prestataire` | Formulaire et libellé du bouton | Champs réduits au strict nécessaire | Case « prestataire actif » | Champs obligatoires |
| Tokens visuels (`src/styles.css`) | V2 Redris | — | `V2_Redris_copie_.design.json` | Gris, surfaces, rayons | Typographie Inter | **Couleur d'accent `--brand`** | Couleur de marque définitive |

## Lignes prévues — LOT 1A (strictement fidèle à V2 Redris)

| Écran construit | Source principale | Source secondaire | Nom du frame/composant | Fidèle | Adapté | Inventé | Décision requise |
|---|---|---|---|---|---|---|---|
| Identité Hublify / purge REDRIS | V2 Redris | — | `Maq V1 Gestionnaire/ Redris`, `2025 Redris`, `john.doe@redris.com` | — | Renommage | Nom affiché de la marque | Couleur de marque |
| Tokens de design | V2 Redris | — | `V2_Redris_copie_.design.json` + couleurs relevées | Gris `#101828`→`#99A1AF`, surfaces, espacements 4/8/12/16/24, rayons 4/8/12/16 | — | Couleur d'accent (absente de la maquette) | Accent + Inter ou Nunito Sans |
| Layout gestionnaire | V2 Redris | — | `Dashboard Sidebar`, `NavItem` | 10 entrées de navigation, en-tête, `Compte gestionnaire` | Regroupement « Outils » | — | Arborescence « Outils » |
| Vue générale | V2 Redris | — | `Dashboard.tsx` (variante principale, pas `option 2`) | Cartes loyers en retard / paiements / événements / arrivées | — | — | Garde-t-on les cartes financières ? |
| Calendrier missions (3 jours + mois) | V2 Redris | — | `Vision Missions Calendar sur 3 jours`, `... mois complet` | Grille, filtres logements & plateformes, `+1 mission` | 2 vues retenues sur 12 variantes | — | Vues retenues |
| Détail d'une mission | V2 Redris | — | `Voir infos missions`, `Détails`, `Membres assignés`, `Fiche intervention` | Champs et membres assignés | Assemblage en un panneau unique | Enchaînement des statuts | Cycle de statuts |
| Liste des prestataires | V2 Redris | — | `Mes prestataires`, `Prestataires (5)` | Liste, catégories | — | — | Catégories officielles |
| Ajout d'un prestataire | V2 Redris | — | `AddPrestataireForm.tsx`, `Enregistrer le prestataire` | Formulaire | — | — | Champs obligatoires |

## Lignes prévues — LOT 1B (parcours métier complet)

Reprend les lignes 1A pour le gestionnaire, plus :

| Écran construit | Source principale | Source secondaire | Nom du frame/composant | Fidèle | Adapté | Inventé | Décision requise |
|---|---|---|---|---|---|---|---|
| Assignation d'une mission à un prestataire | V2 Redris | — | `Membres assignés`, `AddPrestataireForm.tsx` | Partiel | Oui | Action « Assigner » | — |
| Mobile prestataire — réception de la mission | — | Redris V2 (à fournir) | À renseigner | — | — | **Total tant que le fichier manque** | Fourniture du `.fig` |
| Mobile prestataire — acceptation / refus | — | Redris V2 (à fournir) | À renseigner | — | — | Idem | Refus motivé ? |
| Mobile prestataire — démarrage | — | Redris V2 (à fournir) | À renseigner | — | — | Idem | Horodatage / géolocalisation ? |
| Mobile prestataire — preuve photo | V2 Redris (`Photo du compteur en cours`) | Redris V2 (à fournir) | `Vision etats des lieux /Outils/*` | Partiel | Oui | Téléversement côté prestataire | Nombre de photos, obligatoire ? |
| Mobile prestataire — clôture | — | Redris V2 (à fournir) | À renseigner | — | — | Idem | Validation par le gestionnaire ? |
| Synchronisation simulée des statuts | — | — | — | — | — | Machine à états en mémoire | Liste et transitions des statuts |

## Décisions bloquantes avant construction

1. Orientation centrale V1 : gestion locative & financière, ou conciergerie opérationnelle.
2. Couleur de marque Hublify et famille typographique (Inter ou Nunito Sans).
3. Liste et transitions des statuts de mission.
4. Rôles et permissions « Team mate ».
5. Vocabulaire officiel : Patrimoine/Bien · Occupant/Locataire/Voyageur · Mission/Intervention/Événement.
6. Périmètre : Tarifs, Paiements, Analytics, États des lieux, Portail voyageur.
7. Écran de connexion (absent des deux sources connues).
8. Maintien de TanStack Router ou bascule React Router.
9. Fourniture de l'export `.fig` de l'ancienne maquette Redris V2 (condition du lot 1B).
