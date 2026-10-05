import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export type RecordStatus = 'registered' | 'verified' | 'revoked' | 'superseded';

export type RegisterInput = {
  recordType: string;
  title?: string;
  owner?: string;
  source?: string;
  odinId?: string;
  version?: string;
  payload: Record<string, unknown>;
};

export type VerificationLocator = {
  recordId?: string;
  odinId?: string;
  hash?: string;
};

export type ObpRecord = {
  recordId: string;
  recordType: string;
  title: string | null;
  owner: string | null;
  source: string | null;
  odinId: string | null;
  version: string;
  payload: Record<string, unknown>;
  hash: string;
  hashAlgorithm: 'SHA-256';
  status: RecordStatus;
  createdAt: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
  revocationReason: string | null;
  supersededAt: string | null;
  supersededBy: string | null;
};

export type AuditEvent = {
  id: string;
  action: string;
  timestamp: string;
  recordId: string | null;
  actor: string | null;
  details: Record<string, unknown>;
};

export type Certificate = {
  certificateId: string;
  recordId: string;
  issuedTo: string;
  issuedBy: string;
  verificationHash: string;
  issueTimestampUtc: string;
  documentVersion: string;
  status: 'issued' | 'revoked';
};

type StoreData = {
  schemaVersion: 1;
  records: Record<string, ObpRecord>;
  auditLogs: AuditEvent[];
  certificates: Record<string, Certificate>;
};

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;

  const object = value as Record<string, unknown>;
  const keys = Object.keys(object).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(object[key])}`).join(',')}}`;
}

export function hashCanonicalRecord(input: RegisterInput) {
  const content = {
    recordType: input.recordType,
    title: input.title || null,
    owner: input.owner || null,
    source: input.source || null,
    odinId: input.odinId || null,
    version: input.version || '1.0.0',
    payload: input.payload
  };
  return crypto.createHash('sha256').update(canonicalize(content)).digest('hex');
}

function emptyData(): StoreData {
  return { schemaVersion: 1, records: {}, auditLogs: [], certificates: {} };
}

export class Obp1Store {
  private data: StoreData;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(private readonly dataFile: string) {
    this.data = this.load();
  }

  private load(): StoreData {
    if (!fs.existsSync(this.dataFile)) return emptyData();
    const raw = fs.readFileSync(this.dataFile, 'utf8');
    const parsed = JSON.parse(raw) as StoreData;
    if (parsed.schemaVersion !== 1 || !parsed.records || !Array.isArray(parsed.auditLogs) || !parsed.certificates) {
      throw new Error('Invalid OBP-1 data store schema.');
    }
    return parsed;
  }

  private async persist() {
    this.writeChain = this.writeChain.then(async () => {
      const directory = path.dirname(this.dataFile);
      await fs.promises.mkdir(directory, { recursive: true });
      const temp = `${this.dataFile}.${process.pid}.tmp`;
      await fs.promises.writeFile(temp, JSON.stringify(this.data, null, 2), { encoding: 'utf8', mode: 0o600 });
      await fs.promises.rename(temp, this.dataFile);
    });
    await this.writeChain;
  }

  private async audit(
    action: string,
    recordId: string | null,
    actor: string | null,
    details: Record<string, unknown> = {}
  ) {
    const event: AuditEvent = {
      id: makeId('adt'),
      action,
      timestamp: new Date().toISOString(),
      recordId,
      actor,
      details
    };
    this.data.auditLogs.push(event);
    await this.persist();
    return event;
  }

  counts() {
    const records = Object.values(this.data.records);
    return {
      records: records.length,
      registered: records.filter((record) => record.status === 'registered').length,
      verified: records.filter((record) => record.status === 'verified').length,
      revoked: records.filter((record) => record.status === 'revoked').length,
      superseded: records.filter((record) => record.status === 'superseded').length,
      certificates: Object.keys(this.data.certificates).length,
      auditEvents: this.data.auditLogs.length
    };
  }

  listRecords() {
    return Object.values(this.data.records);
  }

  listCertificates() {
    return Object.values(this.data.certificates);
  }

  listAudit() {
    return [...this.data.auditLogs];
  }

  getRecord(recordId: string) {
    return this.data.records[recordId] || null;
  }

