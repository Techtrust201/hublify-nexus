-- Le pooler de Neon ouvre ses connexions avec un search_path vide, là où une
-- connexion directe hérite de « "$user", public ». Nos requêtes nomment leur
-- schéma, mais pas celles de Better Auth : sans ce réglage, l'authentification
-- échoue sur « relation "user" does not exist » et l'application entière devient
-- inaccessible, sans qu'aucun changement de code n'en soit la cause.
--
-- Le search_path est refusé comme paramètre de démarrage par le pooler. On
-- l'attache donc au rôle : les connexions qu'il ouvre en héritent.
--
-- Le rôle et la base ne sont pas les mêmes d'un environnement à l'autre, d'où
-- l'exécution dynamique.

do $migration$
begin
  execute format(
    'alter role %I in database %I set search_path to "$user", public',
    current_user,
    current_database()
  );
end
$migration$;
