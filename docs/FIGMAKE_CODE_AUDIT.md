# FIGMAKE_CODE_AUDIT — V2 Redris (copie)

Statut : **audit de provenance**, pas audit de code. Ce document ne dit pas qu'une application existe.

## Méthode et périmètre

| Élément | Valeur |
|---|---|
| Fichier analysé | `V2_Redris_copie.fig` (2 840 469 octets) |
| Structure | ZIP → `canvas.fig` (2 743 520 o), `thumbnail.png`, `meta.json`, 2 images |
| En-tête `canvas.fig` | `fig-kiwi` (schéma Kiwi Figma) |
| Bloc de données | zstd → **37 182 272 octets** décompressés |
| Texte lisible extrait | 18 363 411 caractères |
| Nom de fichier déclaré (`meta.json`) | `V2 Redris (copie)` |
| Export daté du | 2026-07-31T02:25:00Z |
| `developer_related_links` | `[]` (vide — aucun lien vers un dépôt) |

## Recherche de signatures de code — résultat

Recherche exhaustive sur la totalité des 18,36 M de caractères lisibles :

| Signature | Occurrences |
|---|---|
| `import React` | 0 |
| `from "react"` / `from 'react'` | 0 |
| `export default function` | 0 |
| `useState(` | 0 |
| `const [` | 0 |
| `return (` | 0 |
| `className=` | 0 |
| `codeSyntax` | 0 |
| `devStatus` | 0 |
| `github` | 0 |
| `React`, `Vite`, `Tailwind`, `vercel`, `supabase` (en clair) | 0 |
| `figmake` (marqueur `m2d_node` / `make_to_design_build_data`) | 141 |

**Conclusion : aucun octet de code source n'est présent dans le fichier.** Les 23 entrées ci-dessous sont des **chemins en métadonnées**, associés aux nœuds par la fonction Figma Make → Design. Elles ne prouvent ni un projet compilable, ni une application fonctionnelle, ni un dépôt.

## Échelle de preuve — position réelle du dossier

| Niveau | Statut |
|---|---|
| 1. Métadonnées mentionnant des fichiers | **ATTEINT** (23 chemins, 141 marqueurs) |
| 2. Code source réellement accessible | **NON** — 0 occurrence |
| 3. Code complet ou fragments | **NON** |
| 4. Projet compilable | **NON VÉRIFIABLE** (rien à compiler) |
| 5. Application fonctionnelle | **NON VÉRIFIABLE** |
| 6. Dépôt GitHub historique | **AUCUNE TRACE** |

## Les 23 fichiers référencés

Colonnes « Imports », « Exports », « Dépendances », « Erreurs / références manquantes » : **indisponible — métadonnée seule** pour la totalité des lignes, le contenu n'étant pas dans le fichier. Le « rôle apparent » est déduit des noms de calques et des textes voisins, pas du code.

