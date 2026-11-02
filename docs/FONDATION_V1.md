# Fondation Hublify V1.0

Source : fichier Figma `kBd9QQDfrAlr59dtwyUQZq`, page 1. Les variables Figma n'ont pas été exportées (`tokens.md` : limite du plan Starter). Les couleurs ci-dessous sont celles lues dans les frames via le contexte de design, pas une extrapolation.

## Jetons partagés — compatibilité

Changé :
- `--brand`, `--brand-foreground`, `--brand-soft`, `--brand-strong` : le bleu `#002fa7` remplace l'oklch inventé. Les écrans qui utilisent `bg-brand` (prestataires, calendrier de missions) prennent cette couleur.
- `--font-display` (Poppins) ajouté. `--font-sans` reste Inter.

Non changé, pour que les autres lots mergent sans surprise visuelle :
- `--primary`, `--primary-foreground`, `--ring` (boutons shadcn)
- palette opérationnelle `--canvas`, `--ink`, `--line`, `--accent-teal`

Ajouté, sans effet tant qu'on ne les utilise pas : tous les `--v1-*` (`bg-v1-brand`, `text-v1-ink`, etc.).

## Jetons

Définis dans `src/styles.css` (`--v1-*`, `--brand`, `--font-display`).

| Jeton | Valeur | Où c'est mesuré |
|---|---|---|
| `--v1-brand` / `--brand` / `--primary` | `#002fa7` | CTA, filet, lien actif |
| `--v1-brand-soft` | `#f0f3fc` | Offre sélectionnée, carte Freemium |
| `--v1-brand-pill` | `#c4d7e8` | Pastille de prix actif, colonne « inclus » |
| `--v1-ink` | `#16211d` | Titres marketing |
| `--v1-ink-strong` | `#171a22` | Titres d'auth |
| `--v1-ink-body` | `#4e5b55` | Texte courant |
| `--v1-ink-muted` | `#686d7a` | Texte secondaire auth |
| `--v1-ink-subtle` | `#8b90a0` | « Connexion sécurisée », prix en pastille |
| `--v1-canvas` | `#f7f6f2` | Hero, navigation |
| `--v1-canvas-warm` | `#f7f5f0` | Équipe, FAQ |
| `--v1-canvas-auth` | `#f6f7fb` | Fond derrière le panneau blanc d'auth |
| `--v1-line` | `#d9dfdb` | Filets marketing |
| `--v1-line-strong` | `#c6cec9` | Bouton secondaire |
| `--v1-line-auth` | `#dadde6` | Cartes d'offre |
| `--v1-green` | `#167a5a` | Marque dans l'aperçu produit |
| `--v1-green-soft` | `#ddf0e8` | Ligne active, statut payé |
| `--v1-green-ink` | `#0d5e43` | Texte sur vert clair |
| `--v1-green-deep` | `#12211c` | Carte d'aide |
| `--v1-success` | `#18815c` | « 100 % à jour » |
| `--v1-muted` | `#76817b` | Méta de l'aperçu |
| `--v1-warning` | `#b97418` | « À relancer » |
| `--v1-warning-soft` | `#f7e8d3` | Pastille d'alerte |
| `--v1-mark` | `#9e2f1e` | Ü du wordmark |
| `--v1-pro` | `#ffc0b6` | Carte Professionnel |

Typographie : **Inter** pour l'interface, **Poppins** (`font-display`) pour les titres marketing. Nunito Sans n'est pas dans ce fichier.

