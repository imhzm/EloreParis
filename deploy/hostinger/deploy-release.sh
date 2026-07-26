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
NGINX_CONFIG_TARGET="${NGINX_CONFIG_TARGET:-/etc/nginx/sites-available/elore-paris.com}"
NGINX_ENABLED_LINK="${NGINX_ENABLED_LINK:-/etc/nginx/sites-enabled/elore-paris.com}"
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

for command_name in awk bash cp curl date df flock git install ln mv nginx node npm readlink runuser sed sleep stat systemctl tail tar unlink; do
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
OUTBOX_WORKER_SECRET="$(require_environment_value OUTBOX_WORKER_SECRET)"
RELEASE_EVIDENCE_PATH="$(require_environment_value RELEASE_EVIDENCE_PATH)"
AUTHORITY_DB_PATH="$(require_environment_value AUTHORITY_DB_PATH)"

if [[ "${APP_ENV}" != "production" || "${HOSTING_PROVIDER}" != "hostinger_vps" ]]; then
  echo "Hostinger releases require APP_ENV=production and HOSTING_PROVIDER=hostinger_vps." >&2
  exit 78
fi

if [[ "${NEXT_PUBLIC_SITE_URL}" != "https://elore-paris.com" ]]; then
  echo "NEXT_PUBLIC_SITE_URL must be the canonical hosted URL https://elore-paris.com." >&2
  exit 78
fi

