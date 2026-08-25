# Audit produit — Hublify Nexus

Date : 24 août 2026. Portée retenue : **SaaS multi-clients** (`org_id` dès le schéma).
Méthode : lecture du code, mesures de taille, et **preuve d’exploitation** sur le serveur de dev.

> **Mise à jour du 24 août, après-midi — phase 0 livrée.** Les points 1, 3 et une partie du 4 ci-dessous
> sont corrigés et sous test. Détail et mesures : section « Phase 0 » en fin de document, et `QA.md`.
> Les phases 1 à 4 restent à faire : ce sont elles qui font passer de la démo au produit.

---

## Verdict

L’interface est au niveau d’une **démo commerciale convaincante** (auth cookie, RBAC d’écran, 21 routes, chrome, responsive). Ce n’est **pas** un produit multi-utilisateur prêt à porter de vrais clients.

Le métier vit dans **un blob JSON par utilisateur** (`public.etats_session.payload`), pas dans des tables métier. Chaque compte a **sa copie** des réservations. Deux personnes de la même société ne partagent pas un parc : elles s’ignorent ou s’écrasent.

Le seul module vraiment « serveur + droits revérifiés » est **l’équipe**. Le reste du métier est écrit par le navigateur.

---

## Preuve n°1 — IDOR sur l’état métier (P0) — **corrigé**

Fichier : `src/data/session-remote.ts`.

`chargerEtatDistant` et `sauverEtatDistant` prennent un `userId` **fourni par le client**. Le handler ne lit pas la session. Seul le format UUID est validé.

Contraste : `src/lib/auth.functions.ts` (`sessionDepuisRequete`, `listerEquipe`, `inviterMembre`, …) relit la session et `aLeDroit(..., "gerer-equipe")`. Le motif correct existe déjà dans le dépôt.

**Mesure du 24 août, `http://127.0.0.1:8080` :**

| Appel | Session | Résultat |
|---|---|---|
| `GET /_serverFn/…chargerEtatDistant` sans cookie, sans `Origin` | aucune | HTTP **403** `Forbidden` (garde d’origine TanStack Start, **pas** une auth métier) |
| Même URL + en-têtes `Origin` / `x-tsr-serverfn` / `Accept` de l’app | cookie **Lecture** `claire.lecture@hublify.app` | HTTP **200**, **35 044 octets** |
| UUID demandé | `1ea1c674-37aa-4557-968e-3af98f711c95` (super-admin `contact@tech-trust.fr`) | |
| UUID du lecteur | `e9016520-9825-4a14-97bf-1642329da97c` | distinct |

Le corps 200 contient les clés `loyers`, `missions`, `conversations`, `reservationsDossier`, `membres`, et la chaîne **« Sophie »** (`Sophie Martin · Suzette · 850 €` dans le jeu mock). Un compte Lecture authentifié **lit le blob métier d’un autre utilisateur**.

`sauverEtatDistant` a le même contrat : un POST avec un autre `userId` **écrase** son état. Non rejoué en écriture (données démo), le code est symétrique.

Correctif appliqué : la logique est passée dans `src/data/etat-distant.ts`, qui reçoit un
`sessionUserId()` et n’expose **aucun** paramètre d’identité ; `session-remote.ts` n’est plus qu’un
adaptateur. Rejoué le même jour avec `npm run audit:idor` : l’appel forgé par le lecteur renvoie
**35 602 octets**, soit exactement son propre état, contre 37 404 pour celui de l’admin.

---

## Preuve n°2 — le métier n’est pas en base

### Schéma réel (`db/`)

| Table | Rôle |
|---|---|
| `"user"`, `session`, `account`, `verification` | Better Auth |
| `public.roles`, `permissions`, `role_permissions`, `profils` | RBAC |
| `public.biens` | **4 lignes seed**, jamais lues par l’UI métier |
| `public.etats_session` | `user_id` + **`payload jsonb`** = tout le métier |

Aucune table `reservations`, `missions`, `messages`, `documents`, `orgs`. Pas de RLS. Pas d’`org_id`.