Rayons repris : 8 px (boutons marketing), 12 px (contrôles d'auth), 14 px (cartes FAQ), 20 px (aperçu). Espacements de la maquette : 4, 8, 10, 12, 14, 16, 20, 22, 24, 32, 72.

La palette opérationnelle MO1 (`--canvas`, `--ink`, `--line`, `--accent-teal`) n'est pas remplacée : les écrans métier s'en servent encore. Les nouveaux écrans utilisent `bg-v1-*` / `text-v1-*`.

## Composants à réutiliser

| Composant | Rôle |
|---|---|
| `src/components/marque/Logo.tsx` | Wordmark HÜblify |
| `src/components/marque/SitePublic.tsx` | En-tête et pied de la landing |
| `src/components/marque/CadreAuth.tsx` | Chrome auth + `champAuth` + `boutonAuth` |
| `src/components/marketing/FaqListe.tsx` | Accordéon des 6 questions du frame FAQ |
| `src/components/layout/BarreOngletsMobile.tsx` | Onglets bas &lt; `lg` |
| `src/components/layout/AppShell.tsx` | Padding bas mobile + barre d'onglets. Le hamburger et la sidebar desktop restent. |
| `src/components/layout/NavChrome.tsx` | Deux liens ajoutés : FAQ, Parrainage. Le reste de la navigation n'est pas réordonné. |
| `src/components/layout/BarreOngletsMobile.tsx` | Onglets bas &lt; `lg` : Accueil, Réservations, Messages, Analyse, Menu |
| `src/design/offres.ts` | Prix, remise −20 %, FAQ, lien de parrainage |
| `src/lib/routes-publiques.ts` | Chemins sans redirection vers `/connexion` |

## Routes

| Chemin | Frame |
|---|---|
| `/` anonyme | Landing `163:8878` |
| `/` connecté | Vue générale existante, hors de ce lot |
| `/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe` | Authentication area, Créer un compte, Mot de passe oublié |
| `/choix-du-profil` | Choix du profil `184:1626` |
| `/faq` | Questions du bloc FAQ landing ; le frame in-app `2:50137` est du lorem |
| `/parrainage` | Section Parrainage |
| `/cgu` | Section CGU vide |
| `/cgv` | Annotation `327:26091` |
| `/confidentialite` | Lien du pied d'auth, sans texte de maquette |

## Écarts assumés

1. Traits en croix sur l'aperçu du hero et filet rouge autour de « Sans carte bancaire » : annotations de travail, non reproduites.
2. « © 2026 Clair » devient « © 2026 Hublify ».
3. « X jours » / « X mois » (essai, parrainage) et « XXX.XX €/annuel » ne sont pas chiffrés. L'annuel applique la remise « −20 % » déjà écrite sur le commutateur.
4. Standard : 3 annonces sur la landing, 5 dans le choix de profil. Chaque écran garde le chiffre de son frame.
5. Le compteur +/− au-dessus des tarifs chevauche le titre : non repris.
6. Le commutateur est sur Annuel dans la maquette alors que les prix restent les prix mensuels. Ici le commutateur change vraiment le montant, et Mensuel est le défaut pour que 14,90 € corresponde au libellé.
7. Écran Paiement (`181:9560`) : capture d'e-mail et question rouge « Freemium demande carte bancaire ? ». Décision : pas de carte (hero « Sans carte bancaire »). Stripe n'est pas branché (commentaire « si connection stripes »).
8. CGU : section vide. CGV : seule la phrase « sans engagement mais non remboursable ». Pas d'articles inventés.
9. FAQ in-app : lorem ipsum. Les questions publiées sont celles, rédigées, du bloc landing. Une seule réponse est dans la maquette.
10. Diagrame concentrique « Un travail d'équipe » : positions absolues et descriptions « xxxx ». Repris en trois cartes avec les vrais rôles (propriétaire au centre du schéma n'avait pas de carte texte exploitable au-delà du libellé).
11. Collages de captures, témoignages (calques nommés Quote/Name) et vidéo « Voir la démo » : pas de texte exploitable. « Voir la démo » descend aux fonctionnalités. Le montant « 630 €/mois » n'avait pas de libellé : il n'est pas affiché.
12. Fautes corrigées à l'affichage : limité, accès, tarification, écosystème, « monde au », agence immobilière, 1 annonce, aide ponctuelle.
13. Parrainage : fond `#f0f3fc` (jeton déjà mesuré). Le remplissage exact de la section n'est pas dans l'export de variables. « PHOTO » n'est pas un visuel : emplacement vide.
14. `landing-page/notes.md` et `faq/notes.md` sont absents de l'archive fournie (dossiers vides). Les annotations de ces zones viennent du contexte Figma lu avant la limite d'appels, et des notes parrainage / CGVente / commentaires.
