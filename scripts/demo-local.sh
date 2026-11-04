#!/usr/bin/env bash
# Postgres local + schéma + comptes de démo, sans toucher à la production.
# Réutilisable par les autres agents : rien n'est commité (.env.local est ignoré).
set -euo pipefail

racine="$(cd "$(dirname "$0")/.." && pwd)"
cd "$racine"

port="${POSTGRES_PUBLISH:-5432}"
url="postgresql://hublify:hublify@127.0.0.1:${port}/hublify"

demarrer_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    return 1
  fi
  if ! docker info >/dev/null 2>&1; then
    return 1
  fi
  echo "Postgres via docker compose (port ${port})."
  POSTGRES_PUBLISH="$port" docker compose up -d
  local i
  for i in $(seq 1 30); do
    if PGPASSWORD=hublify psql "$url" -c "select 1" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "Postgres docker ne répond pas sur ${url}." >&2
  return 1
}

demarrer_apt() {
  if ! command -v pg_ctlcluster >/dev/null 2>&1; then
    echo "Ni Docker ni PostgreSQL (pg_ctlcluster) ne sont disponibles." >&2
    echo "Installer : sudo apt-get install -y postgresql" >&2
    return 1
  fi
  echo "Postgres du système (cluster 16/main)."
  sudo pg_ctlcluster 16 main start >/dev/null 2>&1 || true
  sudo -u postgres psql -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hublify') THEN
    CREATE ROLE hublify LOGIN PASSWORD 'hublify' SUPERUSER;
  END IF;
END
$$;
SQL
  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = 'hublify'" | grep -q 1; then
    sudo -u postgres createdb -O hublify hublify
  fi
  PGPASSWORD=hublify psql "$url" -c "select current_database()" >/dev/null
}

if ! demarrer_docker; then
  demarrer_apt
fi

if [[ ! -f .env.local ]]; then
  secret="$(openssl rand -base64 36 | tr -d '\n')"
  mdp="$(openssl rand -base64 18 | tr -d '\n/+=' | head -c 24)"
  crypto="$(openssl rand -base64 32 | tr -d '\n')"
  cat > .env.local <<EOF
DATABASE_URL=${url}
BETTER_AUTH_SECRET=${secret}
BETTER_AUTH_URL=http://127.0.0.1:8080
DEMO_AUTH_PASSWORD=${mdp}
APP_CRYPTO_KEY=${crypto}
VITE_MODE_DEMO=1
VITE_MDP_DEMO=${mdp}
EOF
  echo "Fichier .env.local créé. Mot de passe démo : ${mdp}"
else
  echo ".env.local déjà présent, il n'est pas réécrit."
fi

npm run db:prepare

echo
echo "Comptes (mot de passe = DEMO_AUTH_PASSWORD dans .env.local) :"
echo "  Gestionnaire  amelie.dubois@hublify.app"
echo "  Super-admin   redris.gestion@gmail.com   (Yannick Ratti, voit aussi Team mate)"
echo "  Super-admin   contact@tech-trust.fr"
echo "Démarrage : npm run dev   →  http://127.0.0.1:8080"