### État côté client (`src/data/session.ts`)

- Clé `localStorage` : `hublify.session.v3` (~20 ko après login admin, **15 collections**).
- Debounce **400 ms**, puis `sauverEtatDistant({ data: { userId, payload: etat } })`.
- Erreurs avalées (`.catch(() => {})`) — l’utilisateur croit que c’est enregistré.

Cardinaux mesurés (blob admin hydraté) : loyers 3, événements 3, messagesDash 7, missions 14, réservations calendrier 6, dossiers 14, dates bloquées 1 + 12 annuelles, ensembles 3, règles 5, conversations 9, messages de fil 17, membres 7, actions 0, notifications 3.

Mocks sources : **~90 ko** dans `src/data/*.ts`.

### Mutations

- **~25** écritures UI via `modifierSession` / helpers.
- **8** `createServerFn` : 6 auth/équipe (session + droits) + **2** blob **sans** session.

Conséquence multi-clients : l’invitation d’équipe ne partage pas le parc. Chaque login a **sa** copie.

---

## Ce qui est déjà solide

| Zone | Preuve |
|---|---|
| Session cookie httpOnly | Better Auth + `getSession` depuis les headers |
| Garde de routes | `__root.tsx` `beforeLoad` : pas de session → `/connexion` ; `droitRequisPourChemin` → `/` |
| Équipe | handlers revérifient `gerer-equipe` ; super-admins protégés |
| CI | `.github/workflows/verify.yml` : `tsc`, tests, `build`, Playwright |
| UI | 21 routes fichier ; audits responsive 0 overflow (voir `QA.md`) |

`docs/DECISIONS.md` dit encore « hors périmètre : connexion réelle, base » — le code a dépassé ce document.

---

## Écarts par criticité

### P0 — bloquant données réelles

1. ~~**IDOR** `chargerEtatDistant` / `sauverEtatDistant`.~~ **Corrigé** (phase 0).
2. **Pas d’organisation** : pas d’isolation client A / client B.
3. ~~**Sync silencieuse** : perte de travail sans signal.~~ **Corrigé** : bandeau + reprise (phase 0).
4. **Invitation** : mot de passe temporaire **renvoyé au navigateur** (`inviterMembre` → `motDePasseTemporaire`), pas d’e-mail.

### P0 bis — spécifique à la commercialisation (découvert le 24 août)

Ces trois points ne bloquaient pas un usage interne Redris. Ils bloquent l’arrivée d’un **nouvel adhérent**.

13. **Aucune inscription possible.** `src/lib/auth.ts` rejette `/sign-up/email` sauf appel interne
    (`avecInscriptionInterne`). Un prospect ne peut pas créer de compte : il faut un parcours
    d’inscription, la création de son organisation, et la vérification de son e-mail.
14. **Super-admins codés en dur.** `SUPER_ADMINS` liste trois e-mails nominatifs ; `droitsEffectifs`
    leur rend **tous** les droits quel que soit le contexte. Chez un client payant, cela signifie que
    des tiers sont administrateurs de ses données. À séparer en deux notions : *staff plateforme*
    (support, traçé, consenti) et *rôle dans une organisation*.
15. **Les données de démo sont le point de départ.** `ETAT_INITIAL` contient le parc Redris
    (Suzette, Villa Lavandrix, Sophie Martin…). Un nouvel adhérent atterrit dans le patrimoine d’un
    autre client. Il faut un état vide, des écrans d’amorçage, et un jeu de démo optionnel.

### P1 — le produit métier n’existe pas encore

5. Schéma relationnel + mutations serveur avec `org_id` et contrôle de droit **dans le handler**.
6. Fin du JSON unique : last-write-wins, pas de pagination, pas de SQL métier.
7. Documents : `telechargerDemo` produit un **.txt** (`src/lib/feedback.ts`). Pas de PDF, pas d’objet storage.
8. Messagerie / notifs : mémoire navigateur, pas de temps réel.

### P2 — exploitation

