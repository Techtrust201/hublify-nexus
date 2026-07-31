# Audit de la maquette V2 Redris — avant toute construction

## 1. Sources réellement analysées

- `V2_Redris_copie.fig` — décompressé (conteneur ZIP → `canvas.fig`, en-tête `fig-kiwi` v106, bloc de données zstd de 37,2 Mo). Contenu lu directement : noms de calques, noms de sections, textes, variables.
- `V2_Redris_copie_.design.json` — 13 collections de variables, 60 variables, palettes, typographies.
- La vignette PNG (lisibilité insuffisante pour un audit, utilisée seulement pour repérer les blocs).

Volumétrie : 37 649 frames, 14 448 textes, 553 symboles, 666 instances, 51 sections, 2 pages (`Page 1`, `Internal Only Canvas`), 2 images.

**Découverte majeure — OBSERVÉ DANS LA MAQUETTE :** le fichier contient des métadonnées `figmake` pointant vers 23 fichiers React réels. La maquette n'est pas un dessin : c'est l'export d'une application déjà générée. Fichiers présents, triés par volume d'occurrences :

`Dashboard.tsx` (14 566), `AnnualCalendarPage.tsx` (5 309), `DocumentsPage.tsx` (3 156), `ModelesPage.tsx` (2 195), `TeamMatePage.tsx` (2 032), `MessagingSection.tsx` (1 697), `PatrimoinePage.tsx` (1 194), `PropertyConfigurationPage.tsx` (968), `AnalyticsPage.tsx` (707), `CreateReservationPage.tsx` (649), `ReservationsPage.tsx` (634), `InventoryPage.tsx` (510), `InventoryInspectionPage.tsx` (464), `AccessSheetPage.tsx` (418), `SettingsPage.tsx` (414), `AddPrestataireForm.tsx` (309), `ManagerProfileInfoPage.tsx` (166), `TravelerProfilePage.tsx` (131), `ModernProfilePage.tsx` (123), `reservation-modal.tsx` (115), `PaymentFormModal.tsx` (70), `add-event-modal.tsx` (54), `App.tsx`.

## 2. Inventaire des zones et écrans observés

