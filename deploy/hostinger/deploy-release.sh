#!/usr/bin/env bash
set -Eeuo pipefail

APP_USER="${APP_USER:-elore}"
APP_GROUP="${APP_GROUP:-elore}"
APP_ROOT="${APP_ROOT:-/srv/elore-paris}"
APP_STATE_DIR="${APP_STATE_DIR:-/var/lib/elore-paris}"
IMAGE_CACHE_DIR="${IMAGE_CACHE_DIR:-/var/cache/elore-paris/next-images}"
BUILD_HOME="${BUILD_HOME:-/var/cache/elore-paris/build-home}"
REPOSITORY_DIR="${REPOSITORY_DIR:-${APP_ROOT}/repository}"
REPOSITORY_URL="${REPOSITORY_URL:-https://github.com/imhzm/EloreParis.git}"
RELEASES_DIR="${RELEASES_DIR:-${APP_ROOT}/releases}"
CURRENT_LINK="${CURRENT_LINK:-${APP_ROOT}/current}"
ENV_FILE="${ENV_FILE:-/etc/elore-paris/elore-paris.env}"
SERVICE_NAME="${SERVICE_NAME:-elore-paris.service}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3056/api/health}"
LOCK_FILE="${LOCK_FILE:-/run/lock/elore-paris-deploy.lock}"
MIN_FREE_KB="${MIN_FREE_KB:-2097152}"
DEPLOY_REF="${1:-}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "This deploy wrapper must run as root; application build commands run as ${APP_USER}." >&2
  exit 77
fi

if [[ ! "${DEPLOY_REF}" =~ ^[0-9a-fA-F]{40}$ ]]; then
  echo "Usage: $0 <40-character-immutable-git-commit>" >&2
  exit 64
fi

for command_name in awk bash curl date df flock git install ln mv node npm readlink runuser sed sleep stat systemctl tail tar unlink; do
  command -v "${command_name}" >/dev/null 2>&1 || {
    echo "Missing required command: ${command_name}" >&2
    exit 69
  }
done

exec 9>"${LOCK_FILE}"
if ! flock -n 9; then
  echo "Another Elore Paris deployment is already running." >&2
  exit 75
fi

[[ -f "${ENV_FILE}" ]] || {
  echo "Environment file is missing at ${ENV_FILE}" >&2
  exit 66
}

if [[ -e "${CURRENT_LINK}" && ! -L "${CURRENT_LINK}" ]]; then
  echo "Current release path exists but is not a symlink: ${CURRENT_LINK}" >&2
  exit 73
fi

install -d -o root -g root -m 0755 "${APP_ROOT}" "${RELEASES_DIR}"
install -d -o "${APP_USER}" -g "${APP_GROUP}" -m 0750 \
  "${REPOSITORY_DIR}" "${APP_STATE_DIR}" "${IMAGE_CACHE_DIR}" "${BUILD_HOME}"

available_kb="$(df -Pk "${APP_ROOT}" | awk 'NR == 2 { print $4 }')"
if [[ ! "${available_kb}" =~ ^[0-9]+$ ]] || (( available_kb < MIN_FREE_KB )); then
  echo "Insufficient free disk space: ${available_kb:-unknown} KB available; ${MIN_FREE_KB} KB required." >&2
  exit 70
fi

run_as_app() {
  runuser -u "${APP_USER}" -- "$@"
}

if [[ ! -d "${REPOSITORY_DIR}/.git" ]]; then
  run_as_app git clone "${REPOSITORY_URL}" "${REPOSITORY_DIR}"
else
  if [[ "$(stat -c '%U' "${REPOSITORY_DIR}")" != "${APP_USER}" ]]; then
    echo "Repository must be owned by ${APP_USER}: ${REPOSITORY_DIR}" >&2
    exit 77
  fi

  current_remote="$(run_as_app git -C "${REPOSITORY_DIR}" remote get-url origin 2>/dev/null || true)"
  if [[ "${current_remote}" != "${REPOSITORY_URL}" ]]; then
    run_as_app git -C "${REPOSITORY_DIR}" remote set-url origin "${REPOSITORY_URL}"
  fi
fi

run_as_app git -C "${REPOSITORY_DIR}" fetch origin --prune
DEPLOY_COMMIT="$(run_as_app git -C "${REPOSITORY_DIR}" rev-parse --verify "${DEPLOY_REF}^{commit}")"
if [[ "${DEPLOY_COMMIT,,}" != "${DEPLOY_REF,,}" ]]; then
  echo "Deploy reference did not resolve to the exact requested commit." >&2
  exit 65
fi

