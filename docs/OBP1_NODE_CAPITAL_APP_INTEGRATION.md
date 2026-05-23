# OBP-1 Node — Capital Plugin and OneGodian App Integration

Document class: implementation specification
Status: v0.1 working baseline
Scope: OBP-1 Node, OneGodian Capital Plugin, app.OneGodian.com

## 1. Purpose

The OBP-1 Node is the private verification, audit, registry, certificate, and timestamp layer for OneGodian records. It does not approve investments, execute financial transactions, replace legal review, act as a public-government registry, or override civil/legal timestamps.

Primary function:

- verify records
- hash records
- timestamp records
- version records
- issue internal certificates
- maintain audit history
- expose controlled APIs for Capital Plugin and app.OneGodian.com

## 2. System Boundaries

### OBP-1 Node

Canonical verification service and record authority for private OneGodian verification records.

### OneGodian Capital Plugin

Commercial/capital interface. It sends disclosures, contribution records, document versions, certificates, and acknowledgment events to OBP-1 for verification.

### app.OneGodian.com

Command center and control-plane interface. It displays OBP-1 status, registry records, certificate tools, audit trails, and agent/ACC review hooks.

## 3. Capital Plugin Required Modules

Add or expose these admin screens:

- OBP-1 Node Dashboard
- Verification Registry
- Disclosure Acknowledgment Log
- Capital Document Vault
- Certificate Records
- OBP-1 Audit Log
- OBP-1 Settings
- API Connection Status

### Capital Plugin Menu

```txt
OneGodian Capital
├── Dashboard
├── Disclosure Center
├── OBP-1 Node
├── Verification Registry
├── Capital Document Vault
├── Contribution Records
├── Certificates
├── Audit Logs
├── Settings
└── System Status
```

## 4. App Required Modules

Add or expose these app routes/modules:

```txt
App.OneGodian.com
├── Dashboard
├── OBP-1 Node
├── Registry
├── Certificates
├── Capital Sync
├── Agent Review
├── Audit Logs
├── Policies
├── API Keys
└── Settings
```

Required app routes:

- `/obp1`
- `/obp1/registry`
- `/obp1/certificates`
- `/obp1/capital-sync`
- `/obp1/audit`
- `/obp1/policies`
- `/obp1/settings`

## 5. Required Database Tables

```sql
obp1_nodes
obp1_records
obp1_record_versions
obp1_hashes
obp1_certificates
obp1_disclosure_acknowledgments
obp1_audit_logs
obp1_policy_decisions
```

## 6. Canonical Record Schema

```json
{
  "record_id": "",
  "record_type": "capital_document | disclosure_acknowledgment | contribution_record | certificate | registry_entry | audit_event",
  "source_system": "capital_plugin | onegodian_app | obp1_node | acc",
  "title": "",
  "status": "draft | pending | verified | rejected | archived",
  "timestamp_utc": "",
  "timestamp_local": "",
  "timezone": "",
  "onegodian_time": "",
  "hash": "",
  "hash_algorithm": "SHA-256",
  "version": "0.1.0",
  "created_by": "",
  "approved_by": "",
  "approval_required": true,
  "audit_trail_id": "",
  "metadata": {}
}
```

## 7. API Endpoints

```txt
GET  /api/obp1/status
POST /api/obp1/verify
GET  /api/obp1/records
GET  /api/obp1/records/{id}
POST /api/obp1/certificates/create
POST /api/obp1/disclosures/acknowledge
GET  /api/obp1/audit
POST /api/obp1/hash
POST /api/obp1/capital/sync
POST /api/obp1/policy/authorize
```

## 8. Authorization Rules

OBP-1 must not permit self-authorized privileged actions.

Actions requiring approval before canonical write:

- registry canonical record update
- certificate issuance
- disclosure version finalization
- policy mutation
- financial record verification
- audit exception
- agent-initiated registry change

Denied actions:

- audit deletion
- canonical timestamp override
- canonical registry deletion
- policy bypass
- financial execution by OBP-1

## 9. Timestamp Standard

All records must store Gregorian UTC as canonical.

Required timestamp fields:

```json
{
  "timestamp_utc": "2026-05-23T00:00:00Z",
  "timestamp_local": "2026-05-22 20:00:00",
  "timezone": "America/New_York",
  "onegodian_time": "derived display overlay only"
}
```

OneGodian Time may be displayed as a supplemental overlay, but must not replace UTC for system-of-record, legal, financial, or audit purposes.

## 10. Certificate Output Fields

```json
{
  "certificate_id": "",
  "record_id": "",
  "issued_to": "",
  "issued_by": "OBP-1 Node",
  "verification_hash": "",
  "issue_timestamp_utc": "",
  "document_version": "",
  "status": "issued | revoked | superseded",
  "verification_url": ""
}
```

## 11. Capital Sync Flow

1. Capital Plugin creates or updates a document, disclosure, contribution record, or acknowledgment.
2. Capital Plugin submits the payload to OBP-1 Node.
3. OBP-1 validates required fields.
4. OBP-1 generates SHA-256 hash.
5. OBP-1 writes immutable audit event.
6. OBP-1 returns record ID, hash, timestamp, and status.
7. Capital Plugin displays verification badge and audit reference.
8. App displays the same record in OBP-1 Registry and Capital Sync.

## 12. App Control Flow

1. App requests OBP-1 status.
2. App displays node health and pending reviews.
3. App allows authorized users to inspect registry records.
4. App routes privileged actions through policy authorization.
5. Agent-originated actions must be queued for approval if they touch protected records.

## 13. Definition of Done v0.1

- OBP-1 Node has status, hash, verify, records, certificates, audit, and capital sync endpoints.
- Capital Plugin has OBP-1 admin menu and settings screen.
- App has OBP-1 dashboard route and registry route.
- All writes generate audit records.
- All canonical records store UTC timestamps.
- Certificate creation requires approval or authorized role.
- No financial transaction execution is performed by OBP-1.
- No audit delete function exists.

## 14. Compliance Framing

OBP-1 Node is private verification and audit infrastructure for OneGodian records, documents, disclosures, and certificates. It supports institutional readability by preserving version history, UTC timestamps, hash references, and approval records while maintaining separation between commercial/capital functions and broader identity or educational functions.