| Zone de la maquette | Écrans observés (noms réels) | Utilisateur | Objectif apparent | Actions visibles | Éléments incertains | Doublons / variantes | Recommandation |
|---|---|---|---|---|---|---|---|
| Navigation latérale | `Dashboard Sidebar`, `NavItem` : Vue générale, Patrimoines, Réservations, Locataires, Prestataires, Messagerie, Documents, Outils, Team mate, Compte gestionnaire | Gestionnaire | Navigation principale | Naviguer, replier | « Outils » regroupe Modèles / Inventaire / État des lieux / Fiche accès / Vue annuelle — arborescence non figée | `Dashboard/gestionnaire option 2` (6 occ.) = 2e version de dashboard | CANDIDAT V1 — nav à reprendre telle quelle, hors « Outils » À CONFIRMER |
| Vue générale | `Dashboard.tsx`, `Welcome Text`, cartes : Loyers en retard, `Tout impayé : 2 450`, `Les Loyers Payés Cette Semaine / 3 paiements totaux`, `Événements en Cours / 3 événements détectés`, `6 en cours`, `3 en attente`, `Ménage : 3`, `Réservation : 9`, `Arrivées prochaines` | Gestionnaire | Pilotage quotidien | Voir détail, `Voir tous mes biens`, `Voir le calendrier` | Dashboard **financier** (loyers, impayés) : contredit la consigne « pas de chiffres financiers » | 2 dispositions de dashboard | CANDIDAT V1, mais arbitrage financier requis |
| Calendrier | `AnnualCalendarPage.tsx`, `Vue Annuelle`, `Vision Missions Calendar sur 3 jours / 5 jours / mois complet`, `Vision Réservation Calendar 3/5/mois`, `Vision/Tarifs` (3/5/mois), `Dashboard/Calendar/Réservation/Blockeddate`, filtres `Logements & plateformes`, `Filter AirBnB`, `Booking`, `Autre` | Gestionnaire | Occupation, missions, tarifs | Changer de granularité, filtrer, ouvrir détail, `Créate events`, `Créer une règle`, `gérer ensemble de règles` | 3 axes (Réservations / Missions / **Tarifs**) × 4 vues = 12 combinaisons | 12 variantes du même écran | CANDIDAT V1 pour Réservations+Missions ; Tarifs = CANDIDAT V2 |
| Réservations | `ReservationsPage.tsx`, `CreateReservationPage.tsx`, `reservation-modal.tsx`, `Vision Occupations/Réservations/Tablerfull`, `.../details ligne`, `.../creer reservation/Choice/Locsaisonnier` | Gestionnaire | Liste + création | `Créer une réservation`, `Cliquer sur une réservation pour voir le détail` | Distinction location saisonnière / bail longue durée | Table + modale + page plein écran pour la même création | CANDIDAT V1 |
| Patrimoines | `PatrimoinePage.tsx`, `PropertyConfigurationPage.tsx`, `Vision patrimoines/Biens immos/Cards`, `/CONFIG` | Gestionnaire | Parc immobilier | Voir, configurer | Vocabulaire : « Patrimoines » vs « Biens immos » vs « Logements » | Cartes + config | CANDIDAT V1 (lot ultérieur) |
| Occupants | `Visions Liste occupants/Prestataire/Occupants`, filtres `Filter Loc` / `Filter voyageurs`, `TravelerProfilePage.tsx`, `Page profil lov/voyageur` | Gestionnaire | Locataires + voyageurs | Filtrer, ouvrir fiche | Locataires et voyageurs dans **la même liste** que les prestataires | 3 profils (`ModernProfilePage`, `ManagerProfileInfoPage`, `TravelerProfilePage`) | À CONFIRMER |
| Prestataires | `AddPrestataireForm.tsx`, `Mes prestataires`, `Prestataires (5)`, `Ménage Pro`, `Jardinier Vert`, `Électricien RGE`, `Fiche intervention — Plomberie / Jardinage / Peinture`, `Contrat — Ménage Pro` | Gestionnaire | Carnet de prestataires | `Ajouter un prestataire`, `Enregistrer le prestataire` | Catégories observées : Ménage, Maintenance, Plomberie, Électricité, Jardinage, Check-in assisté | `Fiche intervention` vs `Fiches d'intervention` | CANDIDAT V1 |
| Missions / Interventions | Aucun écran « liste de missions » autonome. Les missions n'existent que **dans le calendrier** (`Dashboard/Calendar/Missions/...`, `Voir infos missions`, `Détails`, `Membres assignés`, `+1 mission`) et comme documents (`Fiche intervention`) | Gestionnaire | Planification d'interventions | `Voir infos missions`, `Créate events`, `Assigner à` | **Aucun écran de création de mission dédié, aucun cycle de statut dessiné** | `Mission` / `Intervention` / `Événement` employés pour la même chose | À CONFIRMER — voir §5 |
| Documents / Outils | `DocumentsPage.tsx`, `ModelesPage.tsx`, `Vision documents/Doclogement`, `/docproprio`, `/Résidents et prestataires`, `/inventaire presta`, `12 modèles` (bail meublé, quittance, avis d'échéance, devis travaux, contrat prestataire, attestation assurance…) | Gestionnaire | Modèles + pièces | Filtrer, `Télécharger modèle`, `Confirmer & Générer` | Module le plus développé de la maquette | `Documents` vs `Outils / Modèles` | CANDIDAT V1 (lot ultérieur) |
| États des lieux / Inventaire | `InventoryPage.tsx`, `InventoryInspectionPage.tsx`, `Page Etat des lieux`, `Vision etats des lieux /Outils/{salon,cuisine,chambre}`, `Certification de l'inventaire`, `Photo du compteur en cours` | Gestionnaire | Constat pièce par pièce | `Enregistrer l'état des lieux`, `Envoyer au locataire` | Valeur juridique non tranchée | 2 écrans proches | CANDIDAT V2 |
| Fiche d'accès | `AccessSheetPage.tsx`, `Vision fiche accès /Outils/1..4`, `Accès et arrivée`, `Heure Check-In*/Check-Out*` | Gestionnaire → prestataire/voyageur | Transmettre les accès | Consulter | 4 variantes numérotées, aucune retenue explicitement | 4 variantes | À CONFIRMER |
| Messagerie | `MessagingSection.tsx`, `Dashboard/Messagerie/{presta, teammate, ecrire message, partager profil, documentsicon, Message archivés}`, `Messages archivés (1)` | Gestionnaire | Fils prestataires / team / occupants | `Envoyer un message`, joindre, archiver | — | — | CANDIDAT V1 (lot ultérieur) |
| Team mate | `TeamMatePage.tsx`, `Vision TeamMate/Droit accès`, `/Sup member`, `Gérez les accès et les permissions`, `Tâches et invitations en attente` | Gestionnaire | Membres + droits | Inviter, supprimer, changer droits | **Les rôles ne sont pas nommés** dans la maquette | `Team mate` / `Team Mate` / `TeamMate` | À CONFIRMER |
| Paiements | `PaymentFormModal.tsx`, `Valider paiement`, `Virement proposé`, `Commission`, `Montant confirmé`, `Revenus validés` | Gestionnaire | Encaissement / reversement | Valider | Contredit frontalement la consigne « aucun paiement » | — | CANDIDAT V2 — exclu du lot 1 |
| Analytics | `AnalyticsPage.tsx` | Gestionnaire | Statistiques | — | Indicateurs non définis | — | CANDIDAT V2 |
| Onboarding | `Page je debute`, `Je débute sur Redris`, `Je découvre`, `En savoir plus`, `Tous les outils` | Gestionnaire | Prise en main | — | — | — | CANDIDAT V2 |
| Portail voyageur | `Page profil lov/voyageur`, `Redris le Portail voyageurs…`, `Envoyer dans l'email un lien pour installer l'application "Voyageur"` | Voyageur | Application séparée | — | Une **3e** application est esquissée | — | Hors périmètre (confirmé par votre prompt) |
| Canevas interne | `Parcours global de l'appweb Redris 1`, `Flow 1`, `Flow 2`, `Finaliser les wireframes`, `Validé bar`, `Partiel` (20 occ.) | Équipe | Suivi de production | — | Un marqueur d'avancement existe déjà (`Validé` / `Partiel` / `Non validé`) | — | À exploiter : c'est votre propre grille de validation |

## 3. Constats bloquants

1. **Aucun écran mobile prestataire n'existe dans la maquette.** Aucune frame mobile, aucune barre de navigation basse, aucun parcours accepter/démarrer/terminer, aucun écran de preuve photo prestataire. Le prestataire n'apparaît que comme *objet géré* par le gestionnaire. → Le lot 1 que vous décrivez (parcours mobile prestataire) serait **100 % inventé**. HYPOTHÈSE, pas OBSERVÉ.
2. **Aucun écran de connexion.** Seuls `Mot de passe actuel / Nouveau mot de passe` dans les paramètres. La page `/connexion` serait donc également inventée.
3. **Aucun cycle de vie de mission dessiné.** Statuts observés, épars et non reliés : `En attente`, `En cours`, `Confirmé`, `Validé`, `Non validé`, `Annulé`, `À faire`, `Urgent`, `Refusée`, `Partiel`, `Impayé`. Ils mélangent mission, réservation et paiement.
4. **La maquette est financière et locative** (loyers, impayés, quittances, baux, commissions), là où votre cahier des charges décrit un outil opérationnel de conciergerie. Ce sont deux produits différents.
5. **Vocabulaire instable** : Patrimoines/Biens/Logements · Locataires/Occupants/Voyageurs/Résidents · Missions/Interventions/Événements · Team mate/TeamMate.
6. **Références REDRIS à purger** : `Maq V1 Gestionnaire/ Redris`, `Je débute sur Redris`, `Accès à la messagerie du gestionnaire Redris`, `2025 Redris`, `john.doe@redris.com`, `Parcours global de l'appweb Redris 1`.
7. **Données fictives à ne pas reprendre telles quelles** (DONNÉE FICTIVE) : `Yannick Rath`, `Emily Smith`, `Erik Dunnell`, `Arthur Ajolk`, `Brian Griffin`, `Marie Curie`, `Sophie Martin`, `Appartement Colette`, `Villa Lavandrix`, `Studio Raclette`, `Suzette`, `@email.com`, `Tout impayé : 2 450`.

## 4. Tokens réellement observés (et ce que j'en fais)

| Token | Observation | Fréquence | Cohérence | Recommandation |
|---|---|---|---|---|
| Gris texte `#4A5565`, `#6A7282`, `#364153`, `#1E2939`, `#101828` | Échelle de gris dominante | 3 602 / 2 477 / 1 701 / 1 229 / 735 | Cohérente (échelle Tailwind `gray`) | Conserver comme échelle de texte |
| `#FFFFFF`, `#F9FAFB`, `#F3F4F6` | Fonds et surfaces | 3 331 / 898 / 1 089 | Cohérente | Conserver |
| `#99A1AF` | Texte tertiaire / bordures | 2 698 | Cohérente | Conserver |
| Variables `Colors/Principal #FFFFFF`, `Colors/Font #6B6B6B`, `Colors/Hover #F8F8F8` | Collection 1, 1 seul mode | 3 variables | **Isolées** — ne couvrent pas l'UI observée | Harmoniser avec l'échelle ci-dessus |
| `Primary/Brand` | Alias : `Black/100%` en SnowUI Light, `#5856D6` en iOS | — | **Incohérent** : la marque n'a pas de couleur propre | **Décision manquante : couleur de marque Hublify** |
| `Secondary/Indigo #9F9FF8`, `Secondary/Blue #92BFFF` | Kit SnowUI importé | faible | ÉLÉMENT GÉNÉRIQUE (kit tiers) | Ne pas adopter sans validation |
| Typographie | **Inter** Regular/Medium 10/11/12/14 px (interlignes 15/16/20) domine ; **Nunito Sans** (288 occ., `NunitoSans-Bold`) ; **Arial** (1 500 occ.) ; **Consolas** | — | **Incohérent : 4 familles** | Décision requise ; Arial/Consolas = artefacts de rendu, à écarter |
| Espacement | Échelle 4 / 8 / 12 / 16 / 24 (4 modes de densité) | collection dédiée | Cohérente | Conserver, mode « Standard » |
| Rayons | 4 / 8 / 12 / 16 / 80 | collection dédiée | Cohérente | Conserver |
| Tailles d'icônes | 16 / 20 / 24 / 28 / 32 / 40 / 48 / 80 | collection dédiée | Cohérente | Conserver |

Je ne propose **aucune couleur d'accent** : la maquette n'en contient pas de dominante. C'est une décision de marque.

## 5. Décisions que je refuse de prendre sans validation

1. Produit : conciergerie opérationnelle (votre prompt) **ou** gestion locative financière (la maquette) ?
2. Existence même d'une application mobile prestataire — absente de la maquette.
3. Couleur de marque Hublify et famille typographique (Inter ou Nunito Sans).
4. Liste et transitions des statuts de mission.
5. Rôles et permissions de `Team mate` (jamais nommés dans la maquette).
6. Vocabulaire officiel (Patrimoine/Bien, Occupant/Locataire/Voyageur, Mission/Intervention).
7. Sort des modules Tarifs, Paiements, Analytics, États des lieux, Portail voyageur.
8. Écran de connexion : à inventer entièrement.

## 6. Note technique

Le dépôt actuel est **déjà** sur React 19 + TypeScript + Vite + Tailwind + TanStack Router (routage par fichiers). Je n'ai pas choisi cette stack : c'est l'existant. Changer de routeur maintenant serait un chantier gratuit. Avantage pour la reprise : c'est un projet Vite/React/TS standard, exportable sur GitHub et reprenable sans dépendance propriétaire. Limite : TanStack Router est moins répandu que React Router — une bascule est possible plus tard, elle ne touche que le dossier des routes. **Je propose de rester sur l'existant ; dites-moi si vous préférez React Router et je bascule avant de construire.**

## 7. Lot 1 proposé (ajusté à ce qui existe réellement)

Le lot 1 que vous décrivez repose sur deux écrans absents de la maquette (connexion, mobile prestataire). Je propose donc un lot 1 **entièrement adossé à des écrans observés** :

1. Identité Hublify (marque, titres, favicon) et purge des références REDRIS.
2. Tokens extraits : échelles de gris, surfaces, espacements 4/8/12/16/24, rayons 4/8/12/16, icônes 16→48 — **sans** couleur d'accent tant qu'elle n'est pas validée.
3. Layout gestionnaire : sidebar `Vue générale, Patrimoines, Réservations, Locataires, Prestataires, Messagerie, Documents, Outils, Team mate`, en-tête, `Compte gestionnaire`.
4. Écran `Vue générale` d'après `Dashboard.tsx` (variante principale, pas `option 2`), avec les cartes réellement dessinées.
5. Calendrier missions, vue 3 jours et mois, d'après `Vision Missions Calendar` — c'est là que vivent les missions dans la maquette.
6. Détail d'une mission d'après `Voir infos missions / Détails` + `Fiche intervention`.
7. Liste prestataires + `Ajouter un prestataire` d'après `AddPrestataireForm.tsx`.
8. Données de démonstration centralisées, fictives, cohérentes entre ces 4 écrans.

Hors lot 1 : connexion, mobile prestataire, tarifs, paiements, analytics, états des lieux, documents, messagerie, réservations, patrimoines, portail voyageur.

**Si vous préférez conserver votre lot 1 initial** (connexion + dashboard + missions + mobile prestataire), je le construis — mais la page de connexion et toute l'interface mobile seront des propositions de ma part, à valider écran par écran, et je le signalerai comme tel.
