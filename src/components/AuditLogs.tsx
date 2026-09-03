import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/obp1/audit')
      .then(res => res.json())
      .then(data => setLogs(data.reverse())) // Newest first
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Audit Logs</h1>
        <p className="text-neutral-500 mt-2">Immutable history of all node events.</p>
      </header>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 flex flex-col items-center">
            <FileText className="w-12 h-12 text-neutral-300 mb-4" />
            <p>No audit events recorded.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3">Event ID</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Timestamp (UTC)</th>
                <th className="px-6 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {logs.map((log, i) => (
                <tr key={i} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 font-mono text-xs">{log.id}</td>
                  <td className="px-6 py-4 font-medium">{log.action}</td>
                  <td className="px-6 py-4">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <pre className="text-[10px] bg-neutral-100 p-2 rounded text-neutral-600 max-w-[300px] overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