  find(locator: VerificationLocator): { record: ObpRecord | null; mismatch: boolean } {
    const supplied: ObpRecord[] = [];

    if (locator.recordId) {
      const record = this.data.records[locator.recordId];
      if (!record) return { record: null, mismatch: false };
      supplied.push(record);
    }

    if (locator.odinId) {
      const record = Object.values(this.data.records).find((item) => item.odinId === locator.odinId);
      if (!record) return { record: null, mismatch: false };
      supplied.push(record);
    }

    if (locator.hash) {
      const normalizedHash = locator.hash.replace(/^0x/i, '').toLowerCase();
      const record = Object.values(this.data.records).find((item) => item.hash.toLowerCase() === normalizedHash);
      if (!record) return { record: null, mismatch: false };
      supplied.push(record);
    }

    if (!supplied.length) return { record: null, mismatch: false };
    const recordId = supplied[0].recordId;
    if (supplied.some((record) => record.recordId !== recordId)) {
      return { record: null, mismatch: true };
    }
    return { record: supplied[0], mismatch: false };
  }

  async register(input: RegisterInput, actor: string) {
    const hash = hashCanonicalRecord(input);
    const duplicate = Object.values(this.data.records).find((record) => record.hash === hash);
    if (duplicate) return { created: false as const, record: duplicate };

    if (input.odinId) {
      const duplicateOdin = Object.values(this.data.records).find(
        (record) => record.odinId === input.odinId && record.status !== 'superseded'
      );
      if (duplicateOdin) {
        throw new Error('ACTIVE_ODIN_ID_EXISTS');
      }
    }

    const record: ObpRecord = {
      recordId: makeId('obp'),
      recordType: input.recordType,
      title: input.title || null,
      owner: input.owner || null,
      source: input.source || null,
      odinId: input.odinId || null,
      version: input.version || '1.0.0',
      payload: input.payload,
      hash,
      hashAlgorithm: 'SHA-256',
      status: 'registered',
      createdAt: new Date().toISOString(),
      verifiedAt: null,
      verifiedBy: null,
      revokedAt: null,
      revokedBy: null,
      revocationReason: null,
      supersededAt: null,
      supersededBy: null
    };

    this.data.records[record.recordId] = record;
    await this.audit('REGISTER_RECORD', record.recordId, actor, { hash, odinId: record.odinId });
    return { created: true as const, record };
  }

  async attest(recordId: string, actor: string, expectedHash?: string) {
    const record = this.getRecord(recordId);
    if (!record) return null;
    if (record.status === 'revoked' || record.status === 'superseded') {
      throw new Error('INACTIVE_RECORD');
    }

    if (expectedHash) {
      const normalized = expectedHash.replace(/^0x/i, '').toLowerCase();
      if (normalized !== record.hash.toLowerCase()) throw new Error('HASH_MISMATCH');
    }

    if (record.status !== 'verified') {
      record.status = 'verified';
      record.verifiedAt = new Date().toISOString();
      record.verifiedBy = actor;
      await this.audit('ATTEST_RECORD', record.recordId, actor, { hash: record.hash });
    }
    return record;
  }

  async revoke(recordId: string, actor: string, reason: string) {
    const record = this.getRecord(recordId);
    if (!record) return null;
    if (record.status === 'superseded') throw new Error('SUPERSEDED_RECORD');

    record.status = 'revoked';
    record.revokedAt = new Date().toISOString();
    record.revokedBy = actor;
    record.revocationReason = reason;
    await this.audit('REVOKE_RECORD', record.recordId, actor, { reason });

    for (const certificate of Object.values(this.data.certificates)) {
      if (certificate.recordId === recordId) certificate.status = 'revoked';
    }
    await this.persist();
    return record;
  }

  async supersede(recordId: string, actor: string, supersededBy: string) {
    const record = this.getRecord(recordId);
    const replacement = this.getRecord(supersededBy);
    if (!record || !replacement) return null;
    if (record.recordId === replacement.recordId) throw new Error('SELF_SUPERSESSION');

    record.status = 'superseded';
    record.supersededAt = new Date().toISOString();
    record.supersededBy = replacement.recordId;
    await this.audit('SUPERSEDE_RECORD', record.recordId, actor, { supersededBy: replacement.recordId });
    return record;
  }

  async issueCertificate(recordId: string, issuedTo: string, actor: string) {
    const record = this.getRecord(recordId);
    if (!record) return null;
    if (record.status !== 'verified') throw new Error('RECORD_NOT_VERIFIED');

    const certificate: Certificate = {
      certificateId: makeId('cert'),
      recordId,
      issuedTo,
      issuedBy: actor,
      verificationHash: record.hash,
      issueTimestampUtc: new Date().toISOString(),
      documentVersion: record.version,
      status: 'issued'
    };
    this.data.certificates[certificate.certificateId] = certificate;
    await this.audit('ISSUE_CERTIFICATE', recordId, actor, { certificateId: certificate.certificateId, issuedTo });
    return certificate;
  }
}
