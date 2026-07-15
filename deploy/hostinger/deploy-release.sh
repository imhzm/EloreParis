#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT="${APP_ROOT:-/srv/elore-paris}"
REPOSITORY_DIR="${REPOSITORY_DIR:-${APP_ROOT}/repository}"
RELEASES_DIR="${RELEASES_DIR:-${APP_ROOT}/releases}"
CURRENT_LINK="${CURRENT_LINK:-${APP_ROOT}/current}"
ENV_FILE="${ENV_FILE:-/etc/elore-paris/elore-paris.env}"
SERVICE_NAME="${SERVICE_NAME:-elore-paris.service}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3056/api/health}"
DEPLOY_REF="${1:-}"

if [[ -z "${DEPLOY_REF}" ]]; then
  echo "Usage: $0 <immutable-git-commit>" >&2
  exit 64
fi

for command_name in git node npm systemctl curl tar sed tail; do
  command -v "${command_name}" >/dev/null 2>&1 || {
    echo "Missing required command: ${command_name}" >&2
    exit 69
  }
done

[[ -d "${REPOSITORY_DIR}/.git" ]] || {
  echo "Repository is missing at ${REPOSITORY_DIR}" >&2
  exit 66
}

[[ -f "${ENV_FILE}" ]] || {
  echo "Environment file is missing at ${ENV_FILE}" >&2
  exit 66
}

git -C "${REPOSITORY_DIR}" fetch origin --prune
DEPLOY_COMMIT="$(git -C "${REPOSITORY_DIR}" rev-parse --verify "${DEPLOY_REF}^{commit}")"
SHORT_COMMIT="$(git -C "${REPOSITORY_DIR}" rev-parse --short=12 "${DEPLOY_COMMIT}")"
RELEASE_ID="$(date -u +%Y%m%dT%H%M%SZ)-${SHORT_COMMIT}"
RELEASE_DIR="${RELEASES_DIR}/${RELEASE_ID}"
PREVIOUS_TARGET=""

mkdir -p "${RELEASES_DIR}"
if [[ -L "${CURRENT_LINK}" ]]; then
  PREVIOUS_TARGET="$(readlink -f "${CURRENT_LINK}")"
fi

mkdir "${RELEASE_DIR}"
git -C "${REPOSITORY_DIR}" archive "${DEPLOY_COMMIT}" | tar -x -C "${RELEASE_DIR}"
printf '%s\n' "${DEPLOY_COMMIT}" > "${RELEASE_DIR}/.deployment-commit"

read_environment_value() {
  local key="$1"
  sed -n "s/^${key}=//p" "${ENV_FILE}" | tail -n 1
}

export APP_ENV="$(read_environment_value APP_ENV)"
export HOSTING_PROVIDER="$(read_environment_value HOSTING_PROVIDER)"
export NEXT_PUBLIC_SITE_URL="$(read_environment_value NEXT_PUBLIC_SITE_URL)"
export PUBLIC_RELEASE_APPROVED="$(read_environment_value PUBLIC_RELEASE_APPROVED)"
export PUBLIC_COMMERCE_ENABLED="$(read_environment_value PUBLIC_COMMERCE_ENABLED)"
export DEPLOYMENT_COMMIT_SHA="${DEPLOY_COMMIT}"

(
  cd "${RELEASE_DIR}"
  npm ci
  npm run lint
  npx tsc --noEmit
  npm run build
  npm audit --omit=dev --audit-level=high
)

chown -R elore:elore "${RELEASE_DIR}"
ln -s "${RELEASE_DIR}" "${CURRENT_LINK}.next"
mv -Tf "${CURRENT_LINK}.next" "${CURRENT_LINK}"
systemctl restart "${SERVICE_NAME}"

healthy=false
for _ in {1..30}; do
  if curl --fail --silent --show-error --max-time 3 "${HEALTH_URL}" >/dev/null; then
    healthy=true
    break
  fi
  sleep 1
done

if [[ "${healthy}" != "true" ]]; then
  echo "New release failed its health check." >&2
  if [[ -n "${PREVIOUS_TARGET}" && -d "${PREVIOUS_TARGET}" ]]; then
    ln -s "${PREVIOUS_TARGET}" "${CURRENT_LINK}.rollback"
    mv -Tf "${CURRENT_LINK}.rollback" "${CURRENT_LINK}"
    systemctl restart "${SERVICE_NAME}"
    echo "Rolled back to ${PREVIOUS_TARGET}." >&2
  fi
  exit 1
fi

echo "Release ${RELEASE_ID} is healthy at ${HEALTH_URL}."
echo "Old releases are retained intentionally for manual rollback and pruning."
