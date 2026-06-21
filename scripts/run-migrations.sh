#!/usr/bin/env bash
# Aplica migraciones SQL versionadas en backend/migrations/ (orden numérico).
# Idempotentes: seguro re-ejecutar en cada deploy.
#
# Uso (desde la raíz del repo):
#   ./scripts/run-migrations.sh
#
# Variables opcionales:
#   POSTGRES_CONTAINER  (default: restogestion-db)
#   POSTGRES_USER       (default: postgres)
#   POSTGRES_DB         (default: restogestion)
#
# Desarrollo local (contenedor pizzeria_db):
#   POSTGRES_CONTAINER=pizzeria_db POSTGRES_DB=pizzeria_db ./scripts/run-migrations.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MIGRATIONS_DIR="${REPO_ROOT}/backend/migrations"

CONTAINER="${POSTGRES_CONTAINER:-restogestion-db}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-restogestion}"

if [[ -f "${REPO_ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${REPO_ROOT}/.env"
  set +a
  CONTAINER="${POSTGRES_CONTAINER:-${CONTAINER}}"
  POSTGRES_USER="${POSTGRES_USER:-postgres}"
  POSTGRES_DB="${POSTGRES_DB:-restogestion}"
fi

docker_cmd=(docker)
if ! docker info >/dev/null 2>&1; then
  if sudo -n docker info >/dev/null 2>&1; then
    docker_cmd=(sudo docker)
  else
    echo "ERROR: sin acceso a Docker"
    exit 1
  fi
fi

if ! "${docker_cmd[@]}" inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null | grep -q true; then
  echo "ERROR: el contenedor ${CONTAINER} no está en ejecución."
  echo "Levanta la base de datos primero, p. ej.: docker compose up -d db"
  exit 1
fi

shopt -s nullglob
files=("${MIGRATIONS_DIR}"/[0-9][0-9][0-9]_*.sql)
shopt -u nullglob

if [[ ${#files[@]} -eq 0 ]]; then
  echo "No hay migraciones en ${MIGRATIONS_DIR}"
  exit 0
fi

mapfile -t sorted < <(printf '%s\n' "${files[@]}" | sort)

echo "Aplicando migraciones en ${POSTGRES_DB}@${CONTAINER} ..."
for f in "${sorted[@]}"; do
  echo ">> $(basename "$f")"
  "${docker_cmd[@]}" exec -i "$CONTAINER" \
    psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$f"
done

echo "Migraciones completadas."
