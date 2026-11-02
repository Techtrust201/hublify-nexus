# Portail mobile locataire / prestataire — écarts assumés

Source : section Figma « Version Mobile LOCATAIRE PRESATAIRE » (Hublify V1.0), notes de section et commentaires de Yannick Ratti. Les frames 48 à 92 reprennent le même parcours : un sélecteur **Mode Résident / Mode Prestataire** couvre les deux colonnes.

## Corrections de la maquette

- Fautes d'interface corrigées : « Tâches », « parmi », « conçu », « accès », « Règlement », « Procéder ».
- Le résidu de template « Daily Study » n'est pas repris.
- Les libellés anglais de la fiche d'accès (`name Password`, `access Code`) deviennent Nom, Mot de passe, Code d'accès.
- Les jours de la bande « Tâches du jour » sont en français. La maquette figeait « May / Fri » sur un composant anglais.
- Le 5e onglet hésite entre une silhouette et une enveloppe. Le profil s'ouvre par l'avatar ; l'onglet de droite est **Messages**, comme sur l'écran Tâches du jour.
- Le persona « Livia Vaccaro » est remplacé par la personne connectée.

## Limites volontaires

- **Paiement** : simulation locale (`HUB-SIM-…`, fournisseur `aucun`). Aucun appel Stripe ni autre prestataire. Le bandeau « Simulation » reste visible. Le « lien de paiement » est copié dans le presse-papiers, il n'est pas envoyé.
- **Biométrie** : WebAuthn local si le navigateur expose un authentificateur de plateforme, sinon code à 4 chiffres pour la session. Pas d'attestation serveur.
- **Illustration** « Let's Start » : marque Ü, calendrier et clé. Pas de personnage 3D (asset non fourni, tokens Figma non extraits).
- **Carte** « Autour de moi » : SVG illustratif, pas de tuiles Google. Les sites d'annonceurs sont des URL de démonstration.
- **Photos** de logements : aplats, pas de clichés de la maquette.
- **WhatsApp** : les frames du kit ne sont pas reproduites (marque et contenus anglais). La messagerie Hublify reprend la liste, le fil et l'ajout de contact.
- **Mode propriétaire** : annoncé « plus tard », non activé. Le voyageur partage le mode résident.
- **Tâches de démonstration** (mai 2026, Colette à Cannes) seulement si le compte n'a aucune donnée. Un compte réel affiche ses loyers impayés, son check-in et ses missions.
- Téléphone du gestionnaire `04 93 00 12 12` : la maquette ne donne qu'un libellé « Téléphone : ». Nom et société viennent du jeu Redris (Yannick Ratti, Hublify).
- Police : Inter, déjà chargée par le produit. Les variables Figma n'ont pas pu être extraites.

## Commentaires Figma hors de ce portail

Paramétrage des messages automatiques, matrice de droits par catégorie, assignation d'un teammate, import / export d'annonce, API de tarifs : écrans gestionnaire, laissés aux autres chantiers. La notation affichée est celle déjà portée par l'annonce, sans extraction externe.

## Reste pour un second passage

Parité pixel des ~45 frames uniques (états d'état des lieux pièce par pièce, récapitulatif de séjour 402×900, modales d'ajout du kit), géolocalisation branchée sur un fournisseur de carte, et mode propriétaire.
