# Audit démo — mobile, pages publiques et portails

Date : 5 novembre 2026. Branche `audit/mobile-public`, rebasée sur `main` après la fusion de `fix/demo-integration-finale` (PR #18, commit `6351803`).

Vérifié en local sur Postgres (`npm test` 189 tests, `tsc --noEmit`, `npm run build`, `npx playwright test` 43 tests). Viewports : 390×844, 360×740, et 1280×900 pour le public. Comptes semés : locataire, voyageur, propriétaire, prestataire, gestionnaire.

Le paiement du portail reste une simulation (bandeau visible, aucune banque). Ce n'est pas un oubli de clic : aucun prestataire de paiement n'est branché.

## Défauts

| Page | Description | Statut |
|---|---|---|
| Accueil public, pied de page | « Blog », « Guides bailleurs », « Modèles gratuits » et « Nous rejoindre » ouvraient la FAQ ou l'inscription. | Corrigé : liens vers des pages qui existent (FAQ, CGV, CGU, confidentialité, parrainage, compte). |
| Accueil public, liste des bailleurs | Le formulaire affichait « L'envoi n'est pas branché » et oubliait l'adresse. Un clic avant hydratation rechargeait la page. | Corrigé : l'adresse est archivée avec les mails, le bouton attend l'hydratation, le message dit si l'e-mail est parti ou seulement conservé. |
| Accueil public, comparaison | Le tableau `min-width: 640px` imposait un défilement horizontal à 360 et 390. | Corrigé : cartes empilées sous `md`, tableau à partir de la tablette. |
| CGU, CGV, confidentialité | Textes internes (« frame », « maquette », « Stripe n'est pas connecté », annotation). | Corrigé : texte client, prix et absence de prélèvement dits clairement. |
| Inscription | Le devis et le parrainage parlaient de Stripe « pas branché ». | Corrigé : aucun prélèvement depuis le formulaire ; le mois de parrainage reste associé à l'inscription. |
| Mot de passe oublié | Libellé « Email ». | Corrigé : « Adresse e-mail ». L'envoi confirme « Si le compte existe… ». |
| Connexion | Bouton Google inactif. | Déjà retiré par l'intégration. |
| FAQ | Réponses « pas encore publiée ». | Déjà complétées par l'intégration. Le lien Contact du pied de page pointe vers `#contact`. |
| Portail, écran d'accueil | « Let's Start » et « Management ». | Corrigé : « Commencer », « Pilotage et gestion », « Votre séjour » pour le voyageur. |
| Portail propriétaire | « Mode propriétaire : plus tard ». | Corrigé : espace propriétaire, tâches (loyers, séjours), menu « + » (note, loyers, messages, documents, calendrier). |
| Portail voyageur, menu « + » | Le pré-check-in n'était pas proposé. | Corrigé : « Préparer mon arrivée ». |
| Portail, démarrage | Un clic sur « Commencer » pendant le chargement était écrasé par la réponse serveur. | Corrigé : une saisie plus récente n'est plus remplacée. |
| Pré-check-in voyageur | La pièce d'identité ne gardait que le nom du fichier. | Corrigé : dépôt serveur (recto, verso ou fichier), relu après rechargement. L'identité du formulaire était déjà enregistrée. |
| Portail, calendrier | Jours et flèches trop petits au doigt ; « Modifier » / « Supprimer » aussi. | Corrigé : cibles d'au moins 44 px, sans défilement horizontal à 360. |
| Portail, en-tête et notifications | Retour, cloche et fermeture sous 44 px. Un bouton hors écran portait le nom du rôle et ne fermait que les notifications. | Corrigé : zones 44 px. Bouton retiré. |
| Portail, déconnexion | Ne vidait pas l'état local du navigateur. | Corrigé : purge puis retour à la connexion. |
| Portail, messages | « Nouveau contact » trop petit. | Corrigé. |
| Dialogue (mobile) | La croix de fermeture était masquée sur tous les écrans. | Corrigé sous 1024 px. Le bureau gestionnaire garde ses propres boutons. |
| Clavier mobile | Un champ en bas de formulaire peut passer sous le clavier. | Corrigé : au focus (pointeur grossier), le champ revient au centre. Les toasts sont remontés au-dessus de la barre. |
| Gestionnaire, filtres du planning | « Taches », « check out », « Check in », « periode ouverture BAIL ». | Corrigé : « Tâches », « Check-out », « Check-in », « Période d'ouverture du bail ». |
| Gestionnaire, livret | Libellé « Welcome book ». | Corrigé : « Livret d'accueil ». |
| Gestionnaire, notifications | « Email », « Infos bulles ». | Corrigé : « E-mail », « Infobulles ». |
| Outils, Je débute | Phrases qui citaient la maquette. | Corrigé. |
| Quittance PDF | « Fait a ». | Corrigé : « Fait à ». |
| Gestionnaire mobile | Menu, réservations, messagerie, analyse, documents. | Vérifié à 390 et 360 : le menu s'ouvre et se ferme, pas de défilement horizontal de la page. L'audit détaillé du bureau est laissé à l'autre branche. |
| Paiements portail | Simulation, pas un encaissement. | Assumé. La simulation reste lisible après rechargement (déjà couvert par le parcours démo). |

## Commit de fusion

Le commit de fusion vers `main` est indiqué dans le message de merge de la pull request `audit/mobile-public`. Il est recopié ici dès qu'il existe : _en attente de la fusion_.
