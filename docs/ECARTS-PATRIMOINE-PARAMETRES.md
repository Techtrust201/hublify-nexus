# Écarts — Patrimoine, Paramètres, Compte gestionnaire

Source : Hublify V1.0, file `kBd9QQDfrAlr59dtwyUQZq`, sections Patrimoine, Paramètres, Compte gestionnaire. Annotations `notes.md`, commentaires de Yannick Ratti.

## Repris

- Liste des types de lieu de l'annotation 200:15198, regroupée, avec ajout à la liste.
- Bouton « + Ajouter un contrat de gestion » (231:4513) et bascule d'accès au mandat signé (231:4506).
- Alerte unique (état des lieux, welcome book, gestion des clés) — 302:17034.
- Bloc légal meublé de tourisme, article L. 324-1-1 du Code du tourisme (246:5595), numéro d'enregistrement requis pour publier.
- Équipements, stationnement, services, règles (200:15227, 201:15418, 200:15246, 200:15247).
- Deux configurations pour un lit double (318:22837).
- Champ Description (329:26367).
- Type de loyer forfaitaire ou classique, loyer + charges (335:1459).
- Import / export d'annonce et extraction locale de notation (323:24256, commentaires 10 et 13).
- Modes Meublé, Vide, Événement, Travaux (commentaire 11). Bateau ajouté au catalogue (commentaire 12).
- Paramètres : notifications, relances, prestations automatiques, portail, abonnement, signature, paiements.
- « Paramétrage message automatique » (commentaire 54).
- Compte gestionnaire : identité, entreprise, SIRET, carte T, recto/verso (commentaires 1 et 2), RIB, équipe.
- Profil vérifié seulement avec agrément de carte T et les deux faces de la pièce (annotation 220:20741, commentaire 6).

## Écarts assumés

1. **Pas de migration SQL.** Consigne de ne pas modifier la base. La fiche lieu, les relances, l'abonnement, le SIRET, l'agrément et le RIB vivent dans le navigateur (`localStorage`). L'identité, les pièces et les codes d'accès continuent d'utiliser les colonnes déjà là. Un rechargement depuis le serveur ne les efface pas, mais un autre appareil ne les voit pas.
2. **Titre.** « Patrimoine » est le titre d'écran. L'entrée de navigation reste « Lieux » : c'est le chrome partagé, hors de ce lot.
3. **Le titre est aussi dans l'en-tête commun.** La planche le centre dans le corps. On le garde aux deux endroits pour ne pas vider l'en-tête mobile.
4. **Badge « Vide ».** La planche dit « Non meublé ». Le commentaire 11 demande le mode Vide. Le badge suit le commentaire.
5. **« Bateau »** n'est pas dans l'annotation des types (il y a « Péniche »). Il est ajouté parce que le commentaire 12 le demande, à côté de la péniche.
6. **« Extérieur », « Fer à repasser et table à repasser », « Douche » et « Baignoire ».** La planche écrit « Exterieur », « Fer à repasser table à repasser » et « Douche baignoire ». Orthographe corrigée, douche et baignoire séparées : un logement peut n'avoir que l'une des deux.
7. **« Château / manoir ».** La parenthèse « rare, haut de gamme » est une aide, pas le nom du type.
8. **Second interrupteur « Push navigateur »** sous Rappels : doublon de la planche. Un seul interrupteur, dans Canaux. Le SMS, déjà en service, reste un troisième canal.
9. **« Mise à jour automatique », messages et missions** restent dans les données. Ils ne sont pas sur la frame Notifications.
10. **Onglet Upsells** conservé : il alimente les réservations. Il n'est pas sur la frame Notifications.
11. **Montants 650 € / 50 € / 95 €** de la planche : exemples (placeholders), pas des loyers inventés sur le parc.
12. **Fond vert** de la planche : couleur de canvas Figma, pas de l'application.
13. **Capture Airbnb** collée sur la planche : non reprise. « Visualiser l'annonce » ouvre un aperçu Hublify construit depuis la fiche.
14. **Notation OTA.** Pas d'API en V1 (commentaire 13 et 17). On lit une note seulement si elle est dans le texte importé.
15. **Stripe** (commentaire 18) : affiché « non connecté ». La passerelle Hublify reste le canal. Se désabonner ou supprimer des données n'écrit rien en base et ne résilie aucun prélèvement.
16. **Prestations automatiques.** Le réglage et le plan (ménage en fin de séjour, état des lieux d'entrée et de sortie d'un bail) sont testés. Ils ne sont pas encore branchés sur la création de réservation, pour ne pas modifier le pipeline partagé.
17. **Identifiant #ID2456** de la planche : exemple. On affiche l'identifiant déjà porté par le profil.
18. **Équipe « THIERRY ».** Nom de la maquette, modifiable. « Partir de cette team » est local. L'assignation réelle des droits reste l'écran Team mate (commentaire 7), hors de ce lot : le profil rappelle seulement la règle « tout est restreint, puis on coche Financier, Calendrier, Messagerie, Documents ».
19. **Historique des paiements et documents** déjà branchés : repliés sous le formulaire, pour ne pas perdre l'existant que la frame ne montre pas.
20. **Phrase légale sous l'entreprise.** La ligne de la planche est illisible. Elle est réécrite : Hublify ne se substitue pas au détenteur de la carte professionnelle.
21. **Commentaires hors périmètre** (autres agents) : 4, 5, 8, 9, 14, 15, 16, 17. Le 1 et le 2 sont traités sur la pièce d'identité du compte, pas sur l'écran Documents.

## Incohérences de maquette corrigées dans l'interface

- Annotation « Caméras de sécurité extérieures (à déclarer obligatoirement autre : » laissée en suspens : case à cocher + champ « Autre règle ».
- « TYpe », « Paramatreage », « numéro d'agréement » : libellés corrigés.
- Alerte dessinée sur une seule ligne : le pictogramme liste uniquement ce qui manque vraiment pour ce logement. Sur le parc de démonstration, Suzette manque de welcome book et de clés ; Studio Raclette manque d'état des lieux.
