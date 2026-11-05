# Hublify — recette pré-lancement (05/11/2026)

> **Statut : NON VALIDÉ POUR UNE MISE EN PRODUCTION CLIENT.**
> Ce document est un **plan d'exécution**, pas un procès-verbal de tests effectués sur le site.
> Source des parcours : maquette PDF Hublify (146 pages), code de \`main\` et branche \`fix/demo-integration-finale\`, tests E2E existants.

## Périmètre et état observé

- \`main\` est la branche de production Vercel, distincte de la branche de fusion des PR #15–#17.
- Branche intégrée : \`fix/demo-integration-finale\` / PR #18, migrations \`014\`, \`015\`, \`016\`.
- CI de PR #18 : typecheck, unités, migrations sur Postgres local, build, Playwright Chromium réussis.
- Les tests synthétiques ne valent **pas** vérification du site Vercel contre la base Neon de production.
- Des alertes de sécurité non résolues subsistent sur les accès aux fichiers privés et aux conversations.
- Les domaines \`.vercel.app\` du projet disposent d'une protection SSO Vercel : vérifier les accès des vrais testeurs.

## Décision de diffusion

- [ ] Aucune alerte de sécurité P0 concernant les fichiers et conversations.
- [ ] Toutes les migrations \`014\` → \`016\` validées contre une copie/staging de la base réelle.
- [ ] Sauvegarde Neon vérifiée et restauration exercée avant mise à jour.
- [ ] Tous les tests CI verts **sur le commit exact à déployer**.
- [ ] Contrôle d'authentification du lien client (sans donner accès au tableau de bord Vercel).
- [ ] Smoke test des 4 rôles + utilisateur non connecté sur **URL finale**, avec traces/captures.
- [ ] Validation du propriétaire du produit pour la diffusion de la démo.

## Matrice de parcours indispensables

Indiquer pour chaque test la version, l'URL, le rôle, une capture ou un log, et le résultat PASS/FAIL.

### 1. Visiteur / Acquisition

- [ ] Landing : CTA principal, tarifs, détails des offres, FAQ, CGU, CGV, confidentialité, parrainage.
- [ ] Aucun CTA sans destination ; aucune section « en construction » présentée comme active.
- [ ] Login : bon/mauvais mot de passe, message d'erreur, oubli, réinitialisation, retour.
- [ ] Accès non autorisé : redirection sans fuite, URL protégée non indexable.
- [ ] Formulaires : pas de soumission avant hydratation ; validation required/e-mail et messages accessibles.

### 2. Gestionnaire

- [ ] Vue générale : KPI exacts, calendrier 3 jours / mois, changement de période, ajout d'événement/missions, détail, fermeture modale.
- [ ] Réservations : création, changement de vue, recherche, filtres combinés, détail, édition, suppression confirmée, retour, rechargement.
- [ ] Prestataires : création, validation, recherche, fiche, modification, suppression et gestion des références existantes.
- [ ] Occupants, dossiers : données filtrées, navigation détail ↔ liste, aperçu et pièces.
- [ ] Patrimoine : ajouter / éditer un bien, photos, permissions, retour et état d'échec.
- [ ] Inventaire : recherche, création, édition, suppression, persistance et statut vide.
- [ ] Missions : assignation, statut, prestataire, rapport, conflits calendaires.
- [ ] Analyse : cohérence des totaux, période, répartition, TVA/honoraires, exports téléchargeables.
- [ ] Messagerie : recherche, fil, création de contact, réponse, archivage, erreurs réseau.
- [ ] Documents : modèles, aperçu, téléchargement, génération, pièces jointes, erreurs/permissions.
- [ ] Outils : livret, upsells, pré-check-in, bail, état des lieux, vue annuelle, timeline ; sauvegarde confirmée même si navigation immédiate.
- [ ] Team : invitation, droits, changement de rôle, refus pour lecteur et confirmation des actions sensibles.
- [ ] Profil / réglages : identité, paramètres, notifications, IBAN masqué et données correctement sauvegardées.

### 3. Locataire / Voyageur mobile

- [ ] Démarrage, choix mode, navigation mobile, retour, recherche et menu « + ».
- [ ] Notes calendrier : créer, modifier, supprimer, recharger.
- [ ] Réservation, pré-check-in, ajout de justificatif, validation d'accès.
- [ ] Simulation de paiement clairement marquée comme telle, aucun faux débit.
- [ ] Nouveau contact et message : aucun effet sur les conversations d'autres utilisateurs.
- [ ] Dossier : aucune pièce tierce consultable, modifiable ou supprimable.
- [ ] Mode hors ligne / réseau interrompu : message d'erreur clair, aucune fausse promesse d'enregistrement.

### 4. Prestataire mobile

- [ ] Connexion et page mission uniquement pour l'intervenant autorisé.
- [ ] Voir les tâches du jour, agenda, messages, pièces associées à sa mission.
- [ ] Rapport d'intervention et photos, conservation après rechargement.
- [ ] Interdiction de modifier les documents ou conversations d'un autre occupant/prestataire.

### 5. Rôle lecture et inter-organisation

- [ ] Un lecteur ne peut ni créer, ni modifier, ni supprimer des fichiers de dossier.
- [ ] Le contrôle est imposé **côté serveur**, pas seulement par bouton masqué.
- [ ] Deux utilisateurs de sociétés différentes ne voient pas les réservations/dossiers/messages réciproques.
- [ ] Les invitations et droits ne changent pas silencieusement la session du gestionnaire.

## Ergonomie / UI (à répéter aux largeurs 320, 375, 390, 768, 1024, 1440)

- [ ] Aucun clic sans effet visible : navigation, ouverture, validation ou erreur explicite.
- [ ] Aucun élément masqué par clavier mobile, sticky header, overlays ou bas de page.
- [ ] Dialogues fermables (X, Escape), retour correct, focus clavier conservé.
- [ ] Textes français cohérents, champs lisibles, erreurs accessibles et focus visible.
- [ ] Actions destructives demandent une confirmation et donnent un retour sans ambiguïté.
- [ ] Les formulaires invalides ne créent aucune donnée.
- [ ] Les états vides, chargements, latences, coupures réseau, droits refusés et erreurs 500 sont utilisables.
- [ ] Vérifications réelles sur Safari iOS et Chrome Android, en plus du Chromium de la CI.

## Bloquants connus à réexaminer avant fusion de PR #18

1. Autorisations des téléversements et téléchargements de pièces d'identité au niveau du propriétaire de ressource.
2. Écriture/remplacement des fils de messages depuis le portail et contrôle serveur des droits de conversation.
3. Gestion des chargements réseau bloqués et états sauvegardés (proposition de correction PR #19).
4. Validation du formulaire prestataire (proposition de correction PR #19).
5. Sauvegarde différée des livrets et fichiers orphelins consommant les quotas.
6. Partage sécurisé du **bon** déploiement Vercel aux clients et cohérence de la base de données utilisée.
7. Déclarations des fonctionnalités de simulation (paiement, OTA, envoi de certaines invitations) : jamais les présenter comme des traitements réels.

## Evidence de validation à joindre avant le GO

\`\`\`
Commit de release :
URL de test :
URL client :
Environnement base :
Migration 014 / 015 / 016 :
CI : lien et résultat
Tests de sécurité fichiers / messages :
Chrome desktop :
Safari iPhone :
Chrome Android :
Compte gestionnaire :
Compte locataire :
Compte prestataire :
Compte lecteur :
Erreurs Sentry/Vercel :
Décision GO / NO-GO :
Validé par :
\`\`\`
