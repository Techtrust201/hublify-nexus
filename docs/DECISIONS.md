# DECISIONS.md — décisions provisoires Hublify (étape 1)

Projet : **HUBLIFY** — équipe technique : **TECHTRUST AGENCY**.
Source unique : **V2 Redris, version actuelle reprise par Yannick**. Aucune autre maquette n'existe.
Aucune interface mobile prestataire n'est construite à ce stade.

## 1. Vocabulaire provisoire — HYPOTHÈSE — À VALIDER

| Terme retenu | Termes écartés (ne jamais employer en parallèle) |
|---|---|
| **Bien** | Patrimoine, Logement |
| **Réservation** | Séjour, Booking |
| **Voyageur** | Occupant, Locataire |
| **Prestataire** | Intervenant, Partenaire |
| **Mission** | Intervention, Événement |
| **Gestionnaire** | Manager, Propriétaire |

## 2. Statuts de mission provisoires — HYPOTHÈSE — À VALIDER

Centralisés dans `src/data/statuts.ts`, nulle part ailleurs.

| Clé | Libellé |
|---|---|
| `a_affecter` | À affecter |
| `planifiee` | Planifiée |
| `en_cours` | En cours |
| `terminee` | Terminée |
| `annulee` | Annulée |

Transitions provisoires : à affecter → planifiée/annulée · planifiée → en cours/à affecter/annulée · en cours → terminée/annulée · terminée → (fin) · annulée → à affecter.

Volontairement **non** implémentés à ce stade : Proposée, Acceptée, Refusée, En attente de preuve, Validée par le gestionnaire. Ils seront étudiés au moment du prototype mobile prestataire.

## 3. Identité visuelle — HYPOTHÈSE — À VALIDER

- Nom affiché : **Hublify** uniquement. Aucune occurrence de REDRIS dans l'interface.
- Typographie : **Inter**, chargée dans `src/routes/__root.tsx`.
- Gris et surfaces : repris de la maquette (fond clair, cartes blanches, bordures fines).
- **Couleur d'accent** : absente de la maquette, donc inventée. Token unique `--brand` dans `src/styles.css` — un seul endroit à changer.
- Statuts colorisés via les tokens `success` / `warning` / `info` / `brand`, jamais de couleur en dur.

## 4. Périmètre construit à l'étape 1

Construit : chrome maquette MO1 (sidebar, en-tête), vue générale (KPI, planning biens × jours, messages, loyers, événements), calendrier missions 3/5 jours + mois, réservations, documents, patrimoines, messagerie, tarifs, outils, profil, détail de mission, prestataires.

Hors périmètre : connexion réelle, base de données, paiements, abonnements, commissions, marketplace, Airbnb/Booking, e-mails, SMS, signature électronique, portail voyageur, analytics, mobile prestataire.

## 5. Données fictives

Un **seul** jeu de données, dans `src/data/mock.ts`, servi par `src/data/store.ts`. La même mission apparaît dans le calendrier, dans son détail et dans la fiche du prestataire affecté. Les dates sont relatives à aujourd'hui.

## 6. Technique

React 19, TypeScript, Vite, Tailwind v4, TanStack Router (routage par fichiers). Routeur inchangé. Aucun secret, aucune intégration externe, aucun backend.

## 7. Décisions attendues des associés

1. Orientation centrale V1 : gestion locative & financière, ou conciergerie opérationnelle.
2. Couleur d'accent définitive de la marque Hublify.
3. Liste et transitions définitives des statuts de mission.
4. Vocabulaire officiel (validation ou correction du tableau ci-dessus).
5. Catégories officielles de prestataires et champs obligatoires de la fiche.
6. Rôles et permissions de l'équipe.
7. Écran de connexion (absent de la source).