if ! run_as_app git -C "${REPOSITORY_DIR}" merge-base --is-ancestor "${DEPLOY_COMMIT}" origin/main; then
  echo "Deploy commit must be reachable from origin/main." >&2
  exit 65
fi

SHORT_COMMIT="$(run_as_app git -C "${REPOSITORY_DIR}" rev-parse --short=12 "${DEPLOY_COMMIT}")"
RELEASE_ID="$(date -u +%Y%m%dT%H%M%SZ)-${SHORT_COMMIT}"
RELEASE_DIR="${RELEASES_DIR}/${RELEASE_ID}"
PREVIOUS_TARGET=""
PREVIOUS_COMMIT=""

if [[ -L "${CURRENT_LINK}" ]]; then
  PREVIOUS_TARGET="$(readlink -f "${CURRENT_LINK}" || true)"
  if [[ -n "${PREVIOUS_TARGET}" && -f "${PREVIOUS_TARGET}/.deployment-commit" ]]; then
    PREVIOUS_COMMIT="$(<"${PREVIOUS_TARGET}/.deployment-commit")"
  fi
fi

install -d -o "${APP_USER}" -g "${APP_GROUP}" -m 0750 "${RELEASE_DIR}"
run_as_app git -C "${REPOSITORY_DIR}" archive "${DEPLOY_COMMIT}" | \
  run_as_app tar -x -C "${RELEASE_DIR}"
printf '%s\n' "${DEPLOY_COMMIT}" > "${RELEASE_DIR}/.deployment-commit"
chown "${APP_USER}:${APP_GROUP}" "${RELEASE_DIR}/.deployment-commit"

read_environment_value() {
  local key="$1"
  sed -n "s/^${key}=//p" "${ENV_FILE}" | tail -n 1
}

require_environment_value() {
  local key="$1"
  local value
  value="$(read_environment_value "${key}")"
  if [[ -z "${value}" ]]; then
    echo "Required environment value is missing: ${key}" >&2
    exit 78
  fi
  printf '%s' "${value}"
}

# These values affect statically generated metadata and release fences. A gate
# change therefore requires a fresh immutable build, not only a service restart.
APP_ENV="$(require_environment_value APP_ENV)"
HOSTING_PROVIDER="$(require_environment_value HOSTING_PROVIDER)"
NEXT_PUBLIC_SITE_URL="$(require_environment_value NEXT_PUBLIC_SITE_URL)"
PUBLIC_RELEASE_APPROVED="$(require_environment_value PUBLIC_RELEASE_APPROVED)"
PUBLIC_CATALOG_APPROVED="$(require_environment_value PUBLIC_CATALOG_APPROVED)"
PUBLIC_DISCOVERY_CONTENT_APPROVED="$(require_environment_value PUBLIC_DISCOVERY_CONTENT_APPROVED)"
PUBLIC_EDITORIAL_CONTENT_APPROVED="$(require_environment_value PUBLIC_EDITORIAL_CONTENT_APPROVED)"
PUBLIC_LEGAL_CONTENT_APPROVED="$(require_environment_value PUBLIC_LEGAL_CONTENT_APPROVED)"
PUBLIC_COMMERCE_ENABLED="$(require_environment_value PUBLIC_COMMERCE_ENABLED)"

if [[ "${APP_ENV}" != "production" || "${HOSTING_PROVIDER}" != "hostinger_vps" ]]; then
  echo "Hostinger releases require APP_ENV=production and HOSTING_PROVIDER=hostinger_vps." >&2
  exit 78
fi

if [[ "${NEXT_PUBLIC_SITE_URL}" != "https://elore-paris.com" ]]; then
  echo "NEXT_PUBLIC_SITE_URL must be the canonical hosted URL https://elore-paris.com." >&2
  exit 78
fi

for gate_value in \
  "${PUBLIC_RELEASE_APPROVED}" \
  "${PUBLIC_CATALOG_APPROVED}" \
  "${PUBLIC_DISCOVERY_CONTENT_APPROVED}" \
  "${PUBLIC_EDITORIAL_CONTENT_APPROVED}" \
  "${PUBLIC_LEGAL_CONTENT_APPROVED}" \
  "${PUBLIC_COMMERCE_ENABLED}"
do
  if [[ "${gate_value}" != "true" && "${gate_value}" != "false" ]]; then
    echo "Public release gates must use the literal values true or false." >&2
    exit 78
  fi
done

