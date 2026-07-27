# onegodian-obp-node

OBP-1™ Blockchain Node — protocol and verification layer for OneGodian records, ODIN registry entries, document integrity, signatures, revocation, supersession, and audit history.

## Current status

**In development.** This repository now contains a production-oriented structure and schema baseline. It is not yet a complete operational node.

## Repository structure

```text
src/
├── api/
├── registry/
├── verification/
├── hashing/
├── signatures/
├── records/
└── audit/
schemas/
├── obp-record.schema.json
├── odin-record.schema.json
└── revocation.schema.json
migrations/
tests/
docs/
Dockerfile
.env.example
SECURITY.md
CHANGELOG.md
.github/workflows/ci.yml
```

## Verification rule

A record must not be described as verified unless its identifier, canonical content, content hash, algorithm, version, issuer or signer reference, and current status are reproducibly validated.

Verification failures must return a fail-closed result such as `invalid`, `revoked`, `superseded`, `under-review`, or `unavailable`; they must not be converted into a successful verification response.

## External boundaries

OBP-1 verification does not replace Ethereum consensus, independent smart-contract audits, legal review, regulatory approval, governmental registration, or third-party identity verification. Interfaces must identify each verification source separately and accurately.

## Production rule

> If a feature is not fully operational, documented, tested, secured, and repeatable, it does not exist in the current production version.

© ONEGODIAN, LLC. All rights reserved.
