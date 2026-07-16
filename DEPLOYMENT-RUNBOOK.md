# Elore Paris Hostinger Deployment Runbook

## Release position

- Primary host: Hostinger VPS at `147.79.66.116`.
- Public domain: `https://elore-paris.com`.
- Runtime: Next.js standalone on Node.js 24 LTS, supervised by systemd.
- Reverse proxy and TLS: nginx with Let's Encrypt.
- Persistent application state: `/var/lib/elore-paris`.
- Repository target: `imhzm/EloreParis`.
- Public launch: blocked until the release packet, legal/business data, catalog data, payment/shipping integrations, security checks, and user approval are complete.

The existing live site must not be replaced merely because a build succeeds. A release needs the full gate below.

## Repository deployment files

- `deploy/hostinger/elore-paris.service`: hardened systemd service.
- `deploy/hostinger/elore-paris.nginx.conf`: TLS proxy, canonical redirect, body limits, and commerce/tracking throttles.
- `deploy/hostinger/elore-paris.env.example`: secret-free production environment template.
- `deploy/hostinger/deploy-release.sh`: immutable release, health check, and rollback script.
- `scripts/start-standalone.mjs`: local/portable standalone runner.
- `/api/health`: runtime health and release/indexing state.

## SSH identity

A dedicated ED25519 key is kept outside the repository:

- Private key: `C:\Users\h REDA\.ssh\elore_paris_hostinger_ed25519`
- Public key: `C:\Users\h REDA\.ssh\elore_paris_hostinger_ed25519.pub`
- Fingerprint: `SHA256:cpyRenLtRBLrMT7cp47lr1CdGINTaL6TTIKv12YAcg4`

Never commit the private key, server password, environment file, or provider credentials. Install only the public key on the server. After bootstrap, disable password authentication for the deployment identity and prefer a non-root `elore` account with the minimum required sudo rules.

## One-time server bootstrap

Run only after a backup of the current live application and nginx configuration exists.

1. Install Node.js 24 LTS from an official-supported distribution method, plus git, nginx, curl, and certbot.
2. Create the service account and directories:

   ```bash
   useradd --system --create-home --shell /bin/bash elore
   install -d -o elore -g elore -m 0750 /srv/elore-paris/repository
   install -d -o elore -g elore -m 0750 /srv/elore-paris/releases
   install -d -o elore -g elore -m 0750 /var/lib/elore-paris
   install -d -o root -g elore -m 0750 /etc/elore-paris
   ```

3. Install the dedicated public SSH key in the intended account's `authorized_keys`. Keep root password access only until key authentication and recovery access are verified.
4. Clone the target GitHub repository into `/srv/elore-paris/repository`.
5. Copy `deploy/hostinger/elore-paris.env.example` to `/etc/elore-paris/elore-paris.env`, replace every placeholder, set mode `0640`, owner `root:elore`, and keep both public gates false.
6. Install the service:

   ```bash
   cp deploy/hostinger/elore-paris.service /etc/systemd/system/elore-paris.service
   systemctl daemon-reload
   systemctl enable elore-paris.service
   ```

7. Validate and install nginx only after adapting certificate paths to the server's current certificate:

   ```bash
   cp deploy/hostinger/elore-paris.nginx.conf /etc/nginx/sites-available/elore-paris.conf
   ln -s /etc/nginx/sites-available/elore-paris.conf /etc/nginx/sites-enabled/elore-paris.conf
   nginx -t
   systemctl reload nginx
   ```

8. Mark the release script executable:

   ```bash
   chmod 0750 /srv/elore-paris/repository/deploy/hostinger/deploy-release.sh
   ```

## Required production configuration

The live file `/etc/elore-paris/elore-paris.env` must contain independent random secrets and real approved provider values. Required release-critical values include:

- `APP_ENV=production`
- `HOSTING_PROVIDER=hostinger_vps`
- `NEXT_PUBLIC_SITE_URL=https://elore-paris.com`
- `PUBLIC_RELEASE_APPROVED=false` until final approval
- `PUBLIC_COMMERCE_ENABLED=false` until commerce approval
- `AUTHORITY_DB_PATH=/var/lib/elore-paris/authority.sqlite`
- `RELEASE_EVIDENCE_PATH=/var/lib/elore-paris/release-evidence.json`
- `ORDER_AUTHORITY_SECRET`
- `OPS_ACCESS_SIGNING_SECRET`
- `OPS_AUTH_USERS_JSON`
- dedicated auth/payment/shipping/notification provider credentials

