# Audit démo — rôles, sessions et cas limites

Périmètre : logique métier et serveur (rôles, isolation d'organisation, sessions, saisies, cohérence des chiffres, chargement). L'interface gestionnaire et le portail mobile sont couverts par d'autres branches.

Base de départ : `main` incluant `fix/demo-integration-finale` (pull request #18), l'audit mobile public (pull request #21) et l'audit gestionnaire (pull request #22). Aucune migration. La base de production n'a pas été touchée. `.env.local` n'est pas versionné.

Vérifications locales : `npx tsc --noEmit`, `npm test` (202 tests), `npm run build`, `npx playwright test` (37 tests) sur Postgres local.

## Défauts

| # | Gravité | État | Description |
| --- | --- | --- | --- |
| 1 | Critique | Corrigé | `chargerEtatDistant` renvoyait presque tout le parc aux rôles locataire, voyageur et propriétaire (`...etat` après un filtre partiel). Un appel direct exposait les autres séjours, les loyers, les messages d'équipe, les droits personnalisés et les dossiers de revenus. Le filtre est maintenant une liste blanche. |
| 2 | Critique | Corrigé | `sauverEtatDistant` remplaçait toute une collection. Un rôle du portail, qui ne voit qu'une partie des lignes, pouvait effacer les réservations ou les messages du reste de l'organisation, y compris avec un tableau vide. Le remplacement entier est refusé à ces rôles. Les messages passent par une insertion de ligne, après contrôle du fil. |
| 3 | Critique | Corrigé | `retirerMembre` supprimait le compte d'authentification même si l'identifiant n'était pas membre de l'organisation courante. Un administrateur pouvait donc supprimer un compte d'une autre organisation. Le retrait n'a lieu que pour un membre de l'org, jamais pour un super-administrateur, jamais pour soi-même. |
| 4 | Haute | Corrigé | `chargerAccesLieux` déchiffrait tous les codes (boîte à clés, Wi-Fi, alarme) pour tout rôle portail de l'organisation et pour le rôle lecture. Désormais : l'équipe qui modifie les biens voit les codes de son organisation ; le locataire et le voyageur seulement les biens de leurs séjours ; le propriétaire seulement les siens ; le prestataire seulement les biens de ses missions ; la lecture n'a aucun secret. |
| 5 | Haute | Corrigé | L'écran des codes de séjour affichait le premier code de la liste quand le bien ne correspondait pas. Il n'affiche plus que le code du bien courant. |
| 6 | Haute | Corrigé | Un voyageur authentifié pouvait, via `modifierLigneMetier`, changer le montant, les dates ou l'occupant de n'importe quelle réservation de l'organisation, et en créer une nouvelle. Il ne peut plus qu'enregistrer le pré-check-in de son propre séjour. |
| 7 | Haute | Corrigé | Un prestataire pouvait écraser un document, une conversation ou un rapport du gestionnaire sans lien avec ses missions. Le rapport exige une mission qui lui est confiée, le document d'intervention est forcé sur cette vue. Les fils sont limités à son nom quand il correspond ; sinon les fils de type prestataire restent visibles, car la base ne relie pas un fil à un prestataire (Lucas Ménage / « Linge & Entretien »). |
| 8 | Haute | Corrigé | `droitsEffectifs` appliquait une liste personnalisée sans la recouper avec le plafond du rôle. Un gestionnaire dont la base contenait `gerer-equipe` obtenait l'administration de l'équipe. Le plafond est appliqué à la lecture. |
| 9 | Moyenne | Corrigé | L'invitation d'équipe acceptait les libellés Locataire, Voyageur et Propriétaire, donc un compte portail dans l'organisation gestionnaire. Ces rôles sont refusés, comme le super-administrateur et le prestataire. |
| 10 | Moyenne | Corrigé | Déposer ou lire un fichier de dossier ne demandait que `voir-documents`. Le rôle lecture pouvait donc écrire, et un locataire pouvait lire ou remplacer la pièce d'un autre dossier. L'écriture d'un dossier exige `mod-reservations`, ou bien son propre dossier pour le locataire et le voyageur. Le prestataire ne dépose une photo de mission que sur une mission qui lui est assignée, dans l'organisation du gestionnaire lié. Les quittances et avis PDF exigent `mod-finances`, le récapitulatif `mod-reservations`. Un montant négatif est refusé. |
| 11 | Moyenne | Corrigé | Le cache de session (5 minutes) pouvait garder une session révoquée après un changement de mot de passe ou une déconnexion. Le cache est désactivé. La déconnexion prévient les autres onglets. Revenir sur un onglet revérifie la session auprès du serveur. Un formulaire de changement de mot de passe révoque les autres sessions. Le portail y accède via `/profil`, sans le formulaire entreprise. |
| 12 | Moyenne | Corrigé | Un échec de chargement laissait les indicateurs à zéro, comme un compte vide, avec un message qui parlait d'enregistrements non sauvés. L'écran affiche maintenant que les données n'ont pas pu être chargées, sans chiffres. Au-delà de huit secondes, le squelette précise que la connexion est lente. |
| 13 | Basse | Corrigé | Une réservation acceptait un prix nul ou négatif, un nom très long, et un double clic sur Enregistrer pouvait créer deux séjours. Le formulaire bloque le second clic, refuse le prix négatif ou nul et les textes trop longs. Le serveur refuse un montant négatif, des dates inversées et un texte de plus de 8 000 caractères. Les identifiants ont un suffixe aléatoire. Les accents et les emojis restent acceptés. |
| 14 | Basse | Corrigé | La carte « Loyers en retard » comptait les échéances non validées, alors que le bloc en dessous annonçait le nombre total de paiements. Le sous-titre reprend le même calcul que la carte (`syntheseLoyers`). Les départs du jour de l'accueil sont les mêmes que le compteur de la liste. |
| 15 | Basse | Corrigé | Un compte neuf, sans logement ni séjour, affichait des zéros sans expliquer qu'il n'y avait encore rien. Un texte le précise. |
| 16 | Basse | Non corrigé | Le chargement de l'état métier interroge encore chaque collection séparément (une trentaine de requêtes). Les fusionner toucherait tout le socle juste avant la démo. L'hydratation en double, elle, est dédoublonnée. |
| 17 | — | Vérifié, pas un défaut | `portail_etat` est isolé par utilisateur. Livrets, upsells et extras de pré-check-in refusent déjà les rôles portail en écriture. La caution d'extra est déjà ramenée à zéro minimum. L'invitation crée le compte sans voler la session de l'administrateur ; le mot de passe temporaire part dans le mail capturé et n'est pas affiché à l'écran. L'expiration de session reste de 7 jours, contrôlée en base à chaque requête. |

## Migrations

Aucune. Les correctifs tiennent dans le code applicatif.

Commit fusionné : `d67b03527df973424ce6deccea33b154045718cb` (merge de la pull request #23 dans `main`).
