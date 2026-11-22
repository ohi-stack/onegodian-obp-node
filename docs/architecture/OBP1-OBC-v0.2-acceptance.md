# OBP-1 / OBC v0.2 — Acceptance and Audit Plan

## Observed baseline
- In-memory Map and audit arrays in `server.ts`.
- Unauthenticated mutation routes and unconditional policy authorization.
- SHA-256 hashes over JSON.stringify input, without canonical serialization.
- No persistence, consensus or OBC balances established by inspected source.

## Required future audit events
RECORD_SUBMITTED, RECORD_VALIDATED, RECORD_REJECTED, RECORD_COMMITTED, SIGNATURE_CHECKED, POLICY_REVIEW_REQUESTED, POLICY_APPROVED, POLICY_DENIED, TRANSACTION_RECEIVED, TRANSACTION_REJECTED, TRANSACTION_COMMITTED, SUPPLY_CHANGE_REQUESTED, SUPPLY_CHANGE_APPROVED, SUPPLY_CHANGED, OVERRIDE_APPLIED.

## Mini test plan for the next implementation
1. Submit a fixed proof payload; expect a stable canonical SHA-256 digest.
2. Resubmit identical idempotency key; expect the same record without duplication.
3. Restart the server; record and audit remain available.
4. Submit malformed input; expect 400 and no mutation.
5. Attempt unauthenticated write; expect 401/403.
6. Attempt unauthorized issuance or policy bypass; expect denial.
7. Verify event ordering and no sensitive data in public logs.

## Definition of done
Code committed, tests run with recorded results, restart-persistence demonstrated, endpoint authenticated, audit inspectable, and deployment independently verified. Until then: DESIGN ONLY.
