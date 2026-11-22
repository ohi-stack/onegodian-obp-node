# OBP-1™ + OBC™ Architecture — v0.2 (Design Baseline)
Date: 2026-11-22
Status: Proposed; not production verified.
Owner: ONEGODIAN, LLC technology development.

## Current implementation audit
The current `server.ts` provides in-memory records, certificates, hashes, and audit arrays. Restarting the process loses data. `/api/obp1/policy/authorize` returns `authorized: true` without validating authority. `/api/obp1/verify` hashes arbitrary JSON and labels it verified, without signatures, external provenance, or independent consensus. There is no demonstrated distributed blockchain, native OBC ledger, consensus mechanism, persistent supply accounting, wallet custody, or transaction finality. Status labels must not imply otherwise.

## Responsibilities
- **OBP-1 (Bedrock):** canonical transaction schemas, signature verification, deterministic state transitions, append-only persisted event history, cryptographic commitments, asset provenance and verification.
- **OBC (Flow):** native currency specification and accounting within OBP-1, not a separate authority over the ledger. Define denomination, supply policy, genesis allocation, issuance controls, transfer rules, fee policy and conservation invariants before enabling transfers.
- **OHI (Mind):** policy evaluation and decision support, routed to human authorization where consequential. OHI cannot override signature validity, supply invariants or ledger history.
- **ODIN:** identifier and metadata references, not a substitute for title, registration, legal rights or blockchain finality.
- **OBW-1:** key custody and transaction signing, with secrets never transmitted to the node.
- **ODeFi:** consumer-facing interfaces and regulated-activity controls, not an independent source of truth for balances.
- **ACC:** agent dispatch, review and audit; compute agents never own ledger state.

## Execution boundaries
1. Client prepares canonical unsigned transaction.
2. Wallet signs using a controlled key; node never receives private keys.
3. Node checks chain/network ID, schema version, signature, nonce, balance, authorization and idempotency.
4. Deterministic state transition records balanced debits/credits atomically in persistent storage.
5. Append audit event and return a transaction reference.
6. Read APIs expose status as pending/committed/rejected; do not claim finality absent a defined consensus model.

## v0.2 transaction contract (design only)
```json
{
  "schema_version": "0.2",
  "network": "obp1-devnet",
  "type": "obc.transfer",
  "from": "obp1:dev:sender",
  "to": "obp1:dev:recipient",
  "amount_minor": "1000",
  "nonce": "1",
  "idempotency_key": "test-transfer-001",
  "signature": "<wallet-signature>"
}
```
All monetary amounts are integer minor units encoded as decimal strings. No floating-point arithmetic. Denomination and signing algorithm remain undecided; no live transfer endpoint is authorized by this document.

## Invariants
- Total debits equal total credits per committed transfer, including any explicitly configured fee account.
- No negative spendable balances; no replayed nonce; no duplicate idempotency effects.
- Supply changes require a separately authorized, auditable issuance/burn event.
- Persist transaction, balances and audit event in one database transaction.
- Admin override may suspend processing but cannot rewrite committed history.
- Public API never exposes secrets, raw sensitive submissions, or unauthenticated issuance.

## Regulatory boundary
No representation that OBC is legal tender, a deposit, a security, redeemable for fiat, or exchange-listed. Before public issuance or fiat conversion, obtain jurisdiction-specific legal review covering money transmission, AML/KYC, sanctions, consumer protection, securities and tax treatment as applicable. INO cultural/governance functions remain separate from ONEGODIAN, LLC commercial activity.

## Release gates
v0.2 is documentation only. Next single operational module: persistent, authenticated development-network proof record with deterministic hash verification and restart durability. Subsequent milestones: transaction validation, OBC accounting, wallet signing, adversarial tests, independent security review, and deployment evidence. Never label a milestone operational without tests and repeatable evidence.