| # | Fichier (chemin métadonnée) | Occ. | Contenu accessible | Imports | Exports | Dépendances | Rôle apparent (déduit des calques) | Complétude | Réutilisation réelle | Erreurs / réf. manquantes |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `/src/app/components/Dashboard.tsx` | 14 566 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Vue générale gestionnaire : loyers en retard, paiements de la semaine, événements en cours, arrivées prochaines | Inconnue | Aucune — à reconstruire d'après le visuel | Indisponible |
| 2 | `/src/app/components/AnnualCalendarPage.tsx` | 5 309 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Calendrier : vues 3 jours / 5 jours / mois, axes Réservations, Missions, Tarifs | Inconnue | Aucune | Indisponible |
| 3 | `/src/app/components/DocumentsPage.tsx` | 3 156 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Documents : logement, propriétaire, résidents et prestataires | Inconnue | Aucune | Indisponible |
| 4 | `/src/app/components/ModelesPage.tsx` | 2 195 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Bibliothèque de 12 modèles (bail, quittance, avis d'échéance, devis, contrat) | Inconnue | Aucune | Indisponible |
| 5 | `/src/app/components/TeamMatePage.tsx` | 2 032 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Membres d'équipe, droits d'accès, invitations en attente | Inconnue | Aucune | Indisponible |
| 6 | `/src/app/components/MessagingSection.tsx` | 1 697 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Messagerie : fils prestataires / team mate, archives, partage de profil | Inconnue | Aucune | Indisponible |
| 7 | `/src/app/components/PatrimoinePage.tsx` | 1 194 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Parc immobilier en cartes | Inconnue | Aucune | Indisponible |
| 8 | `/src/app/components/PropertyConfigurationPage.tsx` | 968 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Configuration d'un bien | Inconnue | Aucune | Indisponible |
| 9 | `/src/app/components/AnalyticsPage.tsx` | 707 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Statistiques (indicateurs non définis dans la maquette) | Inconnue | Aucune | Indisponible |
| 10 | `/src/app/components/CreateReservationPage.tsx` | 649 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Création de réservation plein écran (choix location saisonnière) | Inconnue | Aucune | Indisponible |
| 11 | `/src/app/components/ReservationsPage.tsx` | 634 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Table des réservations + détail de ligne | Inconnue | Aucune | Indisponible |
| 12 | `/src/app/components/InventoryPage.tsx` | 510 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Inventaire d'un logement | Inconnue | Aucune | Indisponible |
| 13 | `/src/app/components/InventoryInspectionPage.tsx` | 464 | Métadonnée seule | Indisponible | Indisponible | Indisponible | État des lieux pièce par pièce, certification, photo de compteur | Inconnue | Aucune | Indisponible |
| 14 | `/src/app/components/AccessSheetPage.tsx` | 418 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Fiche d'accès : arrivée, check-in / check-out (4 variantes) | Inconnue | Aucune | Indisponible |
| 15 | `/src/app/components/SettingsPage.tsx` | 414 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Paramètres, changement de mot de passe | Inconnue | Aucune | Indisponible |
| 16 | `/src/app/components/AddPrestataireForm.tsx` | 309 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Formulaire d'ajout de prestataire | Inconnue | Aucune | Indisponible |
| 17 | `/src/app/components/ManagerProfileInfoPage.tsx` | 166 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Profil du gestionnaire | Inconnue | Aucune | Indisponible |
| 18 | `/src/app/components/TravelerProfilePage.tsx` | 131 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Profil voyageur | Inconnue | Aucune | Indisponible |
| 19 | `/src/app/components/ModernProfilePage.tsx` | 123 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Troisième variante de page profil | Inconnue | Aucune | Indisponible |
| 20 | `/src/app/components/reservation-modal.tsx` | 115 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Modale de réservation | Inconnue | Aucune | Indisponible |
| 21 | `/src/app/components/PaymentFormModal.tsx` | 70 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Validation de paiement, virement, commission | Inconnue | Aucune | Indisponible |
| 22 | `/src/app/components/add-event-modal.tsx` | 54 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Création d'événement / mission dans le calendrier | Inconnue | Aucune | Indisponible |
| 23 | `/src/app/App.tsx` | 5 | Métadonnée seule | Indisponible | Indisponible | Indisponible | Racine applicative supposée | Inconnue | Aucune | Indisponible |

## Absences vérifiées dans la source principale

| Recherche | Occurrences | Conséquence |
|---|---|---|
| `mobile` / `Mobile` | **0** | Aucune frame mobile, aucune barre de navigation basse : le parcours mobile prestataire n'existe pas dans cette maquette |
| Écran de connexion | 0 frame dédiée | Seuls `Mot de passe actuel` / `Nouveau mot de passe` dans les paramètres |
| `Prestataire` | 617 | Le prestataire existe uniquement comme objet géré par le gestionnaire |

## Ce qu'il faudrait pour lever les inconnues

1. Le dépôt Figma Make ou GitHub correspondant aux 23 chemins (code réel, `package.json`, historique).
2. L'export `.fig` de l'ancienne maquette **Redris V2**, partie *Wireframes Mobile First – Prestataire*.

Tant que 1. n'est pas fourni et qu'un build complet n'a pas réussi, **aucune mention d'« application existante » ne doit figurer dans les documents du projet**.