9. ~~Tests : aucun test IDOR, aucun test « prestataire → `/team` ».~~ **Corrigé** : unitaires IDOR +
   e2e cloisonnement des 3 rôles, étanchéité entre comptes, échec d’enregistrement. **En CI** ces e2e
   tournent sur Postgres 16 (service GitHub), plus d’ignorance silencieuse.
10. Pas de reset password produit, journal d’audit, observabilité, backups testés. Le rate-limit
    Better Auth **existe** (40 requêtes / 60 s) et s’est déclenché pendant les tests ; **désactivé
    en CI** pour que le seed et les e2e ne se marchent pas dessus.
11. Contraste muted hors AA (maquette, déjà dans `QA.md`).
12. Device iOS réel non exécuté.
16. ~~**CI aveugle sur l’authentification.**~~ **Corrigé** : `src/lib/sql.ts` utilise `pg` (protocole
    Postgres). Le workflow `verify` lève Postgres 16, `npm run db:prepare`, puis Playwright. Sans
    `DATABASE_URL` en CI, `playwright.config.ts` lève une erreur au chargement.

---

## Implications du choix multi-clients

À figer **avant** la première table métier.

Chaque ligne métier porte `org_id`. La session résout l’org via `org_members`. RLS Neon : l’utilisateur ne voit que **son** org.

**Décision produit (24 août 2026) — prestataire = sa propre org, pas un membre de l’org gestionnaire.**

Un prestataire (personne ou société de ménage, etc.) est **solo** : son compte *est* son organisation. Il n’entre pas dans `org_members` de Redris / du gestionnaire. Le lien métier est une **relation B2B** (contrat / affectation de missions), pas une affiliation d’équipe.

Conséquences :

| Ce qu’on ne fait pas | Ce qu’on fait |
|---|---|
| `org_members` avec `role_id = prestataire` chez le gestionnaire | Deux types d’org : `gestionnaire` et `prestataire` |
| Le prestataire voit le planning interne, les loyers, l’équipe | Il ne voit que **ses** missions (et docs d’intervention) via les liens |
| Inviter un prestataire = l’ajouter à Team | Inviter = créer / lier une **org prestataire** ; Team reste salariés + lecture |

V1 : une org prestataire = un seul membre (lui-même). Une société de ménage à plusieurs employés est hors V1 (ce serait alors une org prestataire avec *ses* `org_members`).

Plus tard, **sans changer le modèle** : la même org prestataire peut être liée à **plusieurs** orgs gestionnaires (`liens_org`). Ce n’est pas « un user dans N teams », c’est « une société liée à N clients ».

---

## Cible schéma V1 (proposition)

`orgs (id, type: gestionnaire | prestataire, nom)` · `org_members (org_id, user_id, role_id)` — **uniquement l’équipe interne de cette org** · `liens_org (org_gestionnaire_id, org_prestataire_id, statut)` · `biens` (`org_id` gestionnaire) · `reservations` · `voyageurs` · `missions` (`org_id` gestionnaire + `org_prestataire_id` nullable) · `messages` · `documents` · `ecritures` / loyers · `audit_log`.

Rôles **dans** une org gestionnaire : `super-admin`, `administrateur`, `gestionnaire`, `lecteur`.  
Rôle **dans** une org prestataire (V1) : `titulaire` (lui-même). Pas de `prestataire` dans `org_members` du gestionnaire.

Handlers : session → `org_id` + droit → SQL. Plus de `payload jsonb` métier.

UI : les écrans restent ; `useSession()` devient du fetch (`useQuery` / `useMutation`).

---

## Plan chiffré (1 senior, calendrier)

Hors marketplace, sync Airbnb, app native prestataire.

