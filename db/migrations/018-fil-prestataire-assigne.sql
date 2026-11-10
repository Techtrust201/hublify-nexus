-- Le fil démo du prestataire n'est visible que par l'identifiant du compte
-- (e-mail dans `assigne`), jamais par le titre. On pose cet identifiant quand
-- le fil n'est pas déjà rattaché à une adresse : une affectation e-mail choisie
-- par un gestionnaire est conservée. Un nom affiché (« Linge & Entretien »,
-- « Lucas Ménage ») est remplacé par l'identifiant, car il n'ouvre plus le fil.
--
-- Idempotente et sans suppression : une seconde exécution ne change plus aucune
-- ligne. Le script `npm run db:migrate` l'enregistre dans public.schema_migrations
-- et ne la rejoue pas. Vercel ne l'applique pas au déploiement.

update public.conversations
   set assigne = 'lucas.menage@hublify.app'
 where type_interlocuteur = 'prestataire'
   and nom = 'Linge & Entretien'
   and btrim(coalesce(assigne, '')) in (
     '',
     'Linge & Entretien',
     'linge & entretien',
     'Lucas Ménage',
     'lucas ménage',
     'Lucas Menage',
     'lucas menage'
   );
