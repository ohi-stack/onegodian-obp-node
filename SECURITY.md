# Security Policy

## Reporting vulnerabilities

Do not disclose suspected vulnerabilities through public issues. Use the repository's private security reporting channel or the designated internal security contact for ONEGODIAN, LLC.

Include the affected version or commit, reproduction steps, expected and observed behavior, potential impact, and suggested mitigation when known.

## Mandatory security controls

- Never commit private keys, signing keys, API secrets, database credentials, or production tokens.
- Verify request timestamps, signatures, nonces, and replay windows.
- Use constant-time comparison for message authentication codes and signatures where applicable.
- Validate all records against the published JSON schemas.
- Treat verification failures as fail-closed outcomes.
- Maintain append-only audit events for administrative and verification actions.
- Separate test, staging, and production credentials.
- Use least-privilege service accounts and database roles.
- Rotate secrets and signing keys under a documented procedure.
- Do not describe a record as verified unless its content hash, identifier, version, and status are reproducibly validated.

## Operational boundary

OBP-1 verification does not replace Ethereum consensus, independent smart-contract audits, legal review, regulatory approval, or third-party identity verification.
