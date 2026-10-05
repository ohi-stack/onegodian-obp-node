# onegodian-obp-node

OBP-1™ Verification & Provenance Authority for the OneGodian Digital Finance™ ecosystem.

## Status

**Version:** 0.2.0  
**Status:** In Development  
**Repository:** `ohi-stack/onegodian-obp-node`

This service is the authoritative OBP-1 verification node. ODeFi™ and `api.OneGodian.org` consume its verification results; they do not create OBP-1 verification truth themselves.

## Authority model

```text
Authorized source / operator
        ↓
Register record
        ↓
OBP-1 registry
        ↓
Explicit attestation
        ↓
Verified record
        ↓
Public verification query
        ↓
api.OneGodian.org
        ↓
ODeFi / QR-V / approved consumers
```

Verification is **read-only and fail-closed**. `POST /api/obp1/verify` never creates or promotes a record.

## Record lifecycle

```text
registered
   ↓ attest
verified
   ├─ revoke ─────→ revoked
   └─ supersede ──→ superseded
```

Only protected authority routes can mutate registry state.

## Public endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Process/service health |
| GET | `/readiness` | Authority configuration and storage readiness |
| GET | `/api/obp1/status` | OBP-1 node status and aggregate counts |
| POST | `/api/obp1/verify` | Verify an existing record by record ID, ODIN ID, SHA-256 hash, or matching combination |
| GET | `/api/obp1/records/:id` | Public verification metadata for one record |
| POST | `/api/obp1/hash` | Utility hash endpoint; does **not** establish verification |

## Protected authority endpoints

These require `Authorization: Bearer <OBP1_API_KEY>` (or `x-api-key`).

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/obp1/records/register` | Register provenance content in `registered` state |
| POST | `/api/obp1/records/:id/attest` | Explicitly attest a registered record |
| POST | `/api/obp1/records/:id/revoke` | Revoke a record with a reason |
| POST | `/api/obp1/records/:id/supersede` | Mark a record superseded by another existing record |
| GET | `/api/obp1/records` | Protected registry listing |
| POST | `/api/obp1/certificates/create` | Issue a certificate only for a verified record |
| GET | `/api/obp1/certificates` | Protected certificate listing |
| GET | `/api/obp1/audit` | Protected append-only application audit log |

Legacy capital-sync and policy-authorize routes now return `501 Not Implemented` rather than falsely claiming success.

## Verification request

At least one locator is required:

```json
{
  "recordId": "obp_...",
  "odinId": "ODIN-...",
  "hash": "64-character-sha256"
}
```

When multiple locators are supplied, every locator must resolve to the same record or verification fails closed with HTTP 409.

Example verified response:

```json
{
  "verified": true,
  "status": "verified",
  "reason": null,
  "authority": "OBP-1",
  "recordId": "obp_...",
  "odinId": "ODIN-...",
  "hash": "...",
  "version": "1.0.0",
  "issuedAt": "2026-10-04T00:00:00.000Z",
  "verifiedAt": "2026-10-04T00:05:00.000Z",
  "revokedAt": null,
  "supersededBy": null
}
```

A missing, registered-only, revoked, superseded, or mismatched record returns `verified: false`.

## Environment

```env
NODE_ENV=production
PORT=3000
OBP1_API_KEY=<strong-server-side-secret>
OBP1_DATA_FILE=/var/lib/obp1/obp1-store.json
```

The v0.2 implementation uses an atomic, durable single-node file store and survives process restarts when `OBP1_DATA_FILE` is mounted on persistent storage. This is sufficient for development and single-node acceptance; a PostgreSQL/approved managed datastore remains the production scaling target before multi-instance deployment.

## Consumer configuration

Once this node is deployed behind an approved HTTPS host, the consumer value is:

```env
OBP1_VERIFY_URL=https://<approved-obp1-host>/api/obp1/verify
OBP1_API_KEY=<server-side-credential-if-the deployment requires authenticated reads>
```

The deployed hostname must be established by deployment evidence. Repository code alone does not establish a live URL.

## Local development

```bash
npm ci
npm run dev
```

## Validation

```bash
npm run check
npm test
npm run build
```

Automated tests cover:

- unknown records fail closed without creating records;
- registration requires authority authentication;
- registered records are not verified until explicit attestation;
- verified records resolve by ID / ODIN / hash;
- revocation disables verification;
- persisted state survives application restart;
- mismatched verification locators fail closed.

## Production boundary

This repository must not be represented as Production merely because the service code exists. Production requires, at minimum:

- canonical HTTPS deployment;
- persistent storage mounted and restart-tested;
- rotated `OBP1_API_KEY`;
- restricted network/CORS posture where applicable;
- structured/redacted operational logging;
- backup and restore procedure;
- rate limiting / abuse controls;
- deployment and rollback documentation;
- live acceptance from `api.OneGodian.org`;
- revocation/supersession acceptance tests;
- monitoring through the O-H-I Command Center / ACC evidence chain.

Until those controls are verified, the service remains **In Development**.
