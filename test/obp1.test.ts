import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createObp1App } from '../src/obp1App.ts';

function createHarness(apiKey = 'test-authority-key') {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'obp1-test-'));
  const dataFile = path.join(directory, 'store.json');
  const app = createObp1App({ dataFile, apiKey });
  const server = app.listen(0);
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Unable to bind test server.');
  return {
    dataFile,
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    })
  };
}

async function jsonRequest(baseUrl: string, route: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers || {})
    }
  });
  const body = await response.json();
  return { response, body };
}

test('verification is fail-closed and cannot create records', async () => {
  const harness = createHarness();
  try {
    const result = await jsonRequest(harness.baseUrl, '/api/obp1/verify', {
      method: 'POST',
      body: JSON.stringify({ recordId: 'obp_missing' })
    });

    assert.equal(result.response.status, 404);
    assert.equal(result.body.verified, false);
    assert.equal(result.body.reason, 'record_not_found');

    const status = await jsonRequest(harness.baseUrl, '/api/obp1/status');
    assert.equal(status.body.counts.records, 0);
    assert.equal(status.body.verificationCreatesRecords, false);
  } finally {
    await harness.close();
  }
});

test('registration requires authority authentication', async () => {
  const harness = createHarness();
  try {
    const result = await jsonRequest(harness.baseUrl, '/api/obp1/records/register', {
      method: 'POST',
      body: JSON.stringify({
        recordType: 'asset',
        title: 'ODC Test Record',
        payload: { symbol: 'ODC' }
      })
    });

    assert.equal(result.response.status, 401);
    assert.equal(result.body.error, 'unauthorized');
  } finally {
    await harness.close();
  }
});

test('register -> attest -> verify -> revoke lifecycle is authoritative and persistent', async () => {
  const apiKey = 'test-authority-key';
  const harness = createHarness(apiKey);

  let recordId = '';
  let hash = '';
  try {
    const registration = await jsonRequest(harness.baseUrl, '/api/obp1/records/register', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'x-obp1-actor': 'test-authority'
      },
      body: JSON.stringify({
        recordType: 'asset',
        title: 'OneGodian Digital Coin',
        source: 'onegodian-digital-coin',
        odinId: 'ODIN-TEST-ODC-001',
        version: '1.0.0',
        payload: {
          network: 'ethereum-mainnet',
          chainId: 1,
          symbol: 'ODC',
          contract: '0x9eee1e3615efe0374a7588d2760db5ffb2d5ce98'
        }
      })
    });

    assert.equal(registration.response.status, 201);
    assert.equal(registration.body.record.status, 'registered');
    recordId = registration.body.record.recordId;
    hash = registration.body.record.hash;

    const beforeAttestation = await jsonRequest(harness.baseUrl, '/api/obp1/verify', {
      method: 'POST',
      body: JSON.stringify({ recordId, hash })
    });
    assert.equal(beforeAttestation.response.status, 200);
    assert.equal(beforeAttestation.body.verified, false);
    assert.equal(beforeAttestation.body.status, 'registered');

    const attestation = await jsonRequest(harness.baseUrl, `/api/obp1/records/${recordId}/attest`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'x-obp1-actor': 'test-authority'
      },
      body: JSON.stringify({ expectedHash: hash })
    });
    assert.equal(attestation.response.status, 200);
    assert.equal(attestation.body.verified, true);

    const verified = await jsonRequest(harness.baseUrl, '/api/obp1/verify', {
      method: 'POST',
      body: JSON.stringify({ odinId: 'ODIN-TEST-ODC-001', hash })
    });
    assert.equal(verified.response.status, 200);
    assert.equal(verified.body.verified, true);
    assert.equal(verified.body.status, 'verified');
    assert.equal(verified.body.recordId, recordId);
    assert.equal(verified.body.hash, hash);

    const revoked = await jsonRequest(harness.baseUrl, `/api/obp1/records/${recordId}/revoke`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'x-obp1-actor': 'test-authority'
      },
      body: JSON.stringify({ reason: 'Test revocation' })
    });
    assert.equal(revoked.response.status, 200);
    assert.equal(revoked.body.record.status, 'revoked');

    const afterRevocation = await jsonRequest(harness.baseUrl, '/api/obp1/verify', {
      method: 'POST',
      body: JSON.stringify({ recordId })
    });
    assert.equal(afterRevocation.body.verified, false);
    assert.equal(afterRevocation.body.status, 'revoked');
    assert.ok(afterRevocation.body.revokedAt);
  } finally {
    await harness.close();
  }

  const restartedApp = createObp1App({ dataFile: harness.dataFile, apiKey });
  const restartedServer = restartedApp.listen(0);
  const address = restartedServer.address();
  if (!address || typeof address === 'string') throw new Error('Unable to bind restarted server.');
  const restartedUrl = `http://127.0.0.1:${address.port}`;

  try {
    const persisted = await jsonRequest(restartedUrl, '/api/obp1/verify', {
      method: 'POST',
      body: JSON.stringify({ recordId })
    });
    assert.equal(persisted.body.status, 'revoked');
    assert.equal(persisted.body.verified, false);

    const status = await jsonRequest(restartedUrl, '/api/obp1/status');
    assert.equal(status.body.counts.records, 1);
    assert.equal(status.body.counts.revoked, 1);
  } finally {
    await new Promise<void>((resolve, reject) => {
      restartedServer.close((error) => error ? reject(error) : resolve());
    });
  }
});

test('mismatched locators fail closed', async () => {
  const apiKey = 'test-authority-key';
  const harness = createHarness(apiKey);
  try {
    const headers = { authorization: `Bearer ${apiKey}` };
    const first = await jsonRequest(harness.baseUrl, '/api/obp1/records/register', {
      method: 'POST',
      headers,
      body: JSON.stringify({ recordType: 'document', odinId: 'ODIN-A', payload: { value: 'A' } })
    });
    const second = await jsonRequest(harness.baseUrl, '/api/obp1/records/register', {
      method: 'POST',
      headers,
      body: JSON.stringify({ recordType: 'document', odinId: 'ODIN-B', payload: { value: 'B' } })
    });

    const mismatch = await jsonRequest(harness.baseUrl, '/api/obp1/verify', {
      method: 'POST',
      body: JSON.stringify({
        recordId: first.body.record.recordId,
        hash: second.body.record.hash
      })
    });

    assert.equal(mismatch.response.status, 409);
    assert.equal(mismatch.body.verified, false);
    assert.equal(mismatch.body.reason, 'verification_locators_do_not_match_same_record');
  } finally {
    await harness.close();
  }
});
