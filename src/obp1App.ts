import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { NextFunction, Request, Response } from 'express';
import { Obp1Store, RegisterInput, VerificationLocator } from './obp1Store.ts';

type AppOptions = {
  dataFile?: string;
  apiKey?: string;
};

function text(value: unknown, max = 200) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized && normalized.length <= max ? normalized : null;
}

function object(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function parseRegisterInput(body: unknown): RegisterInput | null {
  const data = object(body);
  if (!data) return null;

  const recordType = text(data.recordType ?? data.record_type, 100);
  const payload = object(data.payload);
  if (!recordType || !payload) return null;

  return {
    recordType,
    title: text(data.title, 300) || undefined,
    owner: text(data.owner, 300) || undefined,
    source: text(data.source ?? data.source_system, 200) || undefined,
    odinId: text(data.odinId ?? data.odin_id, 200) || undefined,
    version: text(data.version, 50) || undefined,
    payload
  };
}

function parseLocator(body: unknown): VerificationLocator | null {
  const data = object(body);
  if (!data) return null;
  const recordId = text(data.recordId ?? data.record_id, 200) || undefined;
  const odinId = text(data.odinId ?? data.odin_id, 200) || undefined;
  const rawHash = text(data.hash ?? data.sha256 ?? data.sha256Hash, 70) || undefined;
  const hash = rawHash?.replace(/^0x/i, '');

  if (!recordId && !odinId && !hash) return null;
  if (hash && !/^[a-fA-F0-9]{64}$/.test(hash)) return null;
  return { recordId, odinId, hash };
}

function publicRecord(record: ReturnType<Obp1Store['getRecord']>) {
  if (!record) return null;
  return {
    recordId: record.recordId,
    recordType: record.recordType,
    title: record.title,
    owner: record.owner,
    source: record.source,
    odinId: record.odinId,
    version: record.version,
    hash: record.hash,
    hashAlgorithm: record.hashAlgorithm,
    status: record.status,
    createdAt: record.createdAt,
    verifiedAt: record.verifiedAt,
    verifiedBy: record.verifiedBy,
    revokedAt: record.revokedAt,
    revocationReason: record.revocationReason,
    supersededAt: record.supersededAt,
    supersededBy: record.supersededBy
  };
}

function secureEqual(provided: string, expected: string) {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function createObp1App(options: AppOptions = {}) {
  const app = express();
  const dataFile = options.dataFile || process.env.OBP1_DATA_FILE || path.join(process.cwd(), '.data', 'obp1-store.json');
  const apiKey = options.apiKey ?? process.env.OBP1_API_KEY ?? '';
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  const store = new Obp1Store(dataFile);

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = text(req.header('x-request-id'), 200) || `obp_req_${crypto.randomBytes(8).toString('hex')}`;
    res.setHeader('x-request-id', requestId);
    res.locals.requestId = requestId;
    next();
  });

  function requireAuthority(req: Request, res: Response, next: NextFunction) {
    if (!apiKey) {
      return res.status(503).json({
        error: 'authority_auth_not_configured',
        requestId: res.locals.requestId
      });
    }
    const authorization = req.header('authorization') || '';
    const bearer = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    const supplied = bearer || req.header('x-api-key') || '';
    if (!supplied || !secureEqual(supplied, apiKey)) {
      return res.status(401).json({ error: 'unauthorized', requestId: res.locals.requestId });
    }
    return next();
  }

  function actor(req: Request) {
    return text(req.header('x-obp1-actor'), 200) || 'authorized-service';
  }

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'onegodian-obp-node',
      authority: 'OBP-1',
      version: '0.2.0',
      timestampUtc: new Date().toISOString(),
      requestId: res.locals.requestId
    });
  });

  app.get('/readiness', (_req, res) => {
    let storageWritable = true;
    try {
      fs.accessSync(path.dirname(dataFile), fs.constants.W_OK);
    } catch {
      storageWritable = false;
    }
    const authorityAuthConfigured = Boolean(apiKey);
    const ready = storageWritable && authorityAuthConfigured;
    res.status(ready ? 200 : 503).json({
      ready,
      status: 'in_development',
      checks: {
        storageWritable,
        authorityAuthConfigured,
        durableStore: 'single-node-file'
      },
      productionReady: false,
      requestId: res.locals.requestId
    });
  });

  app.get('/api/obp1/status', (_req, res) => {
    res.json({
      service: 'OBP-1',
      name: 'OneGodian Blockchain Protocol Verification Authority',
      status: 'in_development',
      version: '0.2.0',
      authorityMode: 'registry-backed-fail-closed',
      verificationCreatesRecords: false,
      productionReady: false,
      counts: store.counts(),
      requestId: res.locals.requestId
    });
  });

  app.post('/api/obp1/verify', (req, res) => {
    const locator = parseLocator(req.body);
    if (!locator) {
      return res.status(400).json({
        verified: false,
        status: 'invalid_request',
        reason: 'recordId, odinId, or a SHA-256 hash is required',
        authority: 'OBP-1',
        evidence: null,
        requestId: res.locals.requestId
      });
    }

    const result = store.find(locator);
    if (result.mismatch) {
      return res.status(409).json({
        verified: false,
        status: 'unverified',
        reason: 'verification_locators_do_not_match_same_record',
        authority: 'OBP-1',
        evidence: null,
        requestId: res.locals.requestId
      });
    }

    if (!result.record) {
      return res.status(404).json({
        verified: false,
        status: 'unverified',
        reason: 'record_not_found',
        authority: 'OBP-1',
        evidence: null,
        requestId: res.locals.requestId
      });
    }

    const record = result.record;
    const verified = record.status === 'verified';
    return res.json({
      verified,
      status: record.status,
      reason: verified ? null : 'authoritative_record_not_verified',
      authority: 'OBP-1',
      recordId: record.recordId,
      odinId: record.odinId,
      hash: record.hash,
      version: record.version,
      issuedAt: record.createdAt,
      verifiedAt: record.verifiedAt,
      revokedAt: record.revokedAt,
      supersededBy: record.supersededBy,
      evidence: publicRecord(record),
      requestId: res.locals.requestId
    });
  });

  app.get('/api/obp1/records/:id', (req, res) => {
    const record = store.getRecord(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'record_not_found', requestId: res.locals.requestId });
    }
    return res.json({ record: publicRecord(record), requestId: res.locals.requestId });
  });

  app.post('/api/obp1/records/register', requireAuthority, async (req, res) => {
    const input = parseRegisterInput(req.body);
    if (!input) {
      return res.status(400).json({ error: 'invalid_registration_payload', requestId: res.locals.requestId });
    }

    try {
      const result = await store.register(input, actor(req));
      return res.status(result.created ? 201 : 200).json({
        created: result.created,
        record: publicRecord(result.record),
        requestId: res.locals.requestId
      });
    } catch (error) {
      if ((error as Error).message === 'ACTIVE_ODIN_ID_EXISTS') {
        return res.status(409).json({ error: 'active_odin_id_exists', requestId: res.locals.requestId });
      }
      throw error;
    }
  });

  app.post('/api/obp1/records/:id/attest', requireAuthority, async (req, res) => {
    const body = object(req.body) || {};
    const expectedHash = text(body.expectedHash ?? body.expected_hash, 70) || undefined;
    try {
      const record = await store.attest(req.params.id, actor(req), expectedHash);
      if (!record) return res.status(404).json({ error: 'record_not_found', requestId: res.locals.requestId });
      return res.json({ verified: record.status === 'verified', record: publicRecord(record), requestId: res.locals.requestId });
    } catch (error) {
      const code = (error as Error).message;
      if (code === 'HASH_MISMATCH') return res.status(409).json({ error: 'hash_mismatch', requestId: res.locals.requestId });
      if (code === 'INACTIVE_RECORD') return res.status(409).json({ error: 'inactive_record', requestId: res.locals.requestId });
      throw error;
    }
  });

  app.post('/api/obp1/records/:id/revoke', requireAuthority, async (req, res) => {
    const body = object(req.body);
    const reason = text(body?.reason, 500);
    if (!reason) return res.status(400).json({ error: 'revocation_reason_required', requestId: res.locals.requestId });

    try {
      const record = await store.revoke(req.params.id, actor(req), reason);
      if (!record) return res.status(404).json({ error: 'record_not_found', requestId: res.locals.requestId });
      return res.json({ revoked: true, record: publicRecord(record), requestId: res.locals.requestId });
    } catch (error) {
      if ((error as Error).message === 'SUPERSEDED_RECORD') {
        return res.status(409).json({ error: 'record_already_superseded', requestId: res.locals.requestId });
      }
      throw error;
    }
  });

  app.post('/api/obp1/records/:id/supersede', requireAuthority, async (req, res) => {
    const body = object(req.body);
    const supersededBy = text(body?.supersededBy ?? body?.superseded_by, 200);
    if (!supersededBy) {
      return res.status(400).json({ error: 'superseded_by_required', requestId: res.locals.requestId });
    }

    try {
      const record = await store.supersede(req.params.id, actor(req), supersededBy);
      if (!record) return res.status(404).json({ error: 'record_or_replacement_not_found', requestId: res.locals.requestId });
      return res.json({ superseded: true, record: publicRecord(record), requestId: res.locals.requestId });
    } catch (error) {
      if ((error as Error).message === 'SELF_SUPERSESSION') {
        return res.status(409).json({ error: 'self_supersession_not_allowed', requestId: res.locals.requestId });
      }
      throw error;
    }
  });

  app.get('/api/obp1/records', requireAuthority, (_req, res) => {
    res.json({
      records: store.listRecords().map(publicRecord),
      requestId: res.locals.requestId
    });
  });

  app.post('/api/obp1/certificates/create', requireAuthority, async (req, res) => {
    const body = object(req.body);
    const recordId = text(body?.recordId ?? body?.record_id, 200);
    const issuedTo = text(body?.issuedTo ?? body?.issued_to, 300);
    if (!recordId || !issuedTo) {
      return res.status(400).json({ error: 'record_id_and_issued_to_required', requestId: res.locals.requestId });
    }

    try {
      const certificate = await store.issueCertificate(recordId, issuedTo, actor(req));
      if (!certificate) return res.status(404).json({ error: 'record_not_found', requestId: res.locals.requestId });
      return res.status(201).json({ certificate, requestId: res.locals.requestId });
    } catch (error) {
      if ((error as Error).message === 'RECORD_NOT_VERIFIED') {
        return res.status(409).json({ error: 'record_not_verified', requestId: res.locals.requestId });
      }
      throw error;
    }
  });

  app.get('/api/obp1/certificates', requireAuthority, (_req, res) => {
    res.json({ certificates: store.listCertificates(), requestId: res.locals.requestId });
  });

  app.get('/api/obp1/audit', requireAuthority, (_req, res) => {
    res.json({ audit: store.listAudit(), requestId: res.locals.requestId });
  });

  app.post('/api/obp1/hash', (req, res) => {
    const payload = object(req.body);
    if (!payload) return res.status(400).json({ error: 'json_object_required', requestId: res.locals.requestId });
    const hash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    res.json({ hash, algorithm: 'SHA-256', authoritativeVerification: false, requestId: res.locals.requestId });
  });

  app.post('/api/obp1/capital/sync', requireAuthority, (_req, res) => {
    res.status(501).json({
      status: 'not_implemented',
      reason: 'capital_sync_requires_explicit_adapter_contract',
      requestId: res.locals.requestId
    });
  });

  app.post('/api/obp1/policy/authorize', requireAuthority, (_req, res) => {
    res.status(501).json({
      authorized: false,
      status: 'not_implemented',
      reason: 'policy_authorization_requires_explicit_policy_engine',
      requestId: res.locals.requestId
    });
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'not_found', path: req.path, requestId: res.locals.requestId });
  });

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('OBP-1 request failed', { requestId: res.locals.requestId, message: error.message });
    res.status(500).json({ error: 'internal_server_error', requestId: res.locals.requestId });
  });

  return app;
}
