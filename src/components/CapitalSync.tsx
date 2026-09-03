import React, { useState } from 'react';
import { RefreshCw, Send, CheckCircle2 } from 'lucide-react';

export default function CapitalSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/obp1/capital/sync', { method: 'POST' });
      const data = await res.json();
      setLastSync(data.timestamp);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setSyncing(false), 800);
    }
  };

  const handleSimulateDocument = async () => {
    const doc = {
      record_type: "capital_document",
      source_system: "capital_plugin",
      title: "Sample Capital Disclosure v1",
      version: "1.0.0",
      created_by: "Test User",
      approval_required: true,
      metadata: { doc_type: 'disclosure' }
    };

    try {
      await fetch('/api/obp1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc)
      });
      alert('Mock document submitted to OBP-1 for verification');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Capital Sync</h1>
        <p className="text-neutral-500 mt-2">Bridge interface with the OneGodian Capital Plugin.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-neutral-100 rounded-lg">
              <RefreshCw className="w-6 h-6 text-neutral-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Synchronization</h2>
              <p className="text-sm text-neutral-500">Sync with Capital App</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={handleSync}
              disabled={syncing}
              className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {syncing ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              {syncing ? 'Syncing...' : 'Run Capital Sync'}
            </button>
            {lastSync && (
              <p className="text-sm text-green-600 flex items-center justify-center gap-1">
                <CheckCircle2 size={14} /> Last synced: {new Date(lastSync).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-neutral-100 rounded-lg">
              <Send className="w-6 h-6 text-neutral-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Testing Tools</h2>
              <p className="text-sm text-neutral-500">Simulate payload from Capital Plugin</p>
            </div>
          </div>
          
          <button 
            onClick={handleSimulateDocument}
            className="w-full flex justify-center items-center gap-2 px-4 py-2 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Submit Mock Document
          </button>
        </div>
      </div>
    </div>
  );
}
