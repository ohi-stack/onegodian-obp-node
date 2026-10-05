import React, { useState } from 'react';
import { Search, ShieldCheck, AlertTriangle } from 'lucide-react';

function locatorFor(value: string) {
  const trimmed = value.trim();
  if (/^(?:0x)?[a-fA-F0-9]{64}$/.test(trimmed)) return { hash: trimmed };
  if (trimmed.toUpperCase().startsWith('ODIN-')) return { odinId: trimmed };
  return { recordId: trimmed };
}

export default function Registry() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function verify() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/obp1/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(locatorFor(query))
      });
      setResult(await response.json());
    } catch {
      setResult({ verified: false, status: 'unavailable', reason: 'verification_service_unreachable' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Verification Registry</h1>
        <p className="text-neutral-500 mt-2">
          Verify an existing OBP-1 record by Record ID, ODIN ID, or SHA-256 hash. A lookup never creates a record.
        </p>
      </header>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && verify()}
              placeholder="Record ID, ODIN ID, or SHA-256 hash"
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm"
            />
          </div>
          <button onClick={verify} disabled={loading || !query.trim()} className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm disabled:opacity-50">
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </div>
      </div>

      {result && (
        <div className={`rounded-xl border p-6 ${result.verified ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2">
            {result.verified ? <ShieldCheck className="text-green-700" /> : <AlertTriangle className="text-amber-700" />}
            <h2 className="font-semibold">{result.verified ? 'Verified' : 'Not Verified'}</h2>
          </div>
          <dl className="mt-4 grid gap-2 text-sm">
            <div><dt className="text-neutral-500">Status</dt><dd className="font-mono">{result.status || 'unknown'}</dd></div>
            {result.recordId && <div><dt className="text-neutral-500">Record ID</dt><dd className="font-mono break-all">{result.recordId}</dd></div>}
            {result.odinId && <div><dt className="text-neutral-500">ODIN ID</dt><dd className="font-mono break-all">{result.odinId}</dd></div>}
            {result.hash && <div><dt className="text-neutral-500">SHA-256</dt><dd className="font-mono break-all">{result.hash}</dd></div>}
            {result.reason && <div><dt className="text-neutral-500">Reason</dt><dd>{result.reason}</dd></div>}
          </dl>
        </div>
      )}
    </div>
  );
}
