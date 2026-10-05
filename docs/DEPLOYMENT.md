# OBP-1™ Deployment & Rollback

## Status

**In Development.** This document defines the deployment contract; it does not prove a live deployment.

## Required runtime

- Node.js 20+
- HTTPS termination at the platform ingress
- persistent writable volume mounted for `OBP1_DATA_FILE`
- server-side `OBP1_API_KEY`
- health and readiness monitoring
- restricted administrative access to authority-changing routes

## Environment

```env
NODE_ENV=production
PORT=3000
OBP1_API_KEY=<rotated-server-secret>
OBP1_DATA_FILE=/var/lib/obp1/obp1-store.json
```

Do not expose `OBP1_API_KEY` in browser code, `NEXT_PUBLIC_*`, logs, screenshots, or source control.

## Container deployment

Build:

```bash
docker build -t onegodian-obp-node:0.2.0 .
```

Run with persistent storage:

```bash
docker run -d \
  --name onegodian-obp-node \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e OBP1_API_KEY="$OBP1_API_KEY" \
  -e OBP1_DATA_FILE=/var/lib/obp1/obp1-store.json \
  -v obp1-data:/var/lib/obp1 \
  onegodian-obp-node:0.2.0
```

## Acceptance sequence

1. `GET /health` returns HTTP 200.
2. `GET /readiness` returns HTTP 200 only when storage is writable and authority authentication is configured.
3. Register a disposable acceptance record through the protected registration route.
4. Verify that record before attestation; response must be `verified: false` with status `registered`.
5. Attest the record through the protected authority route.
6. Verify again; response must be `verified: true`.
7. Restart the service without deleting the persistent volume.
8. Verify the same record again; it must remain `verified: true`.
9. Revoke the disposable record.
10. Verify again; response must be `verified: false` with status `revoked`.

A successful HTTP response alone is not sufficient. The state transitions and restart-survival checks are required evidence.

## Consumer integration

After an approved HTTPS hostname or internal service address is deployed, configure the shared OneGodian API with:

```env
OBP1_VERIFY_URL=https://<approved-obp1-host>/api/obp1/verify
```

If the verification route remains public/read-only, the shared API does not need the authority mutation key. If authenticated verification is later enabled, use a separate read-only verification credential rather than the mutation credential.

## Rollback

Before rollback:

1. snapshot or back up the persistent OBP-1 data volume;
2. record the current deployment image/version and commit SHA;
3. verify that the target rollback version can read schema version 1.

Rollback procedure:

```text
stop new deployment
→ preserve persistent volume
→ deploy previous verified image
→ run /health and /readiness
→ verify a known non-sensitive acceptance record
→ confirm revocation/supersession state
→ restore traffic
```

Do not delete or recreate the persistent volume as part of application rollback.

## Current limitations

- v0.2 uses a durable single-node file store, not PostgreSQL.
- multi-instance writes are not supported.
- rate limiting is not yet implemented.
- backup automation is not yet implemented.
- no canonical public hostname is established by this repository.
- deployment evidence and live `api.OneGodian.org` acceptance are still required before Production status.
