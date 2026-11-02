# Écarts — espace Analyse (Hublify V1.0)

Source : section `Maq V1 Gestionnaire / Analyse`, frames `Analyse 2` (`69:1700`) et `Analyse 3` (`69:2651`) hors section, annotations de `gestionnaire-analyse/notes.md`, commentaires de Yannick Ratti lorsqu'ils touchent la finance.

Le dossier alimente les chiffres. La maquette fige des montants (21 100 €, Juliette 2023, 120 logements) qui ne se réconcilient pas entre eux. On garde la structure, les libellés et les deux pieds de facture ; on ne recopie pas un total faux.

## Calcul

| Sujet | Maquette | Implémentation |
|---|---|---|
| Commission | 12 % unique dans l'ancien code ; ~10 % plats dans Analyse 3, sauf un direct à 5 % et un annulé à 0 | Taux par plateforme si `fraisPlateforme` est absent **ou à 0** (colonne SQL `NOT NULL DEFAULT 0`, donc « non saisi ») : Airbnb et Booking.com 15 %, VRBO 8 %, Expedia 15 %, Autre 12 %, Direct et bail 0. Un montant saisi supérieur à 0 prime. |
| Honoraires | Pourcentage illustré, HT/TVA demandés sur la facture | Le montant ou le pourcentage saisi est le **TTC** (15 % de 1 260 € = 189 € sur Sophie Martin). HT = TTC / 1,20, TVA = reliquat. Défaut : 15 % TTC saisonnier, 8 % TTC bail. |
| Net propriétaire | Totaux Juliette : 15 489,07 − 2 348,54 − 2 488,33 − 2 060,28 − 1 043,02 − 83,89 = 7 465,01 | Même formule, au centime. Les ajustements (0 dans le relevé) sont déduits dès qu'un remboursement voyageur existe. Un net négatif reste visible. |
| Trois cartes de loyer | 86 400 − 82 080 = 4 320, pas 1 000 | Restant = attendu − encaissé. Les loyers sont hors charges refacturées : le libellé « charges comprises » contredisait les trois montants. |
| Parts de canaux | 45 + 30 + 15 + 10 + 10 = 110, et 102 + 68 + 34 + 23 + 23 nuits ≠ 198 | Parts entières des nuits réelles, méthode du plus fort reste, somme 100. |
| Occupation « 108 / 120 logements » | Mélange un taux de nuit et un effectif de portefeuille figé | Taux = nuits réservées / nuits disponibles du portefeuille réel. Les 120 logements du comp ne sont pas inventés. |
| Taxe de séjour | Cellule « Taxe gérée par… » | Montant saisi, sinon 0. Airbnb et Booking.com sans taxe affichent « Taxe gérée par la plateforme » et ne retirent rien du net. |
| Ménage | Colonne « Ménages locataire » et carte « Frais de gestion » | `fraisMenage` est déduit du net. Le barème des missions (ménage 45 €, linge 12 €, check-in 20 €, check-out 15 €, travaux 80 €, état des lieux 80 €) est un frais avancé, facturé à part, jamais soustrait une seconde fois. |
| Caution | Titre seul, pas de grille chiffrée | Due = caution du séjour. Encaissée à l'arrivée si le séjour n'est pas annulé, restituée au départ, retenue seulement si un remboursement est motivé (caution, dégât, retenue). Solde détenu = encaissé − remboursé − retenu. |
| Facture, deux cas | Les deux phrases sont côte à côte | Appliquées **par séjour** : Airbnb, Booking et autres plateformes alimentent le montant reversé ; Direct et bail alimentent le montant dû (honoraires TTC + frais de gestion TTC). |
| Période | Janvier 2025 → juillet 2025 | Exercice du dossier canon (2026), modifiable. La fenêtre figée vidait l'écran. |
| Analyse 2 / 3 | Brooke Sims, 21 100 €, dates mélangées 2025/2026 | Même écran (onglets, cartes, colonnes, fiche de paiement) branché sur le dossier. La fiche télécharge un CSV : l'écriture d'un paiement reste dans la réservation, pour ne pas ouvrir un second registre. |
| Avis | 4,8/5 sur 127 avis | Moyenne des notes déjà portées sur les logements. Les notes de plateforme ne sont pas extraites : aucune API n'est branchée (commentaire « extraire la notation »). |
| Stripe | Commentaire « si connection stripes » | Bandeau selon `passerellePaiement`. Aucun appel Stripe, aucun prélèvement. |
| Factures voyageurs | Commentaire sans frame | Une facture par séjour : loyer exonéré de TVA, ménage et services à 20 %, taxe de séjour hors TVA. |

## Interface

- Orthographe corrigée : « sélectionnée », « perçoit ». Les annotations restent au mot près sur le fond (prestations HT/TVA/TTC, honoraires de mise en location et état des lieux, deux montants, détail ménage / linge / check-in / check-out / travaux).
- Le titre est celui de l'en-tête applicatif. Le cadre gris `#f4f6f8` reprend le panneau de la maquette ; le fond général reste le canvas produit `#eae7de`.
- L'onglet Gestionnaires liste les propriétaires mandants. Le compte ne contient qu'un gestionnaire : dupliquer la même ligne par coéquipier aurait affiché plusieurs fois le même solde.
- « scroll bar » de la maquette est le défilement du tableau, pas un composant décoratif.