Secrets must not reuse the root password, ops password, customer credentials, or one another.

## Release procedure

1. Require a green protected GitHub commit and record its immutable SHA.
2. Confirm the current production backup is restorable.
   Create and verify a consistent SQLite snapshot while the service is running:

   ```bash
   cd /srv/elore-paris/current
   npm run authority:backup -- backup \
     --source /var/lib/elore-paris/authority.sqlite \
     --output /var/lib/elore-paris/backups
   npm run authority:backup -- verify \
     --backup /var/lib/elore-paris/backups/<snapshot>.sqlite
   ```

   The command uses SQLite's online Backup API, performs a passive WAL checkpoint,
   verifies integrity and foreign keys, and writes a SHA-256 manifest. Copy both the
   `.sqlite` and `.manifest.json` files to separate protected storage.
3. Confirm `PUBLIC_RELEASE_APPROVED=false` and `PUBLIC_COMMERCE_ENABLED=false` for rehearsal deployments.
4. Run on the server:

   ```bash
   /srv/elore-paris/repository/deploy/hostinger/deploy-release.sh <full-commit-sha>
   ```

5. The script fetches the commit, creates a timestamped release, runs install/lint/typecheck/build/audit, atomically switches `current`, restarts systemd, and rolls back automatically if `/api/health` fails.
6. Verify the public site manually and through browser QA while commerce and indexing remain disabled.
7. Record a hold decision while any blocker remains.
8. Enable commerce and indexing only through a separate, explicit configuration change after full approval, then restart and re-run the complete production verification matrix.

## Verification matrix

- `systemctl is-active elore-paris.service`
- `journalctl -u elore-paris.service --since "15 minutes ago"`
- `nginx -t`
- `curl --fail https://elore-paris.com/api/health`
- canonical URL is `https://elore-paris.com`
- `publicReleaseApproved` and `searchIndexingEnabled` match the approved state
- homepage, shop, categories, product, journal, search, cart, checkout gate, tracking, 404, and error states
- unauthenticated `/ops` redirect and role-based authenticated operations pages
- order creation/duplicate protection/tracking negative cases
- payment, shipping, notification, and OAuth sandbox callbacks
- provider callbacks reject stale/tampered signatures and conflicting event-id replays; OAuth rejects state replay, nonce mismatch, unverified bootstrap contacts, and issuer/subject conflicts
- newsletter and back-in-stock consent records preserve policy version/evidence, enforce suppression and production gates, expose only masked Ops data, and support a deliberate same-origin unsubscribe confirmation flow
- lifecycle delivery claims require explicit delivery/provider gates; verify lease recovery, consent-revision dedupe, bounded retry/dead-letter handling, unsubscribe cancellation, and the absence of raw destinations or unsubscribe links from Ops responses
- mobile, keyboard, reduced-motion, accessibility, console, request-failure, and Core Web Vitals checks
- `robots.txt`, sitemap, metadata, JSON-LD, analytics consent, and purchase deduplication
- backup and restore evidence

## Rollback

The deploy script retains prior releases. If the new process fails health checks, it restores the previous `current` symlink automatically. For a later regression:

```bash
ln -s /srv/elore-paris/releases/<known-good-release> /srv/elore-paris/current.rollback
mv -Tf /srv/elore-paris/current.rollback /srv/elore-paris/current
systemctl restart elore-paris.service
curl --fail http://127.0.0.1:3056/api/health
```

Do not delete old releases until a known-good rollback and backup restore have both been verified.

### Restore rehearsal

Rehearse restoration into a new isolated path first; existing targets are rejected by default:

```bash
cd /srv/elore-paris/current
npm run authority:backup -- restore \
  --backup /var/lib/elore-paris/backups/<snapshot>.sqlite \
  --target /var/lib/elore-paris/restore-rehearsal.sqlite
```

Verify the restored database and record the manifest checksum as release evidence. For an
actual replacement, stop `elore-paris.service`, confirm no `-wal` or `-shm` sidecars remain,
then add `--overwrite`. The tool preserves the displaced database as a timestamped
`.pre-restore-*` file rather than deleting it.

## Current blockers

- Approved brand/business/legal file is pending.
- Real product imagery and safety/catalog facts are incomplete.
- VAT/invoice policy and provider contracts are not approved.
- Distributed throttling, webhook replay protection, OAuth identity binding, and broader automated coverage remain in progress.
- The persistent SSH public key has not yet been installed on the server.
- Hostinger configuration files are prepared locally but have not been applied to the live server.