runuser -u "${APP_USER}" -- env \
  HOME="${BUILD_HOME}" \
  APP_ENV="${APP_ENV}" \
  HOSTING_PROVIDER="${HOSTING_PROVIDER}" \
  NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL}" \
  PUBLIC_RELEASE_APPROVED="${PUBLIC_RELEASE_APPROVED}" \
  PUBLIC_CATALOG_APPROVED="${PUBLIC_CATALOG_APPROVED}" \
  PUBLIC_DISCOVERY_CONTENT_APPROVED="${PUBLIC_DISCOVERY_CONTENT_APPROVED}" \
  PUBLIC_EDITORIAL_CONTENT_APPROVED="${PUBLIC_EDITORIAL_CONTENT_APPROVED}" \
  PUBLIC_LEGAL_CONTENT_APPROVED="${PUBLIC_LEGAL_CONTENT_APPROVED}" \
  PUBLIC_COMMERCE_ENABLED="${PUBLIC_COMMERCE_ENABLED}" \
  DEPLOYMENT_COMMIT_SHA="${DEPLOY_COMMIT}" \
  bash -c 'cd "$1" && npm ci && npm run lint && npx tsc --noEmit && npm run build && npm audit --omit=dev --audit-level=high' \
  _ "${RELEASE_DIR}"

runtime_image_cache="${RELEASE_DIR}/.next/cache/images"
if [[ -e "${runtime_image_cache}" || -L "${runtime_image_cache}" ]]; then
  mv "${runtime_image_cache}" "${runtime_image_cache}.build-cache"
fi
ln -s "${IMAGE_CACHE_DIR}" "${runtime_image_cache}"
chown -R root:"${APP_GROUP}" "${RELEASE_DIR}"
chown -h root:"${APP_GROUP}" "${runtime_image_cache}"

wait_for_health() {
  local expected_commit="$1"
  local health_payload

  for _ in {1..30}; do
    if health_payload="$(curl --fail --silent --show-error --max-time 3 "${HEALTH_URL}" 2>/dev/null)"; then
      if HEALTH_PAYLOAD="${health_payload}" \
        EXPECTED_COMMIT="${expected_commit}" \
        EXPECTED_PROVIDER="${HOSTING_PROVIDER}" \
        node -e '
          const payload = JSON.parse(process.env.HEALTH_PAYLOAD);
          const expectedCommit = process.env.EXPECTED_COMMIT;
          const expectedProvider = process.env.EXPECTED_PROVIDER;
          if (payload.status !== "ok" || payload.service !== "elore-paris-storefront") process.exit(1);
          if (payload.hostingProvider !== expectedProvider) process.exit(1);
          if (expectedCommit && payload.commitReference !== expectedCommit) process.exit(1);
        '
      then
        return 0
      fi
    fi
    sleep 1
  done

  return 1
}

SWITCH_STARTED=false
DEPLOYMENT_SUCCEEDED=false

rollback_on_exit() {
  local exit_code="$?"
  trap - EXIT

  if [[ "${exit_code}" -eq 0 || "${DEPLOYMENT_SUCCEEDED}" == "true" || "${SWITCH_STARTED}" != "true" ]]; then
    exit "${exit_code}"
  fi

  set +e
  echo "Deployment failed after release switch; starting rollback." >&2

  if [[ -n "${PREVIOUS_TARGET}" && -d "${PREVIOUS_TARGET}" ]]; then
    ln -s "${PREVIOUS_TARGET}" "${CURRENT_LINK}.rollback"
    mv -Tf "${CURRENT_LINK}.rollback" "${CURRENT_LINK}"
    if systemctl restart "${SERVICE_NAME}" && wait_for_health "${PREVIOUS_COMMIT}"; then
      echo "Rollback verified at ${PREVIOUS_TARGET}." >&2
    else
      echo "CRITICAL: rollback health verification failed; operator intervention is required." >&2
    fi
  else
    if [[ -L "${CURRENT_LINK}" && "$(readlink -f "${CURRENT_LINK}" || true)" == "${RELEASE_DIR}" ]]; then
      unlink "${CURRENT_LINK}"
    fi
    systemctl stop "${SERVICE_NAME}" >/dev/null 2>&1 || true
    echo "First deployment failed; service stopped because no known-good release exists." >&2
  fi

  exit "${exit_code}"
}

trap rollback_on_exit EXIT

SWITCH_STARTED=true
ln -s "${RELEASE_DIR}" "${CURRENT_LINK}.next-${RELEASE_ID}"
mv -Tf "${CURRENT_LINK}.next-${RELEASE_ID}" "${CURRENT_LINK}"
systemctl restart "${SERVICE_NAME}"

if ! wait_for_health "${DEPLOY_COMMIT}"; then
  echo "New release failed commit-aware health verification." >&2
  exit 1
fi

DEPLOYMENT_SUCCEEDED=true
echo "Release ${RELEASE_ID} is healthy at ${HEALTH_URL}."
echo "Previous releases remain available for audited manual rollback and retention."