if (( ${#OUTBOX_WORKER_SECRET} < 32 )) || [[ "${OUTBOX_WORKER_SECRET}" =~ [Rr][Ee][Pp][Ll][Aa][Cc][Ee] ]]; then
  echo "OUTBOX_WORKER_SECRET must be a non-placeholder secret of at least 32 characters." >&2
  exit 78
fi

if [[ "${AUTHORITY_DB_PATH}" != "/var/lib/elore-paris/authority.sqlite" ]]; then
  echo "AUTHORITY_DB_PATH must use /var/lib/elore-paris/authority.sqlite for persistent releases." >&2
  exit 78
fi

if [[ "${RELEASE_EVIDENCE_PATH}" != "/var/lib/elore-paris/release-evidence.json" ]]; then
  echo "RELEASE_EVIDENCE_PATH must use /var/lib/elore-paris/release-evidence.json for rollback-safe releases." >&2
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
NGINX_CONFIG_CHANGED=false
NGINX_CONFIG_HAD_PREVIOUS=false
NGINX_ENABLED_LINK_CREATED=false
NGINX_CONFIG_BACKUP="/run/elore-paris-nginx.$$.backup"
OUTBOX_UNITS_CHANGED=false
OUTBOX_RUNTIME_PAUSED=false
OUTBOX_SERVICE_HAD_PREVIOUS=false
OUTBOX_TIMER_HAD_PREVIOUS=false
OUTBOX_TIMER_ENABLE_STATE=""
OUTBOX_TIMER_WAS_ACTIVE=false
OUTBOX_SERVICE_TARGET="/etc/systemd/system/elore-paris-outbox.service"
OUTBOX_TIMER_TARGET="/etc/systemd/system/elore-paris-outbox.timer"
OUTBOX_SERVICE_BACKUP="/run/elore-paris-outbox-service.$$.backup"
OUTBOX_TIMER_BACKUP="/run/elore-paris-outbox-timer.$$.backup"
RELEASE_EVIDENCE_CHANGED=false
RELEASE_EVIDENCE_HAD_PREVIOUS=false
RELEASE_EVIDENCE_BACKUP="${APP_STATE_DIR}/.release-evidence.$$.backup"
ROLLBACK_FAILED=false

rollback_step() {
  local description="$1"
  shift
  if ! "$@"; then
    echo "CRITICAL: rollback step failed: ${description}." >&2
    ROLLBACK_FAILED=true
    return 1
  fi
}

rollback_on_exit() {
  local exit_code="$?"
  trap - EXIT

  if [[ "${exit_code}" -eq 0 || "${DEPLOYMENT_SUCCEEDED}" == "true" ]]; then
    exit "${exit_code}"
  fi
  if [[ "${SWITCH_STARTED}" != "true" && "${OUTBOX_RUNTIME_PAUSED}" != "true" ]]; then
    exit "${exit_code}"
  fi

  set +e
  echo "Deployment failed after release switch; starting rollback." >&2

  if [[ "${OUTBOX_UNITS_CHANGED}" == "true" ]]; then
    if [[ -e "${OUTBOX_TIMER_TARGET}" ]]; then
      rollback_step "stop the candidate outbox timer" \
        systemctl disable --now elore-paris-outbox.timer || true
    fi
    if [[ "${OUTBOX_SERVICE_HAD_PREVIOUS}" == "true" && -f "${OUTBOX_SERVICE_BACKUP}" ]]; then
      rollback_step "restore the previous outbox service unit" \
        cp -p "${OUTBOX_SERVICE_BACKUP}" "${OUTBOX_SERVICE_TARGET}" || true
    else
      if [[ -e "${OUTBOX_SERVICE_TARGET}" ]]; then
        rollback_step "remove the candidate outbox service unit" \
          unlink "${OUTBOX_SERVICE_TARGET}" || true
      fi
    fi
    if [[ "${OUTBOX_TIMER_HAD_PREVIOUS}" == "true" && -f "${OUTBOX_TIMER_BACKUP}" ]]; then
      rollback_step "restore the previous outbox timer unit" \
        cp -p "${OUTBOX_TIMER_BACKUP}" "${OUTBOX_TIMER_TARGET}" || true
    else
      if [[ -e "${OUTBOX_TIMER_TARGET}" ]]; then
        rollback_step "remove the candidate outbox timer unit" \
          unlink "${OUTBOX_TIMER_TARGET}" || true
      fi
    fi
    rollback_step "reload restored systemd units" systemctl daemon-reload || true
  fi

  case "${OUTBOX_TIMER_ENABLE_STATE}" in
    enabled)
      rollback_step "restore the enabled outbox timer state" \
        systemctl enable elore-paris-outbox.timer || true
      ;;
    disabled)
      rollback_step "restore the disabled outbox timer state" \
        systemctl disable elore-paris-outbox.timer || true
      ;;
  esac
  if [[ "${RELEASE_EVIDENCE_CHANGED}" == "true" ]]; then
    if [[ "${RELEASE_EVIDENCE_HAD_PREVIOUS}" == "true" && -f "${RELEASE_EVIDENCE_BACKUP}" ]]; then
      rollback_step "restore the previous release evidence" \
        mv -f "${RELEASE_EVIDENCE_BACKUP}" "${RELEASE_EVIDENCE_PATH}" || true
    else
      if [[ -e "${RELEASE_EVIDENCE_PATH}" ]]; then
        rollback_step "remove candidate release evidence" \
          unlink "${RELEASE_EVIDENCE_PATH}" || true
      fi
    fi
  fi

  if [[ "${NGINX_CONFIG_CHANGED}" == "true" ]]; then
    if [[ "${NGINX_CONFIG_HAD_PREVIOUS}" == "true" && -f "${NGINX_CONFIG_BACKUP}" ]]; then
      rollback_step "restore the previous Nginx configuration" \
        install -o root -g root -m 0644 "${NGINX_CONFIG_BACKUP}" "${NGINX_CONFIG_TARGET}" || true
    else
      if [[ -e "${NGINX_CONFIG_TARGET}" ]]; then
        rollback_step "remove the candidate Nginx configuration" \
          unlink "${NGINX_CONFIG_TARGET}" || true
      fi
    fi
    if [[ "${NGINX_ENABLED_LINK_CREATED}" == "true" && -L "${NGINX_ENABLED_LINK}" ]]; then
      rollback_step "remove the candidate Nginx enabled-site link" \
        unlink "${NGINX_ENABLED_LINK}" || true
    fi
    if ! nginx -t || ! systemctl reload nginx; then
      echo "CRITICAL: restored Nginx configuration could not be validated or reloaded." >&2
      ROLLBACK_FAILED=true
    fi
  fi

  if [[ -n "${PREVIOUS_TARGET}" && -d "${PREVIOUS_TARGET}" ]]; then
    if ln -s "${PREVIOUS_TARGET}" "${CURRENT_LINK}.rollback" && \
      mv -Tf "${CURRENT_LINK}.rollback" "${CURRENT_LINK}" && \
      systemctl restart "${SERVICE_NAME}" && \
      wait_for_health "${PREVIOUS_COMMIT}"
    then
      echo "Rollback verified at ${PREVIOUS_TARGET}." >&2
      if [[ "${OUTBOX_TIMER_WAS_ACTIVE}" == "true" ]]; then
        rollback_step "restore the active outbox timer state after runtime recovery" \
          systemctl start elore-paris-outbox.timer || true
      fi
    else
      echo "CRITICAL: rollback health verification failed; operator intervention is required." >&2
      ROLLBACK_FAILED=true
    fi
  else
    if [[ -L "${CURRENT_LINK}" && "$(readlink -f "${CURRENT_LINK}" || true)" == "${RELEASE_DIR}" ]]; then
      rollback_step "remove the failed first-release link" \
        unlink "${CURRENT_LINK}" || true
    fi
    if ! systemctl stop "${SERVICE_NAME}" >/dev/null 2>&1; then
      echo "CRITICAL: failed to stop the first-deployment service during rollback." >&2
      ROLLBACK_FAILED=true
    fi
    echo "First deployment failed; service stopped because no known-good release exists." >&2
  fi

  if [[ "${ROLLBACK_FAILED}" == "true" ]]; then
    echo "CRITICAL: rollback completed with errors; operator intervention is required." >&2
  fi

  exit "${exit_code}"
}

trap rollback_on_exit EXIT

for unit_path in "${OUTBOX_SERVICE_TARGET}" "${OUTBOX_TIMER_TARGET}"; do
  if [[ -L "${unit_path}" || ( -e "${unit_path}" && ! -f "${unit_path}" ) ]]; then
    echo "Outbox unit paths must be regular files, not masked or linked units: ${unit_path}" >&2
    exit 78
  fi
done
if [[ -f "${OUTBOX_SERVICE_TARGET}" ]]; then
  cp -p "${OUTBOX_SERVICE_TARGET}" "${OUTBOX_SERVICE_BACKUP}"
  OUTBOX_SERVICE_HAD_PREVIOUS=true
fi
if [[ -f "${OUTBOX_TIMER_TARGET}" ]]; then
  cp -p "${OUTBOX_TIMER_TARGET}" "${OUTBOX_TIMER_BACKUP}"
  OUTBOX_TIMER_HAD_PREVIOUS=true
  OUTBOX_TIMER_ENABLE_STATE="$(systemctl is-enabled elore-paris-outbox.timer 2>/dev/null || true)"
  case "${OUTBOX_TIMER_ENABLE_STATE}" in
    enabled|disabled) ;;
    *)
      echo "Unsupported pre-deploy outbox timer enable state: ${OUTBOX_TIMER_ENABLE_STATE:-unknown}." >&2
      exit 78
      ;;
  esac
  outbox_timer_active_state="$(systemctl is-active elore-paris-outbox.timer 2>/dev/null || true)"
  case "${outbox_timer_active_state}" in
    active) OUTBOX_TIMER_WAS_ACTIVE=true ;;
    inactive) ;;
    *)
      echo "Unsupported pre-deploy outbox timer active state: ${outbox_timer_active_state:-unknown}." >&2
      exit 78
      ;;
  esac