| Phase | Contenu | Durée | Risque |
|---|---|---|---|
| **0. Stop-bleed** ✅ | IDOR (`session.user.id`) ; bandeau + file de reprise sync ; e2e rôles et étanchéité ; cloisonnement `localStorage` ; **CI Postgres + e2e sécurité** | **fait** | Faible |
| **1. Tenancy** | `orgs` + membres ; démo gestionnaire → org « Redris » ; compte prestataire → **sa** org + `liens_org` ; RLS | **1–1,5 sem** | Moyen |
| **1 bis. Onboarding** | inscription publique + création d’org + vérification e-mail ; état vide et écrans d’amorçage ; sortie des super-admins codés en dur | **1,5–2 sem** | Moyen |
| **2. Métier SQL** | tables + handlers (réservations d’abord) ; bascule UI par domaine | **5–8 sem** | Élevé |
| **3. Documents + mail** | objet storage + PDF ; e-mail invitation / reset | **2–3 sem** | Moyen |
| **4. Durcissement** | audit, observabilité, backups, charge | **1,5–2 sem** | Moyen |

**Premier client réel sur une org isolée : ~11–16 semaines** (phase 1 bis incluse, imposée par la
commercialisation).  
Plusieurs orgs payantes + isolation testée en charge : **+4–6 semaines**.

Ce n’est pas du polish. C’est un **changement de nature du logiciel**.

---

## Ordre (ne pas paralléliser 0 et 2)

1. Phase 0 avant toute donnée personnelle réelle.
2. ~~Trancher prestataire~~ **Tranché** : org prestataire distincte, lien B2B, pas membre Team.
3. Phase 1 + 2, réservations en premier. L’invitation Team n’a plus de rôle « Prestataire ».
4. Pas de PDF tant que les lignes ne sont pas en SQL.

---

## « Produit fini full fonctionnel » ici

Un gestionnaire de **la même org** crée une réservation, le collègue la voit au planning, une mission est assignée, un loyer est validé, un **vrai** PDF part, l’invitation part par **e-mail**, et un compte Lecture **ne peut ni lire ni écrire** le JSON d’un autre — y compris via `/_serverFn`.

Aujourd’hui : les écrans existent, et la dernière clause est **vérifiée par un test**. Le partage entre
collègues d’une même organisation, lui, n’existe pas encore.

---

## Phase 0 — livrée le 24 août

| Écart | Correctif | Preuve |
|---|---|---|
| IDOR sur l’état métier | Logique déplacée dans `src/data/etat-distant.ts`, identité issue de `auth.api.getSession`, plus aucun paramètre d’identité | `npm run audit:idor` : appel forgé → 35 602 octets = état du lecteur, ≠ 37 404 de l’admin. 8 tests unitaires. |
| Échec de synchronisation avalé (`.catch(() => {})`) | Statut de synchro exposé, bandeau `role="status"`, reprise 2→30 s + événement `online` + bouton « Réessayer » | e2e : écriture serveur coupée → bandeau visible, puis masqué après reprise. |
| Message de succès mensonger | « Événement **ajouté** » au lieu de « enregistré » (6 libellés) | Le toast ne contredit plus le bandeau. |
| `localStorage` partagé entre comptes | Une clé par utilisateur, purge des autres à la connexion, purge totale à la déconnexion | e2e : après changement de compte, aucune clé ne contient l’état du précédent. |
| Droits jamais testés par rôle | 4 tests de cloisonnement (prestataire, lecture, gestionnaire) sur `/team`, `/tarifs`, `/reservations`, `/reservations/nouveau` | `npm run e2e` |
| Identifiants de démo exposés | Panneau de la page de connexion masqué hors dev (`VITE_MODE_DEMO`) | Build de production : e-mails et mot de passe absents du DOM. |
| Saisie perdue à l’hydratation de `/connexion` | Champs non contrôlés + bouton inactif jusqu’à l’hydratation | Le test de connexion par formulaire passe de façon déterministe (4 s). |
| CI aveugle sur l’auth | Client SQL = `pg` (protocole Postgres) ; service Postgres 16 dans `verify.yml` ; `npm run db:prepare` avant Playwright | Sans `DATABASE_URL` en CI, `playwright.config.ts` lève au chargement. Les e2e sécurité ne sont plus skippés. |

Vérifications de non-régression : `tsc` sans erreur, 18 tests unitaires, 8 e2e, `npm run build`,
et audit responsive à 320 / 375 / 768 / 1024 px — **0 défaut**, mêmes 6 cibles 24–43 px assumées.
