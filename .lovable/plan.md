# HUBLIFY — Phase 1 : base applicative

Objectif : livrer une base d'application SaaS B2B navigable, responsive et propre, en français, sans aucune mention de la marque de l'outil de génération ni de REDRIS. Deux interfaces : gestionnaire (desktop) et prestataire (mobile-first). Toutes les données sont fictives et servies par une couche de services simulés.

## Direction visuelle

Reprise des tokens de la maquette V2 : palette neutre gris/ardoise (`#101828`, `#364153`, `#6A7282`, `#99A1AF`, `#F3F4F6`, `#F9FAFB`, blanc), accent bleu sobre, typographie Inter (12/14 px de base, échelle 10→30), rayons 4/8/12/16, espacements 4/8/12/16/24, ombres discrètes. Interface sobre, dense et lisible — pas de dégradés décoratifs ni d'animations superflues.

Tokens sémantiques centralisés dans `src/styles.css` (oklch) : fond, surface, bordure, texte primaire/secondaire, primaire, succès, avertissement, erreur, info, désactivé, focus, plus hauteur de champ, taille de bouton, largeur de sidebar.

## Ce que je construis

**Socle**
- Identité Hublify : logo texte + marque, titres et métadonnées de chaque page, favicon neutre, écrans 404 et accès refusé.
- Composants transverses : PageHeader, StatusBadge, DataTable (→ cartes en mobile), ResponsiveCardList, SearchAndFilters, LoadingState, EmptyState, ErrorState, ConfirmDialog, toasts de succès, FeatureNotAvailable.

**Authentification de démonstration**
- `/connexion` : logo, e-mail, mot de passe avec bascule d'affichage, « se souvenir de moi », lien mot de passe oublié, états de chargement et d'erreur.
- Comptes de démo centralisés dans un seul fichier : `gestionnaire@hublify.demo` / `prestataire@hublify.demo`, mot de passe `Demo123!`. Session en mémoire + stockage local, redirection selon le rôle. Clairement identifiée comme démonstration, jamais présentée comme sécurisée.

**Layouts**
- Gestionnaire desktop : sidebar réductible (Tableau de bord, Biens, Réservations, Calendrier, Occupants, Prestataires, Missions, Documents, Messages, Équipe, Paramètres), sélecteur d'organisation simulé, notifications, menu utilisateur, barre supérieure avec fil d'Ariane, bascule en menu latéral sur tablette/mobile. Pas d'entrée Paiements.
- Prestataire mobile : barre de navigation inférieure (Accueil, Missions, Calendrier, Messages, Profil), en-tête compact, zones tactiles ≥ 44 px.

**Routes** — toutes celles listées dans la demande sont créées et rendent un écran propre, y compris les modules Phase 2 qui reçoivent une page cadrée « en préparation » plutôt qu'un écran vide.

**Modules complets en Phase 1**
- Tableau de bord : indicateurs opérationnels calculés à partir des données simulées (biens actifs, arrivées/départs du jour, missions à faire / en retard, réservations à venir, documents à surveiller, prestataires), sections Aujourd'hui, Prochaines arrivées, Missions prioritaires, Activité récente, raccourcis d'action. Un seul graphique non financier (répartition des statuts de missions).
- Biens : liste (recherche, filtres, tri, tableau/cartes), fiche détaillée avec onglets (présentation, réservations, occupants, missions, documents, accès, activité), formulaire de création validé.
- Réservations : liste filtrable et triable, fiche détaillée, formulaire avec règles de validation (dates cohérentes, bien, occupant, nombre de voyageurs).
- Prestataires : liste et fiche.
- Missions : liste, fiche, formulaire, machine à états centralisée (statuts et transitions autorisées dans un seul module métier ; les transitions incohérentes sont désactivées).
- Prestataire mobile : accueil, listes de missions par onglet, fiche mission avec le parcours complet accepter / refuser / démarrer / photo / commentaire / signaler / terminer, avec confirmations et clôture guidée. Les pièces jointes sont simulées localement.

**Modules cadrés (Phase 2, écrans de base seulement)** : Calendrier (vue mensuelle lisible sur les données simulées), Occupants, Documents, Messages, Équipe, Paramètres — structure et navigation en place, profondeur fonctionnelle laissée à la phase suivante.

**Données et services**
- Jeu de données fictif cohérent et relié : 6 biens, 12 réservations, 10 occupants, 8 prestataires, 20 missions, documents, conversations, membres d'équipe. Identifiants stables, adresses et personnes inventées.
- Services simulés (`propertyService`, `reservationService`, `missionService`, etc.) avec `list / getById / create / update / archive / changeStatus`, latence simulée, remplaçables plus tard par de vrais appels API sans toucher aux composants.
- Bandeau discret « données de démonstration » dans l'application.

**Documentation** : `docs/PROJECT_OVERVIEW.md`, `FEATURES_IMPLEMENTED.md`, `DEMO_LIMITATIONS.md`, `ROUTES.md`, `MOCK_DATA.md`, `DECISIONS.md`, `NEXT_STEPS.md`, formulation neutre.

## Détails techniques

- TanStack Start (routage par fichiers sous `src/routes/`), React 19, TypeScript strict, Tailwind v4 via tokens CSS, shadcn/ui pour la base des composants.
- Organisation : `src/components/{ui,layout,common}`, `src/features/<module>`, `src/data/mocks`, `src/services`, `src/types`, `src/hooks`, `src/lib`. Les pages restent des assemblages courts ; la logique métier vit dans `features` et `lib`.
- Aucun backend, aucun secret, aucune intégration externe, aucune dépendance ajoutée hors nécessité (dates : `date-fns`).
- Accessibilité : labels associés, focus visible, dialogues fermables au clavier, contrastes vérifiés.

## Livrable

À la fin, un rapport structuré : pages créées, composants, données, parcours fonctionnels, éléments simulés, non développés, ambiguïtés de la maquette, décisions métier à trancher, problèmes connus, phase suivante recommandée.