fi

OUTBOX_RUNTIME_PAUSED=true
if [[ "${OUTBOX_TIMER_HAD_PREVIOUS}" == "true" ]]; then
  systemctl stop elore-paris-outbox.timer
  if systemctl is-active --quiet elore-paris-outbox.timer; then
    echo "Unable to pause the outbox timer before the release switch." >&2
    exit 1
  fi
fi
if [[ "${OUTBOX_SERVICE_HAD_PREVIOUS}" == "true" ]]; then
  for _ in {1..70}; do
    outbox_service_state="$(systemctl is-active elore-paris-outbox.service 2>/dev/null || true)"
    if [[ "${outbox_service_state}" != "active" && "${outbox_service_state}" != "activating" ]]; then
      break
    fi
    sleep 1
  done
  outbox_service_state="$(systemctl is-active elore-paris-outbox.service 2>/dev/null || true)"
  if [[ "${outbox_service_state}" != "inactive" ]]; then
    echo "Outbox worker did not settle safely before the release switch: ${outbox_service_state:-unknown}." >&2
    exit 1
  fi
fi

SWITCH_STARTED=true
ln -s "${RELEASE_DIR}" "${CURRENT_LINK}.next-${RELEASE_ID}"
mv -Tf "${CURRENT_LINK}.next-${RELEASE_ID}" "${CURRENT_LINK}"
systemctl restart "${SERVICE_NAME}"

