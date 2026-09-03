import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

export default function Registry() {
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/obp1/records')
      .then(res => res.json())
      .then(data => setRecords(data))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Verification Registry</h1>
          <p className="text-neutral-500 mt-2">Immutable ledger of all verified OneGodian records.</p>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search by Hash, Record ID, or Title..." 
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {records.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            No records found in the registry.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3">Record ID</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Timestamp (UTC)</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {records.map((r, i) => (
                <tr key={i} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 font-mono text-xs">{r.record_id}</td>
                  <td className="px-6 py-4">{r.record_type}</td>
                  <td className="px-6 py-4">{new Date(r.timestamp_utc).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs truncate max-w-[150px]">{r.hash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
