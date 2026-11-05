# Audit démo — espace gestionnaire (ordinateur)

Date : 5 novembre 2026. Branche `audit/gestionnaire`, rebasée sur `main` après la fusion de `fix/demo-integration-finale` (PR #18, commit `6351803`) et de l'audit mobile (PR #21).

Vérifié en local sur Postgres : `npm test`, `npx tsc --noEmit`, `npm run build`, `npx playwright test`. Viewport 1440×900. Compte super-administrateur `redris.gestion@gmail.com` (Yannick Ratti), qui voit aussi Team mate, tarifs et parrainage. Aucune migration. `.env.local` n'est pas versionné. La base de production n'a pas été touchée.

Parcours : accueil, réservations (liste et planning), missions, patrimoines, occupants, prestataires, messagerie, documents, modèles, baux, états des lieux, livret, upsells, timeline, Je débute, analyse, inventaire, pré-check-in, paramètres, profil, team, parrainage, tarifs, CGV, FAQ. Les bascules déjà actives (onglet courant, filtre « Tous », page 1) ne changent pas l'écran : ce n'est pas un bouton mort.

## Défauts

| Page | Description | Statut |
|---|---|---|
| Prestataires, ajout | « Enregistrer » était un bouton hors formulaire : un clic créait un prestataire sans nom, ville, e-mail ni téléphone. | Corrigé : envoi du formulaire, message si le nom, la ville, l'e-mail ou le téléphone manque ou est invalide. |
| Prestataires, fiche | Un nom vide fermait l'enregistrement sans rien dire. | Corrigé : message explicite, e-mail et téléphone contrôlés s'ils sont remplis. |
| Occupants | Un nom vide ne faisait rien. Sans e-mail, l'application inventait `prenom.nom@email.fr`. | Corrigé : message « Indiquez le nom. » E-mail invalide signalé. Champ vide enregistré comme « — ». |
| Upsells et paramètres | Enregistrer sans nom ou avec un prix illisible ne montrait rien. | Corrigé : message sur le nom et sur le prix. |
| Modèles de documents | Créer un modèle sans nom fermait le dialogue en silence. | Corrigé : « Indiquez le nom du modèle. » |
| Vue générale, remboursement | Un montant vide, nul ou supérieur au paiement ne donnait aucun retour. | Corrigé : message selon le cas. |
| Réservation | « abc » passait comme e-mail. Les libellés mélangeaient « Check-In » et « Check-in ». | Corrigé : e-mail et téléphone contrôlés. Libellés « Check-in », « Check-out », « Heure de check-in », « Heure de check-out ». |
| Parrainage | La copie du lien échouait sans toast si le presse-papiers refusait. | Corrigé : repli, toast, le bouton passe à « Lien copié ». |
| Adresses et messages | La copie affichait « Copie impossible » dès que l'API asynchrone tardait. | Corrigé : délai de 1,5 s puis repli `execCommand`. |
| Documents, « Voir docs » | Le clic ouvrait le dialogue Filtres par-dessus la liste, et le bouton restait « Tous » alors que le logement était filtré. | Corrigé : la liste s'ouvre filtrée, le bouton porte le nom du logement. Les clés du dialogue sont uniques. |
| Paramètres, rappel | Le libellé disait « 00 h avant » (valeur de remplissage). | Corrigé : 24 h à l'affichage et à la lecture, y compris si la base contient encore « 00 ». |
| Upsells | « Late Check-out (14h) ». | Corrigé : « Départ tardif (14 h) », aussi pour une fiche déjà en base portant cet identifiant via le texte du corpus. |
| Livret / alerte lieu | « Welcome book » et « Welcome book manquant ». | Corrigé (le libellé d'alerte l'était déjà sur main par l'audit mobile) : le champ de la fiche dit « Livret d'accueil ». |
| Team mate | Titre « Team Mate », section messagerie « Mes teams mate », affectation « Assignment … », invitation sans poste « Assignment ». | Corrigé : « Team mate », « Mes coéquipiers », secteurs en français, « Non précisée ». |
| Vue annuelle | Titre « Vue Annuelle » à trois endroits. | Corrigé : « Vue annuelle ». |
| Vue générale | « Événements en Cours ». | Corrigé : « Événements en cours ». |
| Paramètres | « Infos bulles ». | Déjà « Infobulles » sur main (audit mobile). Conservé. |
| Je débute | Questions illisibles (« Planifie-t-on des soirées… », « Je deviens la proposition de bail… ») et la même réponse pour toutes. Dates figées en mars 2026. | Corrigé : sept questions de prise en main avec une réponse chacune. Dates à J+14 et J+18. E-mail et téléphone contrôlés. |
| Messagerie et équipe | Noms de remplissage : Brian Griffin, Cleveland Brown, Albert Flores, Floyd Miles, Lentil Entertainment, Silverlight Studio, Erik Dunnell, Emily Smith, Tegerdinal Ulrica, Erihu Ulrica, Arthur Ajolk. | Corrigé dans le corpus et à la lecture des bases déjà peuplées (Bruno Girard, Camille Brun, Alain Forest, François Millet, Linge & Entretien, Studio Sérénité, Éric Durand, Émilie Moreau, Inès Lambert, Elena Ulrich, Arthur Rolland). |
| États des lieux | Dates semées en mars 2026 alors que la démo est en novembre. | Corrigé à l'affichage : la fenêtre de démo est projetée sur la période courante, comme la timeline. La saisie d'un nouvel état des lieux garde la date choisie. |
| Accueil, carte loyers | Le lien vers Analyse était déjà en place. | Vérifié. |
| Accueil, onglets Missions / 3 jours / Tout | Aucun changement quand l'onglet est déjà celui qui est affiché. | Assumé. |
| Analyse, Tarifs, Réservations | Onglet ou filtre déjà sélectionné. | Assumé. |
| Pagination shadcn (« Previous » / « Next ») | Composant non monté dans l'espace gestionnaire. | Non modifié. |
| Tarifs | Pas d'API channel manager : bandeau V1 déjà présent. | Assumé, comme convenu. |
| Google, FAQ publique | Déjà traités par l'intégration. | Vérifié par les e2e existants. |
| Livret, upsells, pré-check-in | Persistance en base livrée par la PR #18. | Vérifié par `e2e/persistance-outils.spec.ts`. |
| Prestataire créé à vide pendant l'audit | Une fiche vide a été écrite puis effacée par un nouveau `db:seed` local. | Corrigé côté produit ; la base locale a été resemée. |
| Console | Aucune erreur sur le parcours des routes gestionnaire, hors l'avertissement de clé React au moment où le dialogue Filtres s'ouvrait tout seul. | Corrigé avec le dialogue. |
| CGV, FAQ gestionnaire, inventaire, baux, timeline, profil | Pages répondent, actions principales ouvrent un dialogue, un toast, un fichier ou une autre page. | Vérifié. Le bouton « Générer un rapport » du profil est dans le bloc replié « Historique » : il télécharge un PDF une fois le bloc ouvert. |

## Tests

`e2e/gestionnaire-audit.spec.ts` couvre le prestataire vide, l'occupant sans nom, l'upsell sans nom, les libellés, « Voir docs », et la copie du lien de parrainage. `src/lib/saisie.test.ts` et `src/data/noms-demo.test.ts` couvrent l'e-mail, le téléphone, le rappel à 24 h et le renommage du corpus.

## Commit de fusion

`ed8f9c664055b5b88b8dbcc1d451be775d921ca5` — merge de la pull request #22 (`audit/gestionnaire`) dans `main`.