if ! wait_for_health "${DEPLOY_COMMIT}"; then
  echo "New release failed commit-aware health verification." >&2
  exit 1
fi

if [[ -e "${NGINX_ENABLED_LINK}" && ! -L "${NGINX_ENABLED_LINK}" ]]; then
  echo "Nginx enabled-site target exists but is not a symlink: ${NGINX_ENABLED_LINK}" >&2
  exit 1
fi
if [[ -L "${NGINX_ENABLED_LINK}" && "$(readlink -f "${NGINX_ENABLED_LINK}" || true)" != "$(readlink -f "${NGINX_CONFIG_TARGET}" 2>/dev/null || true)" ]]; then
  echo "Nginx enabled-site symlink points to an unexpected target: ${NGINX_ENABLED_LINK}" >&2
  exit 1
fi
if [[ -f "${NGINX_CONFIG_TARGET}" ]]; then
  install -o root -g root -m 0600 "${NGINX_CONFIG_TARGET}" "${NGINX_CONFIG_BACKUP}"
  NGINX_CONFIG_HAD_PREVIOUS=true
fi
NGINX_CONFIG_CHANGED=true
install -o root -g root -m 0644 \
  "${RELEASE_DIR}/deploy/hostinger/elore-paris.nginx.conf" \
  "${NGINX_CONFIG_TARGET}"
if [[ ! -L "${NGINX_ENABLED_LINK}" ]]; then
  NGINX_ENABLED_LINK_CREATED=true
  ln -s "${NGINX_CONFIG_TARGET}" "${NGINX_ENABLED_LINK}"
fi
if ! nginx -t || ! systemctl reload nginx; then
  echo "Nginx configuration validation or reload failed." >&2
  exit 1
fi

if [[ -f "${RELEASE_EVIDENCE_PATH}" ]]; then
  cp -p "${RELEASE_EVIDENCE_PATH}" "${RELEASE_EVIDENCE_BACKUP}"
  RELEASE_EVIDENCE_HAD_PREVIOUS=true
fi
RELEASE_EVIDENCE_CHANGED=true
if ! run_as_app env \
  AUTHORITY_DB_PATH="${AUTHORITY_DB_PATH}" \
  RELEASE_EVIDENCE_PATH="${RELEASE_EVIDENCE_PATH}" \
  node "${RELEASE_DIR}/scripts/live-release-verifier.mjs" \
  "${NEXT_PUBLIC_SITE_URL}" "${DEPLOY_COMMIT}"
then
  echo "Canonical domain post-deployment verification failed." >&2
  exit 1
fi

OUTBOX_UNITS_CHANGED=true
install -o root -g root -m 0644 \
  "${RELEASE_DIR}/deploy/hostinger/elore-paris-outbox.service" \
  "${OUTBOX_SERVICE_TARGET}"
install -o root -g root -m 0644 \
  "${RELEASE_DIR}/deploy/hostinger/elore-paris-outbox.timer" \
  "${OUTBOX_TIMER_TARGET}"
systemctl daemon-reload

if ! run_as_app env \
  OUTBOX_WORKER_SECRET="${OUTBOX_WORKER_SECRET}" \
  OUTBOX_WORKER_URL="${HEALTH_URL%/api/health}/api/internal/outbox-drain" \
  node "${RELEASE_DIR}/scripts/run-outbox-worker.mjs" --probe
then
  echo "Side-effect-free unattended outbox worker probe failed." >&2
  exit 1
fi
if ! systemctl enable --now elore-paris-outbox.timer; then
  echo "Unable to enable the unattended outbox retry timer." >&2
  exit 1
fi

DEPLOYMENT_SUCCEEDED=true
cleanup_backup() {
  local backup_path="$1"
  if [[ -f "${backup_path}" ]] && ! unlink "${backup_path}"; then
    echo "WARNING: deployed successfully but could not remove backup artifact: ${backup_path}." >&2
  fi
}
cleanup_backup "${NGINX_CONFIG_BACKUP}"
cleanup_backup "${OUTBOX_SERVICE_BACKUP}"
cleanup_backup "${OUTBOX_TIMER_BACKUP}"
cleanup_backup "${RELEASE_EVIDENCE_BACKUP}"
echo "Release ${RELEASE_ID} is healthy at ${HEALTH_URL}."
echo "Previous releases remain available for audited manual rollback and retention."
